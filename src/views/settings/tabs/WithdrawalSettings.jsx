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
import InputAdornment from '@mui/material/InputAdornment'
import { toast } from 'react-toastify'

// Redux Actions
import { updateSettings } from '@/redux-store/slices/setting'
import { NO_PERMISSION } from '@/utils/constants'

const WithdrawalSettings = () => {
  const dispatch = useDispatch()
  const { setting, loading, error } = useSelector(state => state.setting)
  const { profileData } = useSelector(state => state.adminSlice)



  const currency = setting?.currency || { symbol: '$' }

  const [formData, setFormData] = useState({
    _id: '',
    minCoinsToCashOut: '',
    minCoinsForPayout: ''
  })

  // Update form data when settings are fetched
  useEffect(() => {
    if (setting) {
      setFormData({
        _id: setting._id || '',
        minCoinsToCashOut: setting.minCoinsToCashOut?.toString() || '',
        minCoinsForPayout: setting.minCoinsForPayout?.toString() || ''
      })
    }
  }, [setting])

  const handleFieldChange = (field, value) => {
    // Handle numeric fields
    if (['minCoinsToCashOut', 'minCoinsForPayout'].includes(field)) {
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

  const handleSubmit = async () => {


    if (setting?._id) {
      // Prepare data for submission by converting string values to numbers
      const dataToSubmit = {
        _id: formData._id,
        minCoinsToCashOut: formData.minCoinsToCashOut === '' ? 0 : Number(formData.minCoinsToCashOut),
        minCoinsForPayout: formData.minCoinsForPayout === '' ? 0 : Number(formData.minCoinsForPayout)
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
        <Typography variant='h5'>Withdrawal Settings</Typography>
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

      {/* Withdrawal Thresholds */}
      <Card>
        <CardContent>
          <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 500, display: 'flex', alignItems: 'center' }}>
            <i className='tabler-cash mr-2' />
            Withdrawal Thresholds
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Minimum Coins to Cash Out'
                value={formData.minCoinsToCashOut}
                onChange={e => handleFieldChange('minCoinsToCashOut', e.target.value)}
                InputProps={{
                  inputProps: { inputMode: 'numeric', pattern: '[0-9]*' },
                  endAdornment: (
                    <InputAdornment position='end'>
                      <Typography variant='caption' color='text.secondary'>
                        coins
                      </Typography>
                    </InputAdornment>
                  )
                }}
              />
              <Typography variant='caption' color='text.secondary' sx={{ mt: 1, display: 'block' }}>
                Minimum coins required for a user to request a cash out
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Minimum Coins for Payout'
                value={formData.minCoinsForPayout}
                onChange={e => handleFieldChange('minCoinsForPayout', e.target.value)}
                InputProps={{
                  inputProps: { inputMode: 'numeric', pattern: '[0-9]*' },
                  endAdornment: (
                    <InputAdornment position='end'>
                      <Typography variant='caption' color='text.secondary'>
                        coins
                      </Typography>
                    </InputAdornment>
                  )
                }}
              />
              <Typography variant='caption' color='text.secondary' sx={{ mt: 1, display: 'block' }}>
                Minimum coins required for a payout to be processed
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  )
}

export default WithdrawalSettings
