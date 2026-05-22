// api.js
import axios from 'axios'
import { baseURL, key } from './config'
import { refreshFirebaseToken, cleanupAuthentication } from './firebase-auth'

// Create axios instance
const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Flag to prevent multiple token refresh requests
let isRefreshing = false
// Store pending requests that should be retried after token refresh
let pendingRequests = []

// Helper to process queued requests with new token
const processQueue = (error, token = null) => {
  pendingRequests.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })

  // Reset pending requests
  pendingRequests = []
}

// Request interceptor to dynamically set headers from sessionStorage
api.interceptors.request.use(
  config => {
    if (typeof window !== 'undefined') {
      // make sure we're in browser
      const token = sessionStorage.getItem('admin_token')
      const uid = sessionStorage.getItem('uid')

      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      if (uid) {
        config.headers['x-admin-identity'] = uid
      }

      // Set static API key
      config.headers['key'] = key
    }

    return config
  },
  error => Promise.reject(error)
)

// Response interceptor to handle token expiration
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config

    // If we can't get the response or status, just reject
    if (!error.response) {
      return Promise.reject(error)
    }

    // Check if error is due to token expiration (401 Unauthorized)
    // Also check for specific error messages that might indicate token expiration
    const isTokenExpired =
      error.response.status === 401 ||
      (error.response.data &&
        (error.response.data.message === 'Token expired' ||
          error.response.data.message === 'Invalid token' ||
          error.response.data.message === 'jwt expired'))

    // If token expired and request hasn't been retried yet
    if (isTokenExpired && !originalRequest._retry) {
      originalRequest._retry = true

      // If token refresh is already in progress, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingRequests.push({ resolve, reject })
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch(err => Promise.reject(err))
      }

      // Set refreshing flag
      isRefreshing = true

      try {
        // Attempt to refresh the token
        const newToken = await refreshFirebaseToken()

        // Update Authorization header with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`

        // Process any queued requests with the new token
        processQueue(null, newToken)

        // Retry the original request with new token
        return api(originalRequest)
      } catch (refreshError) {
        // Token refresh failed, process queue with error
        processQueue(refreshError, null)

        // Clean up authentication and redirect to login
        await cleanupAuthentication()

        // If we're in the browser, redirect to login page
        if (typeof window !== 'undefined') {
          // Store the current path to redirect back after login
          const currentPath = window.location.pathname + window.location.search
          sessionStorage.setItem('redirect_after_login', currentPath)

          // Redirect to login page
          window.location.href = '/login'
        }

        return Promise.reject(refreshError)
      } finally {
        // Reset refreshing flag
        isRefreshing = false
      }
    }

    // For other errors, just reject the promise
    return Promise.reject(error)
  }
)

export default api
