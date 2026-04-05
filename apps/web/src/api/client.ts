import axios from 'axios'
import { useAuthStore } from '../stores/auth.store'

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : '/api/v1'

export const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // send cookies (refresh token)
  headers: { 'Content-Type': 'application/json' },
})

// Attach access token to every request
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto-refresh on 401
let isRefreshing = false
let failedQueue: Array<{ resolve: Function; reject: Function }> = []

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return apiClient(original)
        })
      }

      original._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.post(
          `${API_BASE}/auth/refresh`,
          {},
          { withCredentials: true },
        )
        const newToken = data.data.accessToken
        useAuthStore.getState().setAccessToken(newToken)
        failedQueue.forEach(({ resolve }) => resolve(newToken))
        failedQueue = []
        original.headers.Authorization = `Bearer ${newToken}`
        return apiClient(original)
      } catch {
        failedQueue.forEach(({ reject }) => reject(error))
        failedQueue = []
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  },
)

// Typed API functions
export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }).then(r => r.data),
  register: (data: any) =>
    apiClient.post('/auth/register', data).then(r => r.data),
  logout: () =>
    apiClient.post('/auth/logout').then(r => r.data),
  me: () =>
    apiClient.get('/auth/me').then(r => r.data),

  // Tenant
  getMyTenant: () =>
    apiClient.get('/tenants/me').then(r => r.data),
  updateTenant: (data: any) =>
    apiClient.patch('/tenants/me', data).then(r => r.data),

  // Dashboard
  getDashboardToday: () =>
    apiClient.get('/dashboard/today').then(r => r.data),
  getDashboardStats: (from: string, to: string) =>
    apiClient.get('/dashboard/stats', { params: { from, to } }).then(r => r.data),

  // Appointments
  getAppointments: (params: any) =>
    apiClient.get('/appointments', { params }).then(r => r.data),
  getAppointment: (id: string) =>
    apiClient.get(`/appointments/${id}`).then(r => r.data),
  createAppointment: (data: any) =>
    apiClient.post('/appointments', data).then(r => r.data),
  updateAppointmentStatus: (id: string, status: string, cancelReason?: string) =>
    apiClient.patch(`/appointments/${id}/status`, { status, cancelReason }).then(r => r.data),
  getAvailability: (params: any) =>
    apiClient.get('/appointments/availability', { params }).then(r => r.data),

  // Customers
  getCustomers: (params?: any) =>
    apiClient.get('/customers', { params }).then(r => r.data),
  getCustomer: (id: string) =>
    apiClient.get(`/customers/${id}`).then(r => r.data),
  createCustomer: (data: any) =>
    apiClient.post('/customers', data).then(r => r.data),
  updateCustomer: (id: string, data: any) =>
    apiClient.patch(`/customers/${id}`, data).then(r => r.data),

  // Services
  getServices: () =>
    apiClient.get('/services').then(r => r.data),
  createService: (data: any) =>
    apiClient.post('/services', data).then(r => r.data),
  updateService: (id: string, data: any) =>
    apiClient.patch(`/services/${id}`, data).then(r => r.data),
  deleteService: (id: string) =>
    apiClient.delete(`/services/${id}`).then(r => r.data),

  // Providers
  getProviders: () =>
    apiClient.get('/providers').then(r => r.data),
  getProvider: (id: string) =>
    apiClient.get(`/providers/${id}`).then(r => r.data),
  getProviderSchedule: (id: string) =>
    apiClient.get(`/providers/${id}/schedule`).then(r => r.data),
  updateProviderSchedule: (id: string, schedule: any[]) =>
    apiClient.put(`/providers/${id}/schedule`, { schedule }).then(r => r.data),

  // Locations
  getLocations: () =>
    apiClient.get('/locations').then(r => r.data),
}
