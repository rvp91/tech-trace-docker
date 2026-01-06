// Employee management service

import { apiClient } from "../api-client"
import type { Employee, EmployeeHistory } from "../types"

export interface EmployeeFilters {
  search?: string
  estado?: "ACTIVO" | "INACTIVO" | ""
  sucursal?: number
  unidad_negocio?: number
  incluir_inactivos?: boolean
  page?: number
  page_size?: number
  ordering?: string
}

export interface CreateEmployeeData {
  rut: string
  nombre_completo: string
  cargo: string
  sucursal: number
  correo_corporativo?: string
  gmail_personal?: string
  telefono?: string
  unidad_negocio?: number
  estado: "ACTIVO" | "INACTIVO"
}

export interface EmployeePaginatedResponse {
  count: number
  next: string | null
  previous: string | null
  results: Employee[]
}

export const employeeService = {
  async getEmployees(filters: EmployeeFilters = {}): Promise<EmployeePaginatedResponse> {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value))
      }
    })
    const queryString = params.toString()
    return apiClient.get<EmployeePaginatedResponse>(
      `/employees/${queryString ? `?${queryString}` : ""}`
    )
  },

  async getEmployee(id: number): Promise<Employee> {
    return apiClient.get<Employee>(`/employees/${id}/`)
  },

  async getEmployeeHistory(id: number): Promise<EmployeeHistory> {
    return apiClient.get<EmployeeHistory>(`/employees/${id}/history/`)
  },

  async createEmployee(data: CreateEmployeeData): Promise<Employee> {
    return apiClient.post<Employee>("/employees/", data)
  },

  async updateEmployee(id: number, data: Partial<CreateEmployeeData>): Promise<Employee> {
    return apiClient.patch<Employee>(`/employees/${id}/`, data)
  },

  async deleteEmployee(id: number): Promise<void> {
    return apiClient.delete<void>(`/employees/${id}/`)
  },

  async getActiveEmployees(): Promise<Employee[]> {
    // OPTIMIZADO: Reducido de 1000 a 100 para evitar carga masiva
    // Si se necesitan más empleados, implementar paginación o búsqueda
    const response = await this.getEmployees({ estado: "ACTIVO", page_size: 100 })
    return response.results
  },
}
