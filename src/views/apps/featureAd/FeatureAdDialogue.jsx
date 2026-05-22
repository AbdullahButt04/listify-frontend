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
import { getFullImageUrl } from '@/utils/commonfunctions'
import StyledFileInput from '@/@layouts/styles/inputs/StyledFileInput'
import { createFeatureAd, updateFeatureAd } from '@/redux-store/slices/feature'
import { NO_PERMISSION } from '@/utils/constants'
import { toast } from 'react-toastify'

// Redux actions aap apne according import/update kijiye
// import { createFeatureAd, updateFeatureAd } from '@/redux-store/slices/featureAd'

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const FeatureAdDialogue = ({ open, onClose, editData = null }) => {
  const dispatch = useDispatch()

  const { profileData } = useSelector(state => state.adminSlice)



  const [formData, setFormData] = useState({
    name: '',
    iosProductId: '',
    price: '',
    discount: '',
    finalPrice: '',
    description: '',
    days: '',
    advertisementLimit: '',
    imageFile: null
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name ?? '',
        iosProductId: editData.iosProductId ?? '',
        price: editData.price ?? '',
        discount: editData.discount ?? '',
        finalPrice: editData.finalPrice ?? '',
        description: editData.description ?? '',
        days: editData.days ?? '',
        advertisementLimit: editData.advertisementLimit ?? '',
        imageFile: null
      })
      setImagePreview(editData.image ? getFullImageUrl(editData.image) : null)
    } else {
      setFormData({
        name: '',
        iosProductId: '',
        price: '',
        discount: '',
        finalPrice: '',
        description: '',
        days: '',
        advertisementLimit: '',
        imageFile: null
      })
      setImagePreview(null)
    }
    setErrors({})
  }, [editData, open])

  // handle Change
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleFileChange = event => {
    const file = event.target.files[0]
    if (file) {
      if (file.type.startsWith('image/')) {
        setFormData(prev => ({ ...prev, imageFile: file }))
        setImagePreview(URL.createObjectURL(file))
        setErrors(prev => ({ ...prev, imageFile: '' }))
      } else {
        setErrors(prev => ({ ...prev, imageFile: 'Please select a valid image file' }))
      }
    }
  }

  // Validation logic
  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) newErrors.name = 'Name is required'
    // if (!formData.iosProductId.trim()) newErrors.iosProductId = 'iOS Product Id is required'
    if (!formData.price) newErrors.price = 'Price is required'
    else if (Number(formData.price) < 0) newErrors.price = 'Price cannot be negative'
    if (formData.discount === '' || formData.discount === null) newErrors.discount = 'Discount is required'
    else if (Number(formData.discount) < 0) newErrors.discount = 'Discount cannot be negative'
    if (!formData.finalPrice && formData.finalPrice !== 0) newErrors.finalPrice = 'Final price is required'
    else if (Number(formData.finalPrice) < 0) newErrors.finalPrice = 'Final price cannot be negative'
    if (!formData.description) newErrors.description = 'Description is required'
    if (!formData.days) newErrors.days = 'Days is required'
    else if (Number(formData.days) < 0) newErrors.days = 'Days cannot be negative'
    if (!formData.advertisementLimit) newErrors.advertisementLimit = 'Advertisement limit is required'
    else if (Number(formData.advertisementLimit) < 0)
      newErrors.advertisementLimit = 'Advertisement limit cannot be negative'

    if (!editData && !formData.imageFile) {
      newErrors.imageFile = 'Image is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return



    setLoading(true)

    const submitData = new FormData()
    submitData.append('name', formData.name)
    submitData.append('iosProductId', formData.iosProductId)
    submitData.append('price', formData.price)
    submitData.append('discount', formData.discount)
    submitData.append('finalPrice', formData.finalPrice)
    submitData.append('description', formData.description)
    submitData.append('days', formData.days)
    submitData.append('advertisementLimit', formData.advertisementLimit)
    if (formData.imageFile) {
      submitData.append('image', formData.imageFile)
    }

    try {
      if (editData) {
        submitData.append('packageId', editData._id)
        await dispatch(updateFeatureAd(submitData)).unwrap()
      } else {
        await dispatch(createFeatureAd(submitData)).unwrap()
      }
      onClose()
    } catch (err) {
      // handle errors
    } finally {
      setLoading(false)
    }
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
          {editData ? 'Edit Feature Ad Package' : 'Create Feature Ad Package'}
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
            label='iOS Product Id'
            fullWidth
            value={formData.iosProductId}
            onChange={e => handleChange('iosProductId', e.target.value)}
            error={!!errors.iosProductId}
            helperText={errors.iosProductId}
          />
          <TextField
            label='Price'
            type='number'
            fullWidth
            value={formData.price}
            onChange={e => {
              handleChange('price', e.target.value)
              const price = Number(e.target.value) || 0
              const discount = Number(formData.discount) || 0
              const finalPrice = price - (price * discount) / 100
              setFormData(prev => ({ ...prev, finalPrice }))
            }}
            error={!!errors.price}
            helperText={errors.price}
          />
          <TextField
            label='Discount (%)'
            type='number'
            fullWidth
            value={formData.discount}
            onChange={e => {
              handleChange('discount', e.target.value)
              const price = Number(formData.price) || 0
              const discount = Number(e.target.value) || 0
              const finalPrice = price - (price * discount) / 100
              setFormData(prev => ({ ...prev, finalPrice }))
            }}
            error={!!errors.discount}
            helperText={errors.discount}
          />
          <TextField
            label='Final Price'
            type='number'
            fullWidth
            value={formData.finalPrice}
            InputProps={{
              readOnly: true
            }}
            error={!!errors.finalPrice}
            helperText={errors.finalPrice}
          />
          <TextField
            label='Description'
            fullWidth
            value={formData.description}
            onChange={e => handleChange('description', e.target.value)}
            error={!!errors.description}
            helperText={errors.description}
          />
          <TextField
            label='Days'
            type='number'
            fullWidth
            value={formData.days}
            onChange={e => handleChange('days', e.target.value)}
            error={!!errors.days}
            helperText={errors.days}
          />
          <TextField
            label='Advertisement Limit'
            type='number'
            fullWidth
            value={formData.advertisementLimit}
            onChange={e => handleChange('advertisementLimit', e.target.value)}
            error={!!errors.advertisementLimit}
            helperText={errors.advertisementLimit}
          />

          <Box>
            <StyledFileInput
              accept='JPEG (JPG), PNG, GIF, WebP'
              label={editData ? 'Change Image' : 'Upload Image'}
              onChange={handleFileChange}
              required={!editData}
            />
            {errors.imageFile && (
              <Typography color='error' variant='body2' sx={{ mt: 1, color: '#ff4c51' }}>
                {errors.imageFile}
              </Typography>
            )}
            {imagePreview && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <img
                  src={imagePreview}
                  alt='Image preview'
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

export default FeatureAdDialogue
