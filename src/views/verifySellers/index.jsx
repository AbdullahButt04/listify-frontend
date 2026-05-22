'use client'

import React, { useState, useEffect } from 'react'
import { Typography, Grid2, Box, Tab } from '@mui/material'
import { TabContext, TabPanel } from '@mui/lab'
import CustomTabList from '@/@core/components/mui/TabList'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDispatch } from 'react-redux'

// Component Imports
import VerificationTable from './VerificationTable'

// Utils Imports
import { VERIFICATION_STATUS } from '@/utils/constants'
import { setCurrentStatus } from '@/redux-store/slices/verification'

const VerifySellers = () => {
  const router = useRouter()
  const dispatch = useDispatch()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab') || VERIFICATION_STATUS.PENDING.toString()
  const [activeTab, setActiveTab] = useState(tabParam)

  useEffect(() => {
    setActiveTab(tabParam)
    dispatch(setCurrentStatus(Number(tabParam)))
  }, [tabParam, dispatch])

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
    router.push(`?tab=${newValue}`)
    dispatch(setCurrentStatus(Number(newValue)))
  }

  return (
    <>
      <Typography variant='h5' className='mb-6'>
        Verification
      </Typography>
      <TabContext value={activeTab}>
        <Box sx={{ mb: 4 }}>
          <CustomTabList onChange={handleTabChange} variant='scrollable' pill='true'>
            <Tab
              label='Pending'
              value={VERIFICATION_STATUS.PENDING.toString()}
              icon={<i className='tabler-clock' />}
              iconPosition='start'
              sx={{ '& .MuiTab-iconWrapper': { mr: 1 } }}
            />
            <Tab
              label='Approved'
              value={VERIFICATION_STATUS.ACCEPTED.toString()}
              icon={<i className='tabler-check' />}
              iconPosition='start'
              sx={{ '& .MuiTab-iconWrapper': { mr: 1 } }}
            />
            <Tab
              label='Rejected'
              value={VERIFICATION_STATUS.DECLINED.toString()}
              icon={<i className='tabler-x' />}
              iconPosition='start'
              sx={{ '& .MuiTab-iconWrapper': { mr: 1 } }}
            />
          </CustomTabList>
        </Box>
        <TabPanel value={VERIFICATION_STATUS.PENDING.toString()} sx={{ p: 0 }}>
          <VerificationTable status={VERIFICATION_STATUS.PENDING} />
        </TabPanel>
        <TabPanel value={VERIFICATION_STATUS.ACCEPTED.toString()} sx={{ p: 0 }}>
          <VerificationTable status={VERIFICATION_STATUS.ACCEPTED} />
        </TabPanel>
        <TabPanel value={VERIFICATION_STATUS.DECLINED.toString()} sx={{ p: 0 }}>
          <VerificationTable status={VERIFICATION_STATUS.DECLINED} />
        </TabPanel>
      </TabContext>
    </>
  )
}

export default VerifySellers
