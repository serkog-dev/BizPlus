import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  tenantId: string
}

interface Tenant {
  id: string
  name: string
  slug: string
  plan: string
  logoUrl?: string
  brandColors?: { primary: string; secondary: string }
  onboardingCompleted: boolean
}

interface AuthState {
  user: User | null
  tenant: Tenant | null
  accessToken: string | null
  isAuthenticated: boolean
  setAuth: (user: User, tenant: Tenant, token: string) => void
  setAccessToken: (token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tenant: null,
      accessToken: null,
      isAuthenticated: false,
      setAuth: (user, tenant, accessToken) =>
        set({ user, tenant, accessToken, isAuthenticated: true }),
      setAccessToken: (accessToken) => set({ accessToken }),
      logout: () => set({ user: null, tenant: null, accessToken: null, isAuthenticated: false }),
    }),
    {
      name: 'bizplus-auth',
      partialize: (state) => ({
        user: state.user,
        tenant: state.tenant,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
      }),
    },
  ),
)
