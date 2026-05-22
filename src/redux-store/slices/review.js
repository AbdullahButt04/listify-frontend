import axios from 'axios'
import { toast } from 'react-toastify'
import { baseURL } from '../../utils/config'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getAuthHeaders } from '@/utils/commonfunctions'

const BASE_URL = baseURL

export const getReviewList = createAsyncThunk('review/listReviews', async ({ start, limit }) => {
    const response = await axios.get(`${BASE_URL}api/admin/review/listReviews?start=${start}&limit=${limit}`, {
        headers: getAuthHeaders()
    })
    return response.data
})

// Delete Review
export const removeReview = createAsyncThunk('review/removeReview', async (reviewId, thunkAPI) => {
    try {
        const response = await axios.delete(`${BASE_URL}api/admin/review/removeReview?reviewId=${reviewId}`, {
            headers: getAuthHeaders()
        })
        toast.success(response.data.message || 'Review deleted successfully')
        return { reviewId }
    } catch (error) {
        const errorMsg = error.response?.data?.message || error.message
        toast.error(errorMsg)
        return thunkAPI.rejectWithValue(errorMsg)
    }
})

const initialState = {
    review: [],
    initialLoading: true,
    loading: false,
    error: null,
    reviewTotal: 0,
    reviewPage: 1,
    reviewPageSize: 10,
};

const reviewSlice = createSlice({
    name: 'review',
    initialState,
    reducers: {
        setReviewPage: (state, action) => {
            state.reviewPage = action.payload
        },
        setReviewPageSize: (state, action) => {
            state.reviewPageSize = action.payload
        }
    },
    extraReducers: (builder) => {
        builder.addCase(getReviewList.pending, (state) => {
            state.initialLoading = true
        })
        builder.addCase(getReviewList.fulfilled, (state, action) => {
            state.initialLoading = false
            state.review = action.payload.reviews
            state.reviewTotal = action.payload.total
        })
        builder.addCase(getReviewList.rejected, (state, action) => {
            state.initialLoading = false
            state.error = action.payload
            toast.error(action.payload || 'Failed to fetch reviews')
        })

            // Delete Review
            .addCase(removeReview.pending, state => {
                state.loading = true
                state.error = null
            })
            .addCase(removeReview.fulfilled, (state, action) => {
                state.loading = false
                state.review = state.review.filter(review => review._id !== action.payload.reviewId)
                state.error = null
            })
            .addCase(removeReview.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
    }
})

export const { setReviewPage , setReviewPageSize } = reviewSlice.actions
export default reviewSlice.reducer

