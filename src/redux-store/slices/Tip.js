import { toast } from 'react-toastify'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import apiService from '@/utils/apiService'

export const fetchAllTips = createAsyncThunk('tip/getAllTips', async ({ page, pageSize }, thunkAPI) => {
  try {
    const response = await apiService.get(`api/admin/tip/getAllTips?start=${page}&limit=${pageSize}`)
    return response.data
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message
    toast.error(errorMsg)
    return thunkAPI.rejectWithValue(errorMsg)
  }
})

// Create new Tip
export const createTip = createAsyncThunk('tip/createTip', async (data, thunkAPI) => {
  try {
    const response = await apiService.post(`api/admin/tip/createTip`, data)

    toast.success(response.data.message || 'Tip created successfully')
    return response.data.data
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message

    toast.error(errorMsg)

    return thunkAPI.rejectWithValue(errorMsg)
  }
})

export const updateTip = createAsyncThunk('tip/updateTip', async (data, thunkAPI) => {
  try {
    const response = await apiService.patch(`api/admin/tip/updateTip`, data)

    toast.success(response.data.message || 'Tip updated successfully')

    return response.data.data
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message

    toast.error(errorMsg)

    return thunkAPI.rejectWithValue(errorMsg)
  }
})

// Delete Tip
export const removeTip = createAsyncThunk('tip/deleteTip', async (tipId, thunkAPI) => {
  try {
    const response = await apiService.delete(`api/admin/tip/deleteTip?tipId=${tipId}`)

    toast.success(response.data.message || 'tip deleted successfully')

    return { tipId }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message

    toast.error(errorMsg)

    return thunkAPI.rejectWithValue(errorMsg)
  }
})

export const toggleTipActiveState = createAsyncThunk('tip/toggleTipActiveStatus', async (tipId, thunkAPI) => {
  try {
    const response = await apiService.patch(`api/admin/tip/toggleTipActiveStatus?tipId=${tipId}`)

    if (response.data.status) {
      toast.success(response.data.message || 'Tip status updated successfully')

      return { tipId, success: true }
    } else {
      throw new Error(response.data.message || 'Failed to toggle banner status')
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message

    toast.error(errorMsg)

    return thunkAPI.rejectWithValue(errorMsg)
  }
})

const initialState = {
  tips: [],
  loading: false,
  initialLoading: true,
  error: null,
  total: 0,
  page: 1,
  pageSize: 10,
}

const tipSlice = createSlice({
  name: 'tips',
  initialState,
  reducers: {
    setPage: (state, action) => {
      state.page = action.payload
    },
    setPageSize: (state, action) => {
      state.pageSize = action.payload
    },
  },
  extraReducers: builder => {
    builder

      // Fetch tips
      .addCase(fetchAllTips.pending, state => {
        state.initialLoading = true
        state.loading = true
        state.error = null
      })
      .addCase(fetchAllTips.fulfilled, (state, action) => {
        state.initialLoading = false
        state.loading = false
        state.tips = action.payload.data || []
        state.total = action.payload.total || 0
        state.error = null
      })
      .addCase(fetchAllTips.rejected, (state, action) => {
        state.initialLoading = false
        state.loading = false
        state.error = action.payload
      })

      // Create tip
      .addCase(createTip.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(createTip.fulfilled, (state, action) => {
        state.loading = false
        state.tips.unshift(action.payload)
        state.error = null
      })
      .addCase(createTip.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Update tip
      .addCase(updateTip.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(updateTip.fulfilled, (state, action) => {
        state.loading = false
        const index = state.tips.findIndex(tips => tips._id === action.payload._id)

        if (index !== -1) {
          state.tips[index] = action.payload
        }

        state.error = null
      })
      .addCase(updateTip.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Delete tip
      .addCase(removeTip.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(removeTip.fulfilled, (state, action) => {
        state.loading = false
        state.tips = state.tips.filter(tips => tips._id !== action.payload.tipId)
        state.error = null
      })
      .addCase(removeTip.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Toggle active status
      .addCase(toggleTipActiveState.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(toggleTipActiveState.fulfilled, (state, action) => {
        state.loading = false
        const tips = state.tips.find(tips => tips._id === action.payload.tipId)

        if (tips) {
          tips.isActive = !tips.isActive
        }

        state.error = null
      })
      .addCase(toggleTipActiveState.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export const { setPage, setPageSize } = tipSlice.actions
export default tipSlice.reducer
