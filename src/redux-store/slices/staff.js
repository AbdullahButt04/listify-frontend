import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '@/utils/apiService'
import { toast } from 'react-toastify'
import { deleteFirebaseUserByEmailPassword } from '@/utils/commonfunctions'

export const fetchStaff = createAsyncThunk('staff/getStaffList', async ({ start, limit }, { rejectWithValue }) => {
  try {
    const res = await api.get('api/admin/staff/getStaffList', {
      params: {
        start: start,
        limit: limit
      }
    })
    return res.data
  } catch (error) {
    return rejectWithValue(error.response.data)
  }
})

export const fetchAllRoles = createAsyncThunk('role/listAvailableRoles', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('api/admin/role/listAvailableRoles')

    return res.data
  } catch (error) {
    return rejectWithValue(error.response.data)
  }
})

export const createStaff = createAsyncThunk('staff/createStaff', async (payload, { rejectWithValue }) => {
  try {
    const res = await api.post('api/admin/staff/createStaff', payload)

    return res.data
  } catch (error) {
    throw rejectWithValue(error.response.data)
  }
})

export const updateStaff = createAsyncThunk('staff/updateStaff', async (payload, { rejectWithValue }) => {
  try {
    const res = await api.patch('api/admin/staff/updateStaff', payload)

    return res.data
  } catch (error) {
    throw rejectWithValue(error.response.data)
  }
})

export const toggleActiveStatus = createAsyncThunk('updateStaffActiveState', async (payload, { rejectWithValue }) => {
  try {
    const res = await api.patch(`api/admin/staff/updateStaffActiveState?staffId=${payload}`)

    return res.data
  } catch (error) {
    throw rejectWithValue(error.response.data)
  }
})

export const updatePassword = createAsyncThunk('staff/updatePassword', async (payload, { rejectWithValue }) => {
  try {
    const res = await api.patch('api/admin/staff/updateStaff', payload)

    return res.data
  } catch (error) {
    throw rejectWithValue(error.response.data)
  }
})

export const deleteStaff = createAsyncThunk('staff/deleteStaff', async (payload, { rejectWithValue }) => {
  try {
    const res = await api.delete(`api/admin/staff/deleteStaff?staffId=${payload}`)

    return res.data
  } catch (error) {
    throw rejectWithValue(error.response.data)
  }
})

const initialState = {
  staff: [],
  roles: [],
  total: 0,
  page: 1,
  pageSize: 10,
  initialLoading: true,
  loading: false,
  error: null
}

const staffSlice = createSlice({
  name: 'staff',
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
    builder
      .addCase(fetchStaff.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchStaff.fulfilled, (state, action) => {
        state.loading = false
        state.initialLoading = false
        state.staff = action.payload.data || []
        state.total = action.payload.total
      })
      .addCase(fetchStaff.rejected, (state, action) => {
        state.loading = false
        state.initialLoading = false
        state.error = action.payload || 'Failed to fetch staff'
      })

      // roles
      .addCase(fetchAllRoles.pending, state => {
        state.loading = true
      })
      .addCase(fetchAllRoles.fulfilled, (state, action) => {
        state.loading = false
        state.roles = action.payload.data
      })
      .addCase(fetchAllRoles.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to fetch staff'
      })

      // create staff
      .addCase(createStaff.pending, state => {
        state.loading = true
      })
      .addCase(createStaff.fulfilled, (state, action) => {
        state.loading = false
        if (action.payload.message === 'Staff created successfully.') {
          toast.success(action.payload.message)
        } else {
          toast.error(action.payload.message)
        }
      })
      .addCase(createStaff.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to create staff'
        toast.error(action.payload.message)

        deleteFirebaseUserByEmailPassword({
          email: action.meta.arg.email,
          password: action.meta.arg.password
        })
      })

      // update staff details
      .addCase(updateStaff.pending, state => {
        state.loading = true
      })
      .addCase(updateStaff.fulfilled, (state, action) => {
        if (action.payload.status) {
          toast.success(action.payload.message)
        } else {
          toast.error(action.payload.message)
        }
        state.loading = false
      })
      .addCase(updateStaff.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to update staff details'
        toast.error(action.payload.message)
      })

      // update staff password
      .addCase(updatePassword.pending, state => {
        state.loading = true
      })
      .addCase(updatePassword.fulfilled, (state, action) => {
        if (action.payload.status) {
          toast.success('Staff password updated successfully.')
        } else {
          toast.error(action.payload.message)
        }
        state.loading = false
      })
      .addCase(updatePassword.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'failed to update staff password'
        toast.error(action.payload.message)
      })

      // toggle active status
      .addCase(toggleActiveStatus.pending, state => {
        state.loading = true
      })
      .addCase(toggleActiveStatus.fulfilled, (state, action) => {
        if (action.payload.status) {
          toast.success(action.payload.message)
          const staffId = action.meta.arg
          const staffIndex = state.staff.findIndex(staff => staff._id === staffId)
          if (staffIndex !== -1) {
            state.staff[staffIndex].isActive = !state.staff[staffIndex].isActive
          }
        } else {
          toast.error(action.payload.message)
        }
        state.loading = false
      })
      .addCase(toggleActiveStatus.rejected, (state, action) => {
        state.loading = false
        toast.error(action.payload.message)
      })

      // delete staff
      .addCase(deleteStaff.pending, state => {
        state.loading = true
      })
      .addCase(deleteStaff.fulfilled, (state, action) => {
        state.loading = false
        if (action.payload.status) {
          toast.success(action.payload.message)
          state.staff = state.staff.filter(s => s._id !== action.meta.arg)
        } else {
          toast.error(action.payload.message)
        }
      })
      .addCase(deleteStaff.rejected, (state, action) => {
        state.loading = false
        toast.error(action.payload.message)
      })
  }
})

export const { setPage, setPageSize } = staffSlice.actions
export default staffSlice.reducer
