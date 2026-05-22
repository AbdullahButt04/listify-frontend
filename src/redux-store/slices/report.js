import axios from 'axios'
import { toast } from 'react-toastify'
import { baseURL } from '../../utils/config'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getAuthHeaders, getFormDataAuthHeaders } from '@/utils/commonfunctions'

const BASE_URL = baseURL

export const getReportByStatus = createAsyncThunk(
  'report/getReportsByStatus',
  async ({ status, reportType, start, limit, startDate, endDate }, thunkAPI) => {
    const response = await axios.get(
      `${BASE_URL}api/admin/report/getReportsByStatus?status=${status}&start=${start}&limit=${limit}&startDate=${startDate}&endDate=${endDate}&reportType=${reportType}`,
      {
        headers: getAuthHeaders()
      }
    )
    return response.data
  }
)

export const solveReport = createAsyncThunk('report/solveReport', async (reportId, thunkAPI) => {
  const response = await axios.patch(
    `${BASE_URL}api/admin/report/solveReport?reportId=${reportId}`,
    {},
    {
      headers: getAuthHeaders()
    }
  )
  toast.success(response.data.message || 'Report solved successfully')

  return reportId
})

export const deleteReport = createAsyncThunk('report/deleteReport', async (reportId, thunkAPI) => {
  const response = await axios.delete(`${BASE_URL}api/admin/report/deleteReport?reportId=${reportId}`, {
    headers: getAuthHeaders()
  })
  toast.success(response.data.message || 'Report deleted successfully')

  return reportId
})

const initialState = {
  reports: [],
  initialLoading: false,
  loading: false,
  error: null,
  reportPage: 1,
  reportPageSize: 10,
  reportTotal: 0,
  startDate: 'All',
  endDate: 'All' 
}

const reportSlice = createSlice({
  name: 'report',
  initialState,
  reducers: {
    setDateRange: (state, action) => {
      state.startDate = action.payload.startDate
      state.endDate = action.payload.endDate
      state.reportPage = 1 
    },
    setReportPage: (state, action) => {
      state.reportPage = action.payload
    },
    setReportPageSize: (state, action) => {
      state.reportPageSize = action.payload
    }
  },
  extraReducers: builder => {
    builder.addCase(getReportByStatus.pending, (state, action) => {
      state.initialLoading = true
    })
    builder.addCase(getReportByStatus.fulfilled, (state, action) => {
      state.initialLoading = false
      state.reports = action.payload.data
      state.reportTotal = action.payload.total
    })
    builder.addCase(getReportByStatus.rejected, (state, action) => {
      state.initialLoading = false
      state.error = action.payload
      toast.error(action.payload)
    })

    // Solve Report
    builder.addCase(solveReport.pending, state => {
      state.loading = true
      state.error = null
    })
    builder.addCase(solveReport.fulfilled, (state, action) => {
      state.loading = false
      state.reports = state.reports.map(report => report._id !== action.payload)
      state.error = null
    })
    builder.addCase(solveReport.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload
    })

    // Delete Report
    builder.addCase(deleteReport.pending, state => {
      state.loading = true
      state.error = null
    })
    builder.addCase(deleteReport.fulfilled, (state, action) => {
      state.loading = false
      state.reports = state.reports.filter(report => report._id !== action.payload)
      state.reportTotal = Math.max(0, state.reportTotal - 1)
      state.error = null
    })
    builder.addCase(deleteReport.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload
    })
  }
})

export const { setDateRange, setReportPage, setReportPageSize } = reportSlice.actions
export default reportSlice.reducer
