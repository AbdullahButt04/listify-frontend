import axios from 'axios'
import { toast } from 'react-toastify'

import { baseURL } from '../../utils/config'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getAuthHeaders } from '@/utils/commonfunctions'

const BASE_URL = baseURL

export const fetchFaqs = createAsyncThunk('faq/getAllFAQs', async (_, thunkAPI) => {
  try {
    const response = await axios.get(`${BASE_URL}api/admin/faq/getAllFAQs`, {
      headers: getAuthHeaders()
    })

    return response.data
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message)
  }
})

export const AddFaqs = createAsyncThunk('hashtags/createHashtag', async (payload, thunkAPI) => {
  try {
    const response = await axios.post(`${BASE_URL}api/admin/faq/createFAQ`, payload, {
      headers: getAuthHeaders()
    })

    return response.data
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message)
  }
})

export const updateFaqs = createAsyncThunk('faq/updateFAQ', async (payload, thunkAPI) => {
  try {
    const response = await axios.patch(`${BASE_URL}api/admin/faq/updateFAQ`, payload, {
      headers: getAuthHeaders()
    })

    return response.data
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message)
  }
})

export const deleteFaqs = createAsyncThunk('faq/deleteFAQ', async (payload, thunkAPI) => {
  try {
    const response = await axios.delete(`${BASE_URL}api/admin/faq/deleteFAQ?faqId=${payload}`, {
      headers: getAuthHeaders()
    })

    return payload
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message)
  }
})

const initialState = {
  initialLoading: true,
  loading: false,
  faqs: [],
  status: 'idle',
  error: null,
  total: 0
}

const helpSlice = createSlice({
  name: 'help',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder.addCase(fetchFaqs.pending, (state, action) => {
      state.loading = true
    })
    builder.addCase(fetchFaqs.fulfilled, (state, action) => {
      state.initialLoading = false

      if (action.payload.status) {
        state.faqs = action.payload.data
      } else {
        state.error = action.payload.message
        toast.error(action.payload.message)
      }
    })
    builder.addCase(fetchFaqs.rejected, (state, action) => {
      state.initialLoading = false
      state.error = action.payload
      toast.error(action.payload)
    })

    // create FAQs

    builder.addCase(AddFaqs.pending, state => {
      state.loading = true
    })
    builder.addCase(AddFaqs.fulfilled, (state, action) => {
      state.loading = false

      if (action.payload.status) {
        state.faqs = [action.payload.data, ...state.faqs]
        // state.total += 1
        toast.success(action.payload.message || 'FAQs created successfully')
      } else {
        state.error = action.payload.message
        toast.error(action.payload.message)
      }
    })
    builder.addCase(AddFaqs.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload
      toast.error(action.payload)
    })

    // update FAQs
    builder.addCase(updateFaqs.pending, state => {
      state.loading = true
    })
    builder.addCase(updateFaqs.fulfilled, (state, action) => {
      state.loading = false

      if (action.payload.status) {
        state.faqs = state.faqs.map(faq => {
          if (faq._id === action.payload.data._id) {
            return action.payload.data
          }
          return faq
        })
        toast.success(action.payload.message || 'FAQs updated successfully')
      } else {
        state.error = action.payload.message
        toast.error(action.payload.message)
      }
    })
    builder.addCase(updateFaqs.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload
      toast.error(action.payload)
    })

    // delete FAQs
    builder.addCase(deleteFaqs.pending, state => {
      state.loading = true
    })
    builder.addCase(deleteFaqs.fulfilled, (state, action) => {
      state.loading = false

      if (action.payload) {
        state.faqs = state.faqs.filter(faq => faq._id !== action.payload)
        toast.success(action.payload.message || 'FAQs deleted successfully')
      } else {
        state.error = action.payload.message
        toast.error(action.payload.message)
      }
    })

    builder.addCase(deleteFaqs.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload
      toast.error(action.payload)
    })
  }
})

export default helpSlice.reducer
