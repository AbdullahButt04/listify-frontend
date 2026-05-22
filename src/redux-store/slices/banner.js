import axios from 'axios'
import { toast } from 'react-toastify'

import { baseURL } from '../../utils/config'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getAuthHeaders, getFormDataAuthHeaders } from '@/utils/commonfunctions'

const BASE_URL = baseURL


// Fetch banners by type
export const fetchBannerList = createAsyncThunk('banner/fetchAllBanners', async (_, thunkAPI) => {
    try {
        const response = await axios.get(`${BASE_URL}api/admin/banner/fetchAllBanners`, {
            headers: getAuthHeaders()
        })

        return {
            banners: response.data.data || [],
        }
    } catch (error) {
        const errorMsg = error.response?.data?.message || error.message

        toast.error(errorMsg)

        return thunkAPI.rejectWithValue(errorMsg)
    }
})

// Create new banner
export const createNewBanner = createAsyncThunk('banner/addBanner', async (formData, thunkAPI) => {
    try {
        const response = await axios.post(`${BASE_URL}api/admin/banner/addBanner`, formData, {
            headers: {
                ...getFormDataAuthHeaders(),
                'Content-Type': 'multipart/form-data'
            }
        })
        toast.success(response.data.message || 'Banner created successfully')

        return response.data.data
    } catch (error) {
        const errorMsg = error.response?.data?.message || error.message

        toast.error(errorMsg)

        return thunkAPI.rejectWithValue(errorMsg)
    }
})

export const modifyBannerDetails = createAsyncThunk('banner/updateBannerById', async (formData, thunkAPI) => {
    try {
        const response = await axios.patch(`${BASE_URL}api/admin/banner/updateBannerById`, formData, {
            headers: {
                ...getFormDataAuthHeaders(),
                'Content-Type': 'multipart/form-data'
            }
        })

        toast.success(response.data.message || 'Banner updated successfully')

        return response.data.data
    } catch (error) {
        const errorMsg = error.response?.data?.message || error.message

        toast.error(errorMsg)

        return thunkAPI.rejectWithValue(errorMsg)
    }
})

// Delete banner
export const removeBanner = createAsyncThunk('banner/removeBannerById', async (bannerId, thunkAPI) => {
    try {
        const response = await axios.delete(`${BASE_URL}api/admin/banner/removeBannerById?bannerId=${bannerId}`, {
            headers: getAuthHeaders()
        })

        toast.success(response.data.message || 'Banner deleted successfully')

        return { bannerId }
    } catch (error) {
        const errorMsg = error.response?.data?.message || error.message

        toast.error(errorMsg)

        return thunkAPI.rejectWithValue(errorMsg)
    }
})

export const toggleBannerActiveState = createAsyncThunk(
    'banner/toggleBannerStatus',
    async (bannerId, thunkAPI) => {
        try {
            const response = await axios.patch(
                `${BASE_URL}api/admin/banner/toggleBannerStatus?bannerId=${bannerId}`,
                {},
                {
                    headers: getAuthHeaders()
                }
            )


            if (response.data.status) {
                toast.success(response.data.message || 'Banner status updated successfully')

                return { bannerId, success: true }
            } else {
                throw new Error(response.data.message || 'Failed to toggle banner status')
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message

            toast.error(errorMsg)

            return thunkAPI.rejectWithValue(errorMsg)
        }
    }
)



const initialState = {
    banners: [],
    loading: false,
    initialLoading: true,
    error: null,
}


const bannerSlice = createSlice({
    name: 'banner',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder

            // Fetch banners
            .addCase(fetchBannerList.pending, state => {
                state.initialLoading = true
                state.loading = true
                state.error = null
            })
            .addCase(fetchBannerList.fulfilled, (state, action) => {
                state.initialLoading = false
                state.loading = false
                state.banners = action.payload.banners
                state.error = null
            })
            .addCase(fetchBannerList.rejected, (state, action) => {
                state.initialLoading = false
                state.loading = false
                state.error = action.payload
            })

            // Create banner
            .addCase(createNewBanner.pending, state => {
                state.loading = true
                state.error = null
            })
            .addCase(createNewBanner.fulfilled, (state, action) => {
                state.loading = false
                state.banners.push(action.payload)
                state.error = null
            })
            .addCase(createNewBanner.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })

            // Update banner
            .addCase(modifyBannerDetails.pending, state => {
                state.loading = true
                state.error = null
            })
            .addCase(modifyBannerDetails.fulfilled, (state, action) => {
                state.loading = false
                const index = state.banners.findIndex(banner => banner._id === action.payload._id)

                if (index !== -1) {
                    state.banners[index] = action.payload
                }

                state.error = null
            })
            .addCase(modifyBannerDetails.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })

            // Delete banner
            .addCase(removeBanner.pending, state => {
                state.loading = true
                state.error = null
            })
            .addCase(removeBanner.fulfilled, (state, action) => {
                state.loading = false
                state.banners = state.banners.filter(banner => banner._id !== action.payload.bannerId)
                state.error = null
            })
            .addCase(removeBanner.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })

            // Toggle active status
            .addCase(toggleBannerActiveState.pending, state => {
                state.loading = true
                state.error = null
            })
            .addCase(toggleBannerActiveState.fulfilled, (state, action) => {
                
                state.loading = false
                const banner = state.banners.find(banner => banner._id === action.payload.bannerId)

                if (banner) {
                    banner.isActive = !banner.isActive
                }

                state.error = null
            })
            .addCase(toggleBannerActiveState.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })

    }
})

export default bannerSlice.reducer;
