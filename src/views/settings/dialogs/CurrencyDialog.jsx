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
  Box
} from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'

import { createCurrency, updateCurrency } from '@/redux-store/slices/currency'
import { NO_PERMISSION } from '@/utils/constants'
import { toast } from 'react-toastify'

// Slide Transition same as ReportReasonDialog
const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const CurrencyDialog = ({ open, onClose, mode = 'create', currency = null }) => {
  const dispatch = useDispatch()

  const { profileData } = useSelector(state => state.adminSlice)



  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    countryCode: '',
    currencyCode: ''
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (mode === 'edit' && currency) {
      setFormData({
        name: currency.name || '',
        symbol: currency.symbol || '',
        countryCode: currency.countryCode || '',
        currencyCode: currency.currencyCode || ''
      })
    } else {
      setFormData({
        name: '',
        symbol: '',
        countryCode: '',
        currencyCode: ''
      })
    }

    setErrors({})
  }, [mode, currency, open])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: null }))
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.name) newErrors.name = 'Currency name is required'
    if (!formData.symbol) newErrors.symbol = 'Currency symbol is required'
    if (!formData.countryCode) newErrors.countryCode = 'Country code is required'
    if (!formData.currencyCode) newErrors.currencyCode = 'Currency code is required'

    // Additional validation rules
    if (formData.countryCode && formData.countryCode.length !== 2) {
      newErrors.countryCode = 'Country code must be 2 characters'
    }

    if (formData.currencyCode && formData.currencyCode.length !== 3) {
      newErrors.currencyCode = 'Currency code must be 3 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return



    try {
      setLoading(true)
      if (mode === 'edit') {
        await dispatch(updateCurrency({ currencyId: currency._id, ...formData })).unwrap()
      } else {
        await dispatch(createCurrency(formData)).unwrap()
      }
      onClose()
    } catch (error) {
      console.error('Currency save failed:', error)
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
      onClose={handleClose}
      TransitionComponent={Transition}
      keepMounted
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
      {/* Header same style as ReportReasonDialog */}
      <DialogTitle>
        <Typography variant='h5' component='span'>
          {mode === 'edit' ? 'Edit Currency' : 'Add New Currency'}
        </Typography>
        <DialogCloseButton onClick={handleClose}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ my: 2.5 }}>
          <TextField
            fullWidth
            label='Currency Name'
            value={formData.name}
            onChange={e => handleChange('name', e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
            disabled={loading}
          />
        </Box>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label='Symbol'
            value={formData.symbol}
            onChange={e => handleChange('symbol', e.target.value)}
            error={!!errors.symbol}
            helperText={errors.symbol}
            disabled={loading}
          />
        </Box>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label='Country Code (2 characters)'
            value={formData.countryCode}
            onChange={e => handleChange('countryCode', e.target.value.toUpperCase())}
            error={!!errors.countryCode}
            helperText={errors.countryCode}
            disabled={loading}
            inputProps={{ maxLength: 2 }}
          />
        </Box>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label='Currency Code (3 characters)'
            value={formData.currencyCode}
            onChange={e => handleChange('currencyCode', e.target.value.toUpperCase())}
            error={!!errors.currencyCode}
            helperText={errors.currencyCode}
            disabled={loading}
            inputProps={{ maxLength: 3 }}
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button variant='tonal' color='secondary' onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant='contained' onClick={handleSubmit} disabled={loading}>
          {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : mode === 'edit' ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CurrencyDialog
