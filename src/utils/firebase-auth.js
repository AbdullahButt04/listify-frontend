import { setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth'

import { auth } from '@/libs/firebase'

/**
 * Refreshes the Firebase token
 * @returns {Promise<string>} The new token
 */
export const refreshFirebaseToken = async () => {
  const currentUser = auth.currentUser

  if (!currentUser) {
    throw new Error('No user is signed in')
  }

  // Force refresh the token
  const newToken = await currentUser.getIdToken(true)

  // Store the new token
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('admin_token', newToken)
  }

  return newToken
}

/**
 * Get current Firebase token expiration time
 * @returns {Promise<number>} Timestamp in milliseconds when token will expire
 */
export const getTokenExpirationTime = async () => {
  const currentUser = auth.currentUser

  if (!currentUser) {
    throw new Error('No user is signed in')
  }

  const tokenResult = await currentUser.getIdTokenResult()

  return new Date(tokenResult.expirationTime).getTime()
}

/**
 * Set user remember me preference
 * @param {boolean} remember Whether to remember the user
 */
// export const setRememberMe = remember => {
//   if (typeof window !== 'undefined') {
//     sessionStorage.setItem('remember_me', remember ? 'true' : 'false')
//   }
// }

/**
 * Check if user has selected "Remember Me"
 * @returns {boolean} Whether user should be remembered
 */
export const isRememberMeEnabled = () => {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('remember_me') === 'true'
  }

  return false
}

/**
 * Sets the persistence mode for Firebase authentication based on 'remember me' preference
 * @param {boolean} remember - Whether to persist the auth state
 * @returns {Promise<void>}
 */
export const setRememberMe = async remember => {
  try {
    const persistenceType = remember ? browserLocalPersistence : browserSessionPersistence

    await setPersistence(auth, persistenceType)

    return true
  } catch (error) {
    console.error('Auth persistence error:', error)

    return false
  }
}

/**
 * Check if the current Firebase token is expired
 * @returns {Promise<boolean>} True if token is expired
 */
export const isTokenExpired = async () => {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) return true

    const tokenResult = await currentUser.getIdTokenResult()
    const expirationTime = new Date(tokenResult.expirationTime).getTime()
    const currentTime = Date.now()

    // Add 5 minute buffer before expiration
    const bufferTime = 5 * 60 * 1000 // 5 minutes in milliseconds

    return currentTime >= expirationTime - bufferTime
  } catch (error) {
    console.error('Token expiration check error:', error)
    return true
  }
}

/**
 * Validate if the stored token is valid and not tampered with
 * @returns {Promise<boolean>} True if token is valid
 */
export const isTokenValid = async () => {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) return false

    const storedToken = sessionStorage.getItem('admin_token')
    if (!storedToken) return false

    // Try to verify the stored token by getting token result
    // This will fail if token is tampered with or invalid
    try {
      // First, try to get a fresh token to compare
      const currentToken = await currentUser.getIdToken(false)

      // If stored token is different from current token, it might be tampered or expired
      if (storedToken !== currentToken) {
        // Try to get token result with the stored token to see if it's valid
        // This is a more thorough check
        const tokenResult = await currentUser.getIdTokenResult(false)

        // If we can get token result but tokens differ, the stored token might be old
        if (tokenResult && tokenResult.token) {
          // Check if the difference is due to automatic refresh
          const storedTokenDecoded = JSON.parse(atob(storedToken.split('.')[1]))
          const currentTokenDecoded = JSON.parse(atob(currentToken.split('.')[1]))

          // If UIDs match but tokens differ, it's likely an automatic refresh
          if (storedTokenDecoded.user_id === currentTokenDecoded.user_id) {
            // Update stored token with current one
            sessionStorage.setItem('admin_token', currentToken)
            return true
          }
        }

        return false
      }

      // Tokens match, now verify the token is actually valid
      const tokenResult = await currentUser.getIdTokenResult(false)

      if (!tokenResult || !tokenResult.token) {
        return false
      }

      // Additional check: verify token claims
      if (!tokenResult.claims || !tokenResult.claims.user_id) {
        return false
      }

      return true
    } catch (tokenError) {
      console.error('Token verification failed:', tokenError)

      // If token verification fails, it's likely tampered with or invalid
      return false
    }
  } catch (error) {
    console.error('Token validation error:', error)
    return false
  }
}

/**
 * Validates if the current authentication is valid and handles token refresh
 * - Checks if Firebase user exists
 * - Checks if sessionStorage has required items
 * - Verifies Firebase user matches stored uid
 * - Validates token integrity and expiration
 * - Refreshes token if needed
 *
 * @returns {Promise<boolean>} True if authentication is valid
 */
