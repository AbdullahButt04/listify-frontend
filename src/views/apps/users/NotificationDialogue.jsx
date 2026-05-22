'use client'

import React, { useState, useEffect } from 'react'
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
  Box,
  CircularProgress
} from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import StyledFileInput from '@/@layouts/styles/inputs/StyledFileInput'
import { createNotification, fetchAdList, fetchUserList } from '@/redux-store/slices/notification'
import { createNotiPerUser } from '@/redux-store/slices/user'
import { toast } from 'react-toastify'
import { NO_PERMISSION } from '@/utils/constants'

// Slide Transition component
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const NotificationDialogue = ({ open, onClose, selectedUserData }) => {
  const dispatch = useDispatch()
  const { usersListNotif, adsListNotif } = useSelector(state => state.notification)

  const { profileData } = useSelector(state => state.adminSlice)



  const [form, setForm] = useState({
    users: '',
    ads: '',
    title: '',
    message: '',
    image: ''
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)

  const handleClose = () => {
    setForm({
      users: '',
      ads: '',
      title: '',
      message: '',
      image: ''
    })
    setImagePreview(null)
    setErrors({})
    onClose()
  }

  // Fetch users and ads on mount
  useEffect(() => {
    dispatch(fetchUserList())
    dispatch(fetchAdList())
    setErrors({})
  }, [dispatch])

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: null }))
  }

  const adsOptions = adsListNotif.map(ad => ({
    label: ad.title,
    value: ad._id
  }))

  // Handle file input change and preview
  const handleFileChange = e => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, image: 'Please select a valid image file' }))
      return
    }
    setForm(prev => ({ ...prev, image: file }))
    setImagePreview(URL.createObjectURL(file))
    setErrors(prev => ({ ...prev, image: '' }))
  }

  // Basic validation
  const validate = () => {
    const e = {}
    if (!form.title?.trim()) e.title = 'Title is required'
    if (!form.message?.trim()) e.message = 'Message is required'
    // if (!form.users) e.users = 'Select a user'
    // if (!form.ads) e.ads = 'Select an ad'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // Submit handler
  const handleSubmit = async () => {
    if (!validate()) return



    try {
      setLoading(true)
      const fd = new FormData()
      fd.append('userId', selectedUserData?._id)
      if (form.ads) fd.append('adId', form.ads)
      fd.append('title', form.title.trim())
      fd.append('message', form.message.trim())
      if (form.image && typeof form.image !== 'string') fd.append('image', form.image)

      dispatch(createNotiPerUser(fd))
      handleClose()
      setForm({
        users: '',
        ads: '',
        title: '',
        message: '',
        image: ''
      })
    } catch (err) {
      setErrors({ submit: err.message || 'Error sending notification' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      TransitionComponent={Transition}
      fullWidth
      maxWidth='sm'
      PaperProps={{ sx: { overflow: 'visible', width: 500, maxWidth: '95vw' } }}
    >
      <DialogTitle>
        Send Notification
        <DialogCloseButton onClick={handleClose}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>

      <DialogContent className='pt-2'>
        <div className='flex flex-col gap-5'>
          <Autocomplete
            options={adsOptions}
            getOptionLabel={option => option.label}
            value={adsOptions.find(opt => opt.value === form.ads) || null}
            onChange={(_, selectedOption) => {
              handleChange('ads', selectedOption ? selectedOption.value : '')
            }}
            renderInput={params => (
              <TextField
                {...params}
                label='Ad'
                placeholder='Select ad'
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
            onChange={e => handleChange('title', e.target.value)}
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
            onChange={e => handleChange('message', e.target.value)}
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
                style={{ maxWidth: 200, maxHeight: 200, objectFit: 'cover', borderRadius: 8 }}
              />
            </Box>
          )}
        </div>
      </DialogContent>

      <DialogActions>
        <Button variant='outlined' color='secondary' onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant='contained' onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} color='white' /> Saving…
            </>
          ) : (
            'Send'
          )}
        </Button>
      </DialogActions>

      {errors.submit && (
        <Typography color='error' sx={{ p: 2 }}>
          {errors.submit}
        </Typography>
      )}
    </Dialog>
  )
}

export default NotificationDialogue
