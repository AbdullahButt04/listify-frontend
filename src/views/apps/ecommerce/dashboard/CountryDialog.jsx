'use client'

import React, { forwardRef, useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Slide,
  CircularProgress,
  Typography,
  Autocomplete,
  Checkbox,
  Box,
  Chip,
  TextField
} from '@mui/material'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import CustomTextField from '@core/components/mui/TextField'
import { useDispatch, useSelector } from 'react-redux'
import { addCountry } from '@/redux-store/slices/countries'
import { NO_PERMISSION } from '@/utils/constants'
import { toast } from 'react-toastify'

// Transition for dialog animation
const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

// Helpers
const byId = (arr, id) => arr?.find(x => Number(x?.id) === Number(id)) || null
const isEqualById = (a, b) => Number(a?.id) === Number(b?.id)
const uniqById = arr => {
  const seen = new Set()
  const out = []
  for (const it of arr || []) {
    const k = Number(it?.id)
    if (!seen.has(k)) {
      seen.add(k)
      out.push(it)
    }
  }
  return out
}

// Main Component
const CountryDialog = ({ open, onClose, editData = null, countryData = [] }) => {
  const dispatch = useDispatch()
  const { profileData } = useSelector(state => state.adminSlice)


  // ---- new cascading selections ----
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [selectedStates, setSelectedStates] = useState([])
  const [selectedCities, setSelectedCities] = useState([])
  const [countryError, setCountryError] = useState('')

  // Derived options
  const stateOptions = useMemo(() => selectedCountry?.states ?? [], [selectedCountry])
  const cityOptions = useMemo(() => {
    const all = (selectedStates || []).flatMap(s => s?.cities || [])
    return uniqById(all)
  }, [selectedStates])

  useEffect(() => {
    if (!open) {
      setCountryError('')
    }
  }, [open])

  // ---------- EDIT MODE: prefill from editData ----------
  useEffect(() => {
    if (!open) return

    // reset everything on fresh open
    if (!editData) {
      setSelectedCountry(null)
      setSelectedStates([])
      setSelectedCities([])
      return
    }

    // Try nested shape: { country, states:[{..., cities:[...]}] }
    if (editData?.country && Array.isArray(editData?.states)) {
      const c = byId(countryData, editData.country.id)
      setSelectedCountry(c || null)

      if (c) {
        const wantedStateIds = new Set(editData.states.map(s => Number(s.id)))
        const statesResolved = (c.states || []).filter(s => wantedStateIds.has(Number(s.id)))
        setSelectedStates(statesResolved)

        const incomingCityIds = new Set(editData.states.flatMap(s => (s.cities || []).map(ct => Number(ct.id))))
        const resolvedCities = statesResolved
          .flatMap(s => s.cities || [])
          .filter(ct => incomingCityIds.has(Number(ct.id)))
        setSelectedCities(uniqById(resolvedCities))
      } else {
        setSelectedStates([])
        setSelectedCities([])
      }
      return
    }

    // Fallback: flat shape { countryId, stateIds:number[], cityIds:number[] }
    if (editData?.countryId) {
      const c = byId(countryData, editData.countryId)
      setSelectedCountry(c || null)

      if (c) {
        const wantedStateIds = new Set((editData.stateIds || []).map(Number))
        const statesResolved = (c.states || []).filter(s => wantedStateIds.has(Number(s.id)))
        setSelectedStates(statesResolved)

        const wantedCityIds = new Set((editData.cityIds || []).map(Number))
        const resolvedCities = statesResolved
          .flatMap(s => s.cities || [])
          .filter(ct => wantedCityIds.has(Number(ct.id)))
        setSelectedCities(uniqById(resolvedCities))
      } else {
        setSelectedStates([])
        setSelectedCities([])
      }
      return
    }

    // If editData exists but doesn't match expected shapes, leave as-is.
  }, [editData, open, countryData])

  // ---------- handlers ----------
  const onCountryChange = (_evt, newCountry) => {
    setSelectedCountry(newCountry)
    setCountryError('') // error ko reset karo
    // reset cascades
    setSelectedStates([])
    setSelectedCities([])
  }

  const onStatesChange = (_evt, newStates) => {
    setSelectedStates(newStates || [])
    const validCityIds = new Set((newStates || []).flatMap(s => (s?.cities || []).map(c => Number(c.id))))
    setSelectedCities(prev => prev.filter(ct => validCityIds.has(Number(ct.id))))
  }

  const onCitiesChange = (_evt, newCities) => {
    setSelectedCities(newCities || [])
  }

  // ---------- payload builder ----------
  const buildPayloadNested = () => {
    if (!selectedCountry) return null

    const countryLean = {
      name: selectedCountry.name,
      phone_code: selectedCountry.phone_code,
      currency: selectedCountry.currency,
      currencyName: selectedCountry.currency_name,
      currencySymbol: selectedCountry.currency_symbol,
      tld: selectedCountry.tld,
      native: selectedCountry.native,
      region: selectedCountry.region,
      subregion: selectedCountry.subregion,
      latitude: selectedCountry.latitude,
      longitude: selectedCountry.longitude,
      emoji: selectedCountry.emoji,
      emojiU: selectedCountry.emojiU
    }

    const cityIdsSet = new Set(selectedCities.map(ct => Number(ct.id)))

    const states = selectedStates.map(state => {
      const stateCities = (state.cities || []).filter(city => cityIdsSet.has(Number(city.id)))
      return {
        name: state.name,
        state_code: state.state_code,
        latitude: state.latitude,
        longitude: state.longitude,
        cities: stateCities.map(city => ({
          name: city.name,
          latitude: city.latitude,
          longitude: city.longitude
        }))
      }
    })

    return {
      ...countryLean,
      states: states
    }
  }

  const handleSubmit = async () => {
    let hasError = false

    // Country validation
    if (!selectedCountry) {
      setCountryError('Please select a country.')
      hasError = true
    } else {
      setCountryError('')
    }

    if (hasError) return



    // Optionally, show loader
    try {
      const payload = buildPayloadNested()
      dispatch(addCountry(JSON.stringify(payload)))

      onClose()
    } catch (e) {
      console.error('Submit failed:', e)
    }
  }

  // ---------- rendering ----------
  return (
    <Dialog
      open={open}
      keepMounted
      onClose={onClose}
      TransitionComponent={Transition}
      closeAfterTransition={false}
      PaperProps={{
        sx: {
          width: '100%', // full width kar do
          maxWidth: 500, // ya customizable width
          minWidth: 320,
          overflow: 'visible'
        }
      }}
    >
      <DialogTitle>
        <Typography variant='h5' component='span'>
          {editData ? 'Edit Country Selection' : 'Create Country'}
        </Typography>
        <DialogCloseButton onClick={onClose}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>

      <DialogContent>
        <Autocomplete
          options={countryData || []}
          value={selectedCountry}
          onChange={onCountryChange}
          getOptionLabel={opt => opt?.name ?? ''}
          isOptionEqualToValue={isEqualById}
          renderInput={params => (
            <TextField
              {...params}
              label='Country'
              placeholder='Select a country'
              size='medium'
              className='my-3'
              error={!!countryError}
              helperText={countryError}
            />
          )}
        />

        <Autocomplete
          multiple
          options={stateOptions}
          value={selectedStates}
          onChange={onStatesChange}
          getOptionLabel={opt => opt?.name ?? ''}
          isOptionEqualToValue={isEqualById}
          disableCloseOnSelect
          disabled={!selectedCountry}
          renderOption={(props, option, { selected }) => {
            const { key, ...otherProps } = props
            return (
              <li key={key} {...otherProps}>
                <Checkbox checked={selected} sx={{ mr: 1 }} />
                {option.name} {option.state_code ? `(${option.state_code})` : ''}
              </li>
            )
          }}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const { key, ...chipProps } = getTagProps({ index })
              return <Chip key={key} {...chipProps} label={option.name} />
            })
          }
          renderInput={params => (
            <TextField
              {...params}
              label='States'
              placeholder={selectedCountry ? 'Select states' : 'Select country first'}
              size='medium'
              className='my-3'
            />
          )}
        />
        <Autocomplete
          multiple
          options={cityOptions}
          value={selectedCities}
          onChange={onCitiesChange}
          getOptionLabel={opt => opt?.name ?? ''}
          isOptionEqualToValue={isEqualById}
          disableCloseOnSelect
          disabled={selectedStates.length === 0}
          renderOption={(props, option, { selected }) => {
            const { key, ...otherProps } = props
            // Unique key combination for cities
            const safeKey = option.id ? `option-${option.id}` : `option-${option.name}-${option.state_code ?? index}`
            return (
              <li key={safeKey} {...otherProps}>
                <Checkbox checked={selected} sx={{ mr: 1 }} />
                {option.name}
              </li>
            )
          }}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const { key, ...chipProps } = getTagProps({ index })
              // Same approach for tags
              const safeKey = option.id ? `tag-${option.id}` : `tag-${option.name}-${option.state_code ?? index}`
              return <Chip key={safeKey} {...chipProps} label={option.name} />
            })
          }
          renderInput={params => (
            <TextField
              {...params}
              label='Cities'
              placeholder={selectedStates.length > 0 ? 'Select cities' : 'Select states first'}
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

export default CountryDialog
