'use client'

import { useEffect } from 'react'

import setupAxiosInterceptors from '../utils/setupAxiosInterceptors'

/**
 * Component to initialize axios interceptors on client-side
 */
const AxiosInterceptorInitializer = () => {
  useEffect(() => {
    setupAxiosInterceptors()
  }, [])

  return null
}

export default AxiosInterceptorInitializer
