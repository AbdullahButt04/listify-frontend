import axios from 'axios'
import { toast } from 'react-toastify'

import { baseURL } from '../../utils/config'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getFormDataAuthHeaders } from '@/utils/commonfunctions'
import apiService from '@/utils/apiService'

const BASE_URL = baseURL

export const fetchSubscriberPlansList = createAsyncThunk('subscriptionPlan/getAllSubscriptionPlans', async ({ page, pageSize }, thunkAPI) => {
    try {
      const response = await apiService.get(
        `api/admin/subscriptionPlan/getAllSubscriptionPlans?start=${page}&limit=${pageSize}`
      )
      return response.data 
      
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message
      toast.error(errorMsg)

      return thunkAPI.rejectWithValue(errorMsg)
    }
  }
)

export const createSubscriptionPlan = createAsyncThunk(
  'subscriptionPlan/createSubscriptionPlan',
  async (formData, thunkAPI) => {
    try {
      const response = await axios.post(`${BASE_URL}api/admin/subscriptionPlan/createSubscriptionPlan`, formData, {
        headers: {
          ...getFormDataAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      })
      toast.success(response.data.message || 'Subscription plan created successfully')
      return response.data.data
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message

      toast.error(errorMsg)

      return thunkAPI.rejectWithValue(errorMsg)
    }
  }
)

export const updateSubscriptionPlan = createAsyncThunk(
  'subscriptionPlan/updateSubscriptionPlan',
  async (formData, thunkAPI) => {
    try {
      const response = await axios.patch(`${BASE_URL}api/admin/subscriptionPlan/updateSubscriptionPlan`, formData, {
        headers: {
          ...getFormDataAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      })
      toast.success(response.data.message || 'Subscription plan updated successfully')
      return response.data.data
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message

      toast.error(errorMsg)

      return thunkAPI.rejectWithValue(errorMsg)
    }
  }
)

export const removeSubscriptionPlan = createAsyncThunk(
  'subscriptionPlan/deleteSubscriptionPlan',
  async (id, thunkAPI) => {
    try {
      const response = await apiService.delete(`api/admin/subscriptionPlan/deleteSubscriptionPlan?planId=${id}`, {})
      toast.success(response.data.message || 'Subscription plan removed successfully')
      return id
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message

      toast.error(errorMsg)

      return thunkAPI.rejectWithValue(errorMsg)
    }
  }
)

export const toggleSubscriptionPlan = createAsyncThunk(
  'subscriptionPlan/toggleSubscriptionPlanStatus',
  async (planId, thunkAPI) => {
    try {
      const response = await apiService.patch(
        `api/admin/subscriptionPlan/toggleSubscriptionPlanStatus?planId=${planId}`,
        {},
        {}
      )
      if (response.data.status) {
        toast.success('plan status updated successfully')

        return { planId, success: true }
      } else {
        throw new Error(response.data.message || 'Failed to toggle plan status')
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message

      toast.error(errorMsg)

      return thunkAPI.rejectWithValue(errorMsg)
    }
  }
)

const initialState = {
  subscriberPlans: [],
  initialLoading: false,
  loading: false,
  error: null,
  page: 1,
  pageSize: 10,
  total: 0
}

const subScriptionPlan = createSlice({
  name: 'subscriptionPlan',
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
    builder.addCase(fetchSubscriberPlansList.pending, (state, action) => {
      state.initialLoading = true
    })
    builder.addCase(fetchSubscriberPlansList.fulfilled, (state, action) => {
      state.initialLoading = false
      state.subscriberPlans = action.payload.data
      state.total = action.payload.totalCount
    })
    builder.addCase(fetchSubscriberPlansList.rejected, (state, action) => {
      state.initialLoading = false
      state.error = action.payload
      toast.error(action.payload)
    })

    // Create subscription plan
    builder.addCase(createSubscriptionPlan.pending, state => {
      state.loading = true
      state.error = null
    })
    builder.addCase(createSubscriptionPlan.fulfilled, (state, action) => {
      state.loading = false
      state.subscriberPlans.unshift(action.payload)
      state.error = null
    })
    builder.addCase(createSubscriptionPlan.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload
    })

    // Update subscription plan
    builder.addCase(updateSubscriptionPlan.pending, state => {
      state.loading = true
      state.error = null
    })
    builder.addCase(updateSubscriptionPlan.fulfilled, (state, action) => {
      state.loading = false
      state.subscriberPlans = state.subscriberPlans.map(plan =>
        plan._id === action.payload._id ? action.payload : plan
      )
      state.error = null
    })
    builder.addCase(updateSubscriptionPlan.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload
    })

    // Remove subscription plan
    builder.addCase(removeSubscriptionPlan.pending, state => {
      state.loading = true
      state.error = null
    })
    builder.addCase(removeSubscriptionPlan.fulfilled, (state, action) => {
      state.loading = false
      state.subscriberPlans = state.subscriberPlans.filter(plan => plan._id !== action.payload)
      state.error = null
    })
    builder
      .addCase(removeSubscriptionPlan.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Toggle active status
      .addCase(toggleSubscriptionPlan.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(toggleSubscriptionPlan.fulfilled, (state, action) => {
        state.loading = false
        const plan = state.subscriberPlans.find(plan => plan._id === action.payload.planId)

        if (plan) {
          plan.isActive = !plan.isActive
        }

        state.error = null
      })
      .addCase(toggleSubscriptionPlan.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export const { setPage, setPageSize } = subScriptionPlan.actions
export default subScriptionPlan.reducer
