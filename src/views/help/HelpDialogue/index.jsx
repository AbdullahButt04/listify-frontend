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
import { AddFaqs, updateFaqs } from '@/redux-store/slices/help'
import { NO_PERMISSION } from '@/utils/constants'
import { toast } from 'react-toastify'

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const HelpDialog = ({ open, onClose, editData = null }) => {
  const dispatch = useDispatch()

  const { profileData } = useSelector(state => state.adminSlice)



  // Single object for form fields
  const [formData, setFormData] = useState({
    name: '',
    answer: ''
  })

  // Separate errors for each field
  const [errors, setErrors] = useState({
    name: '',
    answer: ''
  })
  const [loading, setLoading] = useState(false)

  // Set formData values when editData ya open change hota hai
  useEffect(() => {
    setFormData({
      name: editData?.question || '',
      answer: editData?.answer || ''
    })
    setErrors({ name: '', answer: '' })
  }, [editData, open])

  // field = 'name' / 'answer', value = newValue
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear specific error on valid input
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Submission validation and main submit logic
  const handleSubmit = async () => {
    let isError = false
    let newErrors = { name: '', answer: '' }

    if (!formData.name.trim()) {
      newErrors.name = 'Question is required'
      isError = true
    }
    if (!formData.answer.trim()) {
      newErrors.answer = 'Answer is required'
      isError = true
    }
    if (isError) {
      setErrors(newErrors)
      return
    }



    setLoading(true)

    try {
      if (editData) {
        await dispatch(
          updateFaqs({
            faqId: editData?._id,
            question: formData.name,
            answer: formData.answer
          })
        )
      } else {
        await dispatch(
          AddFaqs({
            question: formData.name,
            answer: formData.answer
          })
        ).unwrap()
      }
      onClose()
    } catch (err) {
      // error already handled
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
          width: '600px',
          maxWidth: '95vw'
        }
      }}
    >
      <DialogTitle>
        <Typography variant='h5' component='span'>
          {editData ? 'Edit FAQs' : 'Create New FAQs'}
        </Typography>
        <DialogCloseButton onClick={onClose}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin='dense'
          label='Question'
          fullWidth
          value={formData.name}
          onChange={e => handleChange('name', e.target.value)}
          error={!!errors.name}
          helperText={errors.name}
        />

        <TextField
          margin='dense'
          label='Answer'
          fullWidth
          multiline
          minRows={3}
          value={formData.answer}
          onChange={e => handleChange('answer', e.target.value)}
          error={!!errors.answer}
          helperText={errors.answer}
          sx={{ mt: 2 }}
        />
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

export default HelpDialog
