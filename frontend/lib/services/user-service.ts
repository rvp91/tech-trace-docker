// User management service (admin only)

import { apiClient } from "../api-client"
import type { User } from "../types"

export interface CreateUserData {
  username: string
  email: string
  password: string
  role: "ADMIN" | "OPERADOR"
  first_name?: string
  last_name?: string
}

export interface UpdateUserData {
  email?: string
  role?: "ADMIN" | "OPERADOR"
  first_name?: string
  last_name?: string
  is_active?: boolean
}

export interface ChangePasswordData {
  current_password: string
  new_password: string
  confirm_password: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface UserFilters {
  search?: string
  role?: string
  is_active?: boolean
  ordering?: string
  page?: number
  page_size?: number
}

export const userService = {
  /**
   * Obtiene el perfil del usuario actual autenticado
   */
  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>("/auth/me/")
  },

  /**
   * Actualiza el perfil del usuario actual autenticado
   */
  async updateProfile(data: UpdateUserData): Promise<User> {
    return apiClient.patch<User>("/auth/me/", data)
  },

  /**
   * Cambia la contraseña del usuario actual autenticado
   */
  async changeMyPassword(data: ChangePasswordData): Promise<void> {
    return apiClient.post<void>("/auth/me/change_password/", data)
  },

  /**
   * Obtiene la lista de usuarios con filtros opcionales
   */
  async getUsers(filters?: UserFilters): Promise<PaginatedResponse<User>> {
    // Construir objeto de parámetros
    const params: Record<string, any> = {}

    if (filters?.search) params.search = filters.search
    if (filters?.role) params.role = filters.role
    if (filters?.is_active !== undefined) params.is_active = filters.is_active
    if (filters?.ordering) params.ordering = filters.ordering
    if (filters?.page) params.page = filters.page
    if (filters?.page_size) params.page_size = filters.page_size

    // Usar el método get de apiClient que maneja los parámetros automáticamente
    return apiClient.get<PaginatedResponse<User>>("/auth/users/", params)
  },

  /**
   * Obtiene un usuario por ID
   */
  async getUser(id: number): Promise<User> {
    return apiClient.get<User>(`/auth/users/${id}/`)
  },

  /**
   * Crea un nuevo usuario (solo Admin)
   */
  async createUser(data: CreateUserData): Promise<User> {
    return apiClient.post<User>("/auth/users/", data)
  },

  /**
   * Actualiza un usuario existente (solo Admin)
   */
  async updateUser(id: number, data: UpdateUserData): Promise<User> {
    return apiClient.patch<User>(`/auth/users/${id}/`, data)
  },

  /**
   * Cambia la contraseña de un usuario (solo Admin)
   */
  async changePassword(id: number, data: ChangePasswordData): Promise<void> {
    return apiClient.post<void>(`/auth/users/${id}/change_password/`, data)
  },

  /**
   * Desactiva un usuario (soft delete)
   */
  async deactivateUser(id: number): Promise<User> {
    return apiClient.patch<User>(`/auth/users/${id}/`, { is_active: false })
  },

  /**
   * Activa un usuario
   */
  async activateUser(id: number): Promise<User> {
    return apiClient.patch<User>(`/auth/users/${id}/`, { is_active: true })
  },

  /**
   * Elimina un usuario permanentemente (solo Admin)
   */
  async deleteUser(id: number): Promise<void> {
    return apiClient.delete<void>(`/auth/users/${id}/`)
  },
}
