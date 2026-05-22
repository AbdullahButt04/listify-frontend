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
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Typography,
  Box
} from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import { getFullImageUrl } from '@/utils/commonfunctions'
import StyledFileInput from '@/@layouts/styles/inputs/StyledFileInput'
import { createSubscriptionPlan, updateSubscriptionPlan } from '@/redux-store/slices/subscriptionPlan'
import { fetchSetting } from '@/redux-store/slices/setting'
import { NO_PERMISSION } from '@/utils/constants'
import { toast } from 'react-toastify'

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const SubscriptionPlanDialogue = ({ open, onClose, editData = null }) => {
  const dispatch = useDispatch()

  const { setting } = useSelector(state => state.setting)

  const { profileData } = useSelector(state => state.adminSlice)



  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discount: '',
    finalPrice: '',
    daysIsLimited: true,
    daysValue: '',
    adsIsLimited: true,
    adsValue: '',
    imageFile: null
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)

  useEffect(() => {
    dispatch(fetchSetting())
  }, [dispatch])

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name ?? '',
        description: editData.description ?? '',
        price: editData.price ?? '',
        discount: editData.discount ?? '',
        finalPrice: editData.finalPrice ?? '',
        daysIsLimited: Boolean(editData.days?.isLimited ?? true),
        daysValue: editData.days.value ?? '',
        adsIsLimited: Boolean(editData.advertisements?.isLimited ?? true),
        adsValue: editData.advertisements.value ?? '',
        imageFile: null
      })
      setImagePreview(editData.image ? getFullImageUrl(editData.image) : null)
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        discount: '',
        finalPrice: '',
        daysIsLimited: true,
        daysValue: '',
        adsIsLimited: true,
        adsValue: '',
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

  const handleCheckboxChange = (field, checked) => {
    setFormData(prev => {
      const updatedData = { ...prev, [field]: checked }

      // Agar Days Limited uncheck kiya to value reset kar dena
      if (field === 'daysIsLimited' && !checked) {
        updatedData.daysValue = ''
      }

      // Agar Ads Limited uncheck kiya to value reset kar dena
      if (field === 'adsIsLimited' && !checked) {
        updatedData.adsValue = ''
      }

      return updatedData
    })

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // handle File Change
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

  const validateForm = () => {
    const newErrors = {}

    // Name
    if (!formData.name.trim()) newErrors.name = 'Name is required'

    // Description
    if (!formData.description.trim()) newErrors.description = 'Description is required'

    // Price
    if (!formData.price) {
      newErrors.price = 'Price is required'
    } else if (Number(formData.price) < 0) {
      newErrors.price = 'Price cannot be negative'
    }

    // Discount
    if (formData.discount === '' || formData.discount === null) {
      newErrors.discount = 'Discount is required'
    } else if (Number(formData.discount) < 0) {
      newErrors.discount = 'Discount cannot be negative'
    }

    // Final Price
    if (!formData.finalPrice && formData.finalPrice !== 0) {
      newErrors.finalPrice = 'Final price is required'
    } else if (Number(formData.finalPrice) < 0) {
      newErrors.finalPrice = 'Final price cannot be negative'
    }

    // Days Value (only if limited)
    if (formData.daysIsLimited) {
      if (!formData.daysValue) {
        newErrors.daysValue = 'Days value is required'
      } else if (Number(formData.daysValue) < 0) {
        newErrors.daysValue = 'Days value cannot be negative'
      }
    }

    // Ads Value (only if limited)
    if (formData.adsIsLimited) {
      if (!formData.adsValue) {
        newErrors.adsValue = 'Ads value is required'
      } else if (Number(formData.adsValue) < 0) {
        newErrors.adsValue = 'Ads value cannot be negative'
      }
    }

    // Image Required (only for create)
    if (!editData && !formData.imageFile) {
      newErrors.imageFile = 'Image is required'
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  // Submit Handler
  const handleSubmit = async () => {
    if (!validateForm()) return



    setLoading(true)

    const submitData = new FormData()
    submitData.append('name', formData.name)
    submitData.append('description', formData.description)
    submitData.append('price', formData.price)
    submitData.append('discount', formData.discount)
    submitData.append('finalPrice', formData.finalPrice)
    submitData.append('daysIsLimited', formData.daysIsLimited)
    submitData.append('daysValue', formData.daysValue)
    submitData.append('adsIsLimited', formData.adsIsLimited)
    submitData.append('adsValue', formData.adsValue)
    if (formData.imageFile) {
      submitData.append('image', formData.imageFile)
    }
    try {
      if (editData) {
        submitData.append('planId', editData._id)
        await dispatch(updateSubscriptionPlan(submitData)).unwrap()
      } else {
        await dispatch(createSubscriptionPlan(submitData)).unwrap()
      }

      onClose()
    } catch (err) {
      // Handle error
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
          {editData ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
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
            label='Description'
            fullWidth
            value={formData.description}
            onChange={e => handleChange('description', e.target.value)}
            error={!!errors.description}
            helperText={errors.description}
          />
          <TextField
            label={`Price (${setting?.currency?.symbol})`}
            type='number'
            fullWidth
            value={formData.price}
            onChange={e => {
              const value = e.target.value
              // Allow only positive numbers and empty string
              if (/^\d*\.?\d*$/.test(value)) {
                handleChange('price', value)

                const price = Number(value) || 0
                const discount = Number(formData.discount) || 0
                const finalPrice = price - (price * discount) / 100
                setFormData(prev => ({ ...prev, finalPrice }))
              }
            }}
            error={!!errors.price}
            helperText={errors.price}
            inputProps={{ min: 0 }}
          />

          <TextField
            label='Discount (%)'
            type='number'
            fullWidth
            value={formData.discount}
            onChange={e => {
              const value = e.target.value
              if (/^\d*\.?\d*$/.test(value)) {
                handleChange('discount', value)

                const price = Number(formData.price) || 0
                const discount = Number(value) || 0
                const finalPrice = price - (price * discount) / 100
                setFormData(prev => ({ ...prev, finalPrice }))
              }
            }}
            error={!!errors.discount}
            helperText={errors.discount}
            inputProps={{ min: 0 }}
          />

          <TextField
            label='Final Price'
            type='number'
            fullWidth
            value={formData.finalPrice}
            InputProps={{
              readOnly: true // user type na kar sake
            }}
            error={!!errors.finalPrice}
            helperText={errors.finalPrice}
            inputProps={{ min: 0 }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={formData.daysIsLimited}
                onChange={e => handleCheckboxChange('daysIsLimited', e.target.checked)}
              />
            }
            label='Days Limited'
          />

          {formData.daysIsLimited && (
            <TextField
              label='Days Value'
              type='number'
              fullWidth
              value={formData.daysValue}
              onChange={e => {
                const value = e.target.value
                if (/^\d*\.?\d*$/.test(value)) {
                  handleChange('daysValue', value)
                }
              }}
              error={!!errors.daysValue}
              helperText={errors.daysValue}
              inputProps={{ min: 0 }}
            />
          )}

          <FormControlLabel
            control={
              <Checkbox
                checked={formData.adsIsLimited}
                onChange={e => handleCheckboxChange('adsIsLimited', e.target.checked)}
              />
            }
            label='Ads Limited'
          />

          {formData.adsIsLimited && (
            <TextField
              label='Ads Value'
              type='number'
              fullWidth
              value={formData.adsValue}
              onChange={e => {
                const value = e.target.value
                if (/^\d*\.?\d*$/.test(value)) {
                  handleChange('adsValue', value)
                }
              }}
              error={!!errors.adsValue}
              helperText={errors.adsValue}
              inputProps={{ min: 0 }}
            />
          )}

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

export default SubscriptionPlanDialogue
