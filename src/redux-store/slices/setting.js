import { toast } from 'react-toastify'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import apiService from '@/utils/apiService'

// Fetch settings
export const fetchSetting = createAsyncThunk('setting/retrieveSetting', async (_, thunkAPI) => {
  try {
    const response = await apiService.get(`api/admin/setting/retrieveSetting`)
    return response.data
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || 'Failed to fetch settings')
  }
})

// Update settings
export const updateSettings = createAsyncThunk('setting/updateSettings', async (settingData, thunkAPI) => {
  try {
    const settingId = settingData._id
    const response = await apiService.patch(`api/admin/setting/modifySetting?settingId=${settingId}`, settingData)

    if (response.data.status) {
      toast.success('Settings updated successfully')
      return { data: settingData, response: response.data }
    } else {
      toast.error(response.data.message || 'Failed to update settings')
      return thunkAPI.rejectWithValue(response.data)
    }
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to update settings')
    return thunkAPI.rejectWithValue(error.response?.data || 'Failed to update settings')
  }
})

// Toggle setting
export const toggleSetting = createAsyncThunk('setting/toggleSetting', async ({ settingId, type }, thunkAPI) => {
  try {
    const response = await apiService.patch(`api/admin/setting/modifyToggleOption?settingId=${settingId}&type=${type}`)

    if (response.data.status) {
      toast.success(`${type} setting toggled successfully`)
      return { type, response: response.data }
    } else {
      toast.error(response.data.message || 'Failed to toggle setting')
      return thunkAPI.rejectWithValue(response.data)
    }
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to toggle setting')
    return thunkAPI.rejectWithValue(error.response?.data || 'Failed to toggle setting')
  }
})

const initialState = {
  setting: null,
  initialLoading: false,
  loading: false,
  error: null
}

const settingSlice = createSlice({
  name: 'setting',
  initialState,
  reducers: {},
  extraReducers: builder => {
    // Fetch settings cases
    builder.addCase(fetchSetting.pending, state => {
      state.initialLoading = true
      state.loading = true
      state.error = null
    })
    builder.addCase(fetchSetting.fulfilled, (state, action) => {
      state.initialLoading = false
      state.loading = false
      state.setting = action.payload.data
      state.error = null
    })
    builder.addCase(fetchSetting.rejected, (state, action) => {
      state.initialLoading = false
      state.loading = false
      state.error = action.payload
    })

    // Update settings cases
    builder.addCase(updateSettings.pending, state => {
      state.loading = true
      state.error = null
    })
    builder.addCase(updateSettings.fulfilled, (state, action) => {
      state.loading = false
      // Update the state with the new settings data
      state.setting = {
        ...state.setting,
        ...action.payload.data
      }
      state.error = null
    })
    builder.addCase(updateSettings.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload
    })

    // Toggle setting cases
    builder.addCase(toggleSetting.pending, state => {
      state.loading = true
      state.error = null
    })
    builder.addCase(toggleSetting.fulfilled, (state, action) => {
      state.loading = false
      // Toggle the specific setting in state
      if (state.setting && action.payload.type) {
        state.setting = {
          ...state.setting,
          [action.payload.type]: !state.setting[action.payload.type]
        }
      }
      state.error = null
    })
    builder.addCase(toggleSetting.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload
    })
  }
})

export default settingSlice.reducer
