import axios from 'axios'
import { toast } from 'react-toastify'

import { baseURL } from '../../utils/config'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getAuthHeaders } from '@/utils/commonfunctions'

const BASE_URL = baseURL

export const fetchIdProofList = createAsyncThunk('idProof/getAllIdProofs', async () => {
    const response = await axios.get(`${BASE_URL}api/admin/idProof/getAllIdProofs`, {
        headers: getAuthHeaders()
    })
    return response.data
})

export const addIdProof = createAsyncThunk('idProof/createIdProof', async title => {
    const response = await axios.post(
        `${BASE_URL}api/admin/idProof/createIdProof?title=${title.title}`,
        {},
        { headers: getAuthHeaders() }
    )

    return response.data
})

export const updateIdProof = createAsyncThunk('idProof/updateIdProof', async data => {
    const response = await axios.patch(`${BASE_URL}api/admin/idProof/updateIdProof?title=${data.title}&id=${data.id}`,
        {},
        {
            headers: getAuthHeaders()
        })

    return response.data
})

export const removeIdProof = createAsyncThunk('idProof/deleteIdProof', async IdProof => {

    const response = await axios.delete(
        `${BASE_URL}api/admin/idProof/deleteIdProof?id=${IdProof}`,
        {
            headers: getAuthHeaders()
        }
    )
    return IdProof
})

export const toggleProofActiveState = createAsyncThunk('idProof/toggleIdProofStatus', async (proofId, thunkAPI) => {
    try {
        const response = await axios.patch(
            `${BASE_URL}api/admin/idProof/toggleIdProofStatus?idProofId=${proofId}`,
            {},
            {
                headers: getAuthHeaders()
            }
        )

        if (response.data.status) {
            toast.success(response.data.message || 'Id Proof status updated successfully')

            return { proofId, success: true }
        } else {
            throw new Error(response.data.message || 'Failed to toggle Id Proof status')
        }
    } catch (error) {
        const errorMsg = error.response?.data?.message || error.message

        toast.error(errorMsg)

        return thunkAPI.rejectWithValue(errorMsg)
    }
})

const initialState = {
    idProof: [],
    initialLoading: false,
    loading: false,
    error: null
}

const idProofSlice = createSlice({
    name: 'idProof',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder.addCase(fetchIdProofList.pending, state => {
            state.initialLoading = true
        })
        builder.addCase(fetchIdProofList.fulfilled, (state, action) => {


            state.initialLoading = false
            state.idProof = action.payload.data
        })
        builder.addCase(fetchIdProofList.rejected, (state, action) => {
            state.initialLoading = false
            state.error = action.payload
            toast.error(action.payload || 'Failed to fetch ID Proofs')
        })

        // Create Id Proof
        builder.addCase(addIdProof.pending, state => {
            state.loading = true
        })
        builder.addCase(addIdProof.fulfilled, (state, action) => {

            state.loading = false
            state.idProof.unshift(action.payload.data)
            toast.success('ID Proof created successfully')
        })
        builder.addCase(addIdProof.rejected, (state, action) => {
            state.loading = false
            state.error = action.payload
            toast.error(action.payload || 'Failed to create ID Proof')
        })

        // Update Id Proof
        builder.addCase(updateIdProof.pending, state => {
            state.loading = true
        })
        builder.addCase(updateIdProof.fulfilled, (state, action) => {

            state.loading = false
            state.idProof = state.idProof.map(proof =>
                proof._id === action.payload.data._id ? action.payload.data : proof
            )
            toast.success('ID Proof updated successfully')
        })
        builder.addCase(updateIdProof.rejected, (state, action) => {
            state.loading = false
            state.error = action.payload
            toast.error(action.payload || 'Failed to update ID Proof')
        })

        // Delete Id Proof
        builder.addCase(removeIdProof.pending, state => {
            state.loading = true
        })
        builder.addCase(removeIdProof.fulfilled, (state, action) => {

            state.loading = false
            state.idProof = state.idProof.filter(proof => proof._id !== action.payload)
            toast.success('Id Proof deleted successfully')
        })
        builder.addCase(removeIdProof.rejected, (state, action) => {
            state.loading = false
            state.error = action.payload
            toast.error(action.payload || 'Failed to delete Id Proof')
        })

            // Toggle active status
            .addCase(toggleProofActiveState.pending, state => {
                state.loading = true
                state.error = null
            })
            .addCase(toggleProofActiveState.fulfilled, (state, action) => {

                state.loading = false
                const idProof = state.idProof.find(proof => proof._id === action.payload.proofId)

                if (idProof) {
                    idProof.isActive = !idProof.isActive
                }

                state.error = null
            })
            .addCase(toggleProofActiveState.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })

    }
})

export default idProofSlice.reducer
