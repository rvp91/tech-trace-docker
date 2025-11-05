// Assignment and return management service

import { apiClient } from "../api-client"
import type { Assignment, PaginatedResponse } from "../types"

export interface AssignmentFilters {
  search?: string
  estado?: "activa" | "finalizada" | "todas"
  tipoEntrega?: "permanente" | "temporal" | "todas"
  fechaDesde?: string
  fechaHasta?: string
  page?: number
  pageSize?: number
}

export interface CreateAssignmentData {
  empleadoId: string
  dispositivoId: string
  fechaEntrega: string
  tipoEntrega: "permanente" | "temporal"
  estadoCarta: "firmada" | "pendiente" | "no_aplica"
  observaciones?: string
}

export interface ReturnDeviceData {
  fechaDevolucion: string
  estadoDevolucion: "optimo" | "con_danos" | "no_funcional"
  observacionesDevolucion?: string
}

export const assignmentService = {
  async getAssignments(filters: AssignmentFilters = {}): Promise<PaginatedResponse<Assignment>> {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "todas") {
        params.append(key, String(value))
      }
    })
    return apiClient.get<PaginatedResponse<Assignment>>(`/assignments?${params.toString()}`)
  },

  async getAssignment(id: string): Promise<Assignment> {
    return apiClient.get<Assignment>(`/assignments/${id}`)
  },

  async createAssignment(data: CreateAssignmentData): Promise<Assignment> {
    return apiClient.post<Assignment>("/assignments", data)
  },

  async returnDevice(id: string, data: ReturnDeviceData): Promise<Assignment> {
    return apiClient.post<Assignment>(`/assignments/${id}/return`, data)
  },

  async getActiveAssignments(): Promise<Assignment[]> {
    const response = await apiClient.get<PaginatedResponse<Assignment>>("/assignments?estado=activa&pageSize=1000")
    return response.data
  },

  async getEmployeeAssignments(empleadoId: string): Promise<Assignment[]> {
    const response = await apiClient.get<PaginatedResponse<Assignment>>(
      `/assignments?empleadoId=${empleadoId}&estado=activa&pageSize=1000`,
    )
    return response.data
  },
}
