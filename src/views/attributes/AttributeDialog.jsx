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
  Box,
  Switch,
  FormControlLabel,
  Autocomplete,
  Chip,
  MenuItem,
  IconButton
} from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import StyledFileInput from '@/@layouts/styles/inputs/StyledFileInput'
import { FIELD_TYPE_MAP, NO_PERMISSION } from '@/utils/constants'
import { GetHierarchicalCategory } from '@/redux-store/slices/categories'
import { createAttribute, fetchAttributes, modifyAttribute } from '@/redux-store/slices/attributes'
import { getFullImageUrl } from '@/utils/commonfunctions'

// --- Slide Transition (same as Category dialog)
const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

// Use only for comparing original numeric values
const numberOrZero = v => (typeof v === 'number' && !Number.isNaN(v) ? v : 0)

const arrayIds = cat => (Array.isArray(cat) ? cat : cat && typeof cat === 'object' && '_id' in cat ? [cat._id] : [])

const AttributeDialog = ({ open, onClose, mode = 'create', attribute = null }) => {
  const dispatch = useDispatch()
  const { hierarchicalCategories = [] } = useSelector(s => s.categories || {})
  const { page, pageSize } = useSelector(state => state.attributes || {})
  const { profileData } = useSelector(state => state.adminSlice)



  // ---- local form state
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [imagePreview, setImagePreview] = useState(null)

  const [form, setForm] = useState({
    _id: attribute?._id || '',
    name: attribute?.name || '',
    image: attribute?.image || '',
    fieldType: attribute?.fieldType || 1,
    values: attribute?.values || [],
    minLength: '',
    maxLength: '',
    isRequired: attribute?.isRequired ?? false,
    isActive: attribute?.isActive ?? true,
    categoryId: arrayIds(attribute?.categoryId)
  })

  const [valueInput, setValueInput] = useState('')

  // ---- load category tree when dialog opens (same pattern as CategoryDialog)
  useEffect(() => {
    if (open) dispatch(GetHierarchicalCategory())
  }, [dispatch, open])

  // reset when switching modes/records
  useEffect(() => {
    setForm({
      _id: attribute?._id || '',
      name: attribute?.name || '',
      image: attribute?.image || '',
      fieldType: attribute?.fieldType || 1,
      values: attribute?.values || [],
      minLength:
        mode === 'edit' && (attribute?.fieldType === 1 || attribute?.fieldType === 2)
          ? String(attribute?.minLength ?? '')
          : '',
      maxLength:
        mode === 'edit' && (attribute?.fieldType === 1 || attribute?.fieldType === 2)
          ? String(attribute?.maxLength ?? '')
          : '',
      isRequired: attribute?.isRequired ?? false,
      isActive: attribute?.isActive ?? true,
      categoryId: arrayIds(attribute?.categoryId)
    })
    setImagePreview(attribute?.image ? getFullImageUrl(attribute.image) : null)
    setErrors({})
    setValueInput('')
  }, [attribute, mode, open])

  // ---- category helpers (hierarchical multi-select with "|--" prefix per depth)
  const tree = Array.isArray(hierarchicalCategories) ? hierarchicalCategories : hierarchicalCategories?.data || []

  const flatten = (nodes = [], depth = 0) => {
    const out = []
    for (const n of nodes) {
      out.push({ id: n._id, name: n.name, depth })
      if (n.children?.length) out.push(...flatten(n.children, depth + 1))
    }
    return out
  }
  const flatOptions = useMemo(() => flatten(tree), [tree])

  // ---- derived booleans for conditional UI
  const isNumOrText = form.fieldType === 1 || form.fieldType === 2
  const needsValues = form.fieldType === 4 || form.fieldType === 5 || form.fieldType === 6
  const isFileType = form.fieldType === 3

  const setField = (k, v) => {
    setForm(prev => ({ ...prev, [k]: v }))
    setErrors(prev => ({ ...prev, [k]: '' }))
  }

  const handleAddValue = () => {
    const t = valueInput.trim()
    if (!t) return
    if (form.values.includes(t)) return
    setField('values', [...form.values, t])
    setValueInput('')
  }
  const handleRemoveValue = v =>
    setField(
      'values',
      form.values.filter(x => x !== v)
    )

  const handleFileChange = e => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrors(p => ({ ...p, image: 'Please select a valid image file' }))
      return
    }
    setField('image', file) // store File in image field for submit
    setImagePreview(URL.createObjectURL(file))
  }

  // ---- validation
  const validate = () => {
    const e = {}

    // Always required
    if (!form.name?.trim()) e.name = 'Name is required'
    if (!form.fieldType) e.fieldType = 'Field type is required'

    // Booleans must be explicitly set (not null/undefined)
    if (form.isRequired === null || form.isRequired === undefined) e.isRequired = 'Please set Required on/off'
    if (form.isActive === null || form.isActive === undefined) e.isActive = 'Please set Active on/off'

    // Image always required (create OR edit).
    // Accept existing URL string (edit) or a newly picked File.
    const hasImage = (typeof form.image === 'string' && !!form.image) || (form.image && typeof form.image !== 'string')
    if (!hasImage) e.image = 'Image is required'

    // Category required (at least one)
    if (!Array.isArray(form.categoryId) || form.categoryId.length === 0) e.categoryId = 'Select at least one category'

    // Conditional rules (use booleans defined outside)

    if (isNumOrText) {
      if (form.minLength === '' || Number.isNaN(Number(form.minLength))) e.minLength = 'Min length is required'
      if (form.maxLength === '' || Number.isNaN(Number(form.maxLength))) e.maxLength = 'Max length is required'
      if (!e.minLength && !e.maxLength && Number(form.minLength) > Number(form.maxLength))
        e.maxLength = 'Max must be greater than or equal to Min'
    }

    if (needsValues) {
      if (!form.values || form.values.length === 0) e.values = 'Enter at least one value'
    }

    if (form.categoryId === null || form.categoryId === undefined) e.categoryId = 'Select at least one category'

    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ---- payload builders
  const buildCreateFormData = () => {
    const fd = new FormData()
    fd.append('name', form.name.trim())
    fd.append('fieldType', String(form.fieldType))
    // If your backend expects `values[]` array items instead of JSON, switch to the commented version.
    fd.append('values', form.values.join(',')) // or: form.values.forEach(v => fd.append('values[]', v))
    fd.append('isRequired', String(!!form.isRequired))
    fd.append('isActive', String(!!form.isActive))
    const min = isNumOrText ? Number(form.minLength) : 0
    const max = isNumOrText ? Number(form.maxLength) : 0
    fd.append('minLength', String(min))
    fd.append('maxLength', String(max))
    fd.append('categoryId', form.categoryId.join(',')) // or: form.categoryId.forEach(id => fd.append('categoryId[]', id))
    if (form.image && typeof form.image !== 'string') fd.append('image', form.image) // File
    // If you want to allow setting existing image url on create: else if (typeof form.image === 'string') fd.append('imageUrl', form.image)
    return fd
  }

  const buildEditFormData = () => {
    const orig = attribute || {}
    const fd = new FormData()

    fd.append('attrId', form._id)
    // Only append changed fields
    const appendIfChanged = (key, current, original) => {
      const changed = Array.isArray(current)
        ? JSON.stringify(current) !== JSON.stringify(original || [])
        : current !== original
      if (changed) {
        // coerce booleans/numbers to string where needed
        if (typeof current === 'boolean' || typeof current === 'number') fd.append(key, String(current))
        else if (Array.isArray(current)) fd.append(key, current.join(','))
        else fd.append(key, current)
      }
    }

    appendIfChanged('name', form.name, orig.name)
    appendIfChanged('fieldType', form.fieldType, orig.fieldType)
    appendIfChanged('values', form.values, orig.values)
    appendIfChanged('isRequired', !!form.isRequired, !!orig.isRequired)
    appendIfChanged('isActive', !!form.isActive, !!orig.isActive)

    if (isNumOrText) {
      const currMin = Number(form.minLength)
      const currMax = Number(form.maxLength)
      appendIfChanged('minLength', currMin, numberOrZero(orig.minLength))
      appendIfChanged('maxLength', currMax, numberOrZero(orig.maxLength))
    }

    // categoryId as array of _ids
    const origCatArr = arrayIds(orig.categoryId)
    appendIfChanged('categoryId', form.categoryId, origCatArr)

    // image if a new File selected
    if (form.image && typeof form.image !== 'string') {
      fd.append('image', form.image)
    }

    return fd
  }

  const handleSubmit = async () => {
    if (!validate()) return



    try {
      setLoading(true)
      if (mode === 'edit' && form._id) {
        const fd = buildEditFormData()
        // Convert FormData to an array to count its fields
        const entries = Array.from(fd.entries())

        // If FormData only contains 'attrId', skip API call
        if (entries.length === 1 && entries[0][0] === 'attrId') {
          toast.info('No changes to update')
        } else {
          await dispatch(modifyAttribute(fd))
            .unwrap()
            .then(() => {
              dispatch(fetchAttributes({ page, pageSize }))
            })
        }
      } else {
        const fd = buildCreateFormData()
        await dispatch(createAttribute(fd)).unwrap()
        // .then(() => {
        //   dispatch(fetchAttributes({ page: 1, pageSize }))
        // })
      }
      onClose()
    } catch (err) {
      console.error(err)
      toast.error(err?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const canClose = !loading
  const handleClose = () => {
    if (canClose) onClose()
  }

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
      PaperProps={{ sx: { overflow: 'visible', width: 600, maxWidth: '95vw' } }}
    >
      <DialogTitle>
        <Typography variant='h5' component='span'>
          {mode === 'edit' ? 'Edit Attribute' : 'Add New Attribute'}
        </Typography>
        <DialogCloseButton onClick={handleClose}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>

      <DialogContent className='pt-2'>
        <div className='flex flex-col gap-5'>
          {/* Category multi-select (hierarchical, show |-- depth prefix) */}
          <Autocomplete
            multiple
            disableCloseOnSelect
            fullWidth
            options={flatOptions}
            value={flatOptions.filter(o => form.categoryId.includes(o.id))}
            getOptionLabel={o => `${o.depth > 0 ? '|-- '.repeat(o.depth) : ''}${o.name}`}
            renderOption={(props, option) => (
              <li {...props} key={option.id} style={{ paddingLeft: 12 + option.depth * 16 }}>
                {`${option.depth > 0 ? '|-- '.repeat(option.depth) : ''}${option.name}`}
              </li>
            )}
            onChange={(_, arr) =>
              setField(
                'categoryId',
                arr.map(x => x.id)
              )
            }
            renderInput={params => (
              <TextField
                {...params}
                label='Categories'
                placeholder='Select categories'
                error={!!errors.categoryId}
                helperText={errors.categoryId}
              />
            )}
            disabled={loading || mode === 'edit'}
          />

          {/* Name */}
          <TextField
            fullWidth
            label='Name'
            placeholder='e.g. warranty'
            value={form.name}
            onChange={e => setField('name', e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
            disabled={loading}
          />

          {/* Field Type */}
          <TextField
            select
            fullWidth
            label='Field Type'
            value={form.fieldType}
            onChange={e => setField('fieldType', Number(e.target.value))}
            error={!!errors.fieldType}
            helperText={errors.fieldType}
            disabled={loading}
          >
            {Object.entries(FIELD_TYPE_MAP).map(([id, label]) => (
              <MenuItem key={id} value={Number(id)}>
                {label}
              </MenuItem>
            ))}
          </TextField>

          {/* Min/Max only for Number or Text */}
          {isNumOrText && (
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <TextField
                type='number'
                label='Min Length'
                value={form.minLength}
                onChange={e => setField('minLength', e.target.value)}
                error={!!errors.minLength}
                helperText={errors.minLength}
                disabled={loading}
              />
              <TextField
                type='number'
                label='Max Length'
                value={form.maxLength}
                onChange={e => setField('maxLength', e.target.value)}
                error={!!errors.maxLength}
                helperText={errors.maxLength}
                disabled={loading}
              />
            </div>
          )}

          {/* Values required for Radio/Dropdown/Checkboxes */}
          {needsValues && (
            <div className='flex flex-col gap-2'>
              <Typography variant='body2'>Values</Typography>
              <div className='flex gap-2'>
                <TextField
                  fullWidth
                  placeholder='Type a value and press Enter…'
                  value={valueInput}
                  onChange={e => setValueInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddValue()
                    }
                  }}
                  error={!!errors.values}
                  helperText={errors.values}
                  disabled={loading}
                />
                <Button variant='outlined' onClick={handleAddValue} disabled={loading || !valueInput.trim()}>
                  Add
                </Button>
              </div>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {form.values.map(v => (
                  <Chip key={v} label={v} onDelete={() => handleRemoveValue(v)} variant='outlined' />
                ))}
              </Box>
            </div>
          )}

          {/* Switches */}
          <div className='grid grid-cols-1 sm:grid-cols-2'>
            <div>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!form.isRequired}
                    // onChange={e => setField('isRequired', e.target.checked)}
                    onChange={e => {
                      const checked = e.target.checked
                      setField('isRequired', checked)
                      if (checked) {
                        setField('isActive', true)
                      }
                    }}
                    disabled={loading}
                  />
                }
                label='Required'
              />
              {errors.isRequired && (
                <Typography variant='caption' color='error'>
                  {errors.isRequired}
                </Typography>
              )}
            </div>

            <div>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.isRequired ? true : !!form.isActive} // isActive forced true if isRequired true
                    onChange={e => setField('isActive', e.target.checked)}
                    disabled={loading || form.isRequired} // disable switch if isRequired true
                  />
                }
                label='Active'
              />
              {errors.isActive && (
                <Typography variant='caption' color='error'>
                  {errors.isActive}
                </Typography>
              )}
            </div>
          </div>

          {/* File selector (always shown; particularly relevant when Field Type = File) */}
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

      <DialogActions className='dialog-actions-dense'>
        <Button variant='outlined' color='secondary' onClick={handleClose} disabled={loading}>
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

export default AttributeDialog
