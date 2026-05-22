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
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText
} from '@mui/material'

import { useDispatch, useSelector } from 'react-redux'

import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import StyledFileInput from '@/@layouts/styles/inputs/StyledFileInput'
import { createNewBanner, modifyBannerDetails } from '@/redux-store/slices/banner'
import { baseURL } from '@/utils/config'
import { NO_PERMISSION } from '@/utils/constants'
import { toast } from 'react-toastify'

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const BannerDialog = ({ open, onClose, editData = null, onSuccess }) => {
  const dispatch = useDispatch()

  const { profileData } = useSelector(state => state.adminSlice)



  const [formData, setFormData] = useState({
    redirectUrl: '',
    imageFile: null
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [imagePreview, setImagePreview] = useState(null)

  useEffect(() => {
    if (editData) {
      setFormData({
        redirectUrl: editData.redirectUrl || '',
        imageFile: null
      })
      setImagePreview(editData.image ? `${baseURL}${editData.image}` : null)
    } else {
      setFormData({
        redirectUrl: '',
        imageFile: null
      })
      setImagePreview(null)
    }

    setErrors({})
  }, [editData, open])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const handleFileChange = event => {
    const file = event.target.files[0]

    if (file) {
      if (file.type.startsWith('image/')) {
        setFormData(prev => ({
          ...prev,
          imageFile: file
        }))
        setImagePreview(URL.createObjectURL(file))

        if (errors.imageFile) {
          setErrors(prev => ({
            ...prev,
            imageFile: ''
          }))
        }
      } else {
        setErrors(prev => ({
          ...prev,
          imageFile: 'Please select a valid image file'
        }))
      }
    }
  }

  const validateForm = () => {
    const newErrors = {}

    // if (!/^https?:\/\/.+/.test(formData.redirectUrl)) {
    //   newErrors.redirectUrl = 'Please enter a valid URL'
    // }

    if (!editData && !formData.imageFile) {
      newErrors.imageFile = 'Image is required'
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return



    setLoading(true)

    try {
      const submitData = new FormData()

      submitData.append('redirectUrl', formData.redirectUrl)

      if (formData.imageFile) {
        submitData.append('image', formData.imageFile)
      }

      if (editData) {
        submitData.append('bannerId', editData._id)
        await dispatch(modifyBannerDetails(submitData)).unwrap()
      } else {
        await dispatch(createNewBanner(submitData)).unwrap()
      }

      // onSuccess && onSuccess()
      onClose()
    } catch (err) {
      // Error already handled by toast in thunk
    } finally {
      setLoading(false)
    }
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
      PaperProps={{
        sx: {
          overflow: 'visible',
          width: '500px',
          maxWidth: '95vw'
        }
      }}
    >
      <DialogTitle>
        <Typography variant='h5' component='span'>
          {editData ? 'Edit Banner' : 'Create New Banner'}
        </Typography>
        <DialogCloseButton onClick={onClose}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          <TextField
            fullWidth
            label='Redirect URL'
            value={formData.redirectUrl}
            onChange={e => handleInputChange('redirectUrl', e.target.value)}
            error={!!errors.redirectUrl}
            helperText={errors.redirectUrl}
            placeholder='https://example.com'
          />

          <Box>
            <StyledFileInput
              accept='JPEG (JPG), PNG, GIF, WebP'
              label={editData ? 'Change Image' : 'Upload Image'}
              onChange={handleFileChange}
              required={editData ? false : true}
            />
            {errors.imageFile && (
              <Typography color='red' variant='body2' sx={{ mb: 1 }}>
                {errors.imageFile}
              </Typography>
            )}
            {imagePreview && (
              <Box sx={{ textAlign: 'center' }}>
                <img
                  src={imagePreview}
                  alt='Banner preview'
                  style={{
                    maxWidth: '100%',
                    maxHeight: '200px',
                    objectFit: 'contain',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px'
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
          {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : editData ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default BannerDialog
