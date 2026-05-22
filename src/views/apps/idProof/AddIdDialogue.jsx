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
  Typography
} from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import { addIdProof, updateIdProof } from '@/redux-store/slices/idProof'
import { NO_PERMISSION } from '@/utils/constants'
import { toast } from 'react-toastify'
// import { addIdProof, updateIdProof } from '@/redux-store/slices/idProof'

// Transition for dialog animation
const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

// Main Component
const AddIdDialogue = ({ open, onClose, editData = null }) => {
  const dispatch = useDispatch()

  const { profileData } = useSelector(state => state.adminSlice)



  // Form state - only one field
  const [formData, setFormData] = useState({
    title: ''
  })

  // Validation errors
  const [errors, setErrors] = useState({
    title: ''
  })

  // Loading spinner while submit
  const [loading, setLoading] = useState(false)

  // Set values when editing or dialog open
  useEffect(() => {
    setFormData({
      title: editData?.title || '' // agar edit kar rahe hai to data set kar do
    })
    setErrors({ title: '' }) // reset errors
  }, [editData, open])

  // Handle input change
  const handleChange = value => {
    setFormData({ title: value })
    if (errors.title) {
      setErrors({ title: '' })
    }
  }

  // Form submit logic
  const handleSubmit = async () => {
    let isError = false
    let newErrors = { title: '' }

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
      isError = true
    }

    if (isError) {
      setErrors(newErrors)
      return
    }



    setLoading(true)

    try {
      if (editData) {
        // Update idProof
        await dispatch(
          updateIdProof({
            id: editData?._id,
            title: formData.title
          })
        )
      } else {
        // Add new idProof
        await dispatch(
          addIdProof({
            title: formData.title
          })
        ).unwrap()
      }
      onClose()
    } catch (err) {
      // error already handled in slice
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
      maxWidth='xs'
      PaperProps={{
        sx: {
          overflow: 'visible',
          width: '400px',
          maxWidth: '95vw'
        }
      }}
    >
      <DialogTitle>
        <Typography variant='h5' component='span'>
          {editData ? 'Edit ID' : 'Create New ID'}
        </Typography>
        <DialogCloseButton onClick={onClose}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>

      <DialogContent>
        <TextField
          autoFocus
          margin='dense'
          label='Title'
          fullWidth
          value={formData.title}
          onChange={e => handleChange(e.target.value)}
          error={!!errors.title}
          helperText={errors.title}
        />
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

export default AddIdDialogue
