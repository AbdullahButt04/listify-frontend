'use client'

import { baseURL, key } from './config'
import React, { useState } from 'react'
import { Typography, Button, Box, List } from '@mui/material'
import { styled } from '@mui/material/styles'

import defaultImage from '@/assets/images/defaultImage.jpg'

import { initializeApp } from 'firebase/app'
import { auth } from '@/libs/firebase'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateEmail,
  deleteUser,
  signOut,
  getAuth,
  EmailAuthProvider,
  reauthenticateWithCredential,
  verifyBeforeUpdateEmail,
  updatePassword as fbUpdatePassword
} from 'firebase/auth'
import { LOGIN_TYPE } from './constants'

export const getFullImageUrl = imgPath => {
  if (!imgPath) return defaultImage

  if (imgPath.includes('https')) {
    return imgPath
  }

  const normalizedPath = imgPath.replace(/\\/g, '/')

  return `${baseURL}${normalizedPath}`
}

export const fallbackImg =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="48"><rect width="100%" height="100%" fill="#eee"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="10" fill="#999">No Image</text></svg>`
  )

export const formatDate = iso => {
  if (!iso) return '-'
  try {
    const d = new Date(iso)
    return d.toLocaleString()
  } catch {
    return iso
  }
}

// Simple sync check for basic auth status (for initial checks)
export const getIsAuth = () => {
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('admin_token')
    const uid = sessionStorage.getItem('uid')
    return token && uid ? true : false
  }
  return false
}

// Async function for proper auth validation with token expiration check
export const validateAuthAsync = async () => {
  try {
    // Import here to avoid circular dependencies
    const { validateAuthentication } = await import('@/utils/firebase-auth')
    return await validateAuthentication()
  } catch (error) {
    console.error('Auth validation error:', error)
    return false
  }
}

export const getAuthHeaders = () => {
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('admin_token')
    const uid = sessionStorage.getItem('uid')

    return {
      'Content-Type': 'application/json',
      key: key,
      Authorization: `Bearer ${token}`,
      'x-admin-identity': uid
    }
  }

  return {}
}

export const getFormDataAuthHeaders = () => {
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('admin_token')
    const uid = sessionStorage.getItem('uid')

    return {
      key: key,
      Authorization: `Bearer ${token}`,
      'x-admin-identity': uid
    }
  }

  return {}
}

// Date formatting helper
export const getFormattedDate = (
  date,
  locale = 'en-US',
  options = { year: 'numeric', month: 'short', day: 'numeric' }
) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString(locale, options)
}

const ExpandableText = ({ text, lineClamp = 2, maxWidth = 200 }) => {
  const [expanded, setExpanded] = useState(false)

  return (
    <Box sx={{ maxWidth }}>
      <Typography
        color='text.primary'
        sx={{
          display: '-webkit-box',
          WebkitLineClamp: expanded ? 'unset' : lineClamp, // show limited or full text
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: expanded ? 'normal' : 'initial',
          wordBreak: 'break-word'
        }}
      >
        {text}
      </Typography>

      {/* Show "Read More / Read Less" only if text length is bigger */}
      {text && text.length > 50 && (
        <Button
          size='small'
          sx={{ mt: 0.5, p: 0, textTransform: 'none', fontSize: '12px' }}
          onClick={() => setExpanded(prev => !prev)}
        >
          {expanded ? 'Read Less' : 'Read More'}
        </Button>
      )}
    </Box>
  )
}

export default ExpandableText

export const getFirebaseErrorMessage = errorCode => {
  const errorMessages = {
    // Authentication errors
    'auth/email-already-in-use': 'This email address is already registered. Please use a different email.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/operation-not-allowed': 'Email/password authentication is not enabled. Please contact support.',
    'auth/weak-password': 'Password should be at least 6 characters long.',
    'auth/user-disabled': 'This user account has been disabled. Please contact support.',
    'auth/user-not-found': 'No account found with this email address.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password. Please check your credentials.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your internet connection.',
    'auth/internal-error': 'An internal error occurred. Please try again.',

    // Password update specific errors
    'auth/requires-recent-login': 'This operation requires recent authentication. Please sign in again.',
    'auth/invalid-password': 'The password is invalid or does not meet requirements.',

    // Email update specific errors
    'auth/email-already-exists': 'This email address is already in use by another account.',
    'auth/invalid-new-email': 'The new email address is invalid.',

    // Generic fallback
    default: 'An unexpected error occurred. Please try again.'
  }

  return errorMessages[errorCode] || errorMessages['default']
}

const getSecondaryAuth = () => {
  try {
    // Try to get existing secondary app
    const secondaryApp = initializeApp(auth.app.options, 'secondary')
    return getAuth(secondaryApp)
  } catch (error) {
    // If app already exists, get it by name
    if (error.code === 'app/duplicate-app') {
      const { getApp } = require('firebase/app')
      const secondaryApp = getApp('secondary')
      return getAuth(secondaryApp)
    }
    throw error
  }
}

// --------- Firebase flows with secondary auth ----------
export const createFirebaseUser = async ({ email, password }) => {
  try {
    const secondaryAuth = getSecondaryAuth()
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password)
    const authId = cred.user.uid

    // Sign out from secondary auth to prevent any auth state conflicts
    await signOut(secondaryAuth).catch(() => {})

    return { authId }
  } catch (error) {
    console.error('Firebase create user error:', error)
    const errorMessage = getFirebaseErrorMessage(error.code)
    throw new Error(errorMessage)
  }
}

export const updateFirebaseEmail = async ({ currentEmail, currentPassword, newEmail }) => {
  try {
    // IMPORTANT: secondaryAuth must be initialized with the SAME Firebase config
    // (apiKey/projectId/authDomain) as your other code path if you expect identical behavior
    const secondaryAuth = getSecondaryAuth()

    // Sign in to get a recent login
    const { user } = await signInWithEmailAndPassword(secondaryAuth, currentEmail, currentPassword)

    // Extra safety: explicitly reauthenticate with fresh credentials
    const cred = EmailAuthProvider.credential(currentEmail, currentPassword)
    await reauthenticateWithCredential(user, cred)

    // This sends a verification link to the NEW email and defers the change until it’s clicked
    await verifyBeforeUpdateEmail(user, newEmail)

    await signOut(secondaryAuth).catch(() => {})

    // Let the caller know a verification email was sent
    return { sentVerification: true }
  } catch (error) {
    console.error('Firebase update email error:', error)
    // Map to your UI-friendly message if you like
    if (
      error?.code === 'auth/operation-not-allowed' ||
      String(error?.message || '').includes('OPERATION_NOT_ALLOWED')
    ) {
      throw new Error('We’ve sent a verification link to your new email. Please verify to complete the change.')
    }
    throw new Error(getFirebaseErrorMessage?.(error.code) || 'Failed to start email change.')
  }
}

export const deleteFirebaseUserByEmailPassword = async ({ email, password }) => {
  try {
    const secondaryAuth = getSecondaryAuth()
    const { user } = await signInWithEmailAndPassword(secondaryAuth, email, password)
    await deleteUser(user)
    await signOut(secondaryAuth).catch(() => {})
  } catch (error) {
    // If deletion fails (e.g., wrong password), we just log. Caller decides what to do next.
    console.error('Failed to rollback Firebase user:', error)
    const errorMessage = getFirebaseErrorMessage(error.code)
    console.error('Firebase rollback error:', errorMessage)
  }
}

export const updateFirebasePassword = async ({ email, oldPassword, newPassword }) => {
  try {
    const secondaryAuth = getSecondaryAuth()

    // 1) Sign in with old credentials
    const { user } = await signInWithEmailAndPassword(secondaryAuth, email, oldPassword)

    // 2) Reauthenticate (fresh token)
    const cred = EmailAuthProvider.credential(email, oldPassword)
    await reauthenticateWithCredential(user, cred)

    // 3) Update password in Firebase
    await fbUpdatePassword(user, newPassword)

    // 4) Grab UID to send to your backend
    const authId = user.uid

    // 5) Sign out from secondary auth
    await signOut(secondaryAuth).catch(() => {})

    return { authId }
  } catch (error) {
    console.error('Firebase update password error:', error)
    // your existing helper already used elsewhere
    const msg = getFirebaseErrorMessage?.(error.code) || 'Failed to update password in Firebase.'
    throw new Error(msg)
  }
}

export const getLoginTypeColor = loginType => {
  switch (loginType) {
    case LOGIN_TYPE.MOBILENO:
      return { label: 'Mobile No', color: 'info' } // blue
    case LOGIN_TYPE.GOOGLE:
      return { label: 'Google', color: 'error' } // red
    case LOGIN_TYPE.APPLE:
      return { label: 'Apple', color: 'default' } // gray
    case LOGIN_TYPE.EMAIL_PASSWORD:
      return { label: 'Email', color: 'success' } // green
    default:
      return { label: '-', color: 'default' }
  }
}
