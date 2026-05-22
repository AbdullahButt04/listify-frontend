'use client'

import React, { forwardRef } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Slide,
  TextField,
  Typography,
  Box
} from '@mui/material'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

// Sirf yahi fields dikhaani hain
const fieldLabels = {
  name: 'Country Name',
  native: 'Native Name',
  region: 'Region',
  subregion: 'Subregion',
  // phone_code: 'Phone Code',
  latitude: 'Latitude',
  longitude: 'Longitude',
  currency: 'Currency Code',
  currencyName: 'Currency Name',
  currencySymbol: 'Currency Symbol',
}

const ViewCountryData = ({ open, onClose, countryData }) => {
  if (!countryData) return null

  // Sirf fieldLabels ki keys loop karo
  const visibleFields = Object.keys(fieldLabels)

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
      <DialogTitle>
        <Typography variant='h5' component='span'>
          Country Details
        </Typography>
        <DialogCloseButton onClick={onClose}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {visibleFields.map(key => (
            <TextField
              key={key}
              label={fieldLabels[key]}
              value={countryData[key] || ''}
              fullWidth
              margin='dense'
              InputProps={{
                readOnly: true
              }}
              variant='outlined'
            />
          ))}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant='contained'>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ViewCountryData
