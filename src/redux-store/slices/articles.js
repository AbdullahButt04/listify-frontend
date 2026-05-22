import { toast } from 'react-toastify'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import apiService from '@/utils/apiService'

export const getAllBlogs = createAsyncThunk('blog/getAllBlogs', async (payload, thunkAPI) => {
  try {
    const response = await apiService.get(`api/admin/blog/getAllBlogs?start=${payload.start}&limit=${payload.limit}`)

    return response.data
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message)
  }
})

const initialState = {
  initialLoading: true,
  loading: false,
  blogs: [],
  status: 'idle',
  error: null,
  total: 0
}

const articlesSlice = createSlice({
  name: 'blog',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder.addCase(getAllBlogs.pending, (state, action) => {
      state.loading = true
    })
    builder.addCase(getAllBlogs.fulfilled, (state, action) => {
      state.initialLoading = false

      if (action.payload.status) {
        state.blogs = action.payload.data
      } else {
        state.error = action.payload.message
        toast.error(action.payload.message)
      }
    })
    builder.addCase(getAllBlogs.rejected, (state, action) => {
      state.initialLoading = false
      state.error = action.payload
      toast.error(action.payload)
    })
  }
})

export default articlesSlice.reducer
