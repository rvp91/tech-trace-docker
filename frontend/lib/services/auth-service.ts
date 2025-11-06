// Authentication service

import { apiClient } from "../api-client"
import type { User } from "../types"

export interface LoginCredentials {
  username: string
  password: string
  remember?: boolean
}

export interface LoginResponse {
  user: User
  access: string
  refresh: string
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>("/auth/login/", credentials)
    // El token se sincronizará a través del auth-store
    return response
  },

  async logout(refreshToken?: string): Promise<void> {
    try {
      if (refreshToken) {
        await apiClient.post("/auth/logout/", { refresh_token: refreshToken })
      }
    } catch (error) {
      // Ignorar errores al hacer logout
      console.error("Error al hacer logout en el servidor:", error)
    }
  },

  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>("/auth/me/")
  },

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>("/auth/refresh/", { refresh: refreshToken })
    return response
  },
}
