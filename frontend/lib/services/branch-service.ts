// Branch management service

import { apiClient } from "../api-client"
import type { Branch } from "../types"

export interface CreateBranchData {
  nombre: string
  codigo: string
  direccion?: string
  ciudad: string
  estado: "activo" | "inactivo"
}

export const branchService = {
  async getBranches(): Promise<Branch[]> {
    return apiClient.get<Branch[]>("/branches")
  },

  async getBranch(id: string): Promise<Branch> {
    return apiClient.get<Branch>(`/branches/${id}`)
  },

  async createBranch(data: CreateBranchData): Promise<Branch> {
    return apiClient.post<Branch>("/branches", data)
  },

  async updateBranch(id: string, data: Partial<CreateBranchData>): Promise<Branch> {
    return apiClient.put<Branch>(`/branches/${id}`, data)
  },

  async deleteBranch(id: string): Promise<void> {
    return apiClient.delete<void>(`/branches/${id}`)
  },

  async getActiveBranches(): Promise<Branch[]> {
    const branches = await apiClient.get<Branch[]>("/branches")
    return branches.filter((b) => b.estado === "activo")
  },
}
