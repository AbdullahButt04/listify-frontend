import axios from 'axios'
import api from '@/utils/apiService'
import { toast } from 'react-toastify'
import { baseURL } from '../../utils/config'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getAuthHeaders, getFormDataAuthHeaders } from '@/utils/commonfunctions'
import apiService from '@/utils/apiService'

const BASE_URL = baseURL

export const fetchUsersData = createAsyncThunk(
  'user/getUserList',
  async ({ startDate, endDate, start, limit, search, isBlocked, isOnline, isVerified, isSeller }, thunkAPI) => {
    const response = await api.get(`api/admin/user/getUserList`, {
      params: {
        start,
        limit,
        search,
        startDate,
        endDate,
        isBlocked,
        isOnline,
        isVerified,
        isSeller
      }
    })

    return response.data
  }
)

export const toggleUserStatus = createAsyncThunk('user/updateUserBlockState', async (userId, thunkAPI) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}api/admin/user/updateUserBlockState?userId=${userId}`,
      {},
      {
        headers: getAuthHeaders()
      }
    )
    if (response.data.status) {
      toast.success('User Status Updated Successfully')

      return { userId, success: true }
    } else {
      throw new Error(response.data.message || 'Failed to toggle plan status')
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message

    toast.error(errorMsg)

    return thunkAPI.rejectWithValue(errorMsg)
  }
})

export const updateUser = createAsyncThunk('user/editUserProfile', async (formData, thunkAPI) => {
  try {
    const response = await axios.patch(`${BASE_URL}api/admin/user/editUserProfile`, formData, {
      headers: {
        ...getFormDataAuthHeaders(),
        'Content-Type': 'multipart/form-data'
      }
    })
    toast.success(response.data.message || 'User updated successfully')

    return response.data.data
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message

    toast.error(errorMsg)

    return thunkAPI.rejectWithValue(errorMsg)
  }
})

// Send Notification Perticuler User

export const createNotiPerUser = createAsyncThunk(
  'notification/notifySingleUserByAdmin',
  async (formData, thunkAPI) => {
    try {
      const res = await apiService.post('api/admin/notification/notifySingleUserByAdmin', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      return res.data
    } catch (err) {
      return thunkAPI.rejectWithValue(err?.response?.data || { message: 'Create failed' })
    }
  }
)

export const getUserBids = createAsyncThunk('auctionBid/fetchUserBids', async (userId, thunkAPI) => {
  try {
    const response = await apiService.get(`api/admin/auctionBid/fetchUserBids?userId=${userId}`)

    return response.data
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message
    toast.error(errorMsg)
    return thunkAPI.rejectWithValue(errorMsg)
  }
})

export const getSellerBids = createAsyncThunk('auctionBid/fetchSellerAuctionBids', async (userId, thunkAPI) => {
  try {
    const response = await apiService.get(`api/admin/auctionBid/fetchSellerAuctionBids?sellerId=${userId}`)

    return response.data
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message
    toast.error(errorMsg)
    return thunkAPI.rejectWithValue(errorMsg)
  }
})

export const getUserFollowingList = createAsyncThunk(
  'follow/listUserFollowing',
  async ({ userId, start, limit }, thunkAPI) => {
    try {
      const response = await apiService.get(
        `api/admin/follow/listUserFollowing?userId=${userId}&start=${start}&limit=${limit}`
      )

      return response.data
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message
      toast.error(errorMsg)
      return thunkAPI.rejectWithValue(errorMsg)
    }
  }
)

export const getUserFollowerList = createAsyncThunk(
  'follow/listUserFollowers',
  async ({ userId, start, limit }, thunkAPI) => {
    try {
      const response = await apiService.get(
        `api/admin/follow/listUserFollowers?userId=${userId}&start=${start}&limit=${limit}`
      )

      return response.data
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message
      toast.error(errorMsg)
      return thunkAPI.rejectWithValue(errorMsg)
    }
  }
)

export const getUserFriendsList = createAsyncThunk(
  'follow/listUserFriends',
  async ({ userId, start, limit }, thunkAPI) => {
    try {
      const response = await apiService.get(
        `api/admin/follow/listUserFriends?userId=${userId}&start=${start}&limit=${limit}`
      )

      return response.data
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message
      toast.error(errorMsg)
      return thunkAPI.rejectWithValue(errorMsg)
    }
  }
)

const initialState = {
  users: [],
  userBids: [],
  sellerBids: [],
  initialLoading: false,
  loading: false,
  error: null,
  userPage: 1,
  userPageSize: 10,
  userTotal: 0,
  startDate: 'All',
  endDate: 'All',
  totalActiveUsers: 0,
  totalFemaleUsers: 0,
  totalMaleUsers: 0,
  totalSellerUsers: 0,
  // connections
  followingList: [],
  followingTotal: 0,
  followerList: [],
  followerTotal: 0,
  friendsList: [],
  friendsTotal: 0
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserDateRange: (state, action) => {
      state.startDate = action.payload.startDate
      state.endDate = action.payload.endDate
      state.userPage = 1
    },
    setUserPage: (state, action) => {
      state.userPage = action.payload
    },
    setUserPageSize: (state, action) => {
      state.userPageSize = action.payload
      state.userPage = 1
    },

    resetConnections: state => {
      state.followingList = []
      state.followingTotal = 0
      state.followerList = []
      state.followerTotal = 0
      state.friendsList = []
      state.friendsTotal = 0
    }
  },
  extraReducers: builder => {
    builder.addCase(fetchUsersData.pending, state => {
      state.initialLoading = true
      state.error = null
    })
    builder.addCase(fetchUsersData.fulfilled, (state, action) => {
      state.initialLoading = false
      state.users = action.payload.data
      state.userTotal = action.payload.total
      state.totalActiveUsers = action.payload.totalActiveUsers
      state.totalFemaleUsers = action.payload.totalFemaleUsers
      state.totalMaleUsers = action.payload.totalMaleUsers
      state.totalSellerUsers = action.payload.totalSellerUsers
    })
    builder.addCase(fetchUsersData.rejected, (state, action) => {
      state.initialLoading = false
      state.error = action.payload
      toast.error(action.payload)
    })

    // Toggle active status
    builder.addCase(toggleUserStatus.pending, state => {
      state.loading = true
      state.error = null
    })
    builder.addCase(toggleUserStatus.fulfilled, (state, action) => {
      state.loading = false
      const users = state.users.find(user => user._id === action.payload.userId)

      if (users) {
        users.isBlocked = !users.isBlocked
      }

      state.error = null
    })
    builder.addCase(toggleUserStatus.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload
    })

    // UPDATE USER
    builder.addCase(updateUser.pending, state => {
      state.loading = true
      state.error = null
    })
    builder.addCase(updateUser.fulfilled, (state, action) => {
      state.loading = false
      state.users = state.users.map(users => (users._id === action.payload._id ? action.payload : users))
      state.error = null
    })
    builder.addCase(updateUser.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload
    })

    // Send Notifiaction Perticular User
    builder.addCase(createNotiPerUser.pending, (state, action) => {
      state.loading = true
    })
    builder.addCase(createNotiPerUser.fulfilled, (state, action) => {
      state.loading = false
      state.initialLoading = false
      if (action.payload.status) {
        toast.success(action.payload.message || 'Notification sent successfully')
      } else {
        toast.error(action.payload.message || 'Failed to send Notification')
      }
    })
    builder.addCase(createNotiPerUser.rejected, (state, action) => {
      state.loading = false
      state.initialLoading = false
      state.error = action.payload
    })

    // GET USERS BIDS
    builder.addCase(getUserBids.pending, (state, action) => {
      state.loading = true
    })
    builder.addCase(getUserBids.fulfilled, (state, action) => {
      state.loading = false
      state.initialLoading = false
      state.userBids = action.payload.bids
      state.bidstotal = action.payload.total
    })
    builder.addCase(getUserBids.rejected, (state, action) => {
      state.loading = false
      state.initialLoading = false
      state.error = action.payload
    })

    // GET SELLERS BIDS
    builder.addCase(getSellerBids.pending, (state, action) => {
      state.loading = true
    })
    builder.addCase(getSellerBids.fulfilled, (state, action) => {
      state.loading = false
      state.initialLoading = false
      state.sellerBids = action.payload.bids
      state.bidstotal = action.payload.total
    })
    builder.addCase(getSellerBids.rejected, (state, action) => {
      state.loading = false
      state.initialLoading = false
      state.error = action.payload
    })

    // following list
    builder.addCase(getUserFollowingList.pending, state => {
      state.loading = true
    })
    builder.addCase(getUserFollowingList.fulfilled, (state, action) => {
      state.loading = false
      const page = action.meta?.arg?.start ?? 1
      const items = action.payload.following || action.payload.data || []
      const total = action.payload.total || 0

      if (page > 1) {
        const existing = new Set(state.followingList.map(u => u._id))
        const toAdd = items.filter(u => !existing.has(u._id))
        state.followingList = state.followingList.concat(toAdd)
      } else {
        state.followingList = items
      }
      state.followingTotal = total
    })
    builder.addCase(getUserFollowingList.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload.message
    })

    // follower list
    builder.addCase(getUserFollowerList.pending, state => {
      state.loading = true
    })
    builder.addCase(getUserFollowerList.fulfilled, (state, action) => {
      state.loading = false
      const page = action.meta?.arg?.start ?? 1
      const items = action.payload.followers || action.payload.data || []
      const total = action.payload.total || 0

      if (page > 1) {
        const existing = new Set(state.followerList.map(u => u._id))
        const toAdd = items.filter(u => !existing.has(u._id))
        state.followerList = state.followerList.concat(toAdd)
      } else {
        state.followerList = items
      }
      state.followerTotal = total
    })
    builder.addCase(getUserFollowerList.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload.message
    })

    // friends list
    builder.addCase(getUserFriendsList.pending, state => {
      state.loading = true
    })
    builder.addCase(getUserFriendsList.fulfilled, (state, action) => {
      state.loading = false
      const page = action.meta?.arg?.start ?? 1
      const items = action.payload.friends || action.payload.data || []
      const total = action.payload.total || 0

      if (page > 1) {
        const existing = new Set(state.friendsList.map(u => u._id))
        const toAdd = items.filter(u => !existing.has(u._id))
        state.friendsList = state.friendsList.concat(toAdd)
      } else {
        state.friendsList = items
      }
      state.friendsTotal = total
    })
    builder.addCase(getUserFriendsList.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload.message
    })
  }
})

export const { setUserDateRange, setUserPage, setUserPageSize, resetConnections } = userSlice.actions
export default userSlice.reducer
