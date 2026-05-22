'use client'

import React, { forwardRef, useState, useEffect } from 'react'
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
import { createTip, updateTip } from '@/redux-store/slices/Tip'
import { NO_PERMISSION } from '@/utils/constants'
import { toast } from 'react-toastify'
// import { createTip, updateTip } from '@/redux-store/slices/tips' // <-- Apni redux action yaha lagao

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const TipDialog = ({ open, onClose, editData = null, onSuccess }) => {
  const dispatch = useDispatch()

  const { profileData } = useSelector(state => state.adminSlice)



  const [formData, setFormData] = useState({
    description: ''
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  // Populate data when editing
  useEffect(() => {
    if (editData) {
      setFormData({
        description: editData.description || ''
      })
    } else {
      setFormData({
        description: ''
      })
    }
    setErrors({})
  }, [editData, open])

  // Handle Input Change
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

  // Validate Form
  const validateForm = () => {
    const newErrors = {}

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    } else if (formData.description.trim().length < 5) {
      newErrors.description = 'Description must be at least 5 characters long'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Submit Handler
  const handleSubmit = async () => {
    if (!validateForm()) return



    setLoading(true)

    try {
      const payload = {
        ...(editData && { tipId: editData._id }),
        description: formData.description.trim()
      }

      if (editData) {
        await dispatch(updateTip(payload)).unwrap()
      } else {
        await dispatch(createTip(payload)).unwrap()
      }

      // onSuccess && onSuccess()
      onClose()
    } catch (err) {
      // Error handled in redux thunk or toast
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
      {/* Title */}
      <DialogTitle>
        <Typography variant='h5' component='span'>
          {editData ? 'Edit Tip' : 'Create New Tip'}
        </Typography>
        <DialogCloseButton onClick={onClose}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label='Description'
            value={formData.description}
            onChange={e => handleInputChange('description', e.target.value)}
            error={!!errors.description}
            helperText={errors.description}
            placeholder='Enter tip description here...'
          />
        </Box>
      </DialogContent>

      {/* Actions */}
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

export default TipDialog
