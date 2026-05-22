'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getLogin } from '@/@core/utils/clientHelpers'
import { Box, CircularProgress } from '@mui/material'

const AuthRedirect = ({ children }) => {
  const router = useRouter()

  const [isLogin, setIsLogin] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLogin = async () => {
      try {
        const login = await getLogin()
        setIsLogin(login.alreadyRegistered)
        setLoading(false)
      } catch (error) {
        console.error(error)
        setIsLogin(false)
        setLoading(false)
      }
    }
    fetchLogin()
  }, [])

  useEffect(() => {
    if (isLogin === true) {
      router.replace('/login')
    } else if (isLogin === false) {
      router.replace('/register')
    }
  }, [isLogin, router])

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='100vh'>
        <CircularProgress />
      </Box>
    )
  }

  return <>{children}</>
}

export default AuthRedirect
