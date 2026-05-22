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

// Optional: Labels for main stateData fields
const fieldLabels = {
  name: 'State Name',
  state_code: 'State Code',
  latitude: 'Latitude',
  longitude: 'Longitude',
  country_id: 'Country' // Nested object — handle below
}

const ViewStateDialog = ({ open, onClose, stateData }) => {
  if (!stateData) return null

  // Exclude unwanted fields
  const visibleFields = Object.keys(stateData).filter(key => !['_id', 'createdAt', 'updatedAt'].includes(key))

  // Handle nested country_id object if it exists and has fields
  const countryFields = stateData.country_id ? Object.keys(stateData.country_id).filter(k => !['_id'].includes(k)) : []

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
          State Details
        </Typography>
        <DialogCloseButton onClick={onClose}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {/* country_id nested fields */}
          {stateData.country_id && countryFields.length > 0 && (
            <>
              {/* <Typography variant='subtitle1'>Country Info:</Typography> */}
              {countryFields.map(cKey => (
                <TextField
                  key={'country-' + cKey}
                  label={stateData.country_id[cKey] === 'India' ? 'Country Name' : cKey}
                  value={stateData.country_id[cKey] || ''}
                  fullWidth
                  margin='dense'
                  InputProps={{ readOnly: true }}
                  variant='outlined'
                />
              ))}
            </>
          )}

          {/* StateData main fields */}
          {visibleFields.map(key =>
            key !== 'country_id' ? (
              <TextField
                key={key}
                label={fieldLabels[key] || key}
                value={stateData[key] || ''}
                fullWidth
                margin='dense'
                InputProps={{ readOnly: true }}
                variant='outlined'
              />
            ) : null
          )}
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

export default ViewStateDialog
