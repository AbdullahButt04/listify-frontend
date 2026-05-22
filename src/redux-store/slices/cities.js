import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { toast } from 'react-toastify'
import apiService from '@/utils/apiService'

//GET CITIES
export const getAllCities = createAsyncThunk('city/getAllCities', async ({ page, pageSize }, thunkAPI) => {
  try {
    const response = await apiService.get(`api/admin/city/getAllCities?start=${page}&limit=${pageSize}`)

    // toast.success(response.data.message || 'Cities retrieved successfully')
    return response.data || []
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message

    toast.error(errorMsg)

    return thunkAPI.rejectWithValue(errorMsg)
  }
})

// DELETE CITY
export const removeCity = createAsyncThunk('city/deleteCity', async (cityId, thunkAPI) => {
  try {
    const response = await apiService.delete(`api/admin/city/deleteCity?cityId=${cityId}`)

    toast.success(response.data.message || 'City deleted successfully')

    return { cityId }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message

    toast.error(errorMsg)

    return thunkAPI.rejectWithValue(errorMsg)
  }
})

// ADD CITY
export const addCity = createAsyncThunk('city/createCity', async (data, thunkAPI) => {
  try {
    const response = await apiService.post(`api/admin/city/createCity`, data)

    if (response?.data?.data) {
      toast.success(response.data.message || 'State, cities saved successfully')
    }
    return response.data
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message
    toast.error(errorMsg)
    return thunkAPI.rejectWithValue(errorMsg)
  }
})

// GET CITIES WITHOUT PAGINATION
export const getAllCitiesList = createAsyncThunk('city/fetchCities', async (_, thunkAPI) => {
  try {
    const response = await apiService.get(`api/admin/city/fetchCities`)

    return response.data || []
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message
    toast.error(errorMsg)
    return thunkAPI.rejectWithValue(errorMsg)
  }
})

const initialState = {
  cities: [],
  citiesList: [],
  initialLoading: false,
  loading: false,
  error: null,
  total: 0,
  page: 1,
  pageSize: 10
}

const citiesSlice = createSlice({
  name: 'cities',
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
    builder.addCase(getAllCities.pending, state => {
      state.initialLoading = true
      state.error = null
    })
    builder.addCase(getAllCities.fulfilled, (state, action) => {
      state.initialLoading = false
      state.cities = action.payload.data
      state.total = action.payload.total
    })
    builder.addCase(getAllCities.rejected, (state, action) => {
      state.initialLoading = false
      state.error = action.payload
      toast.error(action.payload)
    })

    //DELETE CITY

    builder.addCase(removeCity.pending, state => {
      state.loading = true
      state.error = null
    })
    builder.addCase(removeCity.fulfilled, (state, action) => {
      state.loading = false
      state.cities = state.cities.filter(city => city._id !== action.payload.cityId)
      state.error = null
    })
    builder.addCase(removeCity.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload
    })

    // ADD CITY

    builder.addCase(addCity.pending, state => {
      state.loading = true
    })
    builder.addCase(addCity.fulfilled, (state, action) => {
      if (!action?.payload?.data) {
        toast.error(action?.payload?.message)
        return
      }
      state.loading = false
      state.cities.unshift(action.payload.data)
      state.error = null
    })
    builder.addCase(addCity.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload
    })

    // GET STATESLST WITHOUT PAGINATION

    builder.addCase(getAllCitiesList.pending, state => {
      state.initialLoading = true
      state.error = null
    })
    builder.addCase(getAllCitiesList.fulfilled, (state, action) => {
      state.initialLoading = false
      state.citiesList = action.payload.data
    })
    builder.addCase(getAllCitiesList.rejected, (state, action) => {
      state.initialLoading = false
      state.error = action.payload
      toast.error(action.payload)
    })
  }
})

export const { setPage, setPageSize } = citiesSlice.actions
export default citiesSlice.reducer
