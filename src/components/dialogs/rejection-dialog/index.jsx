'use client'

// React Imports
import { useState, forwardRef } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import { DialogTitle, Slide } from '@mui/material'
import DialogCloseButton from '../DialogCloseButton'

// Slide Transition
const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const RejectionDialog = ({ open, onClose, onConfirm }) => {
  // States
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('Please provide a reason for rejection')
      return
    }

    onConfirm(reason)
    handleClose()
  }

  const handleClose = () => {
    setReason('')
    setError('')
    onClose()
  }

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
          Reject Verification Request
        </Typography>
        <DialogCloseButton onClick={() => onClose(false)}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>
      <DialogContent>
        <Typography color='text.primary' className='mbe-1'>
          Please provide a reason for rejecting this verification request:
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          value={reason}
          onChange={e => {
            setReason(e.target.value)
            if (e.target.value.trim()) setError('')
          }}
          placeholder='Enter rejection reason...'
          error={!!error}
          helperText={error}
        />
      </DialogContent>
      <DialogActions>
        <Button variant='tonal' color='secondary' onClick={handleClose}>
          Cancel
        </Button>
        <Button variant='contained' color='primary' onClick={handleConfirm}>
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default RejectionDialog
