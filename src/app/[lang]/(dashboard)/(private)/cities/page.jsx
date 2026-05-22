import { getAllCountries } from '@/app/server/actions'
import Cities from '../../../../../views/cities'

const Page = async () => {
  const countries = await getAllCountries()

  return <Cities invoiceData={countries} />
}

export default Page
