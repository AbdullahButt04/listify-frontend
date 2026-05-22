import CountriesList from '@/views/apps/ecommerce/dashboard/CountriesList'
import { getAllCountries } from '@/app/server/actions'

const EcommerceDashboard = async () => {
  const countries = await getAllCountries()

  return <CountriesList invoiceData={countries} />
}

export default EcommerceDashboard
