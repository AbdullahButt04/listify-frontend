// MUI Imports
import Grid from '@mui/material/Grid2'
// Component Imports
import PurchaseHistoryTable from './PurchaseHistoryTable'

const PurchaseHistory = () => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <PurchaseHistoryTable />
      </Grid>
    </Grid>
  )
}

export default PurchaseHistory