export const validateAuthentication = async () => {
  try {
    // Check if there's a user in Firebase
    const currentUser = auth.currentUser

    if (!currentUser) {
      await cleanupAuthentication()
      return false
    }

    // Check if we have the required sessionStorage items
    const storedUid = sessionStorage.getItem('uid')
    const storedToken = sessionStorage.getItem('admin_token')

    if (!storedUid || !storedToken) {
      await cleanupAuthentication()
      return false
    }

    // Check if the Firebase user matches the stored uid
    if (currentUser.uid !== storedUid) {
      await cleanupAuthentication()
      return false
    }

    // First check if the token is valid (not tampered with)
    const tokenValid = await isTokenValid()

    if (!tokenValid) {
      // Token is invalid/tampered, try to refresh
      try {
        await refreshFirebaseToken()
        return true
      } catch (refreshError) {
        console.error('Token refresh failed after invalid token:', refreshError)
        await cleanupAuthentication()
        return false
      }
    }

    // Then check if token is expired
    const expired = await isTokenExpired()

    if (expired) {
      try {
        // Try to refresh the token
        await refreshFirebaseToken()
        return true
      } catch (refreshError) {
        console.error('Token refresh failed after expiration:', refreshError)
        await cleanupAuthentication()
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Authentication validation error:', error)
    await cleanupAuthentication()
    return false
  }
}

/**
 * Clean up authentication state
 * - Clears sessionStorage items
 * - Signs out from Firebase
 *
 * @returns {Promise<void>}
 */
export const cleanupAuthentication = async () => {
  try {
    // Clear sessionStorage
    sessionStorage.removeItem('uid')
    sessionStorage.removeItem('admin_token')
    sessionStorage.removeItem('user')
    sessionStorage.removeItem('isAuth')
    sessionStorage.removeItem('manual_login_in_progress')

    // Sign out from Firebase
    if (auth.currentUser) {
      await auth.signOut()
    }
  } catch (error) {
    console.error('Auth cleanup error:', error)
  }
}

/**
 * Logout user and cleanup authentication state
 * @param {Function} router - Next.js router instance
 * @param {string} locale - Current locale
 * @returns {Promise<void>}
 */
export const logoutUser = async (router, locale) => {
  try {
    await cleanupAuthentication()

    // Redirect to login page
    if (router && locale) {
      const { getLocalizedUrl } = await import('@/utils/i18n')
      router.replace(getLocalizedUrl('/login', locale))
    }
  } catch (error) {
    console.error('Logout error:', error)
  }
}

/**
 * Handles Firebase authentication errors
 * @param {Object} error - Firebase auth error object
 * @returns {string} Human-readable error message
 */
export const handleFirebaseAuthError = error => {
  const errorCode = error?.code

  const errorMessages = {
    'auth/user-not-found': 'User does not exist.',
    'auth/wrong-password': 'Invalid password.',
    'auth/invalid-email': 'Invalid email address.',
    'auth/too-many-requests': 'Too many login attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/invalid-credential': 'Invalid credentials. Please check your email and password.',
    'auth/account-exists-with-different-credential':
      'An account already exists with the same email address but different sign-in credentials.',
    'auth/user-disabled': 'This user account has been disabled.',
    'auth/operation-not-allowed': 'This operation is not allowed.',
    'auth/popup-closed-by-user': 'Login popup was closed before completing the sign-in process.',
    'auth/cancelled-popup-request': 'This operation has been cancelled due to another conflicting popup being opened.',
    'auth/popup-blocked': 'The popup was blocked by the browser.',
    'auth/unauthorized-domain': 'This domain is not authorized for OAuth operations.'
  }

  return errorMessages[errorCode] || 'Login failed. Please check your credentials.'
}

/**
 * Test function to manually check token validity (for debugging)
 * @returns {Promise<Object>} Detailed token validation results
 */
export const debugTokenValidation = async () => {
  const result = {
    hasUser: false,
    hasStoredToken: false,
    hasStoredUid: false,
    uidMatch: false,
    tokenValid: false,
    tokenExpired: false,
    storedToken: null,
    currentToken: null,
    error: null
  }

  try {
    const currentUser = auth.currentUser
    result.hasUser = !!currentUser

    const storedToken = sessionStorage.getItem('admin_token')
    const storedUid = sessionStorage.getItem('uid')

    result.hasStoredToken = !!storedToken
    result.hasStoredUid = !!storedUid
    result.storedToken = storedToken ? `${storedToken.substring(0, 20)}...` : null

    if (currentUser && storedUid) {
      result.uidMatch = currentUser.uid === storedUid
    }

    if (currentUser) {
      try {
        const currentToken = await currentUser.getIdToken(false)
        result.currentToken = currentToken ? `${currentToken.substring(0, 20)}...` : null

        result.tokenValid = await isTokenValid()
        result.tokenExpired = await isTokenExpired()
      } catch (error) {
        result.error = error.message
      }
    }

    return result
  } catch (error) {
    result.error = error.message
    return result
  }
}

/**
 * Get authentication headers for API requests
 * @returns {Object} Authentication headers for API requests
 */
export const getAuthHeaders = () => {
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('admin_token')
    const uid = sessionStorage.getItem('uid')

    if (token && uid) {
      return {
        Authorization: `Bearer ${token}`,
        'x-auth-adm': uid
      }
    }
  }

  return {}
}
