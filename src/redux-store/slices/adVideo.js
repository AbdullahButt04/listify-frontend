import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '@/utils/apiService'
import { toast } from 'react-toastify'

export const fetchAllAdVideos = createAsyncThunk(
  'adVideo/retrieveAdVideos',
  async ({ page, pageSize, adId, userId }, { rejectWithValue }) => {
    try {
      const response = await api.get('api/admin/adVideo/retrieveAdVideos', {
        params: {
          start: page,
          limit: pageSize,
          ...(adId !== 'ALL' && { adId }),
          ...(userId !== 'ALL' && { userId })
        }
      })
      return response.data
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || 'Failed to fetch categories')
    }
  }
)

export const fetchAllAds = createAsyncThunk('adListing/listAdListings', async (seller, { rejectWithValue }) => {
  try {
    const response = await api.get(`api/admin/adListing/listAdListings?seller=${seller}`)
    return response.data
  } catch (error) {
    return rejectWithValue(error?.response?.data?.message || 'Failed to fetch categories')
  }
})

export const fetchAllUsers = createAsyncThunk('user/retrieveUserList', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get(`api/admin/user/retrieveUserList?isSeller=${true}`)
    return response.data
  } catch (error) {
    return rejectWithValue(error?.response?.data?.message || 'Failed to fetch categories')
  }
})

export const createAdVideo = createAsyncThunk('api/admin/adVideo/addAdVideo', async (payload, { rejectWithValue }) => {
  try {
    const res = await api.post('api/admin/adVideo/addAdVideo', payload, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    return res.data
  } catch (e) {
    throw rejectWithValue(e.response.data.message)
  }
})

export const editAdVideo = createAsyncThunk('adVideo/modifyAdVideo', async (payload, { rejectWithValue }) => {
  try {
    const res = await api.patch('api/admin/adVideo/modifyAdVideo', payload, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    return res.data
  } catch (e) {
    throw rejectWithValue(e.response.data.message)
  }
})

export const deleteAdVideo = createAsyncThunk('adVideo/discardAdVideo', async (payload, { rejectWithValue }) => {
  try {
    const res = await api.delete(`api/admin/adVideo/discardAdVideo?adVideoId=${payload}`)

    return res.data
  } catch (e) {
    throw rejectWithValue(e.response.data.message)
  }
})

export const fetchAllAdsForFilter = createAsyncThunk(
  'api/admin/adListing/listAdListings',
  async (seller, { rejectWithValue }) => {
    try {
      const response = await api.get(`api/admin/adListing/listAdListings`)
      return response.data
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || 'Failed to fetch categories')
    }
  }
)

export const fetchAllUsersForFilter = createAsyncThunk(
  'api/admin/user/retrieveUserList',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`api/admin/user/retrieveUserList?isSeller=${true}`)
      return response.data
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || 'Failed to fetch categories')
    }
  }
)

const initialState = {
  adVideos: [],
  allAds: [],
  allUsers: [],
  allAdsForFilter: [],
  allUsersForFilter: [],
  initialLoading: true,
  loading: false,
  page: 1,
  pageSize: 10,
  total: 0,
  error: null
}

const adVideoSlice = createSlice({
  name: 'adVideos',
  initialState,
  reducers: {
    setPage: (state, action) => {
      state.page = action.payload
    },
    setPageSize: (state, action) => {
      state.pageSize = action.payload
      state.page = 1
    }
  },
  extraReducers: builder => {
    // ad videos
    builder.addCase(fetchAllAdVideos.pending, state => {
      state.initialLoading = true
      state.error = null
    })
    builder.addCase(fetchAllAdVideos.fulfilled, (state, action) => {
      state.initialLoading = false
      state.adVideos = action.payload.data
      state.total = action.payload.total
      state.error = null
    })
    builder
      .addCase(fetchAllAdVideos.rejected, (state, action) => {
        state.initialLoading = false
        state.error = action.payload.message
      })

      // all ads
      .addCase(fetchAllAds.pending, state => {
        state.loading = true
      })
      .addCase(fetchAllAds.fulfilled, (state, action) => {
        state.loading = false
        state.allAds = action.payload.data
      })
      .addCase(fetchAllAds.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload.message
      })

      // all users
      .addCase(fetchAllUsers.pending, state => {
        state.loading = true
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.loading = false
        state.allUsers = action.payload.data
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload.message
      })

      // create ad video
      .addCase(createAdVideo.pending, state => {
        state.loading = true
      })
      .addCase(createAdVideo.fulfilled, (state, action) => {
        state.loading = false
        if (action.payload.status) {
          toast.success(action.payload.message)
        } else {
          toast.error(action.payload.message)
        }
      })
      .addCase(createAdVideo.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error(action.payload.message)
      })

      // edit ad video
      .addCase(editAdVideo.pending, state => {
        state.loading = true
      })
      .addCase(editAdVideo.fulfilled, (state, action) => {
        state.loading = false
        if (action.payload.status) {
          toast.success(action.payload.message)
        } else {
          toast.error(action.payload.message)
        }
      })

      .addCase(editAdVideo.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error(action.payload.message)
      })

      // delete advideo
      .addCase(deleteAdVideo.pending, state => {
        state.loading = true
      })
      .addCase(deleteAdVideo.fulfilled, (state, action) => {
        state.loading = false
        if (action.payload.status) {
          state.adVideos = state.adVideos.filter(a => a._id !== action.meta.arg)
          state.total -= 1
          toast.success(action.payload.message)
        } else {
          toast.error(action.payload.message)
        }
      })
      .addCase(deleteAdVideo.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload.message
        toast.error(action.payload.message)
      })

      // all ads for filter
      .addCase(fetchAllAdsForFilter.pending, state => {
        state.loading = true
      })
      .addCase(fetchAllAdsForFilter.fulfilled, (state, action) => {
        state.loading = false
        state.allAdsForFilter = action.payload.data
      })
      .addCase(fetchAllAdsForFilter.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload.message
      })

      // all users for filter
      .addCase(fetchAllUsersForFilter.pending, state => {
        state.loading = true
      })
      .addCase(fetchAllUsersForFilter.fulfilled, (state, action) => {
        state.loading = false
        state.allUsersForFilter = action.payload.data
      })
      .addCase(fetchAllUsersForFilter.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload.message
      })
  }
})

export const { setPage, setPageSize } = adVideoSlice.actions
export default adVideoSlice.reducer
