import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import apiService from '../../utils/apiService'
import { toast } from 'react-toastify'
import { deleteUser, signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/libs/firebase'

export const loginAdmin = createAsyncThunk(
  'api/admin/authenticateAdmin',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await apiService.post('api/admin/authenticateAdmin', { email, password })
      return response
    } catch (err) {
      // Improved error handling
      const errorMessage = err.message || 'Login failed'
      return rejectWithValue(errorMessage)
    }
  }
)

export const signInAdmin = createAsyncThunk(
  'admin/handleAdminRegistration',
  async ({ email, password, uid, licenseKey, privateKey }, { rejectWithValue }) => {
    try {
      const response = await apiService.post(`api/admin/handleAdminRegistration`, {
        email,
        password,
        authId: uid,
        // privateKey: licenseKey,
        privateKey
      })

      return response.data
    } catch (err) {
      // Improved error handling
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed'

      return rejectWithValue(errorMessage)
    }
  }
)

// Firebase deleteUser method
const deleteUserFromFirebase = async (email, password) => {
  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password)
    await deleteUser(user)
  } catch (error) {
    console.error('Error deleting user from Firebase:', error)
    toast.error('Failed to delete user from Firebase.')
  }
}

export const requestPasswordReset = createAsyncThunk(
  'admin/handleAdminEmailVerification',
  async ({ email }, { rejectWithValue }) => {
    try {
      const response = await apiService.get(`api/admin/handleAdminEmailVerification`, {
        params: { email }
      })

      return response.data
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Password reset request failed'

      return rejectWithValue(errorMessage)
    }
  }
)

export const resetPassword = createAsyncThunk(
  'api/admin/admin/resetPassword',
  async ({ newPassword, confirmPassword, token, uid }, { rejectWithValue }) => {
    try {
      const response = await apiService.post(`api/admin/initiatePasswordReset`, { newPassword, confirmPassword })

      return response.data
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Password reset failed'

      return rejectWithValue(errorMessage)
    }
  }
)

export const getAdminProfile = createAsyncThunk('api/admin/admin/getAdminProfile', async (_, { rejectWithValue }) => {
  try {
    const response = await apiService.get(`api/admin/retrieveAdminDetails`)

    return response.data
  } catch (err) {
    const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch profile'

    return rejectWithValue(errorMessage)
  }
})

export const updateAdminProfile = createAsyncThunk(
  'admin/modifyAdminProfile',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await apiService.patch(`api/admin/modifyAdminProfile`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      return response.data
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Profile update failed'

      return rejectWithValue(errorMessage)
    }
  }
)

export const changePassword = createAsyncThunk(
  'admin/updatePassword',
  async ({ oldPass, newPass, confirmPass }, { rejectWithValue }) => {
    try {
      const response = await apiService.patch(`api/admin/updatePassword`, { oldPass, newPass, confirmPass })

      return response.data
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Password change failed'

      return rejectWithValue(errorMessage)
    }
  }
)

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    loading: false,
    user: null,
    error: null,
    resetStatus: null,
    profileData: null,
    passwordChangeStatus: null,
    profileUpdateStatus: null,
    loginStatus: 'idle' // Added to track login status
  },
  reducers: {
    clearResetStatus: state => {
      state.resetStatus = null
    },

    clearPasswordChangeStatus: state => {
      state.passwordChangeStatus = null
    },

    clearError: state => {
      state.error = null
    },

    logoutAdmin: state => {
      // Clear auth data from sessionStorage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('uid')
        sessionStorage.removeItem('admin_token')
        sessionStorage.removeItem('user')
        sessionStorage.removeItem('manual_login_in_progress')
      }

      // Reset the state to initial values
      state.user = null
      state.error = null
      state.loading = false
      state.resetStatus = null
      state.profileData = null
      state.passwordChangeStatus = null
      state.profileUpdateStatus = null
      state.loginStatus = 'idle'
    },

    clearProfileUpdateStatus: state => {
      state.profileUpdateStatus = null
    }
  },
  extraReducers: builder => {
    builder

      // Login Admin
      .addCase(loginAdmin.pending, state => {
        state.loading = true
        state.error = null
        state.loginStatus = 'pending'
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        state.loginStatus = 'success'
        // state.profileData = { ...action.payload.admin, flag: false }
        if (typeof window !== 'undefined' && action.payload && action.payload.admin) {
          const user = {
            name: action.payload.admin.name,
            email: action.payload.admin.email,
            image: action.payload.admin.image
          }

          sessionStorage.setItem('user', JSON.stringify(user))
        }
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.loginStatus = 'failed'
      })

      // signup Admin
      .addCase(signInAdmin.pending, state => {
        state.loading = true
        state.error = null
        state.loginStatus = 'pending'
      })
      .addCase(signInAdmin.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload

        if (action.payload.status) {
          state.loginStatus = 'success'
        } else {
          state.loginStatus = 'failed'
          console.log(action.payload)
          toast.error(action.payload.message)
          console.log(action.meta)
          deleteUserFromFirebase(action.meta.arg.email, action.meta.arg.password)
        }
      })
      .addCase(signInAdmin.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.loginStatus = 'failed'
        console.log(action.payload)
        toast.error('Authentication failed')
        console.log(action.meta)
        deleteUserFromFirebase(action.meta.arg.email, action.meta.arg.password)
      })

      // Request Password Reset
      .addCase(requestPasswordReset.pending, state => {
        state.loading = true
        state.error = null
        state.resetStatus = 'pending'
      })
      .addCase(requestPasswordReset.fulfilled, state => {
        state.loading = false
        state.resetStatus = 'email_sent'
      })
      .addCase(requestPasswordReset.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.resetStatus = 'failed'
      })

      // Reset Password
      .addCase(resetPassword.pending, state => {
        state.loading = true
        state.error = null
        state.resetStatus = 'pending'
      })
      .addCase(resetPassword.fulfilled, state => {
        state.loading = false
        state.resetStatus = 'success'
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.resetStatus = 'failed'
      })

      // Get Admin Profile
      .addCase(getAdminProfile.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(getAdminProfile.fulfilled, (state, action) => {
        state.loading = false
        state.profileData = action.payload.data
      })
      .addCase(getAdminProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Update Admin Profile
      .addCase(updateAdminProfile.pending, state => {
        state.loading = true
        state.error = null
        state.profileUpdateStatus = 'pending'
      })
      .addCase(updateAdminProfile.fulfilled, (state, action) => {
        state.loading = false
        state.profileData = action.payload.data || state.profileData
        state.profileUpdateStatus = 'success'
      })
      .addCase(updateAdminProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.profileUpdateStatus = 'failed'
      })

      // Change Password
      .addCase(changePassword.pending, state => {
        state.loading = true
        state.error = null
        state.passwordChangeStatus = 'pending'
      })
      .addCase(changePassword.fulfilled, state => {
        state.loading = false
        state.passwordChangeStatus = 'success'
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.passwordChangeStatus = 'failed'
      })
  }
})

export const { clearResetStatus, logoutAdmin, clearPasswordChangeStatus, clearProfileUpdateStatus, clearError } =
  adminSlice.actions

export default adminSlice.reducer
