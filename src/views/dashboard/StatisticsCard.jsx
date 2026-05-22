'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid2'
import { useSelector } from 'react-redux'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'
import { StatisticsCardSkeleton } from './SkeletonLoaders'

const StatisticsCard = () => {
  const { metrics, loading } = useSelector(state => state.dashboard)

  if (loading.metrics) {
    return <StatisticsCardSkeleton />
  }

  const data = [
    {
      stats: metrics.totalUsers || 0,
      title: 'Total Users',
      color: 'success',
      icon: 'tabler-users'
    },
    {
      stats: metrics.totalBlockedUsers || 0,
      title: 'Blocked Users',
      color: 'error',
      icon: 'tabler-ban'
    },
    {
      stats: metrics.totalCategories || 0,
      title: 'Total Categories',
      color: 'warning',
      icon: 'tabler-category'
    },
    {
      stats: metrics.totalApprovedAds || 0,
      title: 'Approved Ads',
      color: 'success',
      icon: 'tabler-check'
    },
    {
      stats: metrics.totalAttributes || 0,
      title: 'Attributes',
      color: 'warning',
      icon: 'tabler-list-details'
    },
    {
      stats: metrics.totalAdVideos || 0,
      title: 'Ad Videos',
      color: 'secondary',
      icon: 'tabler-video'
    }
  ]

  return (
    <Card>
      <CardHeader
        title='Statistics'
        titleTypographyProps={{ sx: { fontWeight: 600, fontSize: '1.25rem' } }}
        subheader='Combined view of users, sellers, and ads activity'
        subheaderTypographyProps={{ sx: { color: 'text.disabled' } }}
      />
      <CardContent className='flex justify-between flex-wrap gap-4 max-md:pbe-6 max-[1060px]:pbe-[74px] max-[1200px]:pbe-[52px] max-[1320px]:pbe-[74px] max-[1501px]:pbe-[52px]'>
        <Grid container spacing={4} sx={{ inlineSize: '100%' }}>
          {data.map((item, index) => (
            <Grid key={index} size={{ xs: 12, sm: 6, md: 3, lg: 2 }} className='flex items-center gap-4'>
              <CustomAvatar color={item.color} variant='rounded' size={40} skin='light'>
                <i className={item.icon}></i>
              </CustomAvatar>
              <div className='flex flex-col'>
                <Typography variant='h5'>{item.stats}</Typography>
                <Typography variant='body2' className='text-nowrap'>
                  {item.title}
                </Typography>
              </div>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  )
}

export default StatisticsCard
