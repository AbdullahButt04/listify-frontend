import axios from 'axios'
import { toast } from 'react-toastify'

import { baseURL } from '../../utils/config'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getAuthHeaders, getFormDataAuthHeaders } from '@/utils/commonfunctions'

const BASE_URL = baseURL

export const fetchpurchaseHistoryList = createAsyncThunk(
  'purchaseHistory/listPurchaseHistory',
  async (_, { getState }) => {
    const state = getState()
    const { purchaseHistoryPage, purchaseHistoryPageSize, startDate, endDate } = state.purchaseHistory

    const response = await axios.get(
      `${BASE_URL}api/admin/purchaseHistory/listPurchaseHistory?start=${purchaseHistoryPage}&limit=${purchaseHistoryPageSize}&startDate=${startDate}&endDate=${endDate}`,
      {
        headers: getAuthHeaders()
      }
    )
    return response.data
  }
)

const initialState = {
  purchaseHistory: [],
  initialLoading: false,
  loading: false,
  purchaseTotalAmount: 0,
  purchaseHistoryPage: 1,
  purchaseHistoryPageSize: 10,
  purchaseHistoryTotal: 0,
  startDate: 'All',
  endDate: 'All',

  error: null
}

const purchaseHistorySlice = createSlice({
  name: 'purchaseHistory',
  initialState,
  reducers: {
    setDateRange: (state, action) => {
      state.startDate = action.payload.startDate
      state.endDate = action.payload.endDate
    },
    setPage: (state, action) => {
      state.purchaseHistoryPage = action.payload
    },
    setPageSize: (state, action) => {
      state.purchaseHistoryPageSize = action.payload
    }
  },
  // extraReducers remains same, but update fetchpurchaseHistoryList fulfilled case:
  extraReducers: builder => {
    builder.addCase(fetchpurchaseHistoryList.pending, state => {
      state.initialLoading = true
    })
    builder.addCase(fetchpurchaseHistoryList.fulfilled, (state, action) => {
      state.initialLoading = false
      state.purchaseHistory = action.payload.data
      state.purchaseHistoryTotal = action.payload.total // backend se total count bhi lena hoga
      state.purchaseTotalAmount = action.payload.totalAmount
    })
    builder.addCase(fetchpurchaseHistoryList.rejected, (state, action) => {
      state.initialLoading = false
      state.error = action.payload
    })
  }
})

export const { setDateRange, setPage, setPageSize } = purchaseHistorySlice.actions
export default purchaseHistorySlice.reducer
