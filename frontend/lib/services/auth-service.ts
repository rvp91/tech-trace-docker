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
  token: string
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>("/auth/login", credentials)
    apiClient.setToken(response.token)
    return response
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout")
    } finally {
      apiClient.setToken(null)
    }
  },

  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>("/auth/me")
  },

  async refreshToken(): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>("/auth/refresh")
    apiClient.setToken(response.token)
    return response
  },

  getStoredToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("auth_token")
    }
    return null
  },

  clearStoredToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
    }
  },
}
