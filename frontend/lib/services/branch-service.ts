// Branch management service

import { apiClient } from "../api-client"
import type { Branch } from "../types"

export interface CreateBranchData {
  nombre: string
  codigo: string
  direccion?: string
  ciudad: string
  is_active?: boolean
}

export interface UpdateBranchData {
  nombre?: string
  codigo?: string
  direccion?: string
  ciudad?: string
  is_active?: boolean
}

export interface BranchListResponse {
  count: number
  next: string | null
  previous: string | null
  results: Branch[]
}

export const branchService = {
  async getBranches(): Promise<Branch[]> {
    const response = await apiClient.get<BranchListResponse>("/branches/")
    return response.results
  },

  async getBranch(id: number): Promise<Branch> {
    return apiClient.get<Branch>(`/branches/${id}/`)
  },

  async createBranch(data: CreateBranchData): Promise<Branch> {
    return apiClient.post<Branch>("/branches/", data)
  },

  async updateBranch(id: number, data: UpdateBranchData): Promise<Branch> {
    return apiClient.put<Branch>(`/branches/${id}/`, data)
  },

  async deleteBranch(id: number): Promise<void> {
    return apiClient.delete<void>(`/branches/${id}/`)
  },

  async getActiveBranches(): Promise<Branch[]> {
    const response = await apiClient.get<BranchListResponse>("/branches/?is_active=true")
    return response.results
  },
}
