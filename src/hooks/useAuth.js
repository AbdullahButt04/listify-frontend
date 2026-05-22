'use client'

import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'next/navigation'

import { auth } from '@/libs/firebase'
import { validateAuthentication, cleanupAuthentication, logoutUser } from '@/utils/firebase-auth'
import { getLocalizedUrl } from '@/utils/i18n'

/**
 * Custom hook for authentication management
 * @param {string} locale - Current locale
 * @returns {Object} Authentication state and methods
 */
export const useAuth = (locale = 'en') => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    let mounted = true

    const checkAuthentication = async () => {
      try {
        const isValid = await validateAuthentication()

        if (mounted) {
          setIsAuthenticated(isValid)
          setLoading(false)
        }
      } catch (error) {
        console.error('Auth validation error:', error)
        if (mounted) {
          setIsAuthenticated(false)
          setLoading(false)
        }
      }
    }

    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
      if (!mounted) return

      setUser(firebaseUser)

      if (firebaseUser) {
        // User is signed in, validate complete authentication
        await checkAuthentication()
      } else {
        // User is signed out
        setIsAuthenticated(false)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  const logout = async () => {
    try {
      setLoading(true)
      await logoutUser(router, locale)
      setIsAuthenticated(false)
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshAuth = async () => {
    setLoading(true)
    try {
      const isValid = await validateAuthentication()
      setIsAuthenticated(isValid)
      return isValid
    } catch (error) {
      console.error('Auth refresh error:', error)
      setIsAuthenticated(false)
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    isAuthenticated,
    loading,
    user,
    logout,
    refreshAuth
  }
}

export default useAuth
