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
import { createBlog, updateBlog } from '@/redux-store/slices/blog'
import { getFullImageUrl } from '@/utils/commonfunctions'
import StyledFileInput from '@/@layouts/styles/inputs/StyledFileInput'
import defaultImage from '@/assets/images/defaultImage.jpg'
import { NO_PERMISSION } from '@/utils/constants'
import { toast } from 'react-toastify'

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const BlogDialogue = ({ open, onClose, editData = null }) => {
  const dispatch = useDispatch()

  const { profileData } = useSelector(state => state.adminSlice)



  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    tags: '',
    description: '',
    imageFile: null
  })

  const [errors, setErrors] = useState({
    title: '',
    slug: '',
    tags: '',
    description: '',
    imageFile: ''
  })

  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)

  useEffect(() => {
    if (editData) {
      setFormData({
        title: editData.title || '',
        slug: editData.slug || '',
        tags: (editData.tags || []).join(', '),
        description: editData.description || '',
        imageFile: null // Reset file input on edit initialization
      })
      setImagePreview(editData.image ? getFullImageUrl(editData.image) : null) // apply getFullImageUrl here
    } else {
      setFormData({
        title: '',
        slug: '',
        tags: '',
        description: '',
        imageFile: null
      })
      setImagePreview(null)
    }
    setErrors({
      title: '',
      slug: '',
      tags: '',
      description: '',
      imageFile: ''
    })
  }, [editData, open])

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
        if (errors.imageFile) {
          setErrors(prev => ({ ...prev, imageFile: '' }))
        }
      } else {
        setErrors(prev => ({ ...prev, imageFile: 'Please select a valid image file' }))
      }
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.slug.trim()) newErrors.slug = 'Slug is required'
    if (!formData.tags.trim()) newErrors.tags = 'At least one tag is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (!editData && !formData.imageFile) newErrors.imageFile = 'Image is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return



    setLoading(true)

    const tagsArray = formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean)

    const submitData = new FormData()
    submitData.append('title', formData.title)
    submitData.append('slug', formData.slug)
    submitData.append('tags', formData.tags)
    submitData.append('description', formData.description)

    if (formData.imageFile) {
      submitData.append('image', formData.imageFile)
    }

    try {
      if (editData) {
        submitData.append('blogId', editData._id)
        await dispatch(updateBlog(submitData)).unwrap()
      } else {
        await dispatch(createBlog(submitData)).unwrap()
      }
      onClose()
    } catch (err) {
      // Handle error
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
      PaperProps={{ sx: { overflow: 'visible', width: '600px', maxWidth: '95vw' } }}
    >
      <DialogTitle>
        <Typography variant='h5' component='span'>
          {editData ? 'Edit Blog' : 'Create New Blog'}
        </Typography>
        <DialogCloseButton onClick={onClose}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          <TextField
            autoFocus
            label='Title'
            fullWidth
            value={formData.title}
            onChange={e => handleChange('title', e.target.value)}
            error={!!errors.title}
            helperText={errors.title}
          />

          <TextField
            label='Slug'
            fullWidth
            value={formData.slug}
            onChange={e => handleChange('slug', e.target.value)}
            error={!!errors.slug}
            helperText={errors.slug}
          />

          <TextField
            label='Tags  (separate with a comma or space)'
            placeholder='e.g. SKU, Product Name, Price'
            fullWidth
            value={formData.tags}
            onChange={e => handleChange('tags', e.target.value)}
            error={!!errors.tags}
            helperText={errors.tags}
          />

          <TextField
            label='Description'
            fullWidth
            multiline
            minRows={4}
            value={formData.description}
            onChange={e => handleChange('description', e.target.value)}
            error={!!errors.description}
            helperText={errors.description}
          />

          {/* <Box>
            <input
              accept='image/*'
              type='file'
              id='blog-image-upload'
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <label htmlFor='blog-image-upload'>
              <Button variant='contained' component='span'>
                {editData ? 'Change Image' : 'Upload Image'}
              </Button>
            </label>
            {errors.imageFile && (
              <Typography color='error' variant='body2' sx={{ mt: 1 }}>
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
          </Box> */}

          <Box>
            <StyledFileInput
              accept='JPEG (JPG), PNG, GIF, WebP'
              label={editData ? 'Change Image' : 'Upload Image'}
              onChange={handleFileChange}
              required={!editData}
            />
            {errors.imageFile && (
              <Typography color='#ff4c51' variant='body2' sx={{ mt: 1 }}>
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

export default BlogDialogue
