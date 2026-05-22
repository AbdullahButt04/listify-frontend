'use client'

import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { CircularProgress, Box } from '@mui/material'

import AuthRedirect from '@/components/AuthRedirect'
import { auth } from '@/libs/firebase'
import { validateAuthentication, cleanupAuthentication } from '@/utils/firebase-auth'

export default function AuthGuard({ children, locale }) {
  const [isAuth, setIsAuth] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const checkAuth = async () => {
      try {
        const isValid = await validateAuthentication()

        if (mounted) {
          setIsAuth(isValid)
          setLoading(false)
        }
      } catch (error) {
        if (mounted) {
          setIsAuth(false)
          setLoading(false)
        }
      }
    }

    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (!mounted) return

      if (user) {
        // User is signed in Firebase, validate complete auth
        await checkAuth()
      } else {
        // User is signed out, cleanup and redirect
        await cleanupAuthentication()
        setIsAuth(false)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='100vh'>
        <CircularProgress />
      </Box>
    )
  }

  return <>{isAuth ? children : <AuthRedirect lang={locale} />}</>
}
