import { apiClient } from "@/lib/api-client"
import type { Request, PaginatedResponse } from "@/lib/types"

interface GetRequestsParams {
  page?: number
  page_size?: number
  search?: string
  estado?: string
  empleado?: number
  ordering?: string
}

export const requestService = {
  /**
   * Obtener todas las solicitudes con filtros opcionales
   */
  async getRequests(params?: GetRequestsParams): Promise<PaginatedResponse<Request>> {
    const response = await apiClient.get<{
      count: number
      results: Request[]
    }>("/assignments/requests/", params)

    return {
      data: response.results,
      total: response.count,
      page: params?.page || 1,
      pageSize: params?.page_size || 20,
      totalPages: Math.ceil(response.count / (params?.page_size || 20)),
    }
  },

  /**
   * Obtener una solicitud por ID
   */
  async getRequest(id: number): Promise<Request> {
    return await apiClient.get<Request>(`/assignments/requests/${id}/`)
  },

  /**
   * Crear una nueva solicitud
   */
  async createRequest(data: Partial<Request>): Promise<Request> {
    return await apiClient.post<Request>("/assignments/requests/", data)
  },

  /**
   * Actualizar una solicitud existente
   */
  async updateRequest(id: number, data: Partial<Request>): Promise<Request> {
    return await apiClient.patch<Request>(`/assignments/requests/${id}/`, data)
  },

  /**
   * Eliminar una solicitud
   */
  async deleteRequest(id: number): Promise<void> {
    await apiClient.delete(`/assignments/requests/${id}/`)
  },
}

// Helper functions para UI
export const getRequestStatusColor = (estado: string): string => {
  switch (estado) {
    case "PENDIENTE":
      return "bg-yellow-500"
    case "COMPLETADA":
      return "bg-blue-500"
    default:
      return "bg-gray-500"
  }
}

export const getRequestStatusLabel = (estado: string): string => {
  switch (estado) {
    case "PENDIENTE":
      return "Pendiente"
    case "COMPLETADA":
      return "Completada"
    default:
      return estado
  }
}
