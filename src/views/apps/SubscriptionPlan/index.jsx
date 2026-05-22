// MUI Imports
import Grid from '@mui/material/Grid2'

import SubscriptionPlanTable from './SubscriptionPlanTable'

const SubscriptionPlan = () => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <SubscriptionPlanTable />
      </Grid>
    </Grid>
  )
}

export default SubscriptionPlan
