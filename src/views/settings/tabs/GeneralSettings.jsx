'use client'

import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

// MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import TextField from '@mui/material/TextField'
import Divider from '@mui/material/Divider'
import InputAdornment from '@mui/material/InputAdornment'

// Redux Actions
import { updateSettings } from '@/redux-store/slices/setting'
import { toast } from 'react-toastify'
import { NO_PERMISSION } from '@/utils/constants'

const GeneralSettings = () => {
  const dispatch = useDispatch()
  const { setting, loading, error } = useSelector(state => state.setting)

  const { profileData } = useSelector(state => state.adminSlice)



  const [formData, setFormData] = useState({
    _id: '',
    firebasePrivateKey: {},
    maxVideoDurationSec: '',
    aboutPageUrl: '',
    privacyPolicyUrl: '',
    termsAndConditionsUrl: '',
    supportPhone: '',
    supportEmail: ''
  })

  const [privateKeyJson, setPrivateKeyJson] = useState('')
  const [jsonError, setJsonError] = useState('')

  // Update form data when settings are fetched
  useEffect(() => {
    if (setting) {
      setFormData({
        ...formData,
        _id: setting._id || '',
        maxVideoDurationSec: setting.maxVideoDurationSec?.toString() || '',
        aboutPageUrl: setting.aboutPageUrl || '',
        privacyPolicyUrl: setting.privacyPolicyUrl || '',
        termsAndConditionsUrl: setting.termsAndConditionsUrl || '',
        supportPhone: setting.supportPhone || '',
        supportEmail: setting.supportEmail || ''
      })

      if (setting.firebasePrivateKey) {
        try {
          setPrivateKeyJson(JSON.stringify(setting.firebasePrivateKey, null, 2))
          setFormData(prev => ({
            ...prev,
            firebasePrivateKey: setting.firebasePrivateKey
          }))
        } catch (err) {
          setPrivateKeyJson(JSON.stringify({}))
        }
      }
    }
  }, [setting])

  const handleFieldChange = (field, value) => {
    // Handle numeric fields differently
    if (['maxVideoDurationSec'].includes(field)) {
      // Allow empty string or valid numbers
      if (value === '' || !isNaN(value)) {
        setFormData(prev => ({
          ...prev,
          [field]: value
        }))
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleJsonChange = value => {
    setPrivateKeyJson(value)

    try {
      if (value.trim()) {
        const parsedJson = JSON.parse(value)

        setFormData(prev => ({
          ...prev,
          firebasePrivateKey: parsedJson
        }))
        setJsonError('')
      } else {
        setFormData(prev => ({
          ...prev,
          firebasePrivateKey: {}
        }))
      }
    } catch (err) {
      setJsonError('Invalid JSON format')
    }
  }

  const handleSubmit = async () => {


    if (jsonError) return

    if (setting?._id) {
      // Prepare data for submission by converting string values to numbers
      const dataToSubmit = {
        ...formData,
        maxVideoDurationSec: formData.maxVideoDurationSec === '' ? 0 : Number(formData.maxVideoDurationSec)
      }

      dispatch(updateSettings(dataToSubmit))
    }
  }

  if (!setting && loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant='h5'>General Setting</Typography>
        <Button
          variant='contained'
          color='primary'
          onClick={handleSubmit}
          disabled={loading || !!jsonError}
          startIcon={loading ? <CircularProgress color='white' size={20} /> : <i className='tabler-device-floppy' />}
        >
          Save Changes
        </Button>
      </Box>

      {/* Video Settings */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 500, display: 'flex', alignItems: 'center' }}>
            <i className='tabler-video mr-2' />
            Video Setting
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type='text'
                label='Maximum Video Duration'
                value={formData.maxVideoDurationSec}
                onChange={e => handleFieldChange('maxVideoDurationSec', e.target.value)}
                InputProps={{
                  inputProps: { inputMode: 'numeric', pattern: '[0-9]*' },
                  endAdornment: (
                    <InputAdornment position='end'>
                      <Typography variant='caption' color='text.secondary'>
                        seconds
                      </Typography>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Support Information */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 500, display: 'flex', alignItems: 'center' }}>
            <i className='tabler-headset mr-2' />
            Support Information
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Support Phone'
                value={formData.supportPhone}
                onChange={e => handleFieldChange('supportPhone', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Support Email'
                value={formData.supportEmail}
                onChange={e => handleFieldChange('supportEmail', e.target.value)}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Policy Links */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 500, display: 'flex', alignItems: 'center' }}>
            <i className='tabler-link mr-2' />
            Policy Links
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='About Page URL'
                value={formData.aboutPageUrl}
                onChange={e => handleFieldChange('aboutPageUrl', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Privacy Policy URL'
                value={formData.privacyPolicyUrl}
                onChange={e => handleFieldChange('privacyPolicyUrl', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Terms and Conditions URL'
                value={formData.termsAndConditionsUrl}
                onChange={e => handleFieldChange('termsAndConditionsUrl', e.target.value)}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Firebase Configuration */}
      <Card>
        <CardContent>
          <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 500, display: 'flex', alignItems: 'center' }}>
            <i className='tabler-brand-firebase mr-2' />
            Firebase Notification Setting
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Typography variant='subtitle2' sx={{ mb: 2 }}>
            Private Key JSON
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={10}
            value={privateKeyJson}
            onChange={e => handleJsonChange(e.target.value)}
            placeholder='Paste your Firebase private key JSON here'
            error={!!jsonError}
            helperText={jsonError}
            sx={{
              '& .MuiInputBase-root': {
                fontFamily: 'monospace',
                fontSize: '0.875rem'
              }
            }}
          />

          {!jsonError && privateKeyJson && (
            <Alert severity='success' sx={{ mt: 2 }}>
              Firebase configuration is valid
            </Alert>
          )}

          <Alert severity='info' sx={{ mt: 3 }}>
            <Typography variant='body2'>
              Paste your Firebase service account JSON credentials from Firebase console. This is used for server-side
              Firebase operations.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  )
}

export default GeneralSettings
