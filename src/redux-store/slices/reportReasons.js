import axios from 'axios'
import { toast } from 'react-toastify'

import { baseURL } from '../../utils/config'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getAuthHeaders } from '@/utils/commonfunctions'

const BASE_URL = baseURL

export const fetchReportReasons = createAsyncThunk('reportReason/getReportReasons', async () => {
    const response = await axios.get(`${BASE_URL}api/admin/reportReason/getReportReasons`, {
        headers: getAuthHeaders()
    })


    return response.data
})

export const createReportReason = createAsyncThunk('reportReason/createReportReason', async reason => {

    const response = await axios.post(
        `${BASE_URL}api/admin/reportReason/createReportReason?title=${reason}`,
        {},
        { headers: getAuthHeaders() }
    )

    return response.data
})

export const updateReportReason = createAsyncThunk('reportReason/updateReportReason', async reason => {
    const response = await axios.patch(`${BASE_URL}api/admin/reportReason/updateReportReason?title=${reason.title}&reportReasonId=${reason.reportReasonId}`,
        {},
        {
            headers: getAuthHeaders()
        })
    return response.data
})

export const deleteReportReason = createAsyncThunk('reportReason/deleteReportReason', async reportReasonId => {
    
    const response = await axios.delete(
        `${BASE_URL}api/admin/reportReason/deleteReportReason?reportReasonId=${reportReasonId}`,
        {
            headers: getAuthHeaders()
        }
    )
    
    return response.data
})

const initialState = {
    reportReasons: [],
    initialLoading: false,
    loading: false,
    error: null
}

const reportReasonsSlice = createSlice({
    name: 'reportReasons',
    initialState,
    reducers: {
        clearReportReasonStatus: state => {
            state.error = null
            state.loading = false
        }
    },
    extraReducers: builder => {
        builder.addCase(fetchReportReasons.pending, state => {
            state.initialLoading = true
        })
        builder.addCase(fetchReportReasons.fulfilled, (state, action) => {

            state.initialLoading = false
            state.reportReasons = action.payload.data
        })
        builder.addCase(fetchReportReasons.rejected, (state, action) => {
            state.initialLoading = false
            state.error = action.payload
            toast.error(action.payload || 'Failed to fetch report reasons')
        })

        // Create report reason
        builder.addCase(createReportReason.pending, state => {
            state.loading = true
        })
        builder.addCase(createReportReason.fulfilled, (state, action) => {

            state.loading = false
            state.reportReasons.unshift(action.payload.data)
            toast.success('Report reason created successfully')
        })
        builder.addCase(createReportReason.rejected, (state, action) => {
            state.loading = false
            state.error = action.payload
            toast.error(action.payload || 'Failed to create report reason')
        })

        // Update report reason
        builder.addCase(updateReportReason.pending, state => {
            state.loading = true
        })
        builder.addCase(updateReportReason.fulfilled, (state, action) => {

            state.loading = false
            state.reportReasons = state.reportReasons.map(reason =>
                reason._id === action.payload.data._id ? action.payload.data : reason
            )
            toast.success('Report reason updated successfully')
        })
        builder.addCase(updateReportReason.rejected, (state, action) => {
            state.loading = false
            state.error = action.payload
            toast.error(action.payload || 'Failed to update report reason')
        })

        // Delete report reason
        builder.addCase(deleteReportReason.pending, state => {
            state.loading = true
        })
        builder.addCase(deleteReportReason.fulfilled, (state, action) => {
            
            state.loading = false
            state.reportReasons = state.reportReasons.filter(reason => reason._id !== action.payload.data._id)
            toast.success('Report reason deleted successfully')
        })
        builder.addCase(deleteReportReason.rejected, (state, action) => {
            state.loading = false
            state.error = action.payload
            toast.error(action.payload || 'Failed to delete report reason')
        })

    }
})


export const { clearReportReasonStatus } = reportReasonsSlice.actions
export default reportReasonsSlice.reducer
