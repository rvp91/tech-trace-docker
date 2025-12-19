// Branch management service

import { apiClient } from "../api-client"
import type { Branch } from "../types"

export interface CreateBranchData {
  nombre: string
  codigo: string
  is_active?: boolean
}

export interface UpdateBranchData {
  nombre?: string
  codigo?: string
  is_active?: boolean
}

export interface BranchListResponse {
  count: number
  next: string | null
  previous: string | null
  results: Branch[]
}

export interface BranchFilters {
  is_active?: boolean
  search?: string
  page?: number
  page_size?: number
}

export const branchService = {
  async getBranches(filters?: BranchFilters): Promise<BranchListResponse> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })
    }
    const queryString = params.toString()
    return apiClient.get<BranchListResponse>(
      `/branches/${queryString ? `?${queryString}` : ""}`
    )
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
    const response = await this.getBranches({ is_active: true })
    return response.results
  },
}
