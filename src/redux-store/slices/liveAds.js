import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/utils/apiService'
import { toast } from 'react-toastify'

export const fetchLiveAds = createAsyncThunk(
  'liveAds/fetchLiveAds',
  async ({ page, pageSize, sellerId, type, country, city }) => {
    const response = await api.get(
      `api/admin/adListing/getAllAdListings?start=${page}&limit=${pageSize}${sellerId ? `&sellerId=${sellerId}` : ''}&type=${type}${country ? `&country=${country}` : ''}${city ? `&city=${city}` : ''}`
    )
    return response.data
  }
)

export const toggleActiveStatus = createAsyncThunk('liveAds/toggleActiveStatus', async adId => {
  const response = await api.patch(`api/admin/adListing/toggleAdListingStatus?adId=${adId}`)
  return response.data
})

export const changeStatus = createAsyncThunk('liveAds/changeStatus', async ({ adId, status, note }) => {
  const response = await api.patch(
    `api/admin/adListing/updateAdListingStatus?adId=${adId}&status=${status}${note ? `&note=${note}` : ''}`
  )
  return response.data
})

export const removeAd = createAsyncThunk('adListing/deleteAdListing', async (adId, thunkAPI) => {
  try {
    const response = await api.delete(`api/admin/adListing/deleteAdListing?adId=${adId}`)
    toast.success(response.data.message || 'Live Ad deleted successfully')
    return { adId }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message
    toast.error(errorMsg)
    return thunkAPI.rejectWithValue(errorMsg)
  }
})

// Update Live Ads
export const updateLiveAd = createAsyncThunk('adListing/modifyAdListing', async (formData, thunkAPI) => {
  try {
    const res = await api.patch('api/admin/adListing/modifyAdListing', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    return res.data
  } catch (err) {
    return thunkAPI.rejectWithValue(err?.response?.data || { message: 'Create failed' })
  }
})

export const getAuctionBids = createAsyncThunk(
  'auctionBid/fetchBidsByAd',
  async ({ adId, start, limit }, { rejectWithValue }) => {
    try {
      const res = await api.get('api/admin/auctionBid/fetchBidsByAd', {
        params: {
          start,
          limit,
          adId
        }
      })

      return res.data
    } catch (error) {
      throw rejectWithValue(error.response.data)
    }
  }
)

export const getAllCountry = createAsyncThunk('country/fetchCountries', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('api/admin/country/fetchCountries')

    return res.data
  } catch (error) {
    throw rejectWithValue(error?.response?.data || 'Failed to fetch country')
  }
})

export const getAllCity = createAsyncThunk('city/fetchCities', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('api/admin/city/fetchCities')

    return res.data
  } catch (error) {
    throw rejectWithValue(error?.response?.data || 'Failed to fetch city')
  }
})

const initialState = {
  liveAds: [],
  adBids: [],
  bidsLoading: false,
  loading: false,
  initialLoading: true,
  error: null,
  total: 0,
  page: 1,
  pageSize: 10,
  countriesForFilter: [],
  citiesForFilter: []
}

const liveAdsSlice = createSlice({
  name: 'liveAds',
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
    builder.addCase(fetchLiveAds.pending, state => {
      state.initialLoading = true
    })
    builder.addCase(fetchLiveAds.fulfilled, (state, action) => {
      state.initialLoading = false
      if (action.payload?.status) {
        state.liveAds = action.payload.data
        state.total = action.payload.total || 0
      } else {
        toast.error(action.payload?.message || 'Failed to fetch Live Ads')
      }
    })
    builder.addCase(fetchLiveAds.rejected, (state, action) => {
      state.initialLoading = false
      state.error = action.payload
      toast.error(action.payload || 'Failed to fetch Live Ads')
    })

    // toggle active status
    builder.addCase(toggleActiveStatus.pending, state => {
      state.loading = true
    })
    builder.addCase(toggleActiveStatus.fulfilled, (state, action) => {
      state.loading = false
      if (action.payload?.status) {
        const updatedAd = action.payload.data
        const index = state.liveAds.findIndex(ad => ad._id === updatedAd._id)
        if (index !== -1) {
          state.liveAds[index].isActive = !state.liveAds[index].isActive
        }
        toast.success(action.payload?.message || 'Ad status updated successfully')
      } else {
        toast.error(action.payload?.message || 'Failed to update Ad status')
      }
    })
    builder.addCase(toggleActiveStatus.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload
      toast.error(action.payload || 'Failed to update Ad status')
    })

    // change status
    builder.addCase(changeStatus.pending, state => {
      state.loading = true
    })
    builder.addCase(changeStatus.fulfilled, (state, action) => {
      state.loading = false
      if (action.payload?.status) {
        const updatedAd = action.meta.arg.adId
        state.liveAds = state.liveAds.filter(ad => ad._id !== updatedAd)
        toast.success(action.payload?.message || 'Ad status changed successfully')
      } else {
        toast.error(action.payload?.message || 'Failed to change Ad status')
      }
    })
    builder
      .addCase(changeStatus.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error(action.payload || 'Failed to change Ad status')
      })

      // Delete Ad
      .addCase(removeAd.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(removeAd.fulfilled, (state, action) => {
        state.loading = false
        state.liveAds = state.liveAds.filter(liveAd => liveAd._id !== action.payload.adId)
        state.error = null
      })
      .addCase(removeAd.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // UPDATE LIVE AD
    builder.addCase(updateLiveAd.pending, state => {
      state.loading = true
    })
    builder.addCase(updateLiveAd.fulfilled, (state, action) => {
      state.loading = false
      if (action.payload?.status) {
        state.liveAds = state.liveAds.map(liveAd =>
          liveAd._id === action.payload?.data._id ? action.payload?.data : liveAd
        )
        toast.success(action.payload?.message || 'Ad updated successfully')
      } else {
        toast.error(action.payload?.message || 'Failed to update Ad')
      }
      state.error = null
    })
    builder.addCase(updateLiveAd.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload
    })

    // auction bid data
    builder.addCase(getAuctionBids.pending, state => {
      state.bidsLoading = true
    })
    builder.addCase(getAuctionBids.fulfilled, (state, action) => {
      state.bidsLoading = false
      state.adBids = action.payload.data
      state.total = action.payload.total
    })
    builder.addCase(getAuctionBids.rejected, (state, action) => {
      state.bidsLoading = false
    })

    // dropdown country
    builder.addCase(getAllCountry.fulfilled, (state, action) => {
      state.countriesForFilter = action.payload.data
    })

    // dropdown city
    builder.addCase(getAllCity.fulfilled, (state, action) => {
      state.citiesForFilter = action.payload.data
    })
  }
})

export default liveAdsSlice.reducer
export const { setPage, setPageSize } = liveAdsSlice.actions
