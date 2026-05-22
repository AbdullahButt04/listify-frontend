import axios from 'axios'
import { toast } from 'react-toastify'

import { baseURL } from '../../utils/config'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getAuthHeaders, getFormDataAuthHeaders } from '@/utils/commonfunctions'

const BASE_URL = baseURL

export const fetchBlogList = createAsyncThunk('blog/getAllBlogs', async ({ page, pageSize }, thunkAPI) => {
  try {
    const response = await axios.get(`${BASE_URL}api/admin/blog/getAllBlogs?start=${page}&limit=${pageSize}`, {
      headers: getAuthHeaders(),
      signal: thunkAPI.signal // ✅ let React/RTK cancel stale calls
    })
    return response.data || []
  } catch (error) {
    // If aborted, don't toast / reject with error
    if (axios.isCancel(error) || error?.name === 'CanceledError') {
      return thunkAPI.rejectWithValue({ aborted: true })
    }
    const errorMsg = error.response?.data?.message || error.message
    toast.error(errorMsg)
    return thunkAPI.rejectWithValue(errorMsg)
  }
})

export const createBlog = createAsyncThunk('blog/createBlog', async (formData, thunkAPI) => {
  try {
    const response = await axios.post(`${BASE_URL}api/admin/blog/createBlog`, formData, {
      headers: {
        ...getFormDataAuthHeaders(),
        'Content-Type': 'multipart/form-data'
      }
    })
    toast.success(response.data.message)

    return response.data.data
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message

    toast.error(errorMsg)

    return thunkAPI.rejectWithValue(errorMsg)
  }
})

export const updateBlog = createAsyncThunk('blog/updateBlog', async (formData, thunkAPI) => {
  try {
    const response = await axios.patch(`${BASE_URL}api/admin/blog/updateBlog`, formData, {
      headers: {
        ...getFormDataAuthHeaders(),
        'Content-Type': 'multipart/form-data'
      }
    })

    toast.success(response.data.message || 'Blog updated successfully')

    return response.data.data
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message

    toast.error(errorMsg)

    return thunkAPI.rejectWithValue(errorMsg)
  }
})

// Delete blog
export const removeBlog = createAsyncThunk('blog/deleteBlog', async (blogId, thunkAPI) => {
  try {
    const response = await axios.delete(`${BASE_URL}api/admin/blog/deleteBlog?blogId=${blogId}`, {
      headers: getAuthHeaders()
    })

    toast.success(response.data.message || 'Banner deleted successfully')

    return { blogId }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message

    toast.error(errorMsg)

    return thunkAPI.rejectWithValue(errorMsg)
  }
})

export const updateBlogTrending = createAsyncThunk('blog/toggleBlogTrendingStatus', async (blogId, thunkAPI) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}api/admin/blog/toggleBlogTrendingStatus?blogId=${blogId}`,
      {},
      {
        headers: getAuthHeaders()
      }
    )

    toast.success(response.data.message || 'Blog Trending successfully')

    return { blogId }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message

    toast.error(errorMsg)

    return thunkAPI.rejectWithValue(errorMsg)
  }
})

const initialState = {
  blog: [],
  loading: false,
  initialLoading: true,
  page: 1,
  pageSize: 10,
  total: 0,
  error: null,
  currentRequestId: null
}

const blogSlice = createSlice({
  name: 'blog',
  initialState,
  reducers: {
    setPage: (state, action) => {
      state.page = action.payload
    },
    setPageSize: (state, action) => {
      state.pageSize = action.payload
      state.page = 1
    },
    setPagination: (state, action) => {
      const { page, pageSize } = action.payload
      state.page = page
      state.pageSize = pageSize
    }
  },
  extraReducers: builder => {
    builder

      // Fetch banners
      .addCase(fetchBlogList.pending, (state, action) => {
        // only set loading if no request is in-flight
        if (!state.loading) {
          state.loading = true
          state.initialLoading = state.initialLoading // keep as is
          state.error = null
          state.currentRequestId = action.meta.requestId
        }
      })
      .addCase(fetchBlogList.fulfilled, (state, action) => {
        // only accept latest
        if (state.currentRequestId !== action.meta.requestId) return
        state.initialLoading = false
        state.loading = false
        state.blog = action.payload.data
        state.total = action.payload.total
        state.error = null
        state.currentRequestId = null
      })
      .addCase(fetchBlogList.rejected, (state, action) => {
        // ignore aborted or old requests
        if (state.currentRequestId !== action.meta.requestId) return
        state.initialLoading = false
        state.loading = false
        if (!(action.payload && action.payload.aborted)) {
          state.error = action.payload
        }
        state.currentRequestId = null
      })

      // Create Blogs
      .addCase(createBlog.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(createBlog.fulfilled, (state, action) => {
        state.loading = false
        state.blog.unshift(action.payload)
        state.error = null
      })
      .addCase(createBlog.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Update blog
      .addCase(updateBlog.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(updateBlog.fulfilled, (state, action) => {
        state.loading = false
        const index = state.blog.findIndex(blog => blog._id === action.payload._id)

        if (index !== -1) {
          state.blog[index] = action.payload
        }

        state.error = null
      })
      .addCase(updateBlog.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Delete blog
      .addCase(removeBlog.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(removeBlog.fulfilled, (state, action) => {
        state.loading = false
        state.blog = state.blog.filter(blog => blog._id !== action.payload.blogId)
        state.error = null
      })
      .addCase(removeBlog.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Toggle active status
      .addCase(updateBlogTrending.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(updateBlogTrending.fulfilled, (state, action) => {
        state.loading = false
        const blog = state.blog.find(blog => blog._id === action.payload.blogId)

        if (blog) {
          blog.trending = !blog.trending
        }

        state.error = null
      })
      .addCase(updateBlogTrending.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export const { setPage, setPageSize, setPagination } = blogSlice.actions
export default blogSlice.reducer
