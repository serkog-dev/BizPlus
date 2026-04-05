import axios from 'axios'
import { useAuthStore } from '../stores/auth.store'

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : '/api/v1'

const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const api = {
  adminLogin: (email: string, password: string) =>
    apiClient.post('/auth/admin/login', { email, password }),

  getStats: () =>
    apiClient.get('/admin/stats'),

  getTenants: (params?: any) =>
    apiClient.get('/admin/tenants', { params }),

  getTenant: (id: string) =>
    apiClient.get(`/admin/tenants/${id}`),

  updateTenant: (id: string, data: any) =>
    apiClient.patch(`/admin/tenants/${id}`, data),

  getRevenue: (period?: string) =>
    apiClient.get('/admin/revenue', { params: { period } }),
}
