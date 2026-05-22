'use client'

import React, { forwardRef } from 'react'
import { Dialog, DialogTitle, DialogContent, Slide, Typography } from '@mui/material'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'

import { getFullImageUrl } from '@/utils/commonfunctions'

// Slide Transition
const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const DocumentViewDialog = ({ open, onClose, idProof }) => {
  return (
    <Dialog
      open={open}
      keepMounted
      onClose={() => onClose(false)}
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
          {idProof.type} Image
        </Typography>
        <DialogCloseButton onClick={() => onClose(false)}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>
      <DialogContent className='pt-2'>
        <div className='w-full h-full'>
          <img
            src={getFullImageUrl(idProof.type === 'Front' ? idProof.data.idProofFrontUrl : idProof.data.idProofBackUrl)}
            className='w-full h-[500px] object-contain'
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default DocumentViewDialog
