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
  Autocomplete,
  Divider,
  Stack,
  Chip
} from '@mui/material'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'

import PermissionItemCard from './PermissionItemCard'

// Slide Transition
const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const PermissionShowDialog = ({ open, onClose, role, setRole }) => {
  if ((Object.keys(role).length = 0)) return null

  const handleClose = () => {
    onClose()
    setRole({})
  }

  return (
    <Dialog
      open={open}
      keepMounted
      scroll={'paper'}
      onClose={handleClose}
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
          {role?.name} Permissions
        </Typography>
        <Typography variant='body1' component='div' className='mt-2'>
          This role has access to {role.permissions?.length} modules with various permission levels.
        </Typography>
        <DialogCloseButton onClick={handleClose}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>

      <DialogContent className='pt-2' dividers>
        <Stack spacing={2}>
          {role?.permissions?.map((permission, index) => (
            <PermissionItemCard
              key={index}
              moduleName={permission.module}
              actions={permission.actions || []}
              iconClassName='tabler-lock' // tweak per module if you like
              chipIconClassName='tabler-eye' // or pick per-action if needed
            />
          ))}
        </Stack>
      </DialogContent>
      <DialogActions className='pt-6'>
        <Button onClick={handleClose} variant='outlined' color='primary'>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PermissionShowDialog
