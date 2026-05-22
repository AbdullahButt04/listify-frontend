'use client'

import React, { useState, useEffect } from 'react'

import { useRouter, useSearchParams } from 'next/navigation'

import { useDispatch } from 'react-redux'

// MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'

// Redux Actions
import { fetchReportReasons } from '@/redux-store/slices/reportReasons'
import { fetchSetting } from '@/redux-store/slices/setting'

// Tab Components
import GeneralSettings from './tabs/GeneralSettings'
import CurrencySettings from './tabs/CurrencySettings'
import PaymentSettings from './tabs/PaymentSettings'
import WithdrawalSettings from './tabs/WithdrawalSettings'

// Tab labels and values
const tabs = [
  { label: 'General', value: 'general' },
  { label: 'Payment', value: 'payment' },
  { label: 'Currency', value: 'currency' },
  { label: 'Withdrawal', value: 'withdrawal' }
]

const Settings = () => {
  const dispatch = useDispatch()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get the tab from URL query param or default to 'general'
  const tabParam = searchParams.get('tab')

  const [activeTab, setActiveTab] = useState(tabs.some(tab => tab.value === tabParam) ? tabParam : 'general')

  // Fetch settings data when component mounts
  useEffect(() => {
    dispatch(fetchSetting())
    dispatch(fetchReportReasons())
  }, [])

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)

    // Update URL with the new tab
    const params = new URLSearchParams(searchParams.toString())

    params.set('tab', newValue)
    router.push(`?${params.toString()}`)
  }
  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettings />
      case 'payment':
        return <PaymentSettings />
      case 'currency':
        return <CurrencySettings />
      case 'withdrawal':
        return <WithdrawalSettings />
      default:
        return <Typography>Select a tab</Typography>
    }
  }

  return (
    <>
      <Box className='flex items-center justify-between mb-5'>
        <Typography variant='h5'>Settings</Typography>
      </Box>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  aria-label='settings tabs'
                  variant='scrollable'
                  scrollButtons='auto'
                >
                  {tabs.map(tab => (
                    <Tab key={tab.value} label={tab.label} value={tab.value} sx={{ textTransform: 'uppercase' }} />
                  ))}
                </Tabs>
              </Box>
              <Box>{renderTabContent()}</Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  )
}

export default Settings
