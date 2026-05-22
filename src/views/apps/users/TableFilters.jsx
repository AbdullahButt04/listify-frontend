// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import MenuItem from '@mui/material/MenuItem'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

const TableFilters = ({ onFilterChange, initialFilters }) => {
  const [isOnline, setIsOnline] = useState(initialFilters?.isOnline ?? 'All')
  const [plan, setPlan] = useState(initialFilters?.isBlocked ?? 'All')
  const [status, setStatus] = useState(initialFilters?.isVerified ?? 'All')

  const initialRoleType =
    initialFilters?.roleType ??
    (initialFilters?.isSeller === true ? 'seller' : initialFilters?.isSeller === false ? 'user' : 'unset')

  const [roleType, setRoleType] = useState(initialRoleType)

  useEffect(() => {
    setIsOnline(initialFilters?.isOnline ?? 'All')
    setPlan(initialFilters?.isBlocked ?? 'All')
    setStatus(initialFilters?.isVerified ?? 'All')
    const rt =
      initialFilters?.roleType ??
      (initialFilters?.isSeller === true ? 'seller' : initialFilters?.isSeller === false ? 'user' : 'unset')
    setRoleType(rt)
  }, [initialFilters])

  useEffect(() => {
    onFilterChange({
      isOnline,
      isBlocked: plan,
      isVerified: status,
      roleType
    })
  }, [isOnline, plan, status, roleType, onFilterChange])

  return (
    <CardContent>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12, sm: 3 }}>
          <CustomTextField
            select
            fullWidth
            id='select-online-status'
            value={isOnline}
            onChange={e => setIsOnline(e.target.value)}
            slotProps={{ select: { displayEmpty: true } }}
          >
            <MenuItem value='All'>Select Status</MenuItem>
            <MenuItem value='true'>Online</MenuItem>
            <MenuItem value='false'>Offline</MenuItem>
          </CustomTextField>
        </Grid>

        <Grid size={{ xs: 12, sm: 3 }}>
          <CustomTextField
            select
            fullWidth
            id='select-plan'
            value={plan}
            onChange={e => setPlan(e.target.value)}
            slotProps={{ select: { displayEmpty: true } }}
          >
            <MenuItem value='All'>Select Action</MenuItem>
            <MenuItem value='true'>Block</MenuItem>
            <MenuItem value='false'>Unblock</MenuItem>
          </CustomTextField>
        </Grid>

        <Grid size={{ xs: 12, sm: 3 }}>
          <CustomTextField
            select
            fullWidth
            id='select-status'
            value={status}
            onChange={e => setStatus(e.target.value)}
            slotProps={{ select: { displayEmpty: true } }}
          >
            <MenuItem value='All'>Select Verification</MenuItem>
            <MenuItem value='true'>Verified</MenuItem>
            <MenuItem value='false'>Not Verified</MenuItem>
          </CustomTextField>
        </Grid>

        <Grid size={{ xs: 12, sm: 3 }}>
          <CustomTextField
            select
            fullWidth
            id='select-user-seller'
            value={roleType === 'unset' ? '' : roleType}
            onChange={e => {
              const v = e.target.value
              setRoleType(v === '' ? 'unset' : v)
            }}
            slotProps={{ select: { displayEmpty: true } }}
          >
            <MenuItem value=''>Select User or Seller</MenuItem>
            <MenuItem value='user'>User</MenuItem>
            <MenuItem value='seller'>Seller</MenuItem>
          </CustomTextField>
        </Grid>
      </Grid>
    </CardContent>
  )
}

export default TableFilters
