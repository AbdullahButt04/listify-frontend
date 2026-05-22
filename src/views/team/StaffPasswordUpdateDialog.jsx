'use client'

import React, { forwardRef, useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slide,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Autocomplete
} from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import { fetchStaff, updatePassword } from '../../redux-store/slices/staff'
import { toast } from 'react-toastify'
import { updateFirebasePassword } from '@/utils/commonfunctions'
import { NO_PERMISSION } from '@/utils/constants'

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const StaffPasswordUpdateDialog = ({ open, onClose, staff = null, loading: externalLoading = false }) => {
  const dispatch = useDispatch()

  const { page, pageSize } = useSelector(state => state.staff)

  const { profileData } = useSelector(state => state.adminSlice)



  // states
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})

  // local loading to guard the button
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setErrors({})
      setSubmitting(false)
      setFormData({ password: '', confirmPassword: '' })
    }
  }, [open])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: null }))
  }

  const validate = () => {
    const e = {}
    if (!formData.password) e.password = 'Password is required'
    if (!formData.confirmPassword) e.confirmPassword = 'confirm Password is required'
    if (formData.password !== formData.confirmPassword) e.confirmPassword = 'password and confirm password must be same'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return



    if (!staff?._id || !staff?.email) {
      toast.error('Invalid staff data')
      return
    }

    // 🚨 You asked to use staff.password as the old password
    const oldPassword = staff?.password
    if (!oldPassword) {
      toast.error('Old password not found for this staff.')
      return
    }

    try {
      setSubmitting(true)

      // 1) Update password in Firebase, get UID for backend payload
      const { authId } = await updateFirebasePassword({
        email: staff.email,
        oldPassword,
        newPassword: formData.password
      })

      // 2) Update your backend (DB) using existing thunk
      const payload = {
        staffId: staff._id,
        password: formData.password,
        authId // Firebase UID
      }

      await dispatch(updatePassword(payload)).then(() => dispatch(fetchStaff({ start: page, limit: pageSize })))
      onClose?.()
    } catch (err) {
      // could be Firebase step or backend thunk rejection (handled below too)
      toast.error(err?.message || 'Failed to update password')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => onClose?.()

  return (
    <Dialog
      open={open}
      keepMounted
      scroll='paper'
      onClose={handleClose}
      TransitionComponent={Transition}
      closeAfterTransition={false}
      fullWidth
      maxWidth='md'
      PaperProps={{
        sx: {
          overflow: 'visible',
          width: '600px',
          maxWidth: '95vw'
        }
      }}
    >
      <DialogTitle>
        <Typography variant='h5' component='span'>
          Update Password
        </Typography>
        <DialogCloseButton onClick={handleClose}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>

      <DialogContent className='pt-2 flex flex-col gap-5'>
        <TextField
          fullWidth
          label='new Password'
          placeholder='Enter new password'
          type='password'
          value={formData.password}
          onChange={e => handleChange('password', e.target.value)}
          error={!!errors.password}
          helperText={errors.password}
        />
        <TextField
          fullWidth
          label='confirm Password'
          placeholder='Enter confirm password'
          type='password'
          value={formData.confirmPassword}
          onChange={e => handleChange('confirmPassword', e.target.value)}
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword}
        />
      </DialogContent>
      <DialogActions className='dialog-actions-dense'>
        <Button variant='outlined' color='secondary' onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button variant='contained' onClick={handleSubmit} disabled={submitting}>
          {submitting ? (
            <>
              <CircularProgress color='white' size={20} sx={{ mr: 1 }} /> <span>Saving...</span>
            </>
          ) : (
            'Update'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default StaffPasswordUpdateDialog
