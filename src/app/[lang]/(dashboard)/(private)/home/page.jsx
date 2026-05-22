import Grid from '@mui/material/Grid2'

import CongratulationsJohn from './Congratulations'

export default function Page() {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12, md: 4 }}>
        <CongratulationsJohn />
      </Grid>
    </Grid>
  )
}
