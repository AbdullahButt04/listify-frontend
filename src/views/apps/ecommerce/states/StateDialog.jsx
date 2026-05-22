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
  TextField,
  Chip
} from '@mui/material'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import { useDispatch, useSelector } from 'react-redux'
import { addState } from '@/redux-store/slices/states'
import { getAllCountriesList } from '@/redux-store/slices/countries'
import { NO_PERMISSION } from '@/utils/constants'
import { toast } from 'react-toastify'

// Helper to find state by id from countryData
const findStateWithCountry = (countryData, stateId) => {
  for (const country of countryData) {
    const foundState = (country.states || []).find(s => Number(s.id) === Number(stateId))
    if (foundState) {
      return { state: foundState, country }
    }
  }
  return { state: null, country: null }
}

// Main Component
const StateDialog = ({ open, onClose, editData = null, countryData = [] }) => {
  const dispatch = useDispatch()
  const { countriesList } = useSelector(state => state.countries)

  const { profileData } = useSelector(state => state.adminSlice)



  const [selectedState, setSelectedState] = useState(null)
  const [allStates, setAllStates] = useState([]) // Filtered states flat list
  const [error, setError] = useState('')

  useEffect(() => {
    // Fetch backend countries list from redux
    dispatch(getAllCountriesList())
  }, [dispatch])

  // Filter states to show only for backend countries
  useEffect(() => {
    if (!countryData || countryData.length === 0 || !countriesList || countriesList.length === 0) {
      setAllStates([])
      return
    }
    // Backend countries ke names ka set banao for fast lookup (case-insensitive compare)
    const backendCountryNames = new Set(countriesList.map(c => c.name.toLowerCase()))
    const statesFlat = []
    countryData.forEach(country => {
      // countryData me se country.name ko lower case karke check karo backend me hai ya nahi
      if (backendCountryNames.has(country.name.toLowerCase())) {
        ;(country.states || []).forEach(state => {
          const { cities, ...stateWithoutCities } = state
          statesFlat.push({
            ...stateWithoutCities,
            countryId: country.id,
            countryName: country.name
          })
        })
      }
    })
    setAllStates(statesFlat)
  }, [countryData, countriesList])

  // Prefill in edit mode
  useEffect(() => {
    if (!open) return
    if (editData?.stateId) {
      const { state, country } = findStateWithCountry(countryData, editData.stateId)
      if (state && country) {
        setSelectedState({ ...state, countryName: country.name })
      } else {
        setSelectedState(null)
      }
    } else {
      setSelectedState(null)
    }
  }, [editData, open, countryData])

  const handleStateChange = (_evt, newState) => {
    setSelectedState(newState)
    setError('')
  }

  const handleSubmit = () => {
    if (!selectedState) {
      setError('Please select a state.')
      return
    }



    // Payload to send: include state and the country name it belongs to
    const payload = {
      name: selectedState.name,
      state_code: selectedState.state_code,
      latitude: selectedState.latitude,
      longitude: selectedState.longitude,
      countryName: selectedState.countryName
    }
    dispatch(addState(JSON.stringify(payload)))
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: '100%',
          maxWidth: 500,
          minWidth: 320,
          overflow: 'visible'
        }
      }}
    >
      <DialogTitle>
        <Typography variant='h5' component='span'>
          {editData ? 'Edit State Selection' : 'Select State'}
        </Typography>
        <DialogCloseButton onClick={onClose}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>
      <DialogContent>
        <Autocomplete
          options={allStates}
          getOptionLabel={opt => `${opt.name} (${opt.countryName})`}
          value={selectedState}
          onChange={handleStateChange}
          isOptionEqualToValue={(a, b) => Number(a.id) === Number(b.id)}
          renderInput={params => (
            <TextField
              {...params}
              label='States'
              placeholder='Select a state'
              error={!!error}
              helperText={error}
              size='medium'
              className='my-3'
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                {...getTagProps({ index })}
                key={`${option.id}-${option.name}`}
                label={`${option.name} (${option.countryName})`}
              />
            ))
          }
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

export default StateDialog
