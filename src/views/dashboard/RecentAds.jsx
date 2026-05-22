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
import { SALE_TYPE, AD_LISTING_TYPE } from '@/utils/constants'

const SaleTypeMap = {
  [SALE_TYPE.BUY_NOW]: { label: 'Sale', color: 'success' },
  [SALE_TYPE.AUCTION]: { label: 'Rent', color: 'info' }
}

const StatusMap = {
  [AD_LISTING_TYPE.PENDING]: { label: 'Pending', color: 'warning' },
  [AD_LISTING_TYPE.APPROVED]: { label: 'Approved', color: 'success' }
}

const RecentAds = () => {
  const { recentAds, loading } = useSelector(state => state.dashboard)
  const [showAll, setShowAll] = useState(false)
  const displayedRecentAds = showAll ? recentAds : recentAds.slice(0, 5)

  if (loading.recentAds) {
    return <UserListSkeleton />
  }

  if (recentAds.length === 0) return null

  return (
    <Card>
      <CardHeader title='Latest Ads' titleTypographyProps={{ sx: { fontWeight: 600, fontSize: '1.25rem' } }} />
      <CardContent sx={{ pt: 0 }}>
        {displayedRecentAds && displayedRecentAds.length > 0 ? (
          displayedRecentAds.map(ad => (
            <Box
              key={ad._id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 3,
                gap: 2,
                '&:last-child': { mb: 0 }
              }}
            >
              <Avatar
                src={ad.primaryImage && ad.primaryImage.startsWith('uploads') ? getFullImageUrl(ad.primaryImage) : null}
                alt={ad.title}
                variant='rounded'
                sx={{ width: 50, height: 50 }}
              />
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant='body1' sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {ad.title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar
                    src={
                      ad.seller?.profileImage && ad.seller.profileImage.startsWith('uploads')
                        ? getFullImageUrl(ad.seller.profileImage)
                        : null
                    }
                    alt={ad.seller?.name}
                    sx={{ width: 20, height: 20 }}
                  />
                  <Typography variant='caption' sx={{ color: 'text.secondary' }}>
                    {ad.seller?.name}
                  </Typography>
                  <Typography variant='caption' sx={{ color: 'text.disabled' }}>
                    • {ad.category?.name}
                  </Typography>
                </Box>
              </Box>
              <Box className='flex flex-col items-end'>
                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, justifyContent: 'flex-end' }}>
                  <Chip
                    label={SaleTypeMap[ad.saleType]?.label || 'Sale'}
                    color={SaleTypeMap[ad.saleType]?.color || 'default'}
                    size='small'
                    variant='tonal'
                  />
                  <Chip
                    label={StatusMap[ad.status]?.label || 'Pending'}
                    color={StatusMap[ad.status]?.color || 'default'}
                    size='small'
                    variant='tonal'
                  />
                </Box>
                <Typography variant='body2' sx={{ fontWeight: 600, color: 'primary.main' }}>
                  ${ad.price.toFixed(2)}
                </Typography>
                <Typography variant='caption' sx={{ display: 'block', color: 'text.disabled', mt: 1 }}>
                  {ad.createdAt ? formatDistanceToNow(new Date(ad.createdAt), { addSuffix: true }) : ''}
                </Typography>
              </Box>
            </Box>
          ))
        ) : (
          <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>No recent ads found</Typography>
        )}
      </CardContent>
      {recentAds && recentAds.length > 5 && (
        <CardActions sx={{ justifyContent: 'center', mt: 2 }}>
          <Button variant='text' onClick={() => setShowAll(!showAll)}>
            {showAll ? 'Show Less' : 'Show More'}
          </Button>
        </CardActions>
      )}
    </Card>
  )
}

export default RecentAds
