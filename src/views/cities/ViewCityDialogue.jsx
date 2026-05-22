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

const fieldLabels = {
  name: 'City Name',
  latitude: 'Latitude',
  longitude: 'Longitude',
  state_id: 'State'
}

const ViewCityDialogue = ({ open, onClose, cityData }) => {
  if (!cityData) return null

  const visibleFields = Object.keys(cityData).filter(key => !['_id', 'createdAt', 'updatedAt'].includes(key))

  const stateFields = cityData.state_id
    ? Object.keys(cityData.state_id).filter(k => !['_id', 'createdAt', 'updatedAt'].includes(k))
    : []

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
          City Details
        </Typography>
        <DialogCloseButton onClick={onClose}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {/* state_id nested fields */}
          {cityData.state_id && stateFields.length > 0 && (
            <>
              {/* <Typography variant='subtitle1'>State Info:</Typography> */}
              {stateFields.map(sKey => (
                <TextField
                  key={'state-' + sKey}
                  label={cityData.state_id[sKey] === 'Brest Region' ? 'State Name' : sKey}
                  value={cityData.state_id[sKey] || ''}
                  fullWidth
                  margin='dense'
                  InputProps={{ readOnly: true }}
                  variant='outlined'
                />
              ))}
            </>
          )}

          {/* Main city fields */}
          {visibleFields.map(key =>
            key !== 'state_id' ? (
              <TextField
                key={key}
                label={fieldLabels[key] || key}
                value={cityData[key] || ''}
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

export default ViewCityDialogue
