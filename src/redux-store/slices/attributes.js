import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/utils/apiService'
import { toast } from 'react-toastify'

export const fetchAttributes = createAsyncThunk(
  'attributes/fetchAttributes',
  async ({ page = 1, pageSize = 10, categoryId = null, fieldType = null }, thunkAPI) => {
    try {
      let url = `api/admin/attributes/getAllAttributes?start=${page}&limit=${pageSize}`

      // Add categoryId filter if provided and not 'All'
      if (categoryId && categoryId !== 'All') {
        url += `&categoryId=${categoryId}`
      }

      // Add fieldType filter if provided and not 'All' or null
      if (fieldType && fieldType !== 'All' && fieldType !== null) {
        url += `&fieldType=${fieldType}`
      }

      const res = await api.get(url)
      return res.data
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data)
    }
  }
)

export const createAttribute = createAsyncThunk('attributes/createAttribute', async (formData, thunkAPI) => {
  try {
    const res = await api.post('api/admin/attributes/createAttributes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return res.data
  } catch (err) {
    return thunkAPI.rejectWithValue(err?.response?.data || { message: 'Create failed' })
  }
})

export const modifyAttribute = createAsyncThunk('attributes/modifyAttribute', async (data, thunkAPI) => {
  try {
    const res = await api.patch(`api/admin/attributes/updateAttribute`, data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
    })
    return res
  } catch (err) {
    return thunkAPI.rejectWithValue(err?.response?.data || { message: 'Update failed' })
  }
})

export const deleteAttribute = createAsyncThunk('attributes/deleteAttribute', async (id, thunkAPI) => {
  try {
    const res = await api.delete(`api/admin/attributes/deleteAttribute?attributeId=${id}`)
    return res.data
  } catch (err) {
    toast.error(err?.response?.data?.message || 'Delete failed')
    return thunkAPI.rejectWithValue(err?.response?.data || { message: 'Delete failed' })
  }
})

export const modifyAttributeValue = createAsyncThunk(
  'attributes/updateAttributeValues',
  async ({ attributeId, index, newValue }, thunkAPI) => {
    try {
      const res = await api.patch(
        `api/admin/attributes/updateAttributeValues?attributeId=${attributeId}&index=${index}&newValue=${encodeURIComponent(newValue)}`
      )
      return res.data
    } catch (err) {
      return thunkAPI.rejectWithValue(err?.response?.data || { message: 'Update failed' })
    }
  }
)

export const deleteAttributeValue = createAsyncThunk(
  'attributes/deleteAttributeValue',
  async ({ attributeId, index }, thunkAPI) => {
    try {
      const res = await api.delete(
        `api/admin/attributes/deleteAttributeValue?attributeId=${attributeId}&index=${index}`
      )
      return res.data
    } catch (err) {
      return thunkAPI.rejectWithValue(err?.response?.data || { message: 'Delete failed' })
    }
  }
)

// initial state

const initialState = {
  attributes: [],
  initialLoading: true,
  total: 0,
  page: 1,
  pageSize: 10,
  fieldType: 'All',
  loading: false,
  error: null
}

// slice

