'use client'

import React, { forwardRef, useEffect, useState, useMemo } from 'react'
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
  Autocomplete,
  Grid2
} from '@mui/material'
import CustomIconButton from '@/@core/components/mui/IconButton'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import StyledFileInput from '@/@layouts/styles/inputs/StyledFileInput'
import { getFullImageUrl } from '@/utils/commonfunctions'
import { useDispatch, useSelector } from 'react-redux'
import { GetHierarchicalCategory } from '@/redux-store/slices/categories'
import fallbackImg from '../../../src/assets/images/defaultImage.jpg'
import { updateLiveAd } from '@/redux-store/slices/liveAds'
import { NO_PERMISSION } from '@/utils/constants'
import { toast } from 'react-toastify'

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

// For single category, convert to id string or empty string
const idFromCategory = cat =>
  cat && typeof cat === 'object' && '_id' in cat ? cat._id : typeof cat === 'string' ? cat : ''

const EditDialogue = ({ open, onClose, editData = null }) => {
  const dispatch = useDispatch()
  const { hierarchicalCategories = [] } = useSelector(state => state.categories)

  const { profileData } = useSelector(state => state.adminSlice)



  const [formData, setFormData] = useState({
    adId: '',
    title: '',
    price: '',
    subTitle: '',
    description: '',
    availableUnits: '',
    contactNumber: '',
    primaryImageFile: null,
    galleryImagesFile: [],
    latitude: '',
    longitude: '',
    reason: '',
    categoryId: ''
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [primaryImagePreview, setPrimaryImagePreview] = useState(null)
  const [galleryImagesPreview, setGalleryImagesPreview] = useState([])
  const [cheakImage, setImageCheak] = useState([])

  const [removedIndices, setRemovedIndices] = useState([])

  useEffect(() => {
    dispatch(GetHierarchicalCategory())
  }, [dispatch])

  const flatten = (nodes = [], depth = 0) => {
    const out = []
    for (const n of nodes) {
      out.push({ id: n._id, name: n.name, depth })
      if (n.children?.length) out.push(...flatten(n.children, depth + 1))
    }
    return out
  }
  const flatOptions = useMemo(() => flatten(hierarchicalCategories), [hierarchicalCategories])

  useEffect(() => {
    if (editData) {
      setFormData({
        adId: editData._id ?? '',
        title: editData.title ?? '',
        price: editData.price ?? '',
        subTitle: editData.subTitle ?? '',
        description: editData.description ?? '',
        availableUnits: editData.availableUnits ?? '',
        contactNumber: editData.contactNumber ?? '',
        primaryImageFile: null,
        galleryImagesFile: [],
        latitude: editData.location?.latitude ?? '',
        longitude: editData.location?.longitude ?? '',
        reason: editData.adminEditNotes ?? '',
        categoryId: idFromCategory(editData.category)
      })
      setPrimaryImagePreview(editData.primaryImage ? getFullImageUrl(editData.primaryImage) : null)
      setGalleryImagesPreview(
        Array.isArray(editData.galleryImages) ? editData.galleryImages.map(img => getFullImageUrl(img)) : []
      )
      setImageCheak(
        Array.isArray(editData.galleryImages) ? editData.galleryImages.map(img => getFullImageUrl(img)) : []
      )
    } else {
      setFormData({
        adId: '',
        title: '',
        price: '',
        subTitle: '',
        description: '',
        availableUnits: '',
        contactNumber: '',
        primaryImageFile: null,
        galleryImagesFile: [],
        latitude: '',
        longitude: '',
        reason: '',
        categoryId: ''
      })
      setPrimaryImagePreview(null)
      setGalleryImagesPreview([])
    }
    setErrors({})
  }, [editData, open])

  // Field Change
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  // Primary Image Handler
  const handlePrimaryImage = e => {
    const file = e.target.files[0]
    if (file && file.type.startsWith('image/')) {
      setFormData(prev => ({ ...prev, primaryImageFile: file }))
      setPrimaryImagePreview(URL.createObjectURL(file))
      setErrors(prev => ({ ...prev, primaryImageFile: '' }))
    } else {
      setErrors(prev => ({ ...prev, primaryImageFile: 'Select a valid image file' }))
    }
  }

  // Gallery Images Handler - Add images
  const handleGalleryImages = e => {
    const files = Array.from(e.target.files).filter(file => file.type.startsWith('image/'))
    if (files.length) {
      setFormData(prev => ({
        ...prev,
        galleryImagesFile: [...prev.galleryImagesFile, ...files]
      }))
      setGalleryImagesPreview(prev => [...prev, ...files.map(file => URL.createObjectURL(file))])
      setErrors(prev => ({ ...prev, galleryImagesFile: '' }))
    } else {
      setErrors(prev => ({ ...prev, galleryImagesFile: 'Select valid images' }))
    }
  }

  // Remove single gallery image by index
  const handleRemoveGalleryImage = (file, index) => {
    const fileUrl = file.preview ? file.preview : typeof file === 'string' ? file : ''

    const matchedIndices = []
    cheakImage.forEach((imgUrl, idx) => {
      if (imgUrl === fileUrl) {
        matchedIndices.push(idx)
      }
    })
    setRemovedIndices(prev => [...prev, ...matchedIndices])

    setFormData(prev => {
      const updatedFiles = [...prev.galleryImagesFile]

      updatedFiles.splice(index, 1)
      return { ...prev, galleryImagesFile: updatedFiles }
    })
    setGalleryImagesPreview(prev => {
      const updatedPreview = [...prev]
      updatedPreview.splice(index, 1)
      return updatedPreview
    })
  }

  // UTILITY
  function isFormUpdated(form, editData, removedIndices = []) {
    if (!editData) return false
    return (
      form.title !== (editData.title ?? '') ||
      form.price !== (editData.price ?? '') ||
      form.subTitle !== (editData.subTitle ?? '') ||
      form.description !== (editData.description ?? '') ||
      form.availableUnits !== (editData.availableUnits ?? '') ||
      form.contactNumber !== (editData.contactNumber ?? '') ||
      form.latitude !== (editData.location?.latitude ?? '') ||
      form.longitude !== (editData.location?.longitude ?? '') ||
      form.primaryImageFile !== null ||
      form.galleryImagesFile.length > 0 ||
      form.categoryId !== idFromCategory(editData.category) ||
      form.reason !== (editData.adminEditNotes ?? '') ||
      (Array.isArray(removedIndices) && removedIndices.length > 0)
    )
  }

  // Validation
  const validateForm = isUpdated => {
    const newErrors = {}
    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.price) newErrors.price = 'Price required'
    if (!formData.subTitle.trim()) newErrors.subTitle = 'SubTitle required'
    if (!formData.latitude) newErrors.latitude = 'Latitude required'
    if (!formData.longitude) newErrors.longitude = 'Longitude required'
    if (!formData.categoryId) newErrors.categoryId = 'Select a category'
    if (isUpdated && (!formData.reason.trim() || formData.reason.trim() === (editData?.adminEditNotes ?? '').trim())) {
      newErrors.reason = 'Reason is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Submit Handler (call API as per need)
  const handleSubmit = async () => {
    const isUpdated = isFormUpdated(formData, editData, removedIndices)



    // No changes? Sidha close dialog
    if (!isUpdated) {
      handleClose()
      return
    }

    // Reason required only if changes
    if (!validateForm(isUpdated)) return

    setLoading(true)
    const submitData = new FormData()

    submitData.append('adId', formData.adId)
    if (formData.title !== editData.title) submitData.append('title', formData.title)
    if (formData.price !== editData.price) submitData.append('price', formData.price)
    if (formData.subTitle !== editData.subTitle) submitData.append('subTitle', formData.subTitle)
    if (formData.description !== (editData.description ?? '')) submitData.append('description', formData.description)
    if (formData.availableUnits !== (editData.availableUnits ?? ''))
      submitData.append('availableUnits', formData.availableUnits)
    if (formData.contactNumber !== (editData.contactNumber ?? ''))
      submitData.append('contactNumber', formData.contactNumber)
    if (formData.latitude !== (editData.location?.latitude ?? '')) submitData.append('latitude', formData.latitude)
    if (formData.longitude !== (editData.location?.longitude ?? '')) submitData.append('longitude', formData.longitude)
    if (formData.reason.trim() !== '') submitData.append('adminEditNotes', formData.reason)
    if (formData.primaryImageFile) submitData.append('primaryImage', formData.primaryImageFile)
    if (removedIndices.length > 0) {
      submitData.append('galleryIndexes', JSON.stringify(removedIndices))
    }
    if (formData.galleryImagesFile.length > 0)
      formData.galleryImagesFile.forEach((file, idx) => submitData.append(`galleryImages`, file))
    if (
      formData.categoryId !==
      (typeof editData.category === 'object' && editData.category._id
        ? editData.category._id
        : (editData.category ?? ''))
    )
      submitData.append('category', formData.categoryId)

    if (
      submitData.has('title') ||
      submitData.has('price') ||
      submitData.has('subTitle') ||
      submitData.has('description') ||
      submitData.has('availableUnits') ||
      submitData.has('contactNumber') ||
      submitData.has('latitude') ||
      submitData.has('longitude') ||
      submitData.has('primaryImage') ||
      submitData.has('galleryImages') ||
      submitData.has('adminEditNotes') ||
      submitData.has('category')
    ) {
      try {
        await dispatch(updateLiveAd(submitData)).unwrap()
      } catch (error) {
        setLoading(false)
        return
      }
    } else {
      alert('No changes detected to update.')
      setLoading(false)
      return
    }

    handleClose()
    setLoading(false)
    setErrors({})
    setRemovedIndices([])
  }

  const handleClose = () => {
    onClose()
    setRemovedIndices([])
  }

  return (
    <Dialog
      open={open}
      keepMounted
      onClose={onClose}
      TransitionComponent={Transition}
      fullWidth
      maxWidth='sm'
      PaperProps={{ sx: { overflow: 'visible', width: 600, maxWidth: '80vw' } }}
    >
      <DialogTitle>
        <Typography variant='h5' component='span'>
          Edit Ad
        </Typography>
        <DialogCloseButton onClick={handleClose}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          <TextField
            label='Title'
            fullWidth
            value={formData.title}
            onChange={e => handleChange('title', e.target.value)}
            error={!!errors.title}
            helperText={errors.title}
          />
          <TextField
            label='SubTitle'
            fullWidth
            value={formData.subTitle}
            onChange={e => handleChange('subTitle', e.target.value)}
            error={!!errors.subTitle}
            helperText={errors.subTitle}
          />
          <TextField
            label='Price'
            fullWidth
            type='number'
            value={formData.price}
            onChange={e => handleChange('price', e.target.value)}
            error={!!errors.price}
            helperText={errors.price}
          />
          <TextField
            label='Description'
            fullWidth
            multiline
            rows={3}
            value={formData.description}
            onChange={e => handleChange('description', e.target.value)}
          />
          <TextField
            label='Available Units'
            fullWidth
            type='number'
            value={formData.availableUnits}
            onChange={e => handleChange('availableUnits', e.target.value)}
          />
          <TextField
            label='Contact Number'
            fullWidth
            value={formData.contactNumber}
            onChange={e => handleChange('contactNumber', e.target.value)}
          />

          <Autocomplete
            disableCloseOnSelect
            fullWidth
            options={flatOptions}
            value={flatOptions.find(o => o.id === formData.categoryId) || null}
            getOptionLabel={o => `${o.depth > 0 ? '|-- '.repeat(o.depth) : ''}${o.name}`}
            renderOption={(props, option) => (
              <li {...props} key={option.id} style={{ paddingLeft: 12 + option.depth * 16 }}>
                {`${option.depth > 0 ? '|-- '.repeat(option.depth) : ''}${option.name}`}
              </li>
            )}
            onChange={(_, newValue) => {
              handleChange('categoryId', newValue ? newValue.id : '')
            }}
            renderInput={params => (
              <TextField
                {...params}
                label='Category'
                placeholder='Select category'
                error={!!errors.categoryId}
                helperText={errors.categoryId}
              />
            )}
            disabled={loading}
          />

          <StyledFileInput accept='image/*' label='Change Primary Image' onChange={handlePrimaryImage} />
          {primaryImagePreview && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <img
                src={primaryImagePreview}
                alt='Primary preview'
                style={{
                  maxWidth: '100%',
                  maxHeight: 100,
                  objectFit: 'contain',
                  borderRadius: 4,
                  border: '1px solid #e0e0e0'
                }}
                onError={e => {
                  e.target.onerror = null
                  e.target.src = fallbackImg.src
                }}
              />
            </Box>
          )}

          <StyledFileInput accept='image/*' label='Change/Add Gallery Images' multiple onChange={handleGalleryImages} />
          {galleryImagesPreview.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                flexWrap: 'wrap',
                mt: 2,
                justifyContent: 'flex-start'
              }}
            >
              {galleryImagesPreview.map((src, i) => (
                <Box
                  key={i}
                  sx={{
                    position: 'relative',
                    width: 90,
                    height: 90,
                    boxShadow: 2,
                    borderRadius: 2,
                    overflow: 'hidden',
                    background: '#fff',
                    '&:hover': { boxShadow: 5 }
                  }}
                >
                  <img
                    src={src}
                    alt='Gallery preview'
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: 8
                    }}
                    onError={e => {
                      e.target.onerror = null
                      e.target.src = fallbackImg.src
                    }}
                  />

                  <CustomIconButton
                    size='small'
                    color='primary'
                    variant='contained'
                    className='absolute top-[2px] right-[2px] p-0 rounded-full'
                    onClick={() => handleRemoveGalleryImage(src, i)}
                  >
                    <i className='tabler-x' />
                  </CustomIconButton>
                </Box>
              ))}
            </Box>
          )}

          <TextField
            label='Reason for change'
            fullWidth
            multiline
            rows={3}
            value={formData.reason}
            onChange={e => handleChange('reason', e.target.value)}
            error={!!errors.reason}
            helperText={errors.reason}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant='outlined' color='secondary' disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant='contained' disabled={loading}>
          {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Update'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default EditDialogue
