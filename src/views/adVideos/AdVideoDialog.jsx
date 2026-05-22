'use client'

import React, { forwardRef, useEffect, useMemo, useRef, useState } from 'react'
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
  Autocomplete,
  Stack,
  Chip
} from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import StyledFileInput from '@/@layouts/styles/inputs/StyledFileInput'
import { getFullImageUrl } from '@/utils/commonfunctions'
import { createAdVideo, editAdVideo, fetchAllAds, fetchAllAdVideos } from '@/redux-store/slices/adVideo'
import { toast } from 'react-toastify'
import { NO_PERMISSION } from '@/utils/constants'

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const AdVideoDialog = ({ open, onClose, mode = 'create', ad }) => {
  const dispatch = useDispatch()
  const { allAds = [], allUsers = [], page, pageSize } = useSelector(s => s.adVideos || { allAds: [], allUsers: [] })

  const { profileData } = useSelector(state => state.adminSlice)



  const didInitRef = useRef(false)
  const adIdFilledFromOptionsRef = useRef(false) // guard to set ad id once when options arrive

  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    ad: '',
    uploaderId: '',
    caption: '',
    videoFile: null,
    thumbnailFile: null, // <- will be auto OR custom
    videoUrl: '',
    thumbnailUrl: '' // <- existing url (edit)
  })

  const [errors, setErrors] = useState({})
  const [previews, setPreviews] = useState({})
  const videoWorkerRef = useRef(null)

  // NEW: Track auto-generated thumb separately so we can revert if needed
  const [autoThumb, setAutoThumb] = useState({ file: null, url: '' })
  const [isCustomThumb, setIsCustomThumb] = useState(false)

  const adOptions = useMemo(
    () =>
      (Array.isArray(allAds) ? allAds : []).map(a => ({
        id: a._id,
        label: a.title || a.adDetails?.title || 'Untitled',
        subLabel: a.subTitle || a.adDetails?.subTitle,
        primaryImage: a.primaryImage || a.adDetails?.primaryImage
      })),
    [allAds]
  )

  const userOptions = useMemo(
    () =>
      (Array.isArray(allUsers) ? allUsers : []).map(u => ({
        id: u._id,
        label: u.name || 'No Name'
      })),
    [allUsers]
  )

  const resetErrors = () => setErrors({})

  const setField = (key, val) => {
    setFormData(prev => ({ ...prev, [key]: val }))
    setErrors(prev => ({ ...prev, [key]: '' }))
  }

  // ----------- INIT (edit/create) -----------
  // Init: run once per "open" (do NOT depend on adOptions/userOptions)
  useEffect(() => {
    if (!open) {
      didInitRef.current = false
      return
    }
    if (didInitRef.current) return
    didInitRef.current = true
    resetErrors()
    setIsCustomThumb(false)
    setAutoThumb({ file: null, url: '' })

    if (mode === 'edit' && ad) {
      const videoUrl = ad?.videoUrl ? getFullImageUrl(ad.videoUrl) : ''
      const thumbnailUrl = ad?.thumbnailUrl ? getFullImageUrl(ad.thumbnailUrl) : ''

      // Prefer IDs directly from the record if available
      const adIdFromRecord = ad?.adDetails?._id // adjust if your shape differs
      const uploaderIdFromRecord = ad?.uploader?._id || ''

      setFormData({
        ad: adIdFromRecord, // set raw id; display will resolve when options arrive
        uploaderId: uploaderIdFromRecord,
        caption: ad?.caption || '',
        videoFile: null,
        thumbnailFile: null,
        videoUrl,
        thumbnailUrl
      })
      setPreviews({
        video: videoUrl || undefined,
        thumbnail: thumbnailUrl || undefined
      })
      setAutoThumb({ file: null, url: thumbnailUrl })
    } else {
      setFormData({
        ad: '',
        uploaderId: '',
        caption: '',
        videoFile: null,
        thumbnailFile: null,
        videoUrl: '',
        thumbnailUrl: ''
      })
      setPreviews({})
    }
  }, [open, mode, ad])

  // If your edit data has only titles (no id), fill "ad" once when options are ready
  useEffect(() => {
    if (!open || didInitRef.current === false) return
    if (mode !== 'edit' || adIdFilledFromOptionsRef.current) return
    if (formData.ad) return // already have an id
    const adTitle = ad?.adDetails?.title
    if (!adTitle) return
    const matched = adOptions.find(o => o.label === adTitle)
    if (matched) {
      setFormData(p => ({ ...p, ad: matched.id }))
      adIdFilledFromOptionsRef.current = true
    }
  }, [open, mode, ad, adOptions, formData.ad])

  useEffect(() => {
    if (formData.uploaderId) {
      dispatch(fetchAllAds(formData.uploaderId))
    }
  }, [formData.uploaderId, dispatch])

  // ----------- THUMBNAIL GENERATOR -----------
  const generateThumbnailFromVideo = file => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file)
      const v = document.createElement('video')
      v.preload = 'metadata'
      v.src = url
      v.muted = true
      v.crossOrigin = 'anonymous'
      videoWorkerRef.current = v

      const clean = () => {
        URL.revokeObjectURL(url)
        videoWorkerRef.current = null
      }

      const doneError = e => {
        clean()
        reject(e || new Error('Thumbnail generation failed'))
      }

      const capture = () => {
        try {
          const w = v.videoWidth || 640
          const h = v.videoHeight || 360
          const canvas = document.createElement('canvas')
          canvas.width = w
          canvas.height = h
          const ctx = canvas.getContext('2d')
          if (!ctx) return doneError('Canvas not supported')
          ctx.drawImage(v, 0, 0, w, h)
          canvas.toBlob(
            blob => {
              if (!blob) return doneError('Blob creation failed')
              const thumb = new File([blob], `${file.name.replace(/\.[^.]+$/, '')}-thumb.jpg`, {
                type: 'image/jpeg'
              })
              const thumbUrl = URL.createObjectURL(thumb)
              clean()
              resolve({ thumbFile: thumb, thumbUrl })
            },
            'image/jpeg',
            0.85
          )
        } catch (e) {
          doneError(e)
        }
      }

      v.onloadedmetadata = () => {
        const t = Math.min(0.5, Math.max(0.1, (v.duration || 1) / 2))
        const seeked = () => {
          v.removeEventListener('seeked', seeked)
          capture()
        }
        v.addEventListener('seeked', seeked)
        try {
          v.currentTime = t
        } catch {
          const onLoadedData = () => {
            v.removeEventListener('loadeddata', onLoadedData)
            capture()
          }
          v.addEventListener('loadeddata', onLoadedData)
        }
      }

      v.onerror = () => doneError('Video failed to load')
    })
  }

  // ----------- FILE HANDLERS -----------
  const handleVideoChange = async evt => {
    const file = evt.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('video/')) {
      setErrors(prev => ({ ...prev, videoFile: 'Please select a valid video file' }))
      return
    }

    setLoading(true)
    try {
      // local video preview
      const localVideoUrl = URL.createObjectURL(file)
      setPreviews(p => ({ ...p, video: localVideoUrl }))
      setField('videoFile', file)
      setField('videoUrl', '') // clear existing url so validation checks the file

      // thumbnail generation
      const { thumbFile, thumbUrl } = await generateThumbnailFromVideo(file)

      // Save auto thumb for possible revert
      setAutoThumb({ file: thumbFile, url: thumbUrl })

      // If user hasn't set a custom image, use the auto one
      if (!isCustomThumb) {
        setField('thumbnailFile', thumbFile)
        setField('thumbnailUrl', '') // clear existing url if any
        setPreviews(p => ({ ...p, thumbnail: thumbUrl }))
        setErrors(prev => ({ ...prev, thumbnailFile: '' }))
      }
    } catch (e) {
      setErrors(prev => ({ ...prev, thumbnailFile: 'Could not generate thumbnail from this video' }))
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // NEW: custom image upload (overrides auto)
  const handleCustomThumbChange = evt => {
    const file = evt.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, thumbnailFile: 'Please select a valid image file (PNG/JPG/WebP, etc.)' }))
      return
    }

    // Optional size check (e.g., <= 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, thumbnailFile: 'Image must be 5 MB or smaller' }))
      return
    }

    const url = URL.createObjectURL(file)
    setIsCustomThumb(true)
    setField('thumbnailFile', file)
    setField('thumbnailUrl', '')
    setPreviews(p => ({ ...p, thumbnail: url }))
    setErrors(prev => ({ ...prev, thumbnailFile: '' }))
  }

  // NEW: revert to auto-generated (if available)
  const handleUseAutoThumb = () => {
    if (!autoThumb?.file && !autoThumb?.url) return
    setIsCustomThumb(false)
    if (autoThumb.file) {
      setField('thumbnailFile', autoThumb.file)
      setField('thumbnailUrl', '')
    } else if (autoThumb.url) {
      // Only URL known (e.g., edit mode without re-gen)
      setField('thumbnailFile', null)
      setField('thumbnailUrl', autoThumb.url)
    }
    setPreviews(p => ({ ...p, thumbnail: autoThumb.url || p.thumbnail }))
  }

  // ----------- VALIDATION -----------
  const validate = () => {
    const e = {}

    if (!formData.ad) e.ad = 'Ad is required'
    if (!formData.uploaderId) e.uploaderId = 'Uploader is required'
    if (!formData.caption?.trim()) e.caption = 'Caption is required'

    if (mode === 'create') {
      if (!formData.videoFile) e.videoFile = 'Video is required'
      // Either custom or auto should be present
      if (!formData.thumbnailFile) e.thumbnailFile = 'Thumbnail could not be generated'
    } else {
      const hasVideo = !!formData.videoFile || !!formData.videoUrl
      const hasThumb = !!formData.thumbnailFile || !!formData.thumbnailUrl
      if (!hasVideo) e.videoFile = 'Video is required (existing or new)'
      if (!hasThumb) e.thumbnailFile = 'Thumbnail is required (existing, custom, or auto-generated)'
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ----------- PAYLOAD BUILDERS -----------
  const serializeFormDataForLog = fd => {
    const out = {}
    fd.forEach((v, k) => {
      if (v instanceof File) out[k] = { fileName: v.name, size: v.size, type: v.type }
      else out[k] = v
    })
    return out
  }

  const buildCreatePayload = () => {
    const fd = new FormData()
    fd.append('ad', formData.ad)
    fd.append('uploaderId', formData.uploaderId)
    fd.append('caption', formData.caption)
    if (formData.videoFile) fd.append('videoUrl', formData.videoFile)
    // IMPORTANT: This is auto or custom depending on what thumbnailFile currently holds
    if (formData.thumbnailFile) fd.append('thumbnailUrl', formData.thumbnailFile)
    return fd
  }

  const buildEditPayload = () => {
    if (!ad?._id) return null
    const fd = new FormData()
    fd.append('adVideoId', ad._id)
    fd.append('uploaderId', ad?.uploader?._id)

    const currentAdTitle = ad?.adDetails?.title
    const selAd = adOptions.find(o => o.id === formData.ad)
    if (selAd && selAd.label !== currentAdTitle) fd.append('ad', formData.ad)

    if ((formData.caption || '') !== (ad?.caption || '')) fd.append('caption', formData.caption || '')

    // If a new thumbnail is chosen (custom or fresh auto), send it
    if (formData.thumbnailFile) fd.append('thumbnailUrl', formData.thumbnailFile)

    return fd
  }

  // ----------- SUBMIT -----------
  const handleSubmit = async () => {
    if (!validate()) return



    try {
      setLoading(true)
      if (mode === 'edit') {
        const original = {
          adVideoId: ad?._id,
          original: {
            uploader: ad?.uploader?.name,
            adTitle: ad?.adDetails?.title,
            caption: ad?.caption,
            videoUrl: ad?.videoUrl,
            thumbnailUrl: ad?.thumbnailUrl
          }
        }
        const fd = buildEditPayload()
        if (!fd) return
        await dispatch(editAdVideo(fd)).then(() => dispatch(fetchAllAdVideos({ page, pageSize })))
        onClose(false)
      } else {
        const fd = buildCreatePayload()
        await dispatch(createAdVideo(fd)).then(() => dispatch(fetchAllAdVideos({ page, pageSize })))
        onClose(false)
      }
    } catch (err) {
      console.error('Save failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const currentAdValue =
    adOptions.find(o => o.id === formData.ad) ||
    (mode === 'edit' && ad?.adDetails?.title ? adOptions.find(o => o.label === ad.adDetails.title) : null) ||
    null

  // FIXED: this useMemo now returns a value
  const currentUserValue = useMemo(() => {
    return (
      userOptions.find(o => o.id === formData.uploaderId) ||
      (mode === 'edit' && ad?.uploader?.name ? userOptions.find(o => o.label === ad.uploader.name) : null) ||
      null
    )
  }, [formData.uploaderId, userOptions, mode, ad])

  return (
    <Dialog
      open={open}
      keepMounted
      scroll='paper'
      onClose={() => !loading && onClose(false)}
      TransitionComponent={Transition}
      closeAfterTransition={false}
      fullWidth
      maxWidth='md'
      PaperProps={{ sx: { overflow: 'visible', width: '600px', maxWidth: '95vw' } }}
    >
      <DialogTitle>
        <Typography variant='h5' component='span'>
          {mode === 'edit' ? 'Edit Ad Video' : 'Add New Ad Video'}
        </Typography>
        <DialogCloseButton onClick={() => !loading && onClose(false)}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>

      <DialogContent className='pt-2'>
        <div className='flex flex-col gap-5'>
          {/* Uploader */}
          <Autocomplete
            options={userOptions}
            value={currentUserValue}
            onChange={(_, val) => setField('uploaderId', val?.id || '')}
            getOptionLabel={o => o?.label ?? ''}
            renderInput={params => (
              <TextField
                {...params}
                label='Select Uploader'
                placeholder='Search users'
                error={!!errors.uploaderId}
                helperText={errors.uploaderId}
              />
            )}
            disabled={loading || mode === 'edit'}
            fullWidth
          />

          {/* Ad */}
          <Autocomplete
            options={adOptions}
            value={currentAdValue}
            onChange={(_, val) => setField('ad', val?.id || '')}
            getOptionLabel={o => o?.label ?? ''}
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            renderOption={(props, opt) => {
              // React 19: don't spread `key`
              const { key, ...optionProps } = props
              return (
                <li key={key} {...optionProps} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {opt.primaryImage ? (
                    <img
                      src={getFullImageUrl(opt.primaryImage)}
                      alt=''
                      style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: '#eee' }} />
                  )}
                  <div>
                    <div style={{ fontWeight: 600 }}>{opt.label}</div>
                    {opt.subLabel ? <div style={{ fontSize: 12, opacity: 0.7 }}>{opt.subLabel}</div> : null}
                  </div>
                </li>
              )
            }}
            renderInput={params => (
              <TextField
                {...params}
                label='Select Ad'
                placeholder='Search ads'
                error={!!errors.ad}
                helperText={errors.ad}
              />
            )}
            disabled={loading}
            fullWidth
          />

          {/* Caption */}
          <TextField
            label='Caption'
            placeholder='Enter caption'
            value={formData.caption}
            onChange={e => setField('caption', e.target.value)}
            error={!!errors.caption}
            helperText={errors.caption}
            disabled={loading}
            fullWidth
            multiline
            minRows={2}
          />

          {/* Video upload (auto thumbnail) */}
          <div className='flex flex-col gap-2'>
            <StyledFileInput accept='video/*' onChange={handleVideoChange} disabled={loading} />
            <Typography variant='body2' className='flex justify-end'>
              Select a video file. A thumbnail will be generated automatically.
            </Typography>
            {!!errors.videoFile && (
              <Typography variant='caption' color='#ff4c51'>
                {errors.videoFile}
              </Typography>
            )}
          </div>

          {/* NEW: Custom thumbnail (optional) */}
          <Stack spacing={1}>
            <Stack direction='row' alignItems='center' justifyContent='space-between'>
              <Typography variant='subtitle2'>Custom thumbnail (optional)</Typography>
              <Chip
                size='small'
                label={isCustomThumb ? 'Using custom' : 'Using auto'}
                variant={isCustomThumb ? 'filled' : 'outlined'}
              />
            </Stack>

            <StyledFileInput accept='image/*' onChange={handleCustomThumbChange} disabled={loading} />
            <Typography variant='body2' className='flex justify-end'>
              If you don’t pick an image, we’ll use the auto-generated thumbnail.
            </Typography>

            {!!errors.thumbnailFile && (
              <Typography variant='caption' color='#ff4c51'>
                {errors.thumbnailFile}
              </Typography>
            )}

            {isCustomThumb && (autoThumb?.file || autoThumb?.url) ? (
              <Box>
                <Button size='small' variant='text' onClick={handleUseAutoThumb} disabled={loading}>
                  Use auto-generated thumbnail
                </Button>
              </Box>
            ) : null}
          </Stack>

          {/* Previews */}
          {(previews.video || previews.thumbnail) && (
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {previews.video && (
                <video
                  src={previews.video}
                  controls
                  style={{ width: 260, maxHeight: 160, borderRadius: 8, outline: '1px solid #eee' }}
                />
              )}
              {previews.thumbnail && (
                <img
                  src={previews.thumbnail}
                  alt='thumbnail'
                  style={{ width: 200, height: 160, objectFit: 'cover', borderRadius: 8, outline: '1px solid #eee' }}
                />
              )}
            </Box>
          )}
        </div>
      </DialogContent>

      <DialogActions className='dialog-actions-dense'>
        <Button variant='outlined' color='secondary' onClick={() => !loading && onClose(false)} disabled={loading}>
          Cancel
        </Button>
        <Button variant='contained' onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <>
              <CircularProgress size={20} color='inherit' sx={{ mr: 1 }} /> <span>Saving…</span>
            </>
          ) : mode === 'edit' ? (
            'Update'
          ) : (
            'Create'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AdVideoDialog