const attributesSlice = createSlice({
  name: 'attributes',
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
      .addCase(fetchAttributes.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAttributes.fulfilled, (state, action) => {
        state.loading = false
        state.initialLoading = false
        state.attributes = action.payload.attributes || []
        state.total = action.payload.total
      })
      .addCase(fetchAttributes.rejected, (state, action) => {
        state.loading = false
        state.initialLoading = false
        state.error = action.payload || 'Failed to fetch attributes'
      })

      // Create
      .addCase(createAttribute.pending, s => {
        s.loading = true
      })
      .addCase(createAttribute.fulfilled, (s, a) => {
        s.loading = false
        if (a.payload.status) {
          const payloadAttr = a.payload?.attribute

          // Normalize to an array
          const incoming = Array.isArray(payloadAttr) ? payloadAttr : [payloadAttr]

          // Index existing by _id for quick replace
          const idxById = new Map(s.attributes.map((x, i) => [x._id, i]))

          // Collect items that are NEW (not in state yet)
          const toPrepend = []

          for (const item of incoming) {
            const existingIdx = idxById.get(item._id)
            if (existingIdx !== undefined) {
              // Replace existing item with the fresh one
              s.attributes[existingIdx] = item
            } else {
              toPrepend.push(item)
            }
          }

          // Prepend new items preserving the API order
          if (toPrepend.length) {
            s.attributes = [...toPrepend, ...s.attributes]
          }
          toast.success(a.payload?.message || 'Created successfully')
        } else {
          toast.error(a.payload?.message || 'Create failed')
        }
      })

      .addCase(createAttribute.rejected, (s, a) => {
        s.loading = false
        s.error = a.payload
      })

      // Modify
      .addCase(modifyAttribute.pending, s => {
        s.loading = true
      })
      .addCase(modifyAttribute.fulfilled, (s, a) => {
        s.loading = false
        if (a.payload?.data?.status) {
          // const updated = a.payload?.data

          // if (updated?._id) {
          //   const i = s.attributes.findIndex(x => x._id === updated._id)
          //   if (i > -1) s.attributes[i] = updated
          // }
          toast.success(a.payload?.data?.message || 'Updated successfully')
        } else {
          toast.error(a.payload?.data?.message || 'Update failed')
        }
      })
      .addCase(modifyAttribute.rejected, (s, a) => {
        s.loading = false
        s.error = a.payload
      })

      // delete
      .addCase(deleteAttribute.pending, s => {
        s.loading = true
      })
      .addCase(deleteAttribute.fulfilled, (s, a) => {
        s.loading = false
        if (a.payload?.status) {
          const deletedId = a.meta?.arg
          if (deletedId) {
            s.attributes = s.attributes.filter(x => x._id !== deletedId)
          }
        } else {
          toast.error(a.payload?.message || 'Delete failed')
        }
      })
      .addCase(deleteAttribute.rejected, (s, a) => {
        s.loading = false
        s.error = a.payload
      })

      // Modify Attribute Value
      .addCase(modifyAttributeValue.pending, s => {
        s.loading = true
      })
      .addCase(modifyAttributeValue.fulfilled, (s, a) => {
        s.loading = false
        if (a.payload?.status) {
          const { attributeId, index, newValue } = a.meta?.arg || {}
          if (attributeId !== undefined && index !== undefined && newValue !== undefined) {
            const attr = s.attributes.find(x => x._id === attributeId)
            if (attr && Array.isArray(attr.values) && index >= 0 && index < attr.values.length) {
              attr.values[index] = newValue
            }
          }
          toast.success(a.payload?.message || 'Value updated successfully')
        } else {
          toast.error(a.payload?.message || 'Update failed')
        }
      })
      .addCase(modifyAttributeValue.rejected, (s, a) => {
        s.loading = false
        s.error = a.payload
      })

      // Delete Attribute Value
      .addCase(deleteAttributeValue.pending, s => {
        s.loading = true
      })
      .addCase(deleteAttributeValue.fulfilled, (s, a) => {
        s.loading = false
        if (a.payload?.status) {
          const { attributeId, index } = a.meta?.arg || {}
          if (attributeId !== undefined && index !== undefined) {
            const attr = s.attributes.find(x => x._id === attributeId)
            if (attr && Array.isArray(attr.values) && index >= 0 && index < attr.values.length) {
              attr.values.splice(index, 1)
            }
          }
          toast.success(a.payload?.message || 'Value deleted successfully')
        } else {
          toast.error(a.payload?.message || 'Delete failed')
        }
      })
      .addCase(deleteAttributeValue.rejected, (s, a) => {
        s.loading = false
        s.error = a.payload
      })
  }
})

export const { setPage, setPageSize } = attributesSlice.actions
export default attributesSlice.reducer
