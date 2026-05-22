import axios from 'axios'
import { baseURL, key } from '@/utils/config'

export const getLogin = async () => {
  const response = await axios.get(`${baseURL}api/admin/verifyAdminRegistration`, {
    headers: {
      'Content-Type': 'application/json',
      key: key
    }
  })

  return response.data
}
