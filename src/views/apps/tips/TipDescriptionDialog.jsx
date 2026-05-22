'use client'

import React, { forwardRef } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Slide } from '@mui/material'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const TipDescriptionDialog = ({ open, onClose, descToShow }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      keepMounted
      TransitionComponent={Transition}
      closeAfterTransition={false}
      fullWidth
      maxWidth='sm'
      PaperProps={{
        sx: {
          overflow: 'visible',
          width: '600px',
          maxWidth: '95vw'
        }
      }}
    >
      {/* Title with close button */}
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant='h5' component='span'>
          Tip Description
        </Typography>
        <DialogCloseButton onClick={onClose}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent dividers>
        <Typography variant='body1' sx={{ whiteSpace: 'pre-wrap' }}>
          {descToShow || '-'}
        </Typography>
      </DialogContent>

      {/* Actions */}
      <DialogActions className='px-6 py-2.5'>
        <Button onClick={onClose} variant='contained'>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default TipDescriptionDialog
