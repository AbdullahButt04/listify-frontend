'use client'

import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import DateRangePicker from '@/libs/styles/DateRangePicker'
import StatisticsCard from './StatisticsCard'
import { Box, Typography, Grid } from '@mui/material'
import ActivityOverview from './ActivityOverview'
import RecentUsers from './RecentUsers'
import RecentAds from './RecentAds'
import {
  getDashboardMetrics,
  getDashboardGraphStats,
  getRecentUsers,
  getRecentAds
} from '@/redux-store/slices/dashboard'

const serialize = d => (typeof d === 'string' ? d : d instanceof Date ? d.toISOString().slice(0, 10) : null)

const Dashboard = () => {
  const dispatch = useDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // ---- Initialize from URL (or fall back to 'All')
  const urlStart = searchParams.get('start') || 'All'
  const urlEnd = searchParams.get('end') || 'All'

  const [dateRange, setDateRange] = useState({
    startDate: urlStart,
    endDate: urlEnd
  })

  // ---- Keep URL in sync with state
  const syncQuery = (start, end) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    if (start && end) {
      params.set('start', start)
      params.set('end', end)
    } else {
      params.delete('start')
      params.delete('end')
    }
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  // ---- When user applies a new range, update state + URL
  const handleDateRangeChange = (startDate, endDate) => {
    const start = serialize(startDate)
    const end = serialize(endDate)

    if (dateRange.startDate === 'All' && dateRange.endDate === 'All' && startDate === 'All' && endDate === 'All') {
      return
    }

    if (start && end) {
      setDateRange({ startDate: start, endDate: end })
      syncQuery(start, end)
    } else {
      setDateRange({ startDate: 'All', endDate: 'All' })
      syncQuery(null, null)
    }
  }

  // ---- If the URL changes (back/forward), keep state in sync
  // useEffect(() => {
  //   const s = searchParams.get('start') || 'All'
  //   const e = searchParams.get('end') || 'All'
  //   if (s !== dateRange.startDate || e !== dateRange.endDate) {
  //     setDateRange({ startDate: s, endDate: e })
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [searchParams])

  // ---- Fetch data whenever dateRange changes (incl. first load)
  useEffect(() => {
    const { startDate, endDate } = dateRange
    dispatch(getDashboardMetrics())
    dispatch(getDashboardGraphStats({ startDate, endDate, type: 'ads' }))
    dispatch(getDashboardGraphStats({ startDate, endDate, type: 'user' }))
    dispatch(getDashboardGraphStats({ startDate, endDate, type: 'seller' }))
    dispatch(getRecentUsers({ startDate, endDate }))
    dispatch(getRecentAds({ startDate, endDate }))
  }, [dateRange, dispatch])

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }} className='flex-wrap gap-2'>
        <Typography variant='h5'>Dashboard</Typography>

        <DateRangePicker
          buttonText={
            dateRange.startDate !== 'All' && dateRange.endDate !== 'All'
              ? `${dateRange.startDate} - ${dateRange.endDate}`
              : 'Filter by Date'
          }
          initialStartDate={dateRange.startDate !== 'All' ? new Date(dateRange.startDate) : null}
          initialEndDate={dateRange.endDate !== 'All' ? new Date(dateRange.endDate) : null}
          onApply={handleDateRangeChange}
          showClearButton={dateRange.startDate !== 'All' && dateRange.endDate !== 'All'}
        />
      </Box>

      {/* Statistics Card */}
      <Grid container spacing={5} sx={{ mt: 1 }}>
        <Grid item xs={12} lg={12}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <StatisticsCard />
            {/* Left Column - Activity Overview */}
            <ActivityOverview />
          </Box>
        </Grid>

        {/* Right Column - Recent Users & Ads */}
        <Grid item xs={12} lg={6}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <RecentUsers />
            {/* <RecentAds /> */}
          </Box>
        </Grid>
        <Grid item xs={12} lg={6}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {/* <RecentUsers /> */}
            <RecentAds />
          </Box>
        </Grid>
      </Grid>
    </>
  )
}

export default Dashboard
