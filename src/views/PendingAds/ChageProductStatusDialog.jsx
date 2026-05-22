'use client'

import React, { forwardRef, useMemo, useState, useEffect } from 'react'
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
  Autocomplete
} from '@mui/material'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import { AD_LISTING_TYPE } from '@/utils/constants'
import { useDispatch, useSelector } from 'react-redux'
import { changeStatus } from '../../redux-store/slices/liveAds'
import { NO_PERMISSION } from '../../utils/constants'
import { toast } from 'react-toastify'

// Slide Transition
const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

/**
 * Props:
 * - open: boolean
 * - onClose?: () => void
 * - onConfirm?: ({ status: number, note?: string }) => (void|Promise<void>)
 */
const ChangeProductStatusDialog = ({ open, onClose, selectedAd }) => {
  const dispatch = useDispatch()

  const { profileData } = useSelector(state => state.adminSlice)



  const [selected, setSelected] = useState(null) // { key:number, code:string, label:string } | null

  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // statuses that require a note
  const NOTE_REQUIRED_KEYS = useMemo(() => new Set([3, 4, 6]), [])

  useEffect(() => {
    if (selectedAd) {
      setSelected({
        key: selectedAd.status,
        code: AD_LISTING_TYPE[selectedAd.status],
        label: AD_LISTING_TYPE[selectedAd.status]
          ?.toString()
          ?.toLowerCase()
          ?.replace(/_/g, ' ')
          ?.replace(/\b\w/g, c => c.toUpperCase())
      })
    } else {
      setSelected(null)
    }
  }, [selectedAd])

  // Options for status dropdown

  const options = useMemo(() => {
    const toLabel = s =>
      s
        ?.toString()
        ?.toLowerCase()
        ?.replace(/_/g, ' ')
        ?.replace(/\b\w/g, c => c.toUpperCase())
    return Object.entries(AD_LISTING_TYPE)
      .filter(
        ([key]) =>
          Number(key) !== 1 &&
          Number(key) !== 5 &&
          Number(key) !== 6 &&
          Number(key) !== 7 &&
          Number(key) !== 8 &&
          Number(key) !== 9
      )
      .map(([key, code]) => ({
        key: Number(key),
        code, // e.g. 'SOFT_REJECTED'
        label: toLabel(code) // e.g. 'Soft Rejected'
      }))
  }, [])

  const noteRequired = selected ? NOTE_REQUIRED_KEYS.has(selected.key) : false

  // If selection changes to a non-required status, clear note
  useEffect(() => {
    if (!noteRequired) setNote('')
  }, [noteRequired, selected?.key])

  const resetState = () => {
    setSelected(null)
    setNote('')
    setSubmitting(false)
    setError('')
  }

  const handleClose = () => {
    if (submitting) return
    resetState()
    onClose?.()
  }

  const handleSubmit = async () => {
    setError('')
    if (!selected) return



    const payload = {
      adId: selectedAd?._id,
      status: selected.key,
      ...(noteRequired ? { note: note.trim() } : {}) // include note ONLY when required
    }

    try {
      setSubmitting(true)
      dispatch(changeStatus({ ...payload }))
      resetState()
      onClose?.()
    } catch (e) {
      setError(e?.message || 'Failed to update status. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const isSubmitDisabled = submitting || !selected || (noteRequired && note.trim().length === 0)

  return (
    <Dialog
      open={open}
      keepMounted
      scroll='paper'
      onClose={handleClose}
      TransitionComponent={Transition}
      closeAfterTransition={false}
      fullWidth
      maxWidth='md'
      PaperProps={{ sx: { overflow: 'visible', width: '600px', maxWidth: '95vw' } }}
    >
      <DialogTitle>
        <Typography variant='h5' component='span'>
          Change Product Status
        </Typography>
        <DialogCloseButton onClick={handleClose}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>

      <DialogContent className='pt-2'>
        <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
          <Autocomplete
            disablePortal
            options={options}
            value={selected}
            onChange={(_, val) => {
              setSelected(val)
            }}
            getOptionLabel={o => (o?.label ? o.label : '')}
            isOptionEqualToValue={(o, v) => o.key === v.key}
            renderInput={params => <TextField {...params} label='New Status' placeholder='Select a status' required />}
          />

          {/* {selected && (
            <Typography variant='caption' sx={{ opacity: 0.8 }}>
              API payload → <code>status: {selected.key}</code> ({selected.code})
            </Typography>
          )} */}

          {noteRequired && (
            <TextField
              label='Reason / Note'
              placeholder='Tell the user why this was deactivated or rejected...'
              multiline
              minRows={3}
              value={note}
              onChange={e => setNote(e.target.value)}
              required
            />
          )}

          {error && (
            <Typography variant='body2' color='error'>
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={submitting} variant='text'>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitDisabled} variant='contained'>
          {submitting ? <CircularProgress size={20} /> : 'Update'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ChangeProductStatusDialog
