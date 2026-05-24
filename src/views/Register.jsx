'use client'

// React Imports
import { useState, useEffect } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'

import { useDispatch } from 'react-redux'

// Form & Validation Imports
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

// MUI Imports
import useMediaQuery from '@mui/material/useMediaQuery'
import { styled, useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Checkbox from '@mui/material/Checkbox'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Divider from '@mui/material/Divider'

// Third-party Imports
import classnames from 'classnames'

import { auth } from '@/libs/firebase'

// Component Imports
import Logo from '@components/layout/shared/Logo'
import CustomTextField from '@core/components/mui/TextField'

// Hook Imports
import { useImageVariant } from '@core/hooks/useImageVariant'
import { useSettings } from '@core/hooks/useSettings'

import { signInAdmin } from '@/redux-store/slices/admin'

// Util Imports
import { projectName } from '@/utils/config'
import { Alert, CircularProgress, TextField } from '@mui/material'

import { signInWithEmailAndPassword, onAuthStateChanged, createUserWithEmailAndPassword } from 'firebase/auth'

import { toast } from 'react-toastify'

// Styled Custom Components
const RegisterIllustration = styled('img')(({ theme }) => ({
  zIndex: 2,
  blockSize: 'auto',
  maxBlockSize: 600,
  maxInlineSize: '100%',
  margin: theme.spacing(12),
  [theme.breakpoints.down(1536)]: {
    maxBlockSize: 550
  },
  [theme.breakpoints.down('lg')]: {
    maxBlockSize: 450
  }
}))

const MaskImg = styled('img')({
  blockSize: 'auto',
  maxBlockSize: 345,
  inlineSize: '100%',
  position: 'absolute',
  insetBlockEnd: 0,
  zIndex: -1
})

// Validation Schema
const schema = yup.object().shape({
  email: yup.string().email('Invalid email format').required('Email is required'),

  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),

  cpassword: yup
    .string()
    .oneOf([yup.ref('password'), null], 'Confirm passwords not match')
    .required('Confirm password is required')

  // code: yup.string().required('Purchase code is required')
})

// Firebase Error Messages
const firebaseErrorMessages = {
  'auth/user-not-found': 'User does not exist.',
  'auth/wrong-password': 'Invalid password.',
  'auth/invalid-email': 'Invalid email address.',
  'auth/too-many-requests': 'Too many login attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Please check your connection.',
  'auth/invalid-credential': 'Invalid credentials. Please check your email and password.',
  'auth/email-already-in-use': 'This email already exits.'
}

