// MUI Imports
import Grid from '@mui/material/Grid2'

import StateList from '@/views/apps/ecommerce/states/StateList'

import { getAllCountries } from '@/app/server/actions'

const EcommerceDashboard = async () => {
  const countries = await getAllCountries()

  return <StateList invoiceData={countries} />
}

export default EcommerceDashboard
