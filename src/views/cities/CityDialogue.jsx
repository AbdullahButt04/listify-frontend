'use client'

import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Autocomplete,
  TextField
} from '@mui/material'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import { getAllStates } from '@/redux-store/slices/states'
import { useDispatch, useSelector } from 'react-redux'
import { addCity } from '@/redux-store/slices/cities'
import { NO_PERMISSION } from '@/utils/constants'
import { toast } from 'react-toastify'

const CityDialog = ({ open, onClose, editData = null, countryData = [], citiesData, states }) => {
  const dispatch = useDispatch()
  // const { states } = useSelector(state => state.states)

  const { profileData } = useSelector(state => state.adminSlice)



  const [selectedCity, setSelectedCity] = useState(null)

  const [allCities, setAllCities] = useState([])
  const [error, setError] = useState('')

  // useEffect(() => {
  //   // Fetch all redux states when dialog mounts
  //   dispatch(getAllStates({ page: 1, pageSize: 5800 }))
  // }, [dispatch])

  useEffect(() => {
    // Redux store ki states ko normalize karo (for fast lookup)
    const reduxStateSet = new Set((states || []).map(st => String(st.state_code || st.id)))

    // Flat cities from matched states
    const citiesFlat = []
    ;(countryData || []).forEach(country => {
      ;(country.states || []).forEach(state => {
        // Dono jagah exist kare wahi state consider karo
        if (reduxStateSet.has(String(state.state_code || state.id))) {
          ;(state.cities || []).forEach(city => {
            citiesFlat.push({
              ...city,
              stateId: state.id,
              stateName: state.name
            })
          })
        }
      })
    })
    setAllCities(citiesFlat)
  }, [countryData, states])

  useEffect(() => {
    if (!open) return

    if (editData?.cityId) {
      const city = allCities.find(c => Number(c.id) === Number(editData.cityId))
      if (city) setSelectedCity(city)
      else setSelectedCity(null)
    } else {
      setSelectedCity(null)
    }
  }, [editData, open, allCities])

  const handleCityChange = (_evt, newCity) => {
    setSelectedCity(newCity)
    setError('')
  }

  const handleSubmit = () => {
    if (!selectedCity) {
      setError('Please select a city.')
      return
    }



    const payload = {
      name: selectedCity.name,
      latitude: selectedCity.latitude,
      longitude: selectedCity.longitude,
      stateName: selectedCity.stateName
    }
    dispatch(addCity(JSON.stringify(payload)))
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: '100%', maxWidth: 500, minWidth: 320, overflow: 'visible' } }}
    >
      <DialogTitle>
        <Typography variant='h5' component='span'>
          {editData ? 'Edit City Selection' : 'Select City'}
        </Typography>
        <DialogCloseButton onClick={onClose}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>
      <DialogContent>
        <Autocomplete
          options={allCities}
          getOptionLabel={opt => `${opt.name} (${opt.stateName})`}
          value={selectedCity}
          onChange={handleCityChange}
          isOptionEqualToValue={(a, b) => String(a.id) === String(b.id)}
          renderOption={(props, option) => (
            <li {...props} key={option.id}>
              {`${option.name} (${option.stateName})`}
            </li>
          )}
          renderInput={params => (
            <TextField
              {...params}
              label='Cities'
              placeholder='Select a city'
              error={!!error}
              helperText={error}
              size='medium'
              className='my-3'
            />
          )}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant='tonal'>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant='contained'>
          {editData ? 'Update' : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CityDialog
