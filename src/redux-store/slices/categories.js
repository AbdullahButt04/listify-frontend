import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '@/utils/apiService'
import { toast } from 'react-toastify'

// Thunks
export const fetchCategories = createAsyncThunk('categories/fetchCategories', async ({ page, pageSize }, thunkAPI) => {
  try {
    const response = await api.get(`api/admin/category/fetchAllCategories?start=${page}&limit=${pageSize}`)
    return response.data // expected: { data: [], total?: number }
  } catch (error) {
    return thunkAPI.rejectWithValue(error?.response?.data?.message || 'Failed to fetch categories')
  }
})

export const fetchCategoryById = createAsyncThunk('categories/fetchCategoryById', async (categoryId, thunkAPI) => {
  try {
    const res = await api.get(`api/admin/category/${categoryId}`)
    return res.data // expected: { data: {...} }
  } catch (error) {
    return thunkAPI.rejectWithValue(error?.response?.data?.message || 'Failed to fetch category')
  }
})

export const createCategory = createAsyncThunk('categories/createCategory', async (payload, thunkAPI) => {
  try {
    const res = await api.post('api/admin/category/addCategory', payload, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return res.data // expected: { data: {...created} }
  } catch (error) {
    return thunkAPI.rejectWithValue(error?.response?.data?.message || 'Failed to create category')
  }
})

export const toggleCategoryStatus = createAsyncThunk(
  'categories/toggleCategoryStatus',
  async (categoryId, thunkAPI) => {
    try {
      const res = await api.patch(`api/admin/category/toggleCategoryStatus?categoryId=${categoryId}`)
      return res.data // expected: { data: {...updated} }
    } catch (error) {
      return thunkAPI.rejectWithValue(error?.response?.data?.message || 'Failed to toggle category status')
    }
  }
)

export const modifyCategory = createAsyncThunk('categories/modifyCategory', async (payload, thunkAPI) => {
  try {
    const res = await api.patch('api/admin/category/modifyCategory', payload, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return res.data // expected: { data: {...updated} }
  } catch (error) {
    return thunkAPI.rejectWithValue(error?.response?.data?.message || 'Failed to modify category')
  }
})

export const deleteCategory = createAsyncThunk('categories/deleteCategory', async (categoryId, thunkAPI) => {
  try {
    const res = await api.delete(`api/admin/category/removeCategory?categoryId=${categoryId}`)
    return { id: categoryId, ...(res.data || {}) } // include id for local removal
  } catch (error) {
    return thunkAPI.rejectWithValue(error?.response?.data?.message || 'Failed to delete category')
  }
})

export const GetHierarchicalCategory = createAsyncThunk('categories/GetHierarchicalCategory', async thunkAPI => {
  try {
    const res = await api.get('api/admin/category/getCategoryHierarchy')
    return res.data // expected: { data: [...] }
  } catch (error) {
    return thunkAPI.rejectWithValue(error?.response?.data?.message || 'Failed to fetch hierarchical categories')
  }
})

export const getSubCategories = createAsyncThunk(
  'categories/getSubCategories',
  async ({ parentId, start, limit }, thunkAPI) => {
    try {
      const res = await api.get(
        `api/admin/category/getSubcategoriesByCategory?parentId=${parentId}&start=${start}&limit=${limit}`
      )
      return res.data // expected: { data: [...] }
    } catch (error) {
      return thunkAPI.rejectWithValue(error?.response?.data?.message || 'Failed to fetch sub-categories')
    }
  }
)

// Initial state

const initialState = {
  startDate: 'All',
  endDate: 'All',
  categories: [],
  hierarchicalCategories: [],
  selectedCategory: null,
  total: 0,
  page: 1,
  pageSize: 10,
  loading: false,
  initialLoading: true,
  error: null,

  // for sub-categories (nested hierarchy support)
  // Map structure: { [parentId]: { data: [], loading: false, total: 0 } }
  subCategoriesMap: {},
  subCategories: [],
  subCategoryLoading: false,
  subCategoryTotal: 0,
  subCategoryPage: 1,
  subCategoryLimit: 10,
  subCategoryHasMore: true
}

// Slice
const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    setDateRange: (state, action) => {
      state.startDate = action.payload.startDate
      state.endDate = action.payload.endDate
      state.page = 1 // reset page on filter change
    },
    setPage: (state, action) => {
      state.page = action.payload
    },
    setPageSize: (state, action) => {
      state.pageSize = action.payload
    },
    clearSelectedCategory: state => {
      state.selectedCategory = null
    },

    // sub-categories
    resetSubCategories: state => {
      state.subCategories = []
      state.subCategoryTotal = 0
      state.subCategoryPage = 1
      state.subCategoryHasMore = true
      state.subCategoryLoading = false
      state.error = null
    },
    clearSubCategoriesForParent: (state, action) => {
      const parentId = action.payload
      if (state.subCategoriesMap[parentId]) {
        delete state.subCategoriesMap[parentId]
      }
    }
  },
  extraReducers: builder => {
    // Fetch list
    builder.addCase(fetchCategories.pending, state => {
      state.initialLoading = true
      state.loading = true
      state.error = null
    })
    builder.addCase(fetchCategories.fulfilled, (state, action) => {
      state.initialLoading = false
      state.loading = false
      state.categories = action.payload?.data || []
      // state.categories = []
      state.total = action.payload?.total || 0
      // state.total = 0
    })
    builder.addCase(fetchCategories.rejected, (state, action) => {
      state.initialLoading = false
      state.loading = false
      state.error = action.payload || 'Failed to fetch categories'
    })

    // Fetch one
    builder.addCase(fetchCategoryById.pending, state => {
      state.loading = true
      state.error = null
    })
    builder.addCase(fetchCategoryById.fulfilled, (state, action) => {
      state.loading = false
      state.selectedCategory = action.payload?.data || null
    })
    builder.addCase(fetchCategoryById.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload || 'Failed to fetch category'
    })

    // Create
    builder.addCase(createCategory.pending, state => {
      state.loading = true
      state.error = null
    })
    builder.addCase(createCategory.fulfilled, (state, action) => {
      state.loading = false
      const created = action.payload?.data
      if (created) {
        state.categories = [created, ...state.categories]
        state.total = state.total + 1
      }
      if (action.payload.status) {
        toast.success(action.payload.message || 'Category created successfully')
      } else {
        toast.error(action.payload.message || 'Failed to create category')
      }
    })
    builder.addCase(createCategory.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload || 'Failed to create category'
    })

    // toggle active status
    builder.addCase(toggleCategoryStatus.pending, state => {
      state.loading = true
      state.error = null
    })
    builder.addCase(toggleCategoryStatus.fulfilled, (state, action) => {
      state.loading = false
      const updated = action.payload?.data
      if (updated?._id) {
        state.categories = state.categories.map(c => (c._id === updated._id ? { ...c, ...updated } : c))
        if (state.selectedCategory?._id === updated._id) {
          state.selectedCategory = { ...state.selectedCategory, ...updated }
        }
      }
      if (action.payload.status) {
        toast.success(action.payload.message || 'Category status toggled successfully')
      } else {
        toast.error(action.payload.message || 'Failed to toggle category status')
      }
    })
    builder.addCase(toggleCategoryStatus.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload || 'Failed to toggle category status'
    })

    // Modify (new PATCH method)
    builder.addCase(modifyCategory.pending, state => {
      state.loading = true
      state.error = null
    })
    builder.addCase(modifyCategory.fulfilled, (state, action) => {
      state.loading = false
      const updated = action.payload?.data
      if (updated?._id) {
        state.categories = state.categories.map(c => (c._id === updated._id ? { ...c, ...updated } : c))
        if (state.selectedCategory?._id === updated._id) {
          state.selectedCategory = { ...state.selectedCategory, ...updated }
        }
      }
      if (action.payload.status) {
        toast.success(action.payload.message || 'Category modified successfully')
      } else {
        toast.error(action.payload.message || 'Failed to modify category')
      }
    })
    builder.addCase(modifyCategory.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload || 'Failed to modify category'
    })

    // Delete
    builder.addCase(deleteCategory.pending, state => {
      state.loading = true
      state.error = null
    })
    builder.addCase(deleteCategory.fulfilled, (state, action) => {
      state.loading = false
      const id = action.payload?.id
      if (id) {
        state.categories = state.categories.filter(c => c._id !== id)
        state.total = Math.max(0, state.total - 1)
        if (state.selectedCategory?._id === id) {
          state.selectedCategory = null
        }
      }
      if (action.payload.status) {
        toast.success(action.payload.message || 'Category deleted successfully')
      } else {
        toast.error(action.payload.message || 'Failed to delete category')
      }
    })
    builder.addCase(deleteCategory.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload || 'Failed to delete category'
    })

    builder.addCase(GetHierarchicalCategory.pending, state => {
      state.loading = true
      state.error = null
    })
    builder.addCase(GetHierarchicalCategory.fulfilled, (state, action) => {
      state.loading = false
      state.hierarchicalCategories = action.payload?.data || []
    })
    builder.addCase(GetHierarchicalCategory.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload || 'Failed to fetch hierarchical categories'
    })

    // sub categories
    // --- tweak extraReducers for sub categories ---
    builder.addCase(getSubCategories.pending, (state, action) => {
      const parentId = action.meta?.arg?.parentId
      if (parentId) {
        if (!state.subCategoriesMap[parentId]) {
          state.subCategoriesMap[parentId] = { data: [], loading: false, total: 0 }
        }
        state.subCategoriesMap[parentId].loading = true
      }
      state.subCategoryLoading = true
      state.error = null
    })

    builder.addCase(getSubCategories.fulfilled, (state, action) => {
      state.subCategoryLoading = false
      const parentId = action.meta?.arg?.parentId
      const nextPage = action.meta?.arg?.start ?? 1
      const pageSize = action.meta?.arg?.limit ?? state.subCategoryLimit
      const incoming = action.payload?.data || []
      const total = action.payload?.total ?? state.subCategoryTotal

      // Update map-based structure for nested hierarchy
      if (parentId) {
        if (!state.subCategoriesMap[parentId]) {
          state.subCategoriesMap[parentId] = { data: [], loading: false, total: 0 }
        }
        state.subCategoriesMap[parentId].data = incoming
        state.subCategoriesMap[parentId].loading = false
        state.subCategoriesMap[parentId].total = total
      }

      // replace on first page, append on subsequent pages
      if (nextPage === 1) {
        state.subCategories = incoming
      } else {
        state.subCategories = [...state.subCategories, ...incoming]
      }

      state.subCategoryPage = nextPage
      state.subCategoryLimit = pageSize
      state.subCategoryTotal = total

      const loadedCount = state.subCategories.length
      state.subCategoryHasMore = loadedCount < total
    })

    builder.addCase(getSubCategories.rejected, (state, action) => {
      const parentId = action.meta?.arg?.parentId
      if (parentId && state.subCategoriesMap[parentId]) {
        state.subCategoriesMap[parentId].loading = false
      }
      state.subCategoryLoading = false
      state.error = action.payload || 'Failed to fetch sub-categories'
    })
  }
})

export const {
  setDateRange,
  setPage,
  setPageSize,
  clearSelectedCategory,
  resetSubCategories,
  clearSubCategoriesForParent
} = categoriesSlice.actions
export default categoriesSlice.reducer
