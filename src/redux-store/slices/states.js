import { toast } from 'react-toastify'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import apiService from '@/utils/apiService'


export const getAllStates = createAsyncThunk('state/getAllStates', async ({ page, pageSize }, thunkAPI) => {
  try {
    const response = await apiService.get(`api/admin/state/getAllStates?start=${page}&limit=${pageSize}`)

    // toast.success(response.data.message || 'States retrieved successfully')

    return response.data || []
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message

    toast.error(errorMsg)

    return thunkAPI.rejectWithValue(errorMsg)
  }
})

// DELETE STATE
export const removeState = createAsyncThunk('state/deleteState', async (stateId, thunkAPI) => {
  try {
    const response = await apiService.delete(`api/admin/state/deleteState?stateId=${stateId}`)
    toast.success(response.data.message || 'State deleted successfully')
    return { stateId }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message

    toast.error(errorMsg)

    return thunkAPI.rejectWithValue(errorMsg)
  }
})

// ADD STATE
export const addState = createAsyncThunk('state/createState', async (data, thunkAPI) => {
  try {
    const response = await apiService.post(`api/admin/state/createState`, data)
    if(response?.data?.data){
        toast.success(response.data.message || 'State, cities saved successfully')
    }
    return response.data
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message
    toast.error(errorMsg)
    return thunkAPI.rejectWithValue(errorMsg)
  }
})

// GET STATESLST WITHOUT PAGINATION

export const getAllStatesList = createAsyncThunk('state/fetchStates', async (_, thunkAPI) => {
  try {
    const response = await apiService.get(`api/admin/state/fetchStates`)
    return response.data || []
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message
    toast.error(errorMsg)
    return thunkAPI.rejectWithValue(errorMsg)
  }
})


const initialState = {
  states: [],
  statesList: [],
  initialLoading: true,
  loading: false,
  error: null,
  total: 0,
  page: 1,
  pageSize: 10,
}

const stateSlice = createSlice({
  name: 'states',
  initialState,
  reducers: {
    setPage: (state, action) => {
      state.page = action.payload
    },
    setPageSize: (state, action) => {
      state.pageSize = action.payload
    },
  },
  extraReducers: builder => {
    builder.addCase(getAllStates.pending, state => {
      state.initialLoading = true
      state.error = null
    })
    builder.addCase(getAllStates.fulfilled, (state, action) => {
      state.initialLoading = false
      state.states = action.payload.data
      state.total = action.payload.total
    })
    builder.addCase(getAllStates.rejected, (state, action) => {
      state.initialLoading = false
      state.error = action.payload
      toast.error(action.payload)
    })

    //DELETE STATE

    builder.addCase(removeState.pending, state => {
      state.loading = true
      state.error = null
    })
    builder.addCase(removeState.fulfilled, (state, action) => {
      state.loading = false
      state.states = state.states.filter(state => state._id !== action.payload.stateId)
      state.error = null
    })
    builder.addCase(removeState.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload
    })

    // ADD STATE

    builder.addCase(addState.pending, state => {
      state.loading = true
      state.error = null
    })
    
    builder.addCase(addState.fulfilled, (state, action) => {
      if (!action?.payload?.data) {
        toast.error(action.payload?.message)
        return;
      }
      state.loading = false
      state.states.unshift(action.payload.data)
      state.error = null
    })

    builder.addCase(addState.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload
    })

    // GET STATESLST WITHOUT PAGINATION

    builder.addCase(getAllStatesList.pending, state => {
      state.initialLoading = true
      state.error = null
    })
    builder.addCase(getAllStatesList.fulfilled, (state, action) => {
      
      state.initialLoading = false
      state.statesList = action.payload.data
    })
    builder.addCase(getAllStatesList.rejected, (state, action) => {
      state.initialLoading = false
      state.error = action.payload
      toast.error(action.payload)
    })



  }
})

export const { setPage, setPageSize } = stateSlice.actions
export default stateSlice.reducer
