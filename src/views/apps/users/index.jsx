// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import UserListTable from './UserListTable'
import UserListCards from './UserListCards'
import { Box, Typography } from '@mui/material'

const Users = ({ userData }) => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Box display='flex' alignItems='center' gap={2} mb={2}>
          <Typography variant='h5'>User Management</Typography>
        </Box>
        <UserListCards />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <UserListTable />
      </Grid>
    </Grid>
  )
}

export default Users
