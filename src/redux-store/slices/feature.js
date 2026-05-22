import axios from 'axios'
import { toast } from 'react-toastify'
import { baseURL } from '../../utils/config'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getAuthHeaders, getFormDataAuthHeaders } from '@/utils/commonfunctions'

const BASE_URL = baseURL

export const fetchFeatureAdList = createAsyncThunk(
    'featureAd/list',
    async ({ page, pageSize }, thunkAPI) => {
        const response = await axios.get(
            `${BASE_URL}api/admin/featureAdPackage/getAllFeatureAdPackages?start=${page}&limit=${pageSize}`,
            { headers: getAuthHeaders() }
        );

        return response.data;
    }
);

export const createFeatureAd = createAsyncThunk('featureAdPackage/createFeatureAdPackage', async (formData, thunkAPI) => {
    try {
        const response = await axios.post(`${BASE_URL}api/admin/featureAdPackage/createFeatureAdPackage`, formData, {
            headers: {
                ...getFormDataAuthHeaders(),
                'Content-Type': 'multipart/form-data'
            }
        })
        toast.success(response.data.message || 'Feature Advertisement created successfully')
        return response.data.data
    } catch (error) {
        const errorMsg = error.response?.data?.message || error.message

        toast.error(errorMsg)

        return thunkAPI.rejectWithValue(errorMsg)
    }
})

export const updateFeatureAd = createAsyncThunk('featureAdPackage/updateFeatureAdPackage', async (formData, thunkAPI) => {
    try {
        const response = await axios.patch(`${BASE_URL}api/admin/featureAdPackage/updateFeatureAdPackage`, formData, {
            headers: {
                ...getFormDataAuthHeaders(),
                'Content-Type': 'multipart/form-data'
            }
        })
        toast.success(response.data.message || 'Feature Advertisement updated successfully')
        return response.data.data
    } catch (error) {
        const errorMsg = error.response?.data?.message || error.message

        toast.error(errorMsg)

        return thunkAPI.rejectWithValue(errorMsg)
    }
})

export const removeFeatureAd = createAsyncThunk('featureAdPackage/deleteFeatureAdPackage', async (id, thunkAPI) => {

    try {
        const response = await axios.delete(`${BASE_URL}api/admin/featureAdPackage/deleteFeatureAdPackage?packageId=${id}`, {
            headers: getAuthHeaders()
        })
        toast.success(response.data.message || 'Feature Advertisement removed successfully')
        return id
    } catch (error) {
        const errorMsg = error.response?.data?.message || error.message

        toast.error(errorMsg)

        return thunkAPI.rejectWithValue(errorMsg)
    }
})

export const toggleFeatureAd = createAsyncThunk(
    'featureAdPackage/toggleFeatureAdPackageStatus',
    async (featureId, thunkAPI) => {
        try {
            const response = await axios.patch(
                `${BASE_URL}api/admin/featureAdPackage/toggleFeatureAdPackageStatus?packageId=${featureId}`,
                {},
                {
                    headers: getAuthHeaders()
                }
            )
            if (response.data.status) {

                toast.success('Feature Advertisement status updated successfully')

                return { featureId, success: true }
            } else {
                throw new Error(response.data.message || 'Failed to toggle Feature Advertisement status')
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message

            toast.error(errorMsg)

            return thunkAPI.rejectWithValue(errorMsg)
        }
    }
)

const initialState = {
    featureAd: [],
    total: 0,
    page: 1,
    pageSize: 10,
    initialLoading: false,
    loading: false,
    error: null
};

const featureAdSlice = createSlice({
    name: 'featureAd',
    initialState,
    reducers: {
        setPage: (state, action) => {
            state.page = action.payload;
        },
        setPageSize: (state, action) => {
            state.pageSize = action.payload;
        }
    },
    extraReducers: builder => {
        builder.addCase(fetchFeatureAdList.pending, state => {
            state.initialLoading = true
        })
        builder.addCase(fetchFeatureAdList.fulfilled, (state, action) => {

            state.initialLoading = false
            state.featureAd = action.payload.data
            state.total = action.payload.totalCount
        })
        builder.addCase(fetchFeatureAdList.rejected, (state, action) => {
            state.initialLoading = false
            state.error = action.payload
            toast.error(action.payload)
        })

        // Create Feature Advertisement
        builder.addCase(createFeatureAd.pending, state => {
            state.loading = true
            state.error = null
        })
        builder.addCase(createFeatureAd.fulfilled, (state, action) => {
            state.loading = false
            state.featureAd.unshift(action.payload)
            state.error = null
        })
        builder.addCase(createFeatureAd.rejected, (state, action) => {
            state.loading = false
            state.error = action.payload
        })

        // Update subscription plan
        builder.addCase(updateFeatureAd.pending, state => {
            state.loading = true
            state.error = null
        })
        builder.addCase(updateFeatureAd.fulfilled, (state, action) => {
            state.loading = false
            state.featureAd = state.featureAd.map(feature =>
                feature._id === action.payload._id ? action.payload : feature
            )
            state.error = null
        })
        builder.addCase(updateFeatureAd.rejected, (state, action) => {
            state.loading = false
            state.error = action.payload
        })


        // Remove Feature Advertisement
        builder.addCase(removeFeatureAd.pending, state => {
            state.loading = true
            state.error = null
        })
        builder.addCase(removeFeatureAd.fulfilled, (state, action) => {
            state.loading = false
            state.featureAd = state.featureAd.filter(feature => feature._id !== action.payload)
            state.error = null
        })
        builder.addCase(removeFeatureAd.rejected, (state, action) => {
            state.loading = false
            state.error = action.payload
        })

            // Toggle active status
            .addCase(toggleFeatureAd.pending, state => {
                state.loading = true
                state.error = null
            })
            .addCase(toggleFeatureAd.fulfilled, (state, action) => {
                state.loading = false
                const featureAd = state.featureAd.find(feature => feature._id === action.payload.featureId)

                if (featureAd) {
                    featureAd.isActive = !featureAd.isActive
                }

                state.error = null
            })
            .addCase(toggleFeatureAd.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })

    }
})

export const { setPage, setPageSize } = featureAdSlice.actions;
export default featureAdSlice.reducer
