'use client'

import React, { forwardRef } from 'react'
import { Dialog, DialogTitle, DialogContent, Slide, Typography } from '@mui/material'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import { getFullImageUrl } from '@/utils/commonfunctions'

// Slide Transition
const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const VideoViewerDialog = ({ open, onClose, video }) => {
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
          ad's video
        </Typography>
        <DialogCloseButton onClick={() => onClose(false)}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>
      <DialogContent className='pt-2'>
        <div className='w-full h-full'>
          <video src={getFullImageUrl(video?.videoUrl)} className='w-full h-[500px]' controls autoPlay muted />

          {/* Caption title */}
          {video?.caption && (
            <div style={{ marginTop: '12px', textAlign: 'start' }}>
              <Typography variant='h6' component='div' sx={{ fontWeight: 'semibold', color: 'text.primary' }}>
                Caption
              </Typography>
              {/* Caption text */}
              <Typography variant='subtitle1' component='p' sx={{ mt: 2, color: 'text.secondary', textAlign: 'start' }}>
                {video?.caption}
              </Typography>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default VideoViewerDialog
