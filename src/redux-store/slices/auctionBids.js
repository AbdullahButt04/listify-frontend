import axios from 'axios'
import api from '@/utils/apiService'
import { toast } from 'react-toastify'
import { baseURL } from '../../utils/config'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import apiService from '@/utils/apiService'

export const getUserBids = createAsyncThunk(
  'auctionBid/fetchUserBids',
  async ({ userId, page, pageSize }, thunkAPI) => {
    try {
      const response = await apiService.get(
        `api/admin/auctionBid/fetchUserBids?userId=${userId}&start=${page}&limit=${pageSize}`
      )

      return response.data
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message
      toast.error(errorMsg)
      return thunkAPI.rejectWithValue(errorMsg)
    }
  }
)

export const getSellerBids = createAsyncThunk(
  'auctionBid/fetchSellerAuctionBids',
  async ({ userId, page, pageSize }, thunkAPI) => {
    try {
      const response = await apiService.get(
        `api/admin/auctionBid/fetchSellerAuctionBids?sellerId=${userId}&start=${page}&limit=${pageSize}`
      )

      return response.data
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message
      toast.error(errorMsg)
      return thunkAPI.rejectWithValue(errorMsg)
    }
  }
)

const initialState = {
  userBids: [],
  sellerBids: [],
  initialLoading: false,
  loading: false,
  error: null,
  page: 1,
  pageSize: 10,
  total: 0,
  startDate: 'All',
  endDate: 'All'
}

const auctionBidSlice = createSlice({
  name: 'user',
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
    // GET USERS BIDS
    builder.addCase(getUserBids.pending, (state, action) => {
      state.loading = true
    })
    builder.addCase(getUserBids.fulfilled, (state, action) => {
      state.loading = false
      state.initialLoading = false
      state.userBids = action.payload.bids
      state.total = action.payload.total
    })
    builder.addCase(getUserBids.rejected, (state, action) => {
      state.loading = false
      state.initialLoading = false
      state.error = action.payload
    })

    // GET SELLERS BIDS
    builder.addCase(getSellerBids.pending, (state, action) => {
      state.loading = true
    })
    builder.addCase(getSellerBids.fulfilled, (state, action) => {
      state.loading = false
      state.initialLoading = false
      state.sellerBids = action.payload.bids
      state.total = action.payload.total
    })
    builder.addCase(getSellerBids.rejected, (state, action) => {
      state.loading = false
      state.initialLoading = false
      state.error = action.payload
    })
  }
})

export const { setUserDateRange, setPage, setPageSize } = auctionBidSlice.actions
export default auctionBidSlice.reducer
