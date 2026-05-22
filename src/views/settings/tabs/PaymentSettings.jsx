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
import TextField from '@mui/material/TextField'
import Divider from '@mui/material/Divider'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import { toast } from 'react-toastify'

// Redux Actions
import { updateSettings, toggleSetting } from '@/redux-store/slices/setting'
import { NO_PERMISSION } from '@/utils/constants'

const PaymentSettings = () => {
  const dispatch = useDispatch()
  const { setting, loading, error } = useSelector(state => state.setting)
  const { profileData } = useSelector(state => state.adminSlice)



  const [formData, setFormData] = useState({
    _id: '',
    enableGooglePlay: false,
    enableStripe: false,
    stripePublicKey: '',
    stripePrivateKey: '',
    enableRazorpay: false,
    razorpayKeyId: '',
    razorpaySecretKey: '',
    enableFlutterwave: false,
    flutterwaveKeyId: ''
  })

  // Update form data when settings are fetched
  useEffect(() => {
    if (setting) {
      setFormData({
        ...formData,
        _id: setting._id || '',
        enableGooglePlay: setting.enableGooglePlay || false,
        enableStripe: setting.enableStripe || false,
        stripePublicKey: setting.stripePublicKey || '',
        stripePrivateKey: setting.stripePrivateKey || '',
        enableRazorpay: setting.enableRazorpay || false,
        razorpayKeyId: setting.razorpayKeyId || '',
        razorpaySecretKey: setting.razorpaySecretKey || '',
        enableFlutterwave: setting.enableFlutterwave || false,
        flutterwaveKeyId: setting.flutterwaveKeyId || ''
      })
    }
  }, [setting])

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleToggle = type => {


    if (setting?._id) {
      dispatch(toggleSetting({ settingId: setting._id, type }))
    }
  }

  const handleSubmit = async () => {


    if (setting?._id) {
      // Prepare data for submission
      const dataToSubmit = {
        _id: formData._id,
        stripePublicKey: formData.stripePublicKey,
        stripePrivateKey: formData.stripePrivateKey,
        razorpayKeyId: formData.razorpayKeyId,
        razorpaySecretKey: formData.razorpaySecretKey,
        flutterwaveKeyId: formData.flutterwaveKeyId
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
        <Typography variant='h5'>Payment Settings</Typography>
        <Button
          variant='contained'
          color='primary'
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress color='white' size={20} /> : <i className='tabler-device-floppy' />}
        >
          Save Changes
        </Button>
      </Box>

      {/* Google Play Payments */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant='subtitle1' sx={{ fontWeight: 500, display: 'flex', alignItems: 'center' }}>
              <i className='tabler-brand-google-play mr-2' />
              Google Play Payments
            </Typography>
            <FormControlLabel
              control={<Switch checked={formData.enableGooglePlay} onChange={() => handleToggle('enableGooglePlay')} />}
              label='Enable'
            />
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            Google Play payments are managed through the Google Play Console. No additional configuration is needed
            here.
          </Typography>
        </CardContent>
      </Card>

      {/* Stripe Payments */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant='subtitle1' sx={{ fontWeight: 500, display: 'flex', alignItems: 'center' }}>
              <i className='tabler-brand-stripe mr-2' />
              Stripe Payments
            </Typography>
            <FormControlLabel
              control={<Switch checked={formData.enableStripe} onChange={() => handleToggle('enableStripe')} />}
              label='Enable'
            />
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Stripe Public Key'
                value={formData.stripePublicKey}
                onChange={e => handleFieldChange('stripePublicKey', e.target.value)}
                disabled={!formData.enableStripe}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Stripe Private Key'
                value={formData.stripePrivateKey}
                onChange={e => handleFieldChange('stripePrivateKey', e.target.value)}
                disabled={!formData.enableStripe}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Razorpay Payments */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant='subtitle1' sx={{ fontWeight: 500, display: 'flex', alignItems: 'center' }}>
              <i className='tabler-credit-card mr-2' />
              Razorpay Payments
            </Typography>
            <FormControlLabel
              control={<Switch checked={formData.enableRazorpay} onChange={() => handleToggle('enableRazorpay')} />}
              label='Enable'
            />
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Razorpay Key ID'
                value={formData.razorpayKeyId}
                onChange={e => handleFieldChange('razorpayKeyId', e.target.value)}
                disabled={!formData.enableRazorpay}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Razorpay Secret Key'
                value={formData.razorpaySecretKey}
                onChange={e => handleFieldChange('razorpaySecretKey', e.target.value)}
                disabled={!formData.enableRazorpay}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Flutterwave Payments */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant='subtitle1' sx={{ fontWeight: 500, display: 'flex', alignItems: 'center' }}>
              <i className='tabler-credit-card mr-2' />
              Flutterwave Payments
            </Typography>
            <FormControlLabel
              control={
                <Switch checked={formData.enableFlutterwave} onChange={() => handleToggle('enableFlutterwave')} />
              }
              label='Enable'
            />
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Flutterwave Key ID'
                value={formData.flutterwaveKeyId}
                onChange={e => handleFieldChange('flutterwaveKeyId', e.target.value)}
                disabled={!formData.enableFlutterwave}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  )
}

export default PaymentSettings
