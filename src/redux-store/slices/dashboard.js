import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '@/utils/apiService'

export const getDashboardMetrics = createAsyncThunk('dashboard/getDashboardMetrics', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('api/admin/dashboard/fetchAdminDashboardStats')

    return response.data.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch dashboard metrics')
  }
})

export const getDashboardGraphStats = createAsyncThunk(
  'dashboard/getDashboardGraphStats',
  async ({ startDate, endDate, type }, { rejectWithValue }) => {
    try {
      // For ads data
      if (type === 'ads') {
        const response = await api.get(
          `api/admin/dashboard/fetchChartData?startDate=${startDate}&endDate=${endDate}&type=ads`
        )
        return { type: 'ads', data: response.data }
      }
      // For user and seller data
      else {
        const response = await api.get(
          `api/admin/dashboard/retrieveChartMetrics?startDate=${startDate}&endDate=${endDate}&type=${type}`
        )
        return { type, data: response.data }
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch dashboard graph stats')
    }
  }
)

export const getRecentUsers = createAsyncThunk(
  'dashboard/getRecentUsers',
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      const response = await api.get(`api/admin/dashboard/fetchRecentUsers?startDate=${startDate}&endDate=${endDate}`)
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch recent users')
    }
  }
)

export const getRecentAds = createAsyncThunk(
  'dashboard/getRecentAds',
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      const response = await api.get(`api/admin/dashboard/listRecentAds?startDate=${startDate}&endDate=${endDate}`)
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch recent ads')
    }
  }
)

const initialState = {
  metrics: {
    totalUsers: 0,
    totalBlockedUsers: 0,
    totalCategories: 0,
    totalApprovedAds: 0,
    totalAttributes: 0,
    totalAdVideos: 0
  },
  recentUsers: [],
  recentAds: [],
  graphStats: {
    ads: {
      pending: [],
      approved: [],
      permanentRejected: [],
      softRejected: []
    },
    user: [],
    seller: []
  },
  loading: {
    metrics: true,
    recentUsers: true,
    recentAds: true,
    seller: true,
    graphStats: {
      ads: true,
      user: true,
      seller: true
    }
  },
  error: {
    metrics: null,
    recentUsers: null,
    recentAds: null,
    seller: null,
    graphStats: {
      ads: null,
      user: null,
      seller: null
    }
  }
}

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder.addCase(getDashboardMetrics.pending, state => {
      state.loading.metrics = true
    })
    builder.addCase(getDashboardMetrics.fulfilled, (state, action) => {
      state.loading.metrics = false
      state.metrics = action.payload
    })
    builder.addCase(getDashboardMetrics.rejected, (state, action) => {
      state.loading.metrics = false
    })
    builder.addCase(getDashboardGraphStats.pending, (state, action) => {
      const { type } = action.meta.arg
      state.loading.graphStats[type] = true
    })
    builder.addCase(getDashboardGraphStats.fulfilled, (state, action) => {
      const { type, data } = action.payload
      state.loading.graphStats[type] = false

      if (type === 'ads') {
        state.graphStats.ads = data.chartAds || {
          pending: [],
          approved: [],
          permanentRejected: [],
          softRejected: []
        }
      } else if (type === 'user') {
        state.graphStats.user = data.chartUser || []
      } else if (type === 'seller') {
        state.graphStats.seller = data.chartSeller || []
      }
    })
    builder.addCase(getDashboardGraphStats.rejected, (state, action) => {
      const { type } = action.meta.arg
      state.loading.graphStats[type] = false
    })

    // Recent Users
    builder.addCase(getRecentUsers.pending, state => {
      state.loading.recentUsers = true
    })
    builder.addCase(getRecentUsers.fulfilled, (state, action) => {
      state.loading.recentUsers = false
      state.recentUsers = action.payload
    })
    builder.addCase(getRecentUsers.rejected, (state, action) => {
      state.loading.recentUsers = false
    })

    // Recent Ads
    builder.addCase(getRecentAds.pending, state => {
      state.loading.recentAds = true
    })
    builder.addCase(getRecentAds.fulfilled, (state, action) => {
      state.loading.recentAds = false
      state.recentAds = action.payload
    })
    builder.addCase(getRecentAds.rejected, (state, action) => {
      state.loading.recentAds = false
    })
  }
})

export const {} = dashboardSlice.actions

export default dashboardSlice.reducer
