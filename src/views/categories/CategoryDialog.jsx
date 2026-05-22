'use client'

import React, { forwardRef, useEffect, useState } from 'react'
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
  Box,
  Switch,
  FormControlLabel,
  Autocomplete
} from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import StyledFileInput from '@/@layouts/styles/inputs/StyledFileInput'

import {
  createCategory,
  fetchCategories,
  GetHierarchicalCategory,
  modifyCategory
} from '../../redux-store/slices/categories'
import { getFullImageUrl } from '@/utils/commonfunctions'
import { toast } from 'react-toastify'
import { NO_PERMISSION } from '@/utils/constants'

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const CategoryDialog = ({ open, onClose, mode = 'create', category = null, categoryId }) => {
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    parent: '',
    image: '',
    isActive: true
  })
  const [imagePreview, setImagePreview] = useState(null)
  const [errors, setErrors] = useState({})

  const { hierarchicalCategories = [], page, pageSize } = useSelector(state => state.categories)
  const { profileData } = useSelector(state => state.adminSlice)



  useEffect(() => {
    if (open) dispatch(GetHierarchicalCategory())
  }, [dispatch, open])

  const tree = Array.isArray(hierarchicalCategories) ? hierarchicalCategories : hierarchicalCategories?.data || []

  const flattenCategories = (nodes = [], depth = 0) => {
    const rows = []
    for (const n of nodes) {
      rows.push({
        id: n._id,
        name: n.name,
        depth
      })
      if (n.children?.length) {
        rows.push(...flattenCategories(n.children, depth + 1))
      }
    }
    return rows
  }

  const findNodeById = (nodes, id) => {
    for (const n of nodes) {
      if (n._id === id) return n
      const childHit = n.children?.length ? findNodeById(n.children, id) : null
      if (childHit) return childHit
    }
    return null
  }

  const collectDescendantIds = node => {
    const ids = new Set()
    const walk = n => {
      for (const c of n.children || []) {
        ids.add(c._id)
        walk(c)
      }
    }
    if (node) walk(node)
    return ids
  }

  const flatOptions = flattenCategories(tree)
  const noParentOption = { id: '', name: '', depth: 0 }

  let blockedIds = new Set()
  if (mode === 'edit' && category?._id) {
    const selfNode = findNodeById(tree, category._id)
    const descendants = selfNode ? collectDescendantIds(selfNode) : new Set()
    blockedIds = new Set([category._id, ...descendants])
  }

  const options = [
    noParentOption,
    ...flatOptions.map(o => ({
      ...o,
      disabled: blockedIds.has(o.id)
    }))
  ]

  const currentValue = options.find(o => o.id === (formData.parent || '')) || noParentOption

  useEffect(() => {
    if (mode === 'edit' && category) {
      setFormData({
        name: category.name || '',
        slug: category.slug || '',
        parent: category.parent || '',
        image: category.image || '',
        isActive: category.isActive !== undefined ? category.isActive : true
      })
      if (category.image) {
        setImagePreview(getFullImageUrl(category.image))
      }
    } else {
      setFormData({
        name: '',
        slug: '',
        parent: categoryId ? categoryId?._id : '',
        image: '',
        isActive: true
      })
      setImagePreview(null)
    }
    setErrors({})
  }, [mode, category, open, categoryId])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: null }))
  }

  const handleFileChange = event => {
    const file = event.target.files[0]
    if (file) {
      if (file.type.startsWith('image/')) {
        const maxSize = 2 * 1024 * 1024
        if (file.size > maxSize) {
          setErrors(prev => ({
            ...prev,
            imageFile: 'Image size should be less than 2 MB'
          }))
          return
        }
        setFormData(prev => ({
          ...prev,
          imageFile: file,
          image: file
        }))
        setImagePreview(URL.createObjectURL(file))
        if (errors.imageFile) {
          setErrors(prev => ({
            ...prev,
            imageFile: null
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

  const slugify = val =>
    val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')

  const validate = () => {
    const newErrors = {}
    if (!formData.name) newErrors.name = 'Category name is required'
    if (!formData.slug) newErrors.slug = 'Slug is required'

    if (formData.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formData.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens'
    }

    if (mode === 'create' && !formData.imageFile && !formData.image) {
      newErrors.imageFile = 'Category image is required'
    }

    if (errors.imageFile) {
      newErrors.imageFile = errors.imageFile
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }


  const buildPayloadForEdit = () => {
    const formData_edit = new FormData()

    const hasChanges =
      (formData.name && formData.name !== category.name) ||
      (formData.slug && formData.slug !== category.slug) ||
      formData.imageFile ||
      formData.isActive !== category.isActive ||
      (formData.parent || '') !== (category.parent || '')

    if (hasChanges) {
      formData_edit.append('categoryId', category._id)

      if (formData.name && formData.name !== category.name) {
        formData_edit.append('name', formData.name)
      }
      if (formData.slug && formData.slug !== category.slug) {
        formData_edit.append('slug', formData.slug)
      }
      if (formData.imageFile) {
        formData_edit.append('image', formData.imageFile)
      }
      if (formData.isActive !== category.isActive) {
        formData_edit.append('isActive', formData.isActive)
      }
      if ((formData.parent || '') !== (category.parent || '')) {
        formData_edit.append('parent', formData.parent || '')
      }
    }

    return formData_edit
  }

  const buildPayloadForCreate = () => {
    const formData_create = new FormData()

    formData_create.append('name', formData.name)
    formData_create.append('slug', formData.slug)
    if (formData.parent) formData_create.append('parent', formData.parent)
    formData_create.append('isActive', formData.isActive)

    if (formData.imageFile) {
      formData_create.append('image', formData.imageFile)
    } else if (formData.image) {
      formData_create.append('imageUrl', formData.image)
    }

    return formData_create
  }

  const handleSubmit = async () => {
    if (!validate()) return



    try {
      setLoading(true)

      if (mode === 'edit' && category?._id) {
        const editPayload = buildPayloadForEdit()
        if ([...editPayload.entries()].length === 0) {
          setLoading(false)
          onClose()
          return
        }

        await dispatch(modifyCategory(editPayload))
          .unwrap()
          .then(() => {
            dispatch(fetchCategories({ page, pageSize }))
          })
      } else {
        const createPayload = buildPayloadForCreate()
        await dispatch(createCategory(createPayload))
          .unwrap()
          .then(() => {
            dispatch(fetchCategories({ page: 1, pageSize }))
          })
      }

      onClose()
    } catch (error) {
      console.error('Category save failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) onClose()
  }

  return (
    <Dialog
      open={open}
      keepMounted
      scroll={'paper'}
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
          {mode === 'edit' ? 'Edit Category' : 'Add New Category'}
        </Typography>
        <DialogCloseButton onClick={handleClose}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>

      <DialogContent className='pt-2'>
        <div className='flex flex-col gap-5'>
          <TextField
            fullWidth
            label='Category Name'
            placeholder='Enter category name'
            value={formData.name}
            onChange={e => handleChange('name', e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
            disabled={loading}
          />

          <Box display='flex' alignItems='center' gap={1}>
            <TextField
              fullWidth
              label='Slug'
              placeholder='category-slug'
              value={formData.slug}
              onChange={e => handleChange('slug', slugify(e.target.value))}
              error={!!errors.slug}
              helperText={errors.slug || 'Lowercase, numbers, hyphens only'}
              disabled={loading}
              FormHelperTextProps={{
                sx: {
                  textAlign: errors.slug ? 'left' : 'right'
                }
              }}
            />
            <Button
              variant='outlined'
              color='primary'
              size='medium'
              disabled={loading || !formData.name}
              onClick={() => {
                if (formData.name) {
                  const generatedSlug = slugify(formData.name)
                  handleChange('slug', generatedSlug)
                }
              }}
             className='self-start h-[53px]'
            >
              Generate
            </Button>
          </Box>

          <Autocomplete
            disableClearable={false}
            fullWidth
            options={options}
            value={currentValue}
            getOptionLabel={opt => {
              if (!opt) return ''
              const prefix = opt.depth > 0 ? '|-- '.repeat(opt.depth) : ''
              return `${prefix}${opt.name}`
            }}
            onChange={(e, val) => handleChange('parent', val?.id || '')}
            disabled={loading || categoryId}
            renderOption={(props, option) => (
              <li
                {...props}
                key={option.id}
                style={{
                  paddingLeft: 12 + option.depth * 16,
                  opacity: option.disabled ? 0.5 : 1,
                  pointerEvents: option.disabled ? 'none' : 'auto'
                }}
                aria-disabled={option.disabled || undefined}
              >
                {`${option.depth > 0 ? '|-- '.repeat(option.depth) : ''}${option.name}`}
              </li>
            )}
            renderInput={params => (
              <TextField {...params} label='Parent Category (Optional)' placeholder='Search or pick a parent' />
            )}
          />

          {mode === 'edit' && (
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={e => handleChange('isActive', e.target.checked)}
                  disabled={loading}
                />
              }
              label='Active Status'
            />
          )}

          <div>
            <StyledFileInput accept='image/*' onChange={handleFileChange} disabled={loading} />
            {errors.imageFile && (
              <Typography variant='caption' sx={{ mt: 1, display: 'block', color: '#ff4c51 !important' }}>
                {errors.imageFile}
              </Typography>
            )}
          </div>

          {imagePreview && (
            <Box sx={{ mt: 2 }}>
              <img
                src={imagePreview}
                alt='Preview'
                style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px' }}
              />
            </Box>
          )}
        </div>
      </DialogContent>

      <DialogActions className='dialog-actions-dense'>
        <Button variant='outlined' color='secondary' onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant='contained' onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <>
              <CircularProgress size={20} color='white' /> <span>Loading...</span>
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

export default CategoryDialog
