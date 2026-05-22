'use client'

import { useState, useEffect } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'

// MUI Imports
import useMediaQuery from '@mui/material/useMediaQuery'
import { styled, useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Checkbox from '@mui/material/Checkbox'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import classnames from 'classnames'

// Form Handling
import { Controller, useForm } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { email, object, minLength, string, pipe, nonEmpty } from 'valibot'

// Firebase Imports
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/libs/firebase'

// Redux
import { useDispatch } from 'react-redux'
import { loginAdmin } from '@/redux-store/slices/admin'

// Toast
import { toast } from 'react-toastify'

// Components
import Logo from '@components/layout/shared/Logo'
import CustomTextField from '@core/components/mui/TextField'

// Config
import themeConfig from '@configs/themeConfig'

// Hooks
import { useImageVariant } from '@core/hooks/useImageVariant'
import { useSettings } from '@core/hooks/useSettings'

// Utils
import { getLocalizedUrl } from '@/utils/i18n'
import { setRememberMe } from '@/utils/firebase-auth'

// Styled Components
const LoginIllustration = styled('img')(({ theme }) => ({
  zIndex: 2,
  blockSize: 'auto',
  maxBlockSize: 680,
  maxInlineSize: '100%',
  margin: theme.spacing(12),
  [theme.breakpoints.down(1536)]: { maxBlockSize: 550 },
  [theme.breakpoints.down('lg')]: { maxBlockSize: 450 }
}))

const MaskImg = styled('img')({
  blockSize: 'auto',
  maxBlockSize: 355,
  inlineSize: '100%',
  position: 'absolute',
  insetBlockEnd: 0,
  zIndex: -1
})

// Validation schema
const schema = object({
  email: pipe(string(), minLength(1, 'Required'), email('Email invalid')),
  password: pipe(string(), nonEmpty('Required'), minLength(5, 'Min 5 characters'))
})

// Firebase error messages mapping
const firebaseErrorMessages = {
  'auth/user-not-found': 'User does not exist',
  'auth/wrong-password': 'Invalid password',
  'auth/invalid-email': 'Invalid email address',
  'auth/too-many-requests': 'Too many attempts. Try later',
  'auth/network-request-failed': 'Network error. Check connection',
  'auth/invalid-credential': 'Invalid credentials. Please check email/password'
}

const Login = ({ mode }) => {
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [error, setError] = useState(null)
  const [loadingActualLogin, setLoadingActualLogin] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [rememberMe, setRememberMeState] = useState(true)

  // Vars
  const darkImg = '/images/pages/auth-mask-dark.png'
  const lightImg = '/images/pages/auth-mask-light.png'
  const darkIllustration = '/images/illustrations/auth/v2-login-dark.png'
  const lightIllustration = '/images/illustrations/auth/v2-login-light.png'
  const borderedDarkIllustration = '/images/illustrations/auth/v2-login-dark-border.png'
  const borderedLightIllustration = '/images/illustrations/auth/v2-login-light-border.png'

  const dispatch = useDispatch()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { lang: locale } = useParams()
  const { settings } = useSettings()
  const theme = useTheme()
  const hidden = useMediaQuery(theme.breakpoints.down('md'))
  const authBackground = useImageVariant(mode, lightImg, darkImg)

  // Form handling
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: valibotResolver(schema),
    defaultValues: { email: '', password: '' }
  })

  const characterIllustration = useImageVariant(
    mode,
    lightIllustration,
    darkIllustration,
    borderedLightIllustration,
    borderedDarkIllustration
  )

  // Auto-check auth status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (user) {
        const manualLogin = sessionStorage.getItem('manual_login_in_progress')
        if (manualLogin) {
          setCheckingAuth(false)
          return
        }

        try {
          // Import validateAuthentication function
          const { validateAuthentication } = await import('@/utils/firebase-auth')
          const isValid = await validateAuthentication()

          if (isValid) {
            const redirectURL = searchParams.get('redirectTo') ?? '/dashboard'
            router.replace(getLocalizedUrl(redirectURL, locale))
            return
          }

          setCheckingAuth(false)
        } catch (error) {
          console.error('Auth check error:', error)
          setCheckingAuth(false)
        }
      } else {
        setCheckingAuth(false)
      }
    })
    return () => unsubscribe()
  }, [router, searchParams, locale])

  const handleClickShowPassword = () => setIsPasswordShown(p => !p)

  // Common login
  const handleLogin = async (credentials) => {

     setLoadingActualLogin(true)

    setError(null)
    sessionStorage.setItem('manual_login_in_progress', 'true')

    try {
      // Firebase login
      const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password)
      const firebaseUser = userCredential.user
      const token = await firebaseUser.getIdToken()
      const uid = firebaseUser.uid

      sessionStorage.setItem('uid', uid)
      sessionStorage.setItem('admin_token', token)
      sessionStorage.setItem('isAuth', true)

      // Backend verification
      const res = await dispatch(loginAdmin({ email: credentials.email, password: credentials.password }))
      if (!res.payload || !res.payload.status) throw new Error('Server authentication failed')

      // Remember me
      setRememberMe(rememberMe)

      sessionStorage.removeItem('manual_login_in_progress')
      toast.success('Login successful!')

      const redirectURL = searchParams.get('redirectTo') ?? '/dashboard'
      router.replace(getLocalizedUrl(redirectURL, locale))
    } catch (err) {
      console.error('Login Error:', err)
      if (err.code) setError(firebaseErrorMessages[err.code] || 'Login failed')
      else setError(err.message || 'Server authentication failed')

      await auth.signOut()
      sessionStorage.removeItem('uid')
      sessionStorage.removeItem('admin_token')
    } finally {
      setLoadingActualLogin(false)
    }
  }

  const onSubmit = data => handleLogin(data, false)

  if (checkingAuth) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <CircularProgress />
      </div>
    )
  }

  return (
    <div className='flex bs-full justify-center'>
      <div
        className={classnames(
          'flex bs-full items-center justify-center flex-1 min-bs-[100dvh] relative p-6 max-md:hidden',
          { 'border-ie': settings.skin === 'bordered' }
        )}
      >
        <LoginIllustration src={characterIllustration} alt='character-illustration' />
        {!hidden && <MaskImg alt='mask' src={authBackground} />}
      </div>

      <div className='flex justify-center items-center bs-full bg-backgroundPaper p-6 md:p-12 md:w-[480px]'>
        <div className='absolute top-6 left-6'>
          <Logo />
        </div>
        <div className='flex flex-col gap-6 w-full max-w-sm'>
          <Typography variant='h4'>{`Welcome to ${themeConfig.templateName}! 👋🏻`}</Typography>
          <Typography>Please sign-in to your account and start the adventure</Typography>

          {error && <Alert severity='error'>{error}</Alert>}

          <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
            <Controller
              name='email'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  label='Email'
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  placeholder='Enter your email'
                  onChange={e => {
                    field.onChange(e.target.value)
                    setError(null)
                  }}
                />
              )}
            />
            <Controller
              name='password'
              control={control}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  label='Password'
                  type={isPasswordShown ? 'text' : 'password'}
                  placeholder='············'
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  onChange={e => {
                    field.onChange(e.target.value)
                    setError(null)
                  }}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position='end'>
                          <IconButton edge='end' onClick={handleClickShowPassword}>
                            <i className={isPasswordShown ? 'tabler-eye' : 'tabler-eye-off'} />
                          </IconButton>
                        </InputAdornment>
                      )
                    }
                  }}
                />
              )}
            />

            {/* <div className='flex justify-between items-center'>
              <FormControlLabel
                control={<Checkbox checked={rememberMe} onChange={e => setRememberMeState(e.target.checked)} />}
                label='Remember me'
              />
              <Typography component={Link} color='primary.main' href={getLocalizedUrl('/forgot-password', locale)}>
                Forgot password?
              </Typography>
            </div> */}

            <Button
              fullWidth
              variant='contained'
              type='submit'
              disabled={loadingActualLogin}
              startIcon={loadingActualLogin ? <CircularProgress size={20} /> : null}
            >
              {loadingActualLogin ? 'Logging in...' : 'Log In'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
