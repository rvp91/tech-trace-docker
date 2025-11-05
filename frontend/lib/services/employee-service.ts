// Employee management service

import { apiClient } from "../api-client"
import type { Employee, PaginatedResponse } from "../types"

export interface EmployeeFilters {
  search?: string
  estado?: "activo" | "inactivo" | "todos"
  sucursalId?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export interface CreateEmployeeData {
  nombreCompleto: string
  rut: string
  cargo: string
  sucursalId: string
  correoCorpo?: string
  gmailPersonal?: string
  telefono?: string
  sucursalCorregida?: string
  estado: "activo" | "inactivo"
}

export const employeeService = {
  async getEmployees(filters: EmployeeFilters = {}): Promise<PaginatedResponse<Employee>> {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "todos") {
        params.append(key, String(value))
      }
    })
    return apiClient.get<PaginatedResponse<Employee>>(`/employees?${params.toString()}`)
  },

  async getEmployee(id: string): Promise<Employee> {
    return apiClient.get<Employee>(`/employees/${id}`)
  },

  async createEmployee(data: CreateEmployeeData): Promise<Employee> {
    return apiClient.post<Employee>("/employees", data)
  },

  async updateEmployee(id: string, data: Partial<CreateEmployeeData>): Promise<Employee> {
    return apiClient.put<Employee>(`/employees/${id}`, data)
  },

  async deleteEmployee(id: string): Promise<void> {
    return apiClient.delete<void>(`/employees/${id}`)
  },

  async getActiveEmployees(): Promise<Employee[]> {
    const response = await apiClient.get<PaginatedResponse<Employee>>("/employees?estado=activo&pageSize=1000")
    return response.data
  },
}
