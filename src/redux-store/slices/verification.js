import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { VERIFICATION_STATUS } from '@/utils/constants'
import api from '@/utils/apiService'
import { toast } from 'react-toastify'

// Async thunks
export const fetchVerifications = createAsyncThunk(
  'verification/fetchVerifications',
  async ({ status, page, limit, startDate, endDate }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `api/admin/verification/getVerifications?status=${status}&start=${page}&limit=${limit}&startDate=${startDate}&endDate=${endDate}`
      )
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch verifications' })
    }
  }
)

export const approveVerification = createAsyncThunk(
  'verification/approveVerification',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.patch(`api/admin/verification/approveVerification?id=${id}`)
      return { id, data: response.data }
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to approve verification' })
    }
  }
)

export const rejectVerification = createAsyncThunk(
  'verification/rejectVerification',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`api/admin/verification/rejectVerification?id=${id}&reason=${reason}`)
      return { id, data: response.data }
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to reject verification' })
    }
  }
)

const initialState = {
  verifications: {
    [VERIFICATION_STATUS.PENDING]: [],
    [VERIFICATION_STATUS.ACCEPTED]: [],
    [VERIFICATION_STATUS.DECLINED]: []
  },
  currentStatus: VERIFICATION_STATUS.PENDING,
  loading: false,
  error: null,
  page: 1,
  pageSize: 10,
  total: 0,
  startDate: 'All',
  endDate: 'All'
}

const verificationSlice = createSlice({
  name: 'verification',
  initialState,
  reducers: {
    setCurrentStatus: (state, action) => {
      state.currentStatus = action.payload
    },
    setPage: (state, action) => {
      state.page = action.payload
    },
    setPageSize: (state, action) => {
      state.pageSize = action.payload
    },
    setDateRange: (state, action) => {
      state.startDate = action.payload.startDate
      state.endDate = action.payload.endDate
      state.page = 1
    }
  },
  extraReducers: builder => {
    builder
      // Fetch Verifications
      .addCase(fetchVerifications.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchVerifications.fulfilled, (state, action) => {
        state.loading = false
        state.verifications[state.currentStatus] = action.payload.data
        state.total = action.payload.total
      })
      .addCase(fetchVerifications.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload?.message || 'Failed to fetch verifications'
      })

      // Approve Verification
      .addCase(approveVerification.pending, state => {
        state.error = null
      })
      .addCase(approveVerification.fulfilled, (state, action) => {
        // Remove the approved verification from pending list
        if (action.payload?.data?.status) {
          state.verifications[VERIFICATION_STATUS.PENDING] = state.verifications[VERIFICATION_STATUS.PENDING].filter(
            item => item._id !== action.payload.id
          )
          // Update total count
          if (state.currentStatus === VERIFICATION_STATUS.PENDING) {
            state.total -= 1
          }
          toast(action.payload?.data?.message)
        } else {
          toast.error(action.payload?.data?.message)
        }
      })
      .addCase(approveVerification.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to approve verification'
        toast.error(action.payload.message)
      })

      // Reject Verification
      .addCase(rejectVerification.pending, state => {
        state.error = null
      })
      .addCase(rejectVerification.fulfilled, (state, action) => {
        // Remove the rejected verification from pending list
        if (action.payload?.data?.status) {
          state.verifications[VERIFICATION_STATUS.PENDING] = state.verifications[VERIFICATION_STATUS.PENDING].filter(
            item => item._id !== action.payload.id
          )
          // Update total count
          if (state.currentStatus === VERIFICATION_STATUS.PENDING) {
            state.total -= 1
          }

          toast(action.payload?.data?.message)
        } else {
          toast.error(action.payload?.data?.message)
        }
      })
      .addCase(rejectVerification.rejected, (state, action) => {
        state.error = action.payload?.message || 'Failed to reject verification'
        toast.error(action.payload.message)
      })
  }
})

export const { setCurrentStatus, setPage, setPageSize, setDateRange } = verificationSlice.actions

export default verificationSlice.reducer
