'use client'

import React, { useEffect, useState } from 'react'

import {
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  Box,
  CircularProgress,
  Alert,
  Avatar,
  IconButton,
  Paper,
  Fade,
  Divider,
  Tooltip,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab
} from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { useForm, Controller } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'

import {
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
  updateEmail,
  sendEmailVerification
} from 'firebase/auth'
import { toast } from 'react-toastify'

import {
  getAdminProfile,
  changePassword,
  clearPasswordChangeStatus,
  updateAdminProfile,
  clearProfileUpdateStatus
} from '@/redux-store/slices/admin'
import { auth } from '@/libs/firebase'
import { getFullImageUrl } from '@/utils/commonfunctions'
import { NO_PERMISSION } from '@/utils/constants'

const passwordSchema = yup.object().shape({
  oldPass: yup.string().required('Current password is required'),
  newPass: yup.string().required('New password is required').min(6, 'Password must be at least 6 characters'),
  confirmPass: yup
    .string()
    .required('Confirm password is required')
    .oneOf([yup.ref('newPass')], 'Passwords must match')
})

const Profile = () => {
  const theme = useTheme()
  const dispatch = useDispatch()

  const { profileData, loading, passwordChangeStatus, profileUpdateStatus, error } = useSelector(
    state => state.adminSlice
  )



  // State management
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'success' })
  const [firebaseStatus, setFirebaseStatus] = useState({ loading: false, error: null })
  const [editMode, setEditMode] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [emailToUpdate, setEmailToUpdate] = useState('')

  // Password change form
  const passwordForm = useForm({
    defaultValues: {
      oldPass: '',
      newPass: '',
      confirmPass: ''
    },
    resolver: yupResolver(passwordSchema)
  })

  // Profile edit form
  const profileForm = useForm({
    defaultValues: {
      name: '',
      email: ''
    },
    resolver: yupResolver(
      yup.object().shape({
        name: yup.string().required('Name is required'),
        email: yup.string().email('Invalid email address').required('Email is required')
      })
    )
  })

  // Password confirmation form for email change
  const passwordConfirmForm = useForm({
    defaultValues: {
      password: ''
    },
    resolver: yupResolver(
      yup.object().shape({
        password: yup.string().required('Password is required to change email')
      })
    )
  })

  // Get admin profile on component mount
  useEffect(() => {
    dispatch(getAdminProfile())
  }, [dispatch])

  // Set profile form values when profile data is loaded
  useEffect(() => {
    if (profileData) {
      profileForm.setValue('name', profileData.name || '')
      profileForm.setValue('email', profileData.email || '')
      setImagePreview(getFullImageUrl(profileData.image) || '')
    }
  }, [profileData, profileForm])

  // Handle password change status changes
  useEffect(() => {
    if (passwordChangeStatus === 'success') {
      showAlert('success', 'Password successfully updated in both authentication and our system!')
      passwordForm.reset()

      setTimeout(() => {
        dispatch(clearPasswordChangeStatus())
      }, 3000)
    } else if (passwordChangeStatus === 'failed') {
      showAlert('error', error || 'Failed to update password in our system. Please contact support.')
    }
  }, [passwordChangeStatus, error, dispatch, passwordForm])

  // Handle profile update status changes
  useEffect(() => {
    if (profileUpdateStatus === 'success') {
      showAlert('success', 'Profile updated successfully in database!')
      setEditMode(false)
      setFirebaseStatus({ loading: false, error: null })

      setTimeout(() => {
        dispatch(clearProfileUpdateStatus())
      }, 3000)
    } else if (profileUpdateStatus === 'failed') {
      showAlert('error', error || 'Failed to update profile. Please try again.')
      setFirebaseStatus({ loading: false, error: null })
    }
  }, [profileUpdateStatus, error, dispatch])

  // Firebase error effect
  useEffect(() => {
    if (firebaseStatus.error) {
      showAlert('error', firebaseStatus.error)
    }
  }, [firebaseStatus.error])

  // Hide alert after 5 seconds
  useEffect(() => {
    if (alert.show) {
      const timer = setTimeout(() => {
        setAlert(prev => ({ ...prev, show: false }))
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [alert.show])

  // Show alert helper function
  const showAlert = (severity, message) => {
    setAlert({
      show: true,
      message,
      severity
    })
  }

  // Handle image change
  const handleImageChange = e => {
    const file = e.target.files[0]

    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showAlert('error', 'Image size should be less than 5MB')

        return
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']

      if (!validTypes.includes(file.type)) {
        showAlert('error', 'Please upload a valid image file (JPG, JPEG, PNG)')

        return
      }

      setImageFile(file)

      // Create preview
      const reader = new FileReader()

      reader.onloadend = () => {
        setImagePreview(reader.result)
      }

      reader.readAsDataURL(file)
    }
  }

  // Password change submission
  const onPasswordSubmit = async data => {


    try {
      setFirebaseStatus({ loading: true, error: null })

      const user = auth.currentUser

      if (!user) {
        throw new Error('No user is currently signed in')
      }

      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(user.email, data.oldPass)

      await reauthenticateWithCredential(user, credential)

      // Update password in Firebase
      await updatePassword(user, data.newPass)

      setFirebaseStatus({ loading: false, error: null })

      // After successful Firebase password change, update in backend
      dispatch(
        changePassword({
          oldPass: data.oldPass,
          newPass: data.newPass,
          confirmPass: data.confirmPass
        })
      )
    } catch (error) {
      let errorMessage = 'Failed to change password'

      if (error.code === 'auth/wrong-password') {
        errorMessage = 'The current password is incorrect'
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later'
      } else if (error.code) {
        errorMessage = `Authentication error: ${error.code}`
      } else if (error.message) {
        errorMessage = error.message
      }

      setFirebaseStatus({ loading: false, error: errorMessage })
    }
  }

  // Handle email update with re-authentication
  const handleEmailUpdate = async (password, newEmail) => {


    try {
      setFirebaseStatus({ loading: true, error: null })

      const user = auth.currentUser

      if (!user) {
        throw new Error('No user is currently signed in')
      }

      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(user.email, password)

      await reauthenticateWithCredential(user, credential)

      // Update email in Firebase
      await updateEmail(user, newEmail)

      setFirebaseStatus({ loading: false, error: null })
      showAlert('success', 'Email updated in Firebase successfully!')
      setShowPasswordDialog(false)

      // Now proceed with updating the database
      const formData = new FormData()
      const currentFormData = profileForm.getValues()

      formData.append('name', currentFormData.name)
      formData.append('email', newEmail)

      // Add image file if changed
      if (imageFile) {
        formData.append('image', imageFile)
      }

      // Update profile in backend
      dispatch(updateAdminProfile(formData))
    } catch (error) {
      let errorMessage = 'Failed to update email'

      if (error.code === 'auth/wrong-password') {
        errorMessage = 'The password is incorrect'
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already in use by another account'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address'
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later'
      } else if (error.message && error.message.includes('verify the new email')) {
        errorMessage = 'Email verification is required. Please check your new email inbox and verify before changing.'
      } else if (error.code) {
        errorMessage = `Authentication error: ${error.code}`
      } else if (error.message) {
        errorMessage = error.message
      }

      setFirebaseStatus({ loading: false, error: errorMessage })
      showAlert('error', errorMessage)
    }
  }

  // Profile update submission
  const onProfileSubmit = async data => {
    try {
      const hasEmailChanged = data.email !== profileData?.email

      // If email is being changed, show password dialog for re-authentication
      if (hasEmailChanged && data.email) {
        setEmailToUpdate(data.email)
        setShowPasswordDialog(true)

        return
      }



      // For name/image only updates, proceed directly
      const formData = new FormData()

      formData.append('name', data.name)
      formData.append('email', data.email)

      // Add image file if changed
      if (imageFile) {
        formData.append('image', imageFile)
      }

      // Update profile in backend
      dispatch(updateAdminProfile(formData))
    } catch (error) {
      showAlert('error', error.message || 'Failed to update profile')
    }
  }

  // Reset profile form
  const handleCancelEdit = () => {
    setEditMode(false)
    setFirebaseStatus({ loading: false, error: null })

    // Reset form to original values
    if (profileData) {
      profileForm.setValue('name', profileData.name || '')
      profileForm.setValue('email', profileData.email || '')
      setImagePreview(getFullImageUrl(profileData.image) || '')
      setImageFile(null)
    }
  }

  // Check if any forms are submitting
  const isSubmitting =
    loading || firebaseStatus.loading || passwordChangeStatus === 'pending' || profileUpdateStatus === 'pending'

  return (
    <Grid container spacing={3}>
      {/* Global Alert */}
      <Grid item xs={12}>
        <Fade in={alert.show}>
          <Alert
            severity={alert.severity}
            sx={{
              mb: 1,
              boxShadow: theme.shadows[3],
              '& .MuiAlert-message': { fontWeight: 500 }
            }}
            onClose={() => setAlert(prev => ({ ...prev, show: false }))}
          >
            {alert.message}
          </Alert>
        </Fade>
      </Grid>

      {/* Profile Information */}
      <Grid item xs={12} md={6}>
        <Card elevation={3} sx={{ height: '100%', borderRadius: 2, overflow: 'hidden' }}>
          {loading ? (
            <Box display='flex' justifyContent='center' alignItems='center' minHeight='400px'>
              <CircularProgress color='white' />
            </Box>
          ) : (
            <CardContent sx={{ p: 3 }}>
              <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
                <Typography variant='h5' fontWeight='600' color='primary'>
                  Profile Information
                </Typography>

                {!editMode ? (
                  <Tooltip title='Edit Profile'>
                    <IconButton
                      color='primary'
                      onClick={() => {
                        // if (!permission) return toast.error('You are not authorized')

                        setEditMode(true)
                      }}
                    >
                      <i className='tabler-edit' />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Box>
                    <Tooltip title='Save Changes'>
                      <IconButton
                        color='primary'
                        onClick={() => {
                          // if (!permission) return toast.error('You are not authorized')

                          profileForm.handleSubmit(onProfileSubmit)()
                        }}
                        disabled={isSubmitting}
                      >
                        <i className='tabler-device-floppy' />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title='Cancel'>
                      <IconButton color='error' onClick={handleCancelEdit}>
                        <i className='tabler-x' />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
                {/* Profile Image */}
                <Box
                  sx={{
                    position: 'relative',
                    mb: 4,
                    borderRadius: '50%',
                    border: `4px solid ${theme.palette.primary.lighter}`,
                    boxShadow: theme.shadows[4],
                    width: 150,
                    height: 150
                  }}
                >
                  <Avatar
                    src={imagePreview}
                    alt={profileForm.getValues('name')}
                    sx={{
                      width: '100%',
                      height: '100%',
                      bgcolor: theme.palette.primary.lighter,
                      color: theme.palette.primary.dark,
                      fontSize: '3rem'
                    }}
                  />
                  {editMode && (
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: '50%',
                        transform: 'translate(-50%, 50%)'
                      }}
                    >
                      <input
                        accept='image/jpeg,image/png,image/jpg'
                        id='profile-image-upload'
                        type='file'
                        style={{ display: 'none' }}
                        onChange={handleImageChange}
                      />
                      <label htmlFor='profile-image-upload'>
                        <Box
                          sx={{
                            backgroundColor: theme.palette.primary.main,
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: theme.shadows[3],
                            cursor: 'pointer',
                            transition: 'background-color 0.3s',
                            '&:hover': {
                              backgroundColor: theme.palette.primary.dark
                            }
                          }}
                        >
                          <i className='tabler-camera text-white' />
                        </Box>
                      </label>
                    </Box>
                  )}
                </Box>
                <form style={{ width: '100%', marginTop: '20px' }}>
                  {/* Name Field */}
                  <Box sx={{ mb: 3 }}>
                    {editMode ? (
                      <Controller
                        name='name'
                        control={profileForm.control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label='Full Name'
                            variant='outlined'
                            fullWidth
                            error={!!profileForm.formState.errors.name}
                            helperText={profileForm.formState.errors.name?.message}
                            InputProps={{
                              sx: { borderRadius: 1.5 }
                            }}
                          />
                        )}
                      />
                    ) : (
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                          Name
                        </Typography>
                        <Typography variant='h6' fontWeight='500'>
                          {profileData?.name || 'Not Set'}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Email Field */}
                  <Box sx={{ mb: 3 }}>
                    {editMode ? (
                      <>
                        <Controller
                          name='email'
                          control={profileForm.control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label='Email Address'
                              variant='outlined'
                              fullWidth
                              error={!!profileForm.formState.errors.email}
                              helperText={profileForm.formState.errors.email?.message}
                              InputProps={{
                                sx: { borderRadius: 1.5 }
                              }}
                            />
                          )}
                        />
                        {profileForm.watch('email') !== profileData?.email && (
                          <Typography variant='caption' color='warning.main' sx={{ mt: 1, display: 'block' }}>
                            ⚠️ Changing email will update your Firebase authentication email
                          </Typography>
                        )}
                      </>
                    ) : (
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                          Email
                        </Typography>
                        <Typography variant='h6' fontWeight='500'>
                          {profileData?.email || 'Not Set'}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </form>
              </Box>
            </CardContent>
          )}
        </Card>
      </Grid>

      {/* Change Password */}
      <Grid item xs={12} md={6}>
        <Card elevation={3} sx={{ height: '100%', borderRadius: 2, overflow: 'hidden' }}>
          <CardContent sx={{ p: 3 }}>
            <Box display='flex' alignItems='center' mb={3}>
              <i className='tabler-lock-search' />
              <Typography variant='h5' fontWeight='600' color='primary'>
                Change Password
              </Typography>
            </Box>

            {firebaseStatus.error && !alert.show && (
              <Alert severity='error' sx={{ mb: 3 }}>
                {firebaseStatus.error}
              </Alert>
            )}

            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Controller
                    name='oldPass'
                    control={passwordForm.control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label='Current Password'
                        fullWidth
                        type='password'
                        error={!!passwordForm.formState.errors.oldPass}
                        helperText={passwordForm.formState.errors.oldPass?.message}
                        InputProps={{
                          sx: { borderRadius: 1.5 }
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Controller
                    name='newPass'
                    control={passwordForm.control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label='New Password'
                        fullWidth
                        type='password'
                        error={!!passwordForm.formState.errors.newPass}
                        helperText={passwordForm.formState.errors.newPass?.message}
                        InputProps={{
                          sx: { borderRadius: 1.5 }
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Controller
                    name='confirmPass'
                    control={passwordForm.control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label='Confirm New Password'
                        fullWidth
                        type='password'
                        error={!!passwordForm.formState.errors.confirmPass}
                        helperText={passwordForm.formState.errors.confirmPass?.message}
                        InputProps={{
                          sx: { borderRadius: 1.5 }
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 2 }}>
                    Password must be at least 6 characters
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button
                      variant='contained'
                      color='primary'
                      type='submit'
                      disabled={isSubmitting}
                      sx={{
                        borderRadius: 1.5,
                        py: 1.2,
                        px: 3,
                        boxShadow: theme.shadows[3],
                        minWidth: 160, // Ensures consistent width
                        fontSize: '0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {isSubmitting && <CircularProgress color='white' size={20} sx={{ mr: 1 }} />}
                      Update Password
                    </Button>

                    <Button
                      variant='outlined'
                      color='inherit'
                      onClick={() => passwordForm.reset()}
                      disabled={isSubmitting}
                      sx={{
                        ml: 2,
                        borderRadius: 1.5,
                        py: 1.2,
                        px: 3,
                        minWidth: 160, // Match width
                        fontSize: '0.95rem'
                      }}
                    >
                      Reset
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Grid>

      {/* Password Confirmation Dialog for Email Change */}
      <Dialog
        open={showPasswordDialog}
        onClose={() => {
          setShowPasswordDialog(false)
          setEmailToUpdate('')
          passwordConfirmForm.reset()
        }}
        maxWidth='sm'
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.shadows[10]
          }
        }}
      >
        <DialogTitle>
          <Typography variant='h6' fontWeight='600' color='primary'>
            Confirm Password to Change Email
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Alert severity='info' sx={{ mb: 3 }}>
            To change your email from <strong>{profileData?.email}</strong> to <strong>{emailToUpdate}</strong>, please
            enter your current password.
          </Alert>

          <Controller
            name='password'
            control={passwordConfirmForm.control}
            render={({ field }) => (
              <TextField
                {...field}
                label='Current Password'
                type='password'
                fullWidth
                variant='outlined'
                error={!!passwordConfirmForm.formState.errors.password}
                helperText={passwordConfirmForm.formState.errors.password?.message}
                InputProps={{
                  sx: { borderRadius: 1.5 }
                }}
                sx={{ mt: 2 }}
              />
            )}
          />

          {firebaseStatus.error && (
            <Alert severity='error' sx={{ mt: 2 }}>
              {firebaseStatus.error}
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => {
              setShowPasswordDialog(false)
              setEmailToUpdate('')
              passwordConfirmForm.reset()
              setFirebaseStatus({ loading: false, error: null })
            }}
            disabled={firebaseStatus.loading}
            sx={{ borderRadius: 1.5 }}
          >
            Cancel
          </Button>
          <Button
            onClick={passwordConfirmForm.handleSubmit(data => {
              handleEmailUpdate(data.password, emailToUpdate)
            })}
            variant='contained'
            disabled={firebaseStatus.loading}
            sx={{
              borderRadius: 1.5,
              minWidth: 120
            }}
          >
            {firebaseStatus.loading ? <CircularProgress color='white' size={20} sx={{ mr: 1 }} /> : null}
            Update Email
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}

export default Profile
