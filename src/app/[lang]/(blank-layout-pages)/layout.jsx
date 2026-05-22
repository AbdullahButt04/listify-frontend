// Component Imports
import Providers from '@components/Providers'
import BlankLayout from '@layouts/BlankLayout'
import AuthRedirect from '@/hocs/AuthRedirection'

// Util Imports
import { getSystemMode } from '@core/utils/serverHelpers'

const Layout = async props => {
  const { children } = props

  // Vars
  const direction = 'ltr'
  const systemMode = await getSystemMode()

  return (
    <Providers direction={direction}>
      <AuthRedirect>
        <BlankLayout systemMode={systemMode}>{children}</BlankLayout>
      </AuthRedirect>
    </Providers>
  )
}

export default Layout
