import Grid from '@mui/material/Grid2'

// Component Imports
import ProductListTable from '@views/apps/ecommerce/products/list/ProductListTable'

// Data Imports
import { getEcommerceData } from '@/app/server/actions'

const Advertisement = async () => {
  const data = await getEcommerceData()

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <ProductListTable productData={data?.products} />
      </Grid>
    </Grid>
  )
}

export default Advertisement
