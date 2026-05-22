import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '@/utils/apiService'
import { toast } from 'react-toastify'

export const fetchRoles = createAsyncThunk('role/getRoles', async ({ start, limit }) => {
  try {
    const res = await api.get('api/admin/role/getRoles', {
      params: {
        start: start,
        limit: limit
      }
    })
    return res.data
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data)
  }
})

export const createRole = createAsyncThunk('role/createRole', async payload => {
  try {
    const res = await api.post('api/admin/role/createRole', payload)

    return res.data
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data)
  }
})

// edit role
export const editRole = createAsyncThunk('role/updateRole', async payload => {
  try {
    const res = await api.patch('api/admin/role/updateRole', payload)

    return res.data
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data)
  }
})

// delete role
export const deleteRole = createAsyncThunk('role/deleteRole', async payload => {
  try {
    const res = await api.delete('api/admin/role/deleteRole', {
      params: {
        roleId: payload
      }
    })

    return res.data
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data)
  }
})

export const toggleActiveStatus = createAsyncThunk('role/updateRoleActiveState', async payload => {
  try {
    const res = await api.patch(`api/admin/role/updateRoleActiveState?roleId=${payload}`)

    return res.data
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data)
  }
})

const initialState = {
  role: [],
  total: 0,
  page: 1,
  pageSize: 10,
  initialLoading: true,
  loading: false,
  error: null
}

const roleSlice = createSlice({
  name: 'role',
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
      .addCase(fetchRoles.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.loading = false
        state.initialLoading = false
        state.role = action.payload.data || []
        state.total = action.payload.total
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.loading = false
        state.initialLoading = false
        state.error = action.payload || 'Failed to fetch roles'
      })

      // create role
      .addCase(createRole.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(createRole.fulfilled, (state, action) => {
        state.loading = false
        state.initialLoading = false
        if (action.payload.status) {
          state.role = [action.payload.data, ...state.role]
          toast.success(action.payload.message)
        } else {
          toast.error(action.payload.message)
        }
      })
      .addCase(createRole.rejected, (state, action) => {
        state.loading = false
        state.initialLoading = false
        state.error = action.payload || 'Failed to create role'
        toast.error(action.payload.message)
      })

      // edit role
      .addCase(editRole.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(editRole.fulfilled, (state, action) => {
        state.loading = false
        if (action.payload.status) {
          const updatedRole = action.payload.data

          const roleIndex = state.role.findIndex(role => role._id === updatedRole._id)
          if (roleIndex !== -1) {
            state.role[roleIndex] = updatedRole
          }

          toast.success(action.payload.message)
        } else {
          toast.error(action.payload.message)
        }
      })
      .addCase(editRole.rejected, (state, action) => {
        state.loading = false
        state.initialLoading = false
        state.error = action.payload
        toast.error(action.payload.message)
      })

      // toggle active status
      .addCase(toggleActiveStatus.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(toggleActiveStatus.fulfilled, (state, action) => {
        state.loading = false
        if (action.payload.status) {
          const roleId = action.meta.arg
          const roleIndex = state.role.findIndex(role => role._id === roleId)
          if (roleIndex !== -1) {
            state.role[roleIndex].isActive = !state.role[roleIndex].isActive
          }
          toast.success(action.payload.message)
        } else {
          toast.error(action.payload.message)
        }
      })

      // delete role
      .addCase(deleteRole.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteRole.fulfilled, (state, action) => {
        state.loading = false
        if (action.payload.status) {
          state.role = state.role.filter(i => i._id !== action.meta.arg)
          toast.success(action.payload.message)
        } else {
          toast.error(action.payload.message)
        }
      })
      .addCase(deleteRole.rejected, (state, action) => {
        state.loading = false
        state.initialLoading = false
        toast.error(action.payload.message)
      })
  }
})

export const { setPage, setPageSize } = roleSlice.actions
export default roleSlice.reducer
