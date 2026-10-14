import axios from 'axios'
import Cookies from 'js-cookie'

export const baseBackendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:1248'

export const api = axios.create({
  baseURL: baseBackendUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('saminvest-token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    return Promise.reject(error)
  }
)
