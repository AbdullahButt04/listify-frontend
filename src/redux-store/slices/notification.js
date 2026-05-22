import { toast } from 'react-toastify'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import apiService from '@/utils/apiService'


export const getAllNotification = createAsyncThunk('notification/getAllNotifications', async ({ page, pageSize }, thunkAPI) => {
    try {
        const response = await apiService.get(`api/admin/notification/getAllNotifications?start=${page}&limit=${pageSize}`)
        return response.data
    } catch (error) {
        const errorMsg = error.response?.data?.message || error.message
        toast.error(errorMsg)
        return thunkAPI.rejectWithValue(errorMsg)
    }
})

// Delete 
export const deletenotification = createAsyncThunk('notification/deleteNotification', async (notificationId, thunkAPI) => {
    try {
        const response = await apiService.delete(`api/admin/notification/deleteNotification?id=${notificationId}`)
        return { id: notificationId, ...(response.data || {}) }
    } catch (error) {
        const errorMsg = error.response?.data?.message || error.message
        toast.error(errorMsg)
        return thunkAPI.rejectWithValue(errorMsg)
    }
})

// Get users for Notification
export const fetchUserList = createAsyncThunk('user/retrieveUserList', async (_, thunkAPI) => {
    try {
        const response = await apiService.get(`api/admin/user/retrieveUserList`)
        return response.data
    } catch (error) {
        const errorMsg = error.response?.data?.message || error.message
        toast.error(errorMsg)
        return thunkAPI.rejectWithValue(errorMsg)
    }
})

// Get Ads for Notification
export const fetchAdList = createAsyncThunk('adListing/listAdListings', async (_, thunkAPI) => {
    try {
        const response = await apiService.get(`api/admin/adListing/listAdListings`)
        return response.data
    } catch (error) {
        const errorMsg = error.response?.data?.message || error.message
        toast.error(errorMsg)
        return thunkAPI.rejectWithValue(errorMsg)
    }
})

export const createNotification = createAsyncThunk(
    'notification/broadcastAdminNotification',
    async (formData, thunkAPI) => {
        try {
            const res = await apiService.post(
                'api/admin/notification/broadcastAdminNotification',
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            )
            if (res.data?.status === true) {
                // Get current page and pageSize from state
                const state = thunkAPI.getState()
                const { page, pageSize } = state.notification
                thunkAPI.dispatch(getAllNotification({ page, pageSize }))
            }
            return res.data
        } catch (err) {
            return thunkAPI.rejectWithValue(
                err?.response?.data || { message: 'Create failed' }
            )
        }
    }
)

const initialState = {
    notifications: [],
    usersListNotif: [],
    adsListNotif: [],
    initialLoading: true,
    loading: false,
    error: null,
    total: 0,
    page: 1,
    pageSize: 10
}

const notificationSlice = createSlice({
    name: 'notification',
    initialState,
    reducers: {
        setPage: (state, action) => {
            state.page = action.payload
        },
        setPageSize: (state, action) => {
            state.pageSize = action.payload
        },
    },
    extraReducers: (builder) => {
        builder.addCase(getAllNotification.pending, (state, action) => {
            state.loading = true
        })
        builder.addCase(getAllNotification.fulfilled, (state, action) => {
            state.loading = false
            state.initialLoading = false
            state.notifications = action.payload.data
            state.total = action.payload.totalCount
        })
        builder.addCase(getAllNotification.rejected, (state, action) => {
            state.loading = false
            state.initialLoading = false
            state.error = action.payload
        })

        // Delete tip
        builder.addCase(deletenotification.pending, state => {
            state.loading = true
            state.error = null
        })
        builder.addCase(deletenotification.fulfilled, (state, action) => {

            state.loading = false
            const id = action.payload?.id
            if (id) {
                state.notifications = state.notifications.filter(n => n._id !== id)
                state.total = Math.max(0, state.total - 1)
            }
            if (action.payload.status) {
                toast.success(action.payload.message || 'Notification deleted successfully')
            } else {
                toast.error(action.payload.message || 'Failed to delete Notification')
            }
        })
        builder.addCase(deletenotification.rejected, (state, action) => {
            state.loading = false
            state.error = action.payload
        })

        // get users for notification
        builder.addCase(fetchUserList.pending, (state, action) => {
            state.loading = true
        })
        builder.addCase(fetchUserList.fulfilled, (state, action) => {
            state.loading = false
            state.initialLoading = false
            state.usersListNotif = action.payload.data
        })
        builder.addCase(fetchUserList.rejected, (state, action) => {
            state.loading = false
            state.initialLoading = false
            state.error = action.payload
        })

        // get ads for notification
        builder.addCase(fetchAdList.pending, (state, action) => {
            state.loading = true
        })
        builder.addCase(fetchAdList.fulfilled, (state, action) => {
            state.loading = false
            state.initialLoading = false
            state.adsListNotif = action.payload.data
        })
        builder.addCase(fetchAdList.rejected, (state, action) => {
            state.loading = false
            state.initialLoading = false
            state.error = action.payload
        })

        // send Notifiaction (createNotification)
        builder.addCase(createNotification.pending, (state, action) => {
            state.loading = true
        })
        builder.addCase(createNotification.fulfilled, (state, action) => {
            state.loading = false
            state.initialLoading = false
            if (action.payload.status) {
                toast.success(action.payload.message || 'Notification sent successfully')
            } else {
                toast.error(action.payload.message || 'Failed to send Notification')
            }
        })
        builder.addCase(createNotification.rejected, (state, action) => {
            state.loading = false
            state.initialLoading = false
            state.error = action.payload
        })
    }
})

export const { setPage, setPageSize } = notificationSlice.actions
export default notificationSlice.reducer


