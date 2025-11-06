// Authentication state management using Zustand

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User } from "../types"
import { apiClient } from "../api-client"

interface AuthStore {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  clearAuth: () => void
  updateUser: (user: User) => void
  initializeAuth: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, refreshToken) => {
        // Sincronizar access token con api-client
        apiClient.setToken(accessToken)

        // Guardar cookie para el middleware (solo en el cliente)
        if (typeof document !== "undefined") {
          document.cookie = `techtrace-auth=true; path=/; max-age=${60 * 60 * 24 * 7}` // 7 días
        }

        set({ user, token: accessToken, refreshToken, isAuthenticated: true })
      },
      clearAuth: () => {
        // Limpiar token del api-client
        apiClient.setToken(null)

        // Eliminar cookie
        if (typeof document !== "undefined") {
          document.cookie = "techtrace-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        }

        set({ user: null, token: null, refreshToken: null, isAuthenticated: false })
      },
      updateUser: (user) => set({ user }),
      initializeAuth: () => {
        // Sincronizar token del store con api-client al cargar
        const state = get()
        if (state.token) {
          apiClient.setToken(state.token)
        }
      },
    }),
    {
      name: "techtrace-auth",
    },
  ),
)
