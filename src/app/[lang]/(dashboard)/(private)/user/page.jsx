import Users from "../../../../../views/apps/users"

import { getUserData } from '@/app/server/actions'

const User = async () => {
    // Vars
  const data = await getUserData()

  return <Users userData={data} />
}

export default User
