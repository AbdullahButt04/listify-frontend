'use client'

import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Slide,
  Typography,
  Tabs,
  Tab,
  Box,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
  Rating
} from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import { getFullImageUrl } from '@/utils/commonfunctions'
import {
  getUserFollowingList,
  getUserFollowerList,
  getUserFriendsList,
  resetConnections
} from '@/redux-store/slices/user'

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

function a11yProps(index) {
  return { id: `conn-tab-${index}`, 'aria-controls': `conn-tabpanel-${index}` }
}

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role='tabpanel'
    hidden={value !== index}
    id={`conn-tabpanel-${index}`}
    aria-labelledby={`conn-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ pt: 1 }}>{children}</Box>}
  </div>
)

const LIMIT = 10

const ConnectionListDialog = ({ open, onClose, user = null }) => {
  const dispatch = useDispatch()
  const contentRef = useRef(null)

  const userId = user?._id || user?.id

  const [tab, setTab] = useState(0) // 0=Following, 1=Followers, 2=Friends

  // per-tab page (1-based)
  const [followingPage, setFollowingPage] = useState(1)
  const [followersPage, setFollowersPage] = useState(1)
  const [friendsPage, setFriendsPage] = useState(1)

  const loading = useSelector(s => s.users.loading)
  const { followingList, followingTotal, followerList, followerTotal, friendsList, friendsTotal } = useSelector(s => ({
    followingList: s.users.followingList,
    followingTotal: s.users.followingTotal,
    followerList: s.users.followerList,
    followerTotal: s.users.followerTotal,
    friendsList: s.users.friendsList,
    friendsTotal: s.users.friendsTotal
  }))

  // Handy memoized “has more” per tab
  const hasMore = useMemo(() => {
    if (tab === 0) return followingList.length < (followingTotal || 0)
    if (tab === 1) return followerList.length < (followerTotal || 0)
    return friendsList.length < (friendsTotal || 0)
  }, [tab, followingList.length, followerList.length, friendsList.length, followingTotal, followerTotal, friendsTotal])

  // Loaders
  const loadFollowing = useCallback(
    page => {
      if (!userId) return
      dispatch(getUserFollowingList({ userId, start: page, limit: LIMIT }))
    },
    [dispatch, userId]
  )
  const loadFollowers = useCallback(
    page => {
      if (!userId) return
      dispatch(getUserFollowerList({ userId, start: page, limit: LIMIT }))
    },
    [dispatch, userId]
  )
  const loadFriends = useCallback(
    page => {
      if (!userId) return
      dispatch(getUserFriendsList({ userId, start: page, limit: LIMIT }))
    },
    [dispatch, userId]
  )

  // Reset + initial fetch when dialog opens or user changes
  useEffect(() => {
    if (!open || !userId) return

    // clear previous user’s connections
    dispatch(resetConnections())
    setFollowingPage(1)
    setFollowersPage(1)
    setFriendsPage(1)

    // load first tab’s first page
    if (tab === 0) loadFollowing(1)
    if (tab === 1) loadFollowers(1)
    if (tab === 2) loadFriends(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId])

  // When tab changes, ensure first page is loaded if list empty
  useEffect(() => {
    if (!open || !userId) return
    if (tab === 0 && followingList.length === 0) {
      setFollowingPage(1)
      loadFollowing(1)
    }
    if (tab === 1 && followerList.length === 0) {
      setFollowersPage(1)
      loadFollowers(1)
    }
    if (tab === 2 && friendsList.length === 0) {
      setFriendsPage(1)
      loadFriends(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const handleClose = () => onClose()

  // Infinite scroll on the DialogContent (scroll="paper")
  const onScroll = useCallback(
    e => {
      const el = e.currentTarget
      const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 24

      if (!nearBottom || loading || !hasMore) return

      if (tab === 0) {
        const next = followingPage + 1
        setFollowingPage(next)
        loadFollowing(next)
      } else if (tab === 1) {
        const next = followersPage + 1
        setFollowersPage(next)
        loadFollowers(next)
      } else {
        const next = friendsPage + 1
        setFriendsPage(next)
        loadFriends(next)
      }
    },
    [tab, loading, hasMore, followingPage, followersPage, friendsPage, loadFollowing, loadFollowers, loadFriends]
  )

  const renderList = (items, emptyText) => {
    if (!loading && items.length === 0) {
      return (
        <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
          <Typography variant='body1'>{emptyText}</Typography>
        </Box>
      )
    }

    return (
      <>
        <List disablePadding>
          {items.map(u => (
            <ListItem key={u._id} divider sx={{ px: 0 }}>
              <ListItemAvatar>
                <Avatar
                  src={u.profileImage ? getFullImageUrl(u.profileImage) : undefined}
                  alt={u.name}
                  sx={{ width: 40, height: 40 }}
                >
                  {u?.name?.[0]?.toUpperCase() || '?'}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                className='flex justify-between'
                primary={
                  <>
                    <Typography fontWeight={600} noWrap component='div'>
                      {u.name || 'Anonymous'}
                    </Typography>
                    {u.email && (
                      <Typography noWrap component='span'>
                        {u.email}
                      </Typography>
                    )}
                  </>
                }
                secondary={
                  <Box className='flex flex-col gap-'>
                    <Typography noWrap component='span'>
                      @{u.profileId}
                    </Typography>
                    <Rating defaultValue={u.averageRating} name='size-small' size='small' readOnly />
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>

        {/* Loader at bottom for "next page" */}
        {loading && (
          <Box sx={{ py: 2, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={22} />
          </Box>
        )}
      </>
    )
  }

  return (
    <Dialog
      open={open}
      keepMounted
      scroll='paper'
      onClose={handleClose}
      TransitionComponent={Transition}
      closeAfterTransition={false}
      fullWidth
      maxWidth='md'
      PaperProps={{
        sx: { overflow: 'visible', width: '600px', maxWidth: '95vw' }
      }}
    >
      <DialogTitle sx={{ pr: 7 }}>
        {/* <Typography variant='h5' component='span'> */}
        {user?.name || 'Anonymous user'}&rsquo;s connections
        {/* </Typography> */}
        <DialogCloseButton onClick={handleClose}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>
      <DialogContent ref={contentRef} className='py-2' onScroll={onScroll}>
        <Box sx={{ px: 3, pt: 0 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant='fullWidth' aria-label='connections tabs'>
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>Following</span>
                </Box>
              }
              {...a11yProps(0)}
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>Followers</span>
                </Box>
              }
              {...a11yProps(1)}
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>Friends</span>
                </Box>
              }
              {...a11yProps(2)}
            />
          </Tabs>
        </Box>

        <TabPanel value={tab} index={0}>
          {renderList(followingList, 'No following yet.')}
        </TabPanel>

        <TabPanel value={tab} index={1}>
          {renderList(followerList, 'No followers yet.')}
        </TabPanel>

        <TabPanel value={tab} index={2}>
          {renderList(friendsList, 'No friends yet.')}
        </TabPanel>
      </DialogContent>
    </Dialog>
  )
}

export default ConnectionListDialog
