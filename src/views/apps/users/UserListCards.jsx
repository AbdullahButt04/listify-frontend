'use client'

import { useMemo } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import { useSelector } from 'react-redux'

import HorizontalWithSubtitle from '@components/card-statistics/HorizontalWithSubtitle'

const UserListCards = () => {
  // Get current user type
  const { totalActiveUsers, totalFemaleUsers, totalMaleUsers, totalSellerUsers } = useSelector(state => state.users)

  // Vars
  const cardData = useMemo(() => {
    // Default data for regular and fake users
    // if (type !== 3) {
    return [
      {
        title: 'Total Users',
        stats: totalActiveUsers || 0,
        avatarIcon: 'tabler-users',
        avatarColor: 'secondary',
        trend: 'positive'
      },
      {
        title: 'Females',
        stats: totalFemaleUsers || 0,
        avatarIcon: 'tabler-gender-female',
        avatarColor: 'error',
        trend: 'positive'
      },
      {
        title: 'Males',
        stats: totalMaleUsers || 0,
        avatarIcon: 'tabler-gender-male',
        avatarColor: 'warning',
        trend: 'positive'
      },
      {
        title: 'Sellers',
        stats: totalSellerUsers || 0,
        avatarIcon: 'tabler-building-store',
        avatarColor: 'info',
        trend: 'positive'
      }
    ]
  }, [totalActiveUsers, totalFemaleUsers, totalSellerUsers, totalMaleUsers])

  return (
    <Grid container spacing={6}>
      {cardData.map((item, i) => (
        <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
          <HorizontalWithSubtitle {...item} />
        </Grid>
      ))}
    </Grid>
  )
}

export default UserListCards