const Register = ({ mode }) => {
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [isConfirmPasswordShown, setIsConfirmPasswordShown] = useState(false)

  const [loadingActualLogin, setLoadingActualLogin] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [error, setError] = useState(null)

  const [privateKeyJson, setPrivateKeyJson] = useState('')
  const [jsonError, setJsonError] = useState('')

  // Vars
  const darkImg = '/images/pages/auth-mask-dark.png'
  const lightImg = '/images/pages/auth-mask-light.png'
  const darkIllustration = '/images/illustrations/auth/v2-register-dark.png'
  const lightIllustration = '/images/illustrations/auth/v2-register-light.png'
  const borderedDarkIllustration = '/images/illustrations/auth/v2-register-dark-border.png'
  const borderedLightIllustration = '/images/illustrations/auth/v2-register-light-border.png'

  // Hooks
  const { lang: locale } = useParams()
  const dispatch = useDispatch()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { settings } = useSettings()
  const theme = useTheme()
  const hidden = useMediaQuery(theme.breakpoints.down('md'))
  const authBackground = useImageVariant(mode, lightImg, darkImg)

  const characterIllustration = useImageVariant(
    mode,
    lightIllustration,
    darkIllustration,
    borderedLightIllustration,
    borderedDarkIllustration
  )

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: '',
      // code: '',
      privateKey: ''
    }
  })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (user) {
        // Only proceed with auto-login if we're not in a login flow
        const manualLoginInProgress = sessionStorage.getItem('manual_login_in_progress')

        if (manualLoginInProgress) {
          // We're in the middle of a manual login flow, don't redirect
          setCheckingAuth(false)

          return
        }

        try {
          // Check if we have valid credentials in localStorage
          const storedUid = localStorage.getItem('uid')
          const storedToken = localStorage.getItem('admin_token')

          if (storedUid && storedToken) {
            // Verify token with backend before auto-redirecting
            const token = await user.getIdToken(true)

            if (token === storedToken) {
              // Valid token, redirect to dashboard
              const redirectURL = searchParams.get('redirectTo') ?? '/dashboard'

              router.replace(redirectURL)

              return
            }
          }

          // If we get here, tokens are invalid or missing
          setCheckingAuth(false)
        } catch (error) {
          console.error('Error during auth check:', error)
          setCheckingAuth(false)
        }
      } else {
        // User is not logged in
        setCheckingAuth(false)
      }
    })

    return () => unsubscribe() // Cleanup subscription on unmount
  }, [router, searchParams])

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)

  const handleClickShowConfirmPassword = () => setIsConfirmPasswordShown(show => !show)

  const handleJsonChange = value => {
    setPrivateKeyJson(value)

    try {
      if (value.trim()) {
        const obj = JSON.parse(value)

        setValue('privateKey', obj)
        setJsonError('')
      } else {
        setJsonError('Firebase JSON key is required')
      }
    } catch (err) {
      setJsonError('Invalid JSON format')
    }
  }

  const onSubmit = data => {
    if (!data.privateKey) return setJsonError('Firebase JSON key is required')
    // If actual login button was clicked, use the form data
    handleRegi(data)
  }

  const handleRegi = async (credentials) => {

    setError(null)

    // sessionStorage.setItem('manual_login_in_progress', 'true')

    setLoadingActualLogin(true)

    try {
      // Firebase authentication
      const userCredential = await createUserWithEmailAndPassword(auth, credentials.email, credentials.password)

      const firebaseUser = userCredential.user
      const uid = firebaseUser.uid

      // const token = await firebaseUser.getIdToken()

      // if (typeof window !== 'undefined') {
      //   localStorage.setItem('uid', uid)
      //   localStorage.setItem('admin_token', token)
      // }

      try {
        // Backend authentication
        const response = await dispatch(
          signInAdmin({
            email: credentials.email,
            password: credentials.password,
            // licenseKey: credentials.code,
            uid,
            privateKey: credentials.privateKey
          })
        )

        if (!response.payload || !response.payload.status) {
          throw new Error(response.payload.message || 'Authentication failed on server')
        }

        // Success! Store credentials
        // localStorage.setItem('uid', uid)
        // localStorage.setItem('admin_token', token)

        // Clear manual login flag
        // sessionStorage.removeItem('manual_login_in_progress')

        // Redirect to dashboard
        const redirectURL = searchParams.get('redirectTo') ?? '/dashboard'

        
        setTimeout(() => {
          toast.success('Registrtion successful!')
          window.location.href = '/'
        }, 4000)
      } catch (backendError) {
        console.log('Backend Registration Error:', backendError)

        setLoadingActualLogin(false)

        // Sign out from Firebase on backend error
        // await auth.signOut()

        // Clear stored credentials
        // localStorage.removeItem('uid')
        // localStorage.removeItem('admin_token')

        setError(backendError.message || 'Server authentication failed. Please try again later.')
      }
    } catch (firebaseError) {
      console.log('Firebase Login Error:', firebaseError)

      const errorCode = firebaseError?.code
      const errorMessage = firebaseErrorMessages[errorCode] || 'Registrtion failed. Please check your details.'

      setError(errorMessage)
    }
  }

  return (
    <div className='flex bs-full justify-center'>
      <div
        className={classnames(
          'flex bs-full items-center justify-center flex-1 min-bs-[100dvh] relative p-6 max-md:hidden',
          {
            'border-ie': settings.skin === 'bordered'
          }
        )}
      >
        <RegisterIllustration src={characterIllustration} alt='character-illustration' />
        {!hidden && <MaskImg alt='mask' src={authBackground} />}
      </div>
      <div className='flex justify-center items-center bs-full bg-backgroundPaper !min-is-full p-6 md:!min-is-[unset] md:p-12 md:is-[480px]'>
        <Link
          href={`${locale}/login`}
          className='absolute block-start-5 sm:block-start-[33px] inline-start-6 sm:inline-start-[38px]'
        >
          <Logo />
        </Link>
        <div className='flex flex-col gap-6 is-full sm:is-auto md:is-full sm:max-is-[400px] md:max-is-[unset] mbs-8 sm:mbs-11 md:mbs-0'>
          <div className='flex flex-col gap-1'>
            <Typography variant='h4'>{projectName}</Typography>
            <Typography>
              Create your admin account to manage products, orders, and customers seamlessly from one dashboard
            </Typography>
          </div>
          {error && <Alert severity='error'>{error}</Alert>}
          <form noValidate autoComplete='off' onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
            {/* <CustomTextField autoFocus fullWidth label='Username' placeholder='Enter your username' /> */}
            <CustomTextField
              fullWidth
              label='Email'
              placeholder='Enter your email'
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
            <CustomTextField
              fullWidth
              label='Password'
              placeholder='············'
              type={isPasswordShown ? 'text' : 'password'}
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton edge='end' onClick={handleClickShowPassword} onMouseDown={e => e.preventDefault()}>
                        <i className={isPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
            />
            <CustomTextField
              fullWidth
              label='Confirm Password'
              placeholder='············'
              type={isConfirmPasswordShown ? 'text' : 'password'}
              {...register('cpassword')}
              error={!!errors.cpassword}
              helperText={errors.cpassword?.message}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton
                        edge='end'
                        onClick={handleClickShowConfirmPassword}
                        onMouseDown={e => e.preventDefault()}
                      >
                        <i className={isConfirmPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
            />
            {/* <CustomTextField
              fullWidth
              label='Purchase Code'
              placeholder='Enter your purchase code'
              {...register('code')}
              error={!!errors.code}
              helperText={errors.code?.message}
            /> */}

            <CustomTextField
              label='Firebase Private Key'
              value={privateKeyJson || ''}
              {...register('privateKey')}
              onChange={e => handleJsonChange(e.target.value)}
              fullWidth
              multiline
              rows={3}
              placeholder={'Paste your Firebase private key JSON here'}
              error={!!jsonError}
              helperText={jsonError}
              sx={{
                '& .MuiInputBase-root': {
                  fontFamily: 'monospace',
                  fontSize: '0.875rem'
                },
                '& .MuiInputBase-inputMultiline': {
                  overflow: 'hidden',
                  resize: 'vertical'
                }
              }}
            />

            <Button fullWidth variant='contained' type='submit' disabled={loadingActualLogin}>
              {loadingActualLogin && <CircularProgress size={20} color='white' className='mr-2' />}
              {loadingActualLogin ? 'Signing Up...' : 'Sign Up'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Register
