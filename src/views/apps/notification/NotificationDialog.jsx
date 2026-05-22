'use client'

import React, { useState, useEffect, forwardRef } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slide,
  Typography,
  Button,
  TextField,
  Autocomplete,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Box,
  CircularProgress
} from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import StyledFileInput from '@/@layouts/styles/inputs/StyledFileInput'
import { createNotification, fetchAdList, fetchUserList } from '@/redux-store/slices/notification'
import { NO_PERMISSION } from '@/utils/constants'
import { toast } from 'react-toastify'

// --- Slide Transition
const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const NotificationDialog = ({ open, onClose, mode = 'create', notification = null }) => {
  const dispatch = useDispatch()
  const { usersListNotif, adsListNotif } = useSelector(state => state.notification)

  const { profileData } = useSelector(state => state.adminSlice)



  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [imagePreview, setImagePreview] = useState(null)

  const [form, setForm] = useState({
    userSelectionType: 'all',
    users: [],
    ads: [],
    title: '',
    message: '',
    image: ''
  })

  useEffect(() => {
    dispatch(fetchUserList())
    dispatch(fetchAdList())
  }, [dispatch])

  const usersOptions = usersListNotif.map(user => ({
    label: user.name,
    value: user._id
  }))

  const adsOptions = adsListNotif.map(ad => ({
    label: ad.title,
    value: ad._id
  }))

  // Pre-fill ya edit mode me initial data
  useEffect(() => {
    setForm({
      userSelectionType: notification?.userSelectionType || 'all',
      users: notification?.users || [],
      ads: notification?.ads || [],
      title: notification?.title || '',
      message: notification?.message || '',
      image: notification?.image || ''
    })
    setErrors({})
    setImagePreview(notification?.image ? notification.image : null)
  }, [notification, open, mode])

  // File change handler & preview
  const handleFileChange = e => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrors(p => ({ ...p, image: 'Please select a valid image file' }))
      return
    }
    setForm(prev => ({ ...prev, image: file }))
    setImagePreview(URL.createObjectURL(file))
  }

  // Validation
  const validate = () => {
    const e = {}
    if (!form.title?.trim()) e.title = 'Title is required'
    if (!form.message?.trim()) e.message = 'Message is required'
    // image validation hata diya, optional hai
    if (form.userSelectionType === 'selected' && (!form.users || form.users.length === 0))
      e.users = 'Select at least one user'
    // if (!form.ads || form.ads.length === 0) e.ads = 'Select at least one ad'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // Submit
  const handleSubmit = async () => {
    if (!validate()) return



    try {
      setLoading(true)
      const fd = new FormData()
      if (form.userSelectionType === 'all') {
        fd.append('userId', 'all')
      } else {
        fd.append('userId', form.users.join(','))
      }
      fd.append('adId', form.ads)
      fd.append('title', form.title.trim())
      fd.append('message', form.message.trim())
      if (form.image && typeof form.image !== 'string') fd.append('image', form.image)

      dispatch(createNotification(fd))
      onClose()
    } catch (err) {
      setErrors({ submit: err.message || 'Error sending notification' })
    } finally {
      setLoading(false)
    }
  }

  // Render
  return (
    <Dialog
      open={open}
      keepMounted
      onClose={onClose}
      TransitionComponent={Transition}
      fullWidth
      maxWidth='sm'
      PaperProps={{ sx: { overflow: 'visible', width: 500, maxWidth: '95vw' } }}
    >
      <DialogTitle>
        <Typography variant=''>{mode === 'edit' ? 'Edit Notification' : 'Add New Notification'}</Typography>
        <DialogCloseButton onClick={onClose}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>

      <DialogContent className='pt-2'>
        <div className='flex flex-col gap-5'>
          {/* User Target select */}
          <FormControl fullWidth>
            <InputLabel>User Target</InputLabel>
            <Select
              label='User Target'
              value={form.userSelectionType}
              onChange={e => setForm(prev => ({ ...prev, userSelectionType: e.target.value }))}
              disabled={loading}
            >
              <MenuItem value='all'>All</MenuItem>
              <MenuItem value='selected'>Selected</MenuItem>
            </Select>
          </FormControl>

          {/* User multi-select only if 'selected' */}
          {form.userSelectionType === 'selected' && (
            <Autocomplete
              multiple
              disableCloseOnSelect
              options={usersOptions}
              getOptionLabel={option => (option.label ? option.label : 'No Name')}
              value={usersOptions.filter(opt => form.users.includes(opt.value))}
              onChange={(_, selectedOptions) => {
                const selectedUserIds = selectedOptions.map(opt => opt.value)
                setForm(prev => ({ ...prev, users: selectedUserIds }))
              }}
              renderInput={params => (
                <TextField
                  {...params}
                  label='Users'
                  placeholder='Select users'
                  error={!!errors.users}
                  helperText={errors.users}
                  disabled={loading}
                />
              )}
              disabled={loading}
            />
          )}

          {/* Ads multi-select */}
          <Autocomplete
            options={adsOptions}
            getOptionLabel={option => option.label}
            value={adsOptions.find(opt => form.ads.includes(opt.value)) || null}
            onChange={(_, selectedOption) => {
              setForm(prev => ({
                ...prev,
                ads: selectedOption ? [selectedOption.value] : []
              }))
            }}
            renderInput={params => (
              <TextField
                {...params}
                label='Ads'
                placeholder='Select an ad'
                error={!!errors.ads}
                helperText={errors.ads}
                disabled={loading}
              />
            )}
            disabled={loading}
          />

          {/* Title */}
          <TextField
            fullWidth
            label='Title'
            placeholder='Enter notification title'
            value={form.title}
            onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
            error={!!errors.title}
            helperText={errors.title}
            disabled={loading}
          />

          {/* Message */}
          <TextField
            fullWidth
            multiline
            label='Message'
            placeholder='Type your message here'
            rows={4}
            value={form.message}
            onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))}
            error={!!errors.message}
            helperText={errors.message}
            disabled={loading}
          />

          {/* Image Upload */}
          <div>
            <StyledFileInput accept='image/*' onChange={handleFileChange} disabled={loading} />
            {errors.image && (
              <Typography className='text-error' variant='caption' sx={{ mt: 1, display: 'block' }}>
                {errors.image}
              </Typography>
            )}
          </div>
          {imagePreview && (
            <Box sx={{ mt: 1, textAlign: 'center' }}>
              <img
                src={imagePreview}
                alt='Preview'
                style={{
                  maxWidth: 200,
                  maxHeight: 200,
                  objectFit: 'cover',
                  borderRadius: 8
                }}
              />
            </Box>
          )}
        </div>
      </DialogContent>

      <DialogActions>
        <Button variant='outlined' color='secondary' onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant='contained' onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} color='white' /> Saving…
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

export default NotificationDialog
