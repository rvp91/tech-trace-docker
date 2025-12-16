import { apiClient } from "../api-client"
import type { BusinessUnit } from "../types"

interface BusinessUnitPaginatedResponse {
  count: number
  next: string | null
  previous: string | null
  results: BusinessUnit[]
}

export const businessUnitService = {
  async getBusinessUnits(): Promise<BusinessUnit[]> {
    const response = await apiClient.get<BusinessUnitPaginatedResponse>('/business-units/')
    // Si la respuesta tiene results, es paginada; si no, es un array directo
    return Array.isArray(response) ? response : response.results
  },

  async getBusinessUnit(id: number): Promise<BusinessUnit> {
    return apiClient.get<BusinessUnit>(`/business-units/${id}/`)
  }
}
