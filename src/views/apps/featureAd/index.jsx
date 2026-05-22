// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import FeatureAdTable from './FeatureAdTable'

const Index = () => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <FeatureAdTable />
      </Grid>
    </Grid>
  )
}

export default Index
