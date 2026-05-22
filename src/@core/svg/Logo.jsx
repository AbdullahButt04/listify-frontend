import Image from 'next/image'
import mainLogo from '../../images/main-logo-outline.png'

const Logo = props => {
  return <Image src={mainLogo} width='40' height='40' alt='logo' {...props} />
}

export default Logo
