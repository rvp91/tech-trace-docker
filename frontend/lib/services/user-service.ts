// User management service (admin only)

import { apiClient } from "../api-client"
import type { User } from "../types"

export interface CreateUserData {
  username: string
  email: string
  password: string
  role: "admin" | "operator"
}

export const userService = {
  async getUsers(): Promise<User[]> {
    return apiClient.get<User[]>("/users")
  },

  async getUser(id: string): Promise<User> {
    return apiClient.get<User>(`/users/${id}`)
  },

  async createUser(data: CreateUserData): Promise<User> {
    return apiClient.post<User>("/users", data)
  },

  async updateUser(id: string, data: Partial<CreateUserData>): Promise<User> {
    return apiClient.put<User>(`/users/${id}`, data)
  },

  async deleteUser(id: string): Promise<void> {
    return apiClient.delete<void>(`/users/${id}`)
  },
}
