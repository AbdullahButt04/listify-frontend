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
import { createStaff, fetchAllRoles, fetchStaff, updateStaff } from '../../redux-store/slices/staff'
import { toast } from 'react-toastify'
import { createFirebaseUser, updateFirebaseEmail } from '@/utils/commonfunctions'
import { NO_PERMISSION } from '@/utils/constants'

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const StaffDialog = ({ open, onClose, mode = 'create', staff = null, loading: externalLoading = false }) => {
  const dispatch = useDispatch()
  const { roles, page, pageSize } = useSelector(state => state.staff)

  const { profileData } = useSelector(state => state.adminSlice)



  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roleId: ''
  })
  const [errors, setErrors] = useState({})

  const originalStaff = useMemo(() => staff || {}, [staff])

  // Fetch roles when opening
  useEffect(() => {
    if (open) dispatch(fetchAllRoles())
  }, [open, dispatch])

  // Prefill on edit
  useEffect(() => {
    if (open && mode === 'edit' && originalStaff) {
      setFormData(prev => ({
        ...prev,
        name: originalStaff.name || '',
        email: originalStaff.email || '',
        password: '', // not editable here
        roleId: originalStaff.role?._id || ''
      }))
      setErrors({})
    }
    if (open && mode === 'create') {
      setFormData({
        name: '',
        email: '',
        password: '',
        roleId: ''
      })
      setErrors({})
    }
  }, [open, mode, originalStaff])

  const roleValue = useMemo(() => roles.find(r => r._id === formData.roleId) || null, [roles, formData.roleId])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: null }))
  }

  const validate = () => {
    const e = {}

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!formData.name.trim()) e.name = 'Name is required'
    if (!formData.email.trim()) {
      e.email = 'Email is required'
    } else if (!emailPattern.test(formData.email.trim())) {
      e.email = 'Please enter a valid email format (example@domain.com)'
    }
    if (!formData.roleId) e.roleId = 'Role is required'
    if (mode === 'create' && !formData.password) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleClose = () => {
    if (submitting) return
    onClose?.()
  }

  // --------- Submit handlers ----------
  const handleSubmit = async () => {
    if (!validate()) return



    setSubmitting(true)

    if (mode === 'create') {
      // 1) Create user in Firebase using secondary auth
      let createdAuthId = null
      try {
        const { email, password, name, roleId } = formData
        // const { authId } = await createFirebaseUser({ email, password })
        // createdAuthId = authId

        // 2) Backend: create staff
        const payload = {
          name,
          email,
          password,
          role: roleId
          // authId
        }
        dispatch(createStaff(payload))
          .then(() => {
            dispatch(fetchStaff({ start: page, limit: pageSize }))
          })
          .catch(error => {
            console.error('then catch', error)
          })
        onClose?.()
      } catch (err) {
        // 3) If backend fails, roll back firebase user
        console.error('catch', err)
        toast.error(err?.response?.data?.message || err?.message || 'Failed to create staff')
      } finally {
        setSubmitting(false)
      }
      return
    }

    // mode === 'edit'
    try {
      const emailChanged = formData.email.trim().toLowerCase() !== (originalStaff.email || '').toLowerCase()

      // If email changed, update in Firebase by signing in as that staff with their known password
      // if (emailChanged) {
      //   const currentEmail = originalStaff.email
      //   const currentPassword = originalStaff.password
      //   if (!currentPassword) {
      //     throw new Error(
      //       'Password for the staff is required to update email in Firebase. Please include it in the loaded staff data.'
      //     )
      //   }
      //   await updateFirebaseEmail({
      //     currentEmail,
      //     currentPassword,
      //     newEmail: formData.email.trim()
      //   })
      // }

      // Backend: updateStaff (send password only if email changed — your spec shows password in body, so we include conditionally)
      const payload = {
        staffId: originalStaff._id || originalStaff.staffId || '',
        name: formData.name.trim(),
        email: formData.email.trim(),
        ...(emailChanged ? { password: originalStaff.password } : {}),
        roleId: formData.roleId,
        authId: originalStaff.authId || ''
      }

      dispatch(updateStaff(payload)).then(() => dispatch(fetchStaff({ start: page, limit: pageSize })))
      onClose?.()
    } catch (err) {
      console.error('catch', err)
      toast.error(err?.message || err?.response?.data?.message || 'Failed to update staff')
    } finally {
      setSubmitting(false)
    }
  }

  const busy = externalLoading || submitting

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
          {mode === 'edit' ? 'Edit Staff' : 'Add New Staff'}
        </Typography>
        <DialogCloseButton onClick={handleClose}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>

      <DialogContent className='pt-2'>
        <div className='flex flex-col gap-5'>
          <TextField
            fullWidth
            label='Staff Name'
            placeholder='Enter staff name'
            value={formData.name}
            onChange={e => handleChange('name', e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
          />

          <TextField
            fullWidth
            label='Staff Email'
            placeholder='Enter staff email'
            value={formData.email}
            onChange={e => handleChange('email', e.target.value)}
            error={!!errors.email}
            helperText={
              mode === 'edit' && errors.email
                ? errors.email
                : mode === 'edit'
                  ? 'Changing email will also update Firebase using the stored password.'
                  : errors.email
            }
          />

          {mode === 'create' && (
            <TextField
              fullWidth
              label='Staff Password'
              placeholder='Enter staff password'
              type='password'
              value={formData.password}
              onChange={e => handleChange('password', e.target.value)}
              error={!!errors.password}
              helperText={errors.password}
            />
          )}

          <Autocomplete
            options={roles || []}
            getOptionLabel={o => o?.name || ''}
            value={roleValue}
            onChange={(_, val) => handleChange('roleId', val?._id || '')}
            renderInput={params => (
              <TextField
                {...params}
                label='Role'
                placeholder='Select role'
                error={!!errors.roleId}
                helperText={errors.roleId}
                fullWidth
              />
            )}
            isOptionEqualToValue={(o, v) => o._id === v._id}
            disableClearable
          />
        </div>
      </DialogContent>

      <DialogActions className='dialog-actions-dense'>
        <Button variant='outlined' color='secondary' onClick={handleClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant='contained' onClick={handleSubmit} disabled={busy}>
          {busy ? (
            <>
              <CircularProgress color='white' size={20} sx={{ mr: 1 }} /> <span>Saving...</span>
            </>
          ) : mode === 'edit' ? (
            'Update'
          ) : (
            'Create'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default StaffDialog
