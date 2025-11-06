import { apiClient } from "@/lib/api-client"
import type { Assignment, Return, PaginatedResponse } from "@/lib/types"

interface GetAssignmentsParams {
  page?: number
  page_size?: number
  search?: string
  estado_asignacion?: string
  empleado?: number
  dispositivo?: number
  ordering?: string
}

interface GetReturnsParams {
  page?: number
  page_size?: number
  estado_dispositivo?: string
  ordering?: string
}

export const assignmentService = {
  /**
   * Obtener todas las asignaciones con filtros opcionales
   */
  async getAssignments(params?: GetAssignmentsParams): Promise<PaginatedResponse<Assignment>> {
    const response = await apiClient.get<{
      count: number
      results: Assignment[]
    }>("/assignments/assignments/", params)

    return {
      data: response.results,
      total: response.count,
      page: params?.page || 1,
      pageSize: params?.page_size || 20,
      totalPages: Math.ceil(response.count / (params?.page_size || 20)),
    }
  },

  /**
   * Obtener una asignación por ID
   */
  async getAssignment(id: number): Promise<Assignment> {
    return await apiClient.get<Assignment>(`/assignments/assignments/${id}/`)
  },

  /**
   * Crear una nueva asignación
   */
  async createAssignment(data: Partial<Assignment>): Promise<Assignment> {
    return await apiClient.post<Assignment>("/assignments/assignments/", data)
  },

  /**
   * Actualizar una asignación existente
   */
  async updateAssignment(id: number, data: Partial<Assignment>): Promise<Assignment> {
    return await apiClient.patch<Assignment>(`/assignments/assignments/${id}/`, data)
  },

  /**
   * Eliminar una asignación
   */
  async deleteAssignment(id: number): Promise<void> {
    await apiClient.delete(`/assignments/assignments/${id}/`)
  },

  /**
   * Obtener todas las devoluciones con filtros opcionales
   */
  async getReturns(params?: GetReturnsParams): Promise<PaginatedResponse<Return>> {
    const response = await apiClient.get<{
      count: number
      results: Return[]
    }>("/assignments/returns/", params)

    return {
      data: response.results,
      total: response.count,
      page: params?.page || 1,
      pageSize: params?.page_size || 20,
      totalPages: Math.ceil(response.count / (params?.page_size || 20)),
    }
  },

  /**
   * Obtener una devolución por ID
   */
  async getReturn(id: number): Promise<Return> {
    return await apiClient.get<Return>(`/assignments/returns/${id}/`)
  },

  /**
   * Crear una nueva devolución
   */
  async createReturn(data: Partial<Return>): Promise<Return> {
    return await apiClient.post<Return>("/assignments/returns/", data)
  },

  /**
   * Obtener devolución por asignación
   */
  async getReturnByAssignment(assignmentId: number): Promise<Return | null> {
    try {
      const response = await this.getReturns({ page_size: 1 })
      const returnItem = response.data.find(r => r.asignacion === assignmentId)
      return returnItem || null
    } catch (error) {
      return null
    }
  },
}

// Helper functions para UI
export const getAssignmentStatusColor = (estado: string): string => {
  switch (estado) {
    case "ACTIVA":
      return "bg-green-500"
    case "FINALIZADA":
      return "bg-gray-500"
    default:
      return "bg-gray-500"
  }
}

export const getAssignmentStatusLabel = (estado: string): string => {
  switch (estado) {
    case "ACTIVA":
      return "Activa"
    case "FINALIZADA":
      return "Finalizada"
    default:
      return estado
  }
}

export const getTipoEntregaLabel = (tipo: string): string => {
  switch (tipo) {
    case "PERMANENTE":
      return "Permanente"
    case "TEMPORAL":
      return "Temporal"
    default:
      return tipo
  }
}

export const getEstadoCartaLabel = (estado: string): string => {
  switch (estado) {
    case "FIRMADA":
      return "Firmada"
    case "PENDIENTE":
      return "Pendiente"
    case "NO_APLICA":
      return "No Aplica"
    default:
      return estado
  }
}

export const getReturnStatusColor = (estado: string): string => {
  switch (estado) {
    case "OPTIMO":
      return "bg-green-500"
    case "CON_DANOS":
      return "bg-yellow-500"
    case "NO_FUNCIONAL":
      return "bg-red-500"
    default:
      return "bg-gray-500"
  }
}

export const getReturnStatusLabel = (estado: string): string => {
  switch (estado) {
    case "OPTIMO":
      return "Óptimo"
    case "CON_DANOS":
      return "Con Daños"
    case "NO_FUNCIONAL":
      return "No Funcional"
    default:
      return estado
  }
}
