'use client'

// Next Imports
import { useState, useEffect } from 'react'

import dynamic from 'next/dynamic'

// React Imports
import { useSelector } from 'react-redux'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { useTheme } from '@mui/material/styles'

// Styled Component Imports
const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'), { ssr: false })

const ActivityOverview = () => {
  const theme = useTheme()
  const { graphStats, loading } = useSelector(state => state.dashboard)
  const [chartMounted, setChartMounted] = useState(false)

  // Wait until component is mounted before rendering chart
  useEffect(() => {
    setChartMounted(true)
  }, [])

  // Process data for each series
  const processChartData = (data, dateField = 'date', countField = 'count') => {
    if (!data || data.length === 0) {
      return {
        dates: [],
        counts: []
      }
    }

    try {
      const sortedData = [...data].sort((a, b) => {
        if (!a[dateField] || !b[dateField]) return 0
        return new Date(a[dateField]) - new Date(b[dateField])
      })

      const dates = sortedData.map(item => {
        if (!item || !item[dateField]) return ''

        try {
          const date = new Date(item[dateField])
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        } catch (e) {
          return ''
        }
      })

      const counts = sortedData.map(item => item?.[countField] || 0)

      return { dates, counts }
    } catch (error) {
      console.error(`Error processing data:`, error)
      return { dates: [], counts: [] }
    }
  }

  // Get data for all series
  const pendingAdsData = processChartData(graphStats.ads?.pending || [])
  const approvedAdsData = processChartData(graphStats.ads?.approved || [])
  // const permanentRejectedAdsData = processChartData(graphStats.ads?.permanentRejected || [])
  // const softRejectedAdsData = processChartData(graphStats.ads?.softRejected || [])
  const userData = processChartData(graphStats.user || [])
  const sellerData = processChartData(graphStats.seller || [])

  // Get all unique dates across all series
  const getAllDates = () => {
    const allDates = [
      ...pendingAdsData.dates,
      ...approvedAdsData.dates,
      // ...permanentRejectedAdsData.dates,
      // ...softRejectedAdsData.dates,
      ...userData.dates,
      ...sellerData.dates
    ]

    const uniqueDates = [...new Set(allDates)].filter(date => date)

    // If we have no data, return some default dates
    if (uniqueDates.length === 0) {
      return ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7']
    }

    return uniqueDates.sort((a, b) => {
      try {
        // Try to interpret as dates
        const dateA = new Date(a)
        const dateB = new Date(b)

        return dateA - dateB
      } catch (e) {
        // If dates can't be compared, sort alphabetically
        return a.localeCompare(b)
      }
    })
  }

  const chartCategories = getAllDates()

  // Create series with aligned data points
  const createAlignedSeries = (data, name, color) => {
    // Create a map of date to count
    const dateCountMap = {}

    data.dates.forEach((date, index) => {
      dateCountMap[date] = data.counts[index]
    })

    // Map through all categories and get corresponding count or 0
    const alignedCounts = chartCategories.map(date => dateCountMap[date] || 0)

    return {
      name,
      type: 'line',
      data: alignedCounts.length > 0 ? alignedCounts : [0, 0, 0, 0, 0, 0, 0],
      color
    }
  }

  // Generate chart series
  const series = [
    createAlignedSeries(userData, 'Users', theme.palette.warning.main),
    createAlignedSeries(sellerData, 'Sellers', theme.palette.success.main),
    createAlignedSeries(pendingAdsData, 'Pending Ads', theme.palette.primary.main),
    createAlignedSeries(approvedAdsData, 'Approved Ads', theme.palette.info.main)
    // createAlignedSeries(permanentRejectedAdsData, 'Permanent Rejected Ads', theme.palette.error.main),
    // createAlignedSeries(softRejectedAdsData, 'Soft Rejected Ads', theme.palette.secondary.main)
  ]

  const isDark = theme.palette.mode === 'dark'

  // Chart options
  const options = {
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false },
      stacked: false
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '20%'
      }
    },
    stroke: {
      width: [2, 2, 2],
      curve: 'smooth'
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'left',
      fontSize: '14px',
      fontFamily: theme.typography.fontFamily,
      offsetY: 0,
      labels: {
        colors: isDark ? '#E0E0E0' : '#333333'
      },
      markers: {
        radius: 10,
        width: 10,
        height: 10
      },
      itemMargin: {
        horizontal: 10,
        vertical: 0
      }
    },
    grid: {
      borderColor: isDark ? '#5A5A5A' : '#E0E0E0',
      strokeDashArray: 6,
      padding: {
        top: 10
      },
      xaxis: {
        lines: { show: true }
      }
    },
    colors: [
      theme.palette.warning.main,
      theme.palette.success.main,
      theme.palette.primary.main,
      theme.palette.error.light,
      theme.palette.info.main,
      theme.palette.secondary.main
    ],
    xaxis: {
      categories:
        chartCategories.length > 0 ? chartCategories : ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
      tickAmount: 10,
      tickPlacement: 'on',
      labels: {
        show: true,
        style: {
          colors: isDark ? '#CCCCCC' : '#4B4B4B',
          fontSize: '12px',
          fontFamily: theme.typography.fontFamily
        }
      },
      axisTicks: { show: false, color: isDark ? '#666' : '#999' },
      axisBorder: { show: false }
    },
    yaxis: {
      min: 0,
      max: undefined,
      tickAmount: 4,
      labels: {
        style: {
          colors: isDark ? '#CCCCCC' : '#4B4B4B',
          fontSize: '12px',
          fontFamily: theme.typography.fontFamily
        }
      }
    },
    tooltip: {
      shared: true,
      intersect: false
    }
  }

  const renderChart = () => {
    if (!chartMounted) return null

    return <AppReactApexCharts type='line' height={350} options={options} series={series} />
  }

  const isLoading = loading.graphStats.ads || loading.graphStats.user || loading.graphStats.seller

  return (
    <Card>
      <CardHeader
        title='Activity Overview'
        titleTypographyProps={{ sx: { fontWeight: 600, fontSize: '1.25rem' } }}
        subheader='Combined view of users, sellers, and ads activity'
        subheaderTypographyProps={{ sx: { color: 'text.disabled' } }}
      />
      <CardContent sx={{ pt: 0 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress size={40} />
          </Box>
        ) : (
          renderChart()
        )}
      </CardContent>
    </Card>
  )
}

export default ActivityOverview
