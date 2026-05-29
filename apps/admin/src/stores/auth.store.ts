import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AdminUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
}

interface AuthState {
  admin: AdminUser | null
  accessToken: string | null
  isAuthenticated: boolean
  setAuth: (admin: AdminUser, token: string) => void
  setAccessToken: (token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      admin: null,
      accessToken: null,
      isAuthenticated: false,
      setAuth: (admin, accessToken) => set({ admin, accessToken, isAuthenticated: true }),
      setAccessToken: (accessToken) => set({ accessToken }),
      logout: () => set({ admin: null, accessToken: null, isAuthenticated: false }),
    }),
    {
      name: 'bizplus-admin-auth',
      partialize: (state) => ({
        admin: state.admin,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
      }),
    },
  ),
)
