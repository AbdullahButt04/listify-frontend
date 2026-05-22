'use client'

import React, { forwardRef, useEffect, useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Slide,
  TextField,
  CircularProgress,
  Typography,
  Box
} from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import StyledFileInput from '@/@layouts/styles/inputs/StyledFileInput'
import { getFullImageUrl } from '@/utils/commonfunctions'
import { updateUser } from '@/redux-store/slices/user'
import { toast } from 'react-toastify'
import { NO_PERMISSION } from '@/utils/constants'

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const AddUserDialogue = ({ open, onClose, editData = null }) => {
  const dispatch = useDispatch()
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    profileImageFile: null
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)

  const { profileData } = useSelector(state => state.adminSlice)



  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name ?? '',
        address: editData.address ?? '',
        profileImageFile: null
      })
      setImagePreview(editData.profileImage ? getFullImageUrl(editData.profileImage) : null)
    } else {
      setFormData({
        name: '',
        address: '',
        profileImageFile: null
      })
      setImagePreview(null)
    }
    setErrors({})
  }, [editData, open])

  // Handle field change
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  // File change handler
  const handleFileChange = event => {
    const file = event.target.files[0]
    if (file) {
      if (file.type.startsWith('image/')) {
        setFormData(prev => ({ ...prev, profileImageFile: file }))
        setImagePreview(URL.createObjectURL(file))
        setErrors(prev => ({ ...prev, profileImageFile: '' }))
      } else {
        setErrors(prev => ({ ...prev, profileImageFile: 'Please select a valid image file' }))
      }
    }
  }

  // Validation
  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.address.trim()) newErrors.address = 'Address is required'
    if (!editData && !formData.profileImageFile) newErrors.profileImageFile = 'Profile image is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return



    setLoading(true)

    const submitData = new FormData()

    if (editData) {
      if (formData.name !== editData.name) {
        submitData.append('name', formData.name)
      }
      if (formData.address !== editData.address) {
        submitData.append('address', formData.address)
      }
      if (formData.profileImageFile) {
        submitData.append('profileImage', formData.profileImageFile)
      }

      if (submitData.has('name') || submitData.has('address') || submitData.has('profileImage')) {
        submitData.append('userId', editData._id)
        await dispatch(updateUser(submitData)).unwrap()
      } else {
        toast('No changes made to update.')
      }
    } else {
      // For new user creation, send full data always
      submitData.append('name', formData.name)
      submitData.append('address', formData.address)
      if (formData.profileImageFile) {
        submitData.append('profileImage', formData.profileImageFile)
      }
      await dispatch(createUser(submitData)).unwrap()
    }

    onClose()
    setLoading(false)
    setFormData({})
    setErrors({})
  }

  return (
    <Dialog
      open={open}
      keepMounted
      onClose={onClose}
      TransitionComponent={Transition}
      closeAfterTransition={false}
      fullWidth
      maxWidth='sm'
      PaperProps={{ sx: { overflow: 'visible', width: '600px', maxWidth: '95vw' } }}
    >
      <DialogTitle>
        <Typography variant='h5' component='span'>
          {editData ? 'Edit User' : 'Add User'}
        </Typography>
        <DialogCloseButton onClick={onClose}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          <TextField
            label='Name'
            fullWidth
            value={formData.name}
            onChange={e => handleChange('name', e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
          />
          <TextField
            label='Address'
            fullWidth
            value={formData.address}
            onChange={e => handleChange('address', e.target.value)}
            error={!!errors.address}
            helperText={errors.address}
          />
          <Box>
            <StyledFileInput
              accept='JPEG (JPG), PNG, GIF, WebP'
              label={editData ? 'Change Profile Image' : 'Upload Profile Image'}
              onChange={handleFileChange}
              required={!editData}
            />
            {errors.profileImageFile && (
              <Typography color='error' variant='body2' sx={{ mt: 1, color: '#ff4c51' }}>
                {errors.profileImageFile}
              </Typography>
            )}
            {imagePreview && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <img
                  src={imagePreview}
                  alt='Profile preview'
                  style={{
                    maxWidth: '100%',
                    maxHeight: 200,
                    objectFit: 'contain',
                    borderRadius: 4,
                    border: '1px solid #e0e0e0'
                  }}
                />
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant='tonal' disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant='contained' disabled={loading}>
          {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : editData ? 'Update' : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddUserDialogue
