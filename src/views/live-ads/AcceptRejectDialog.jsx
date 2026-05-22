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
  Box,
  Switch,
  FormControlLabel,
  Autocomplete
} from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'

// Slide Transition
const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const AcceptRejectDialog = ({ open, onClose, ad, onActionCompleted }) => {
  const dispatch = useDispatch()
  const { loading } = useSelector(state => state.liveAds)

  const [actionType, setActionType] = useState('APPROVED') // 'APPROVED' or 'REJECTED'
  const [rejectionReason, setRejectionReason] = useState('')
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (ad) {
      setIsActive(ad.isActive)
    }
  }, [ad])

  // const handleAction = () => {
  //   if (!ad) return

  //   const payload = {
  //     adId: ad._id,
  //     action: actionType,
  //     rejectionReason: actionType === 'REJECTED' ? rejectionReason : undefined,
  //     isActive: actionType === 'APPROVED' ? isActive : undefined
  //   }

  //   // Dispatch the action to update the ad status
  //   dispatch(updateAdStatus(payload)).then(res => {
  //     if (res.payload?.status) {
  //       onActionCompleted()
  //       onClose()
  //     }
  //   })
  // }

  return (
    <Dialog open={open} onClose={onClose} TransitionComponent={Transition} fullWidth maxWidth='sm'>
      <DialogTitle>
        <Box className='flex items-center justify-between'>
          <Typography variant='h6'>Review Ad</Typography>
          <DialogCloseButton onClick={onClose} />
        </Box>
      </DialogTitle>
      <DialogContent></DialogContent>
    </Dialog>
  )
}

export default AcceptRejectDialog
