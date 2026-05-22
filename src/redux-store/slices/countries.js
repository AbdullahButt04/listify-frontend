import { toast } from 'react-toastify'
import apiService from '@/utils/apiService'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

export const getAllCountries = createAsyncThunk('country/getAllCountries', async ({ page, pageSize }, thunkAPI) => {
  try {
    const response = await apiService.get(`api/admin/country/getAllCountries?start=${page}&limit=${pageSize}`)

    return response.data || []
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message

    toast.error(errorMsg)

    return thunkAPI.rejectWithValue(errorMsg)
  }
})

// Delete Country
export const removeCountry = createAsyncThunk('country/deleteCountry', async (countryId, thunkAPI) => {
  try {
    const response = await apiService.delete(`api/admin/country/deleteCountry?countryId=${countryId}`)

    toast.success(response.data.message || 'Country deleted successfully')

    return { countryId }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message

    toast.error(errorMsg)

    return thunkAPI.rejectWithValue(errorMsg)
  }
})

// ADD COUNTRY
export const addCountry = createAsyncThunk('country/createCountry', async (data, thunkAPI) => {
  try {
    const response = await apiService.post(`api/admin/country/createCountry`, data)

    if (response?.data?.data) {
      toast.success(response.data.message || 'Country, states, and cities saved successfully')
    }

    return response.data
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message

    toast.error(errorMsg)

    return thunkAPI.rejectWithValue(errorMsg)
  }
})

// GET COUNTRIES WITHOUT PAGINATION

export const getAllCountriesList = createAsyncThunk('country/fetchCountries', async (_, thunkAPI) => {
  try {
    const response = await apiService.get(`api/admin/country/fetchCountries`)
    return response.data || []
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message
    toast.error(errorMsg)
    return thunkAPI.rejectWithValue(errorMsg)
  }
})

const initialState = {
  countries: [],
  countriesList: [],
  initialLoading: true,
  loading: false,
  error: null,
  page: 1,
  pageSize: 10,
  total: 0
}

const countriesSlice = createSlice({
  name: 'countries',
  initialState,
  reducers: {
    setPage: (state, action) => {
      state.page = action.payload
    },
    setPageSize: (state, action) => {
      state.pageSize = action.payload
    }
  },
  extraReducers: builder => {
    builder.addCase(getAllCountries.pending, state => {
      state.initialLoading = true
      state.error = null
    })
    builder.addCase(getAllCountries.fulfilled, (state, action) => {
      state.initialLoading = false
      state.countries = action.payload.data
      state.total = action.payload.total
    })
    builder.addCase(getAllCountries.rejected, (state, action) => {
      state.initialLoading = false
      state.error = action.payload
      toast.error(action.payload)
    })

    // Delete Countries

    builder.addCase(removeCountry.pending, state => {
      state.loading = true
      state.error = null
    })
    builder.addCase(removeCountry.fulfilled, (state, action) => {
      state.loading = false
      state.countries = state.countries.filter(country => country._id !== action.payload.countryId)
      state.error = null
    })
    builder.addCase(removeCountry.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload
    })

    // ADD COUNTRY

    builder.addCase(addCountry.pending, state => {
      state.loading = true
      state.error = null
    })
    builder.addCase(addCountry.fulfilled, (state, action) => {
      if (!action?.payload?.data) {
        toast.error(action.payload.message)
        return
      }
      state.loading = false
      state.countries.unshift(action.payload.data)
      state.error = null
    })
    builder.addCase(addCountry.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload
    })

    // GET COUNTRIES WITHOUT PAGINATION

    builder.addCase(getAllCountriesList.pending, state => {
      state.initialLoading = true
      state.error = null
    })
    builder.addCase(getAllCountriesList.fulfilled, (state, action) => {
      state.initialLoading = false
      state.countriesList = action.payload.data
    })
    builder.addCase(getAllCountriesList.rejected, (state, action) => {
      state.initialLoading = false
      state.error = action.payload
      toast.error(action.payload)
    })
  }
})

export const { setPage, setPageSize } = countriesSlice.actions
export default countriesSlice.reducer
