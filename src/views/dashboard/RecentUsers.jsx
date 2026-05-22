'use client'

import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'
import { UserListSkeleton } from './SkeletonLoaders'
import { formatDistanceToNow } from 'date-fns'
import { CardActions } from '@mui/material'
import { Button } from '@mui/material'
import { getFullImageUrl } from '@/utils/commonfunctions'
import { LOGIN_TYPE } from '@/utils/constants'

const LoginTypeMap = {
  [LOGIN_TYPE.EMAIL_PASSWORD]: { label: 'Email', color: 'primary' },
  [LOGIN_TYPE.GOOGLE]: { label: 'Google', color: 'error' },
  [LOGIN_TYPE.APPLE]: { label: 'Apple', color: 'info' },
  [LOGIN_TYPE.MOBILENO]: { label: 'Mobile', color: 'secondary' }
}

const RecentUsers = () => {
  const { recentUsers, loading } = useSelector(state => state.dashboard)
  const [showAll, setShowAll] = useState(false)
  if (loading.recentUsers) {
    return <UserListSkeleton />
  }

  if (recentUsers.length === 0) {
    return null
  }

  const displayedRecentUsers = showAll ? recentUsers : recentUsers.slice(0, 5)

  return (
    <Card>
      <CardHeader title='Recent Users' titleTypographyProps={{ sx: { fontWeight: 600, fontSize: '1.25rem' } }} />
      <CardContent sx={{ pt: 0 }}>
        {displayedRecentUsers && displayedRecentUsers.length > 0 ? (
          displayedRecentUsers.map(user => (
            <Box
              key={user._id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 3,
                gap: 2,
                '&:last-child': { mb: 0 }
              }}
            >
              <Avatar
                src={
                  user.profileImage && user.profileImage.startsWith('uploads')
                    ? getFullImageUrl(user.profileImage)
                    : null
                }
                alt={user.name}
                sx={{ width: 40, height: 40 }}
              >
                {!user.profileImage && user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Avatar>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant='body1' sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.name}
                </Typography>
                <Typography
                  variant='body2'
                  sx={{ color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis' }}
                >
                  {user.email || user.phoneNumber}
                </Typography>
              </Box>
              <Box className='flex flex-col items-end'>
                <Typography variant='caption' sx={{ display: 'block', textAlign: 'right', color: 'text.disabled' }}>
                  {user.createdAt ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true }) : ''}
                </Typography>
                <Chip
                  label={LoginTypeMap[user.loginType]?.label || 'Other'}
                  color={LoginTypeMap[user.loginType]?.color || 'default'}
                  size='small'
                  sx={{ mt: 1 }}
                  variant='tonal'
                />
              </Box>
            </Box>
          ))
        ) : (
          <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>No recent users found</Typography>
        )}
      </CardContent>
      {recentUsers && recentUsers.length > 5 && (
        <CardActions sx={{ justifyContent: 'center', mt: 2 }}>
          <Button variant='text' onClick={() => setShowAll(!showAll)}>
            {showAll ? 'Show Less' : 'Show More'}
          </Button>
        </CardActions>
      )}
    </Card>
  )
}

export default RecentUsers
