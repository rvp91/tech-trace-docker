// Statistics and dashboard service

import { apiClient } from "../api-client"
import { Assignment, Return } from "../types"

export interface DevicesByBranch {
  sucursal__nombre: string | null
  sucursal__codigo: string | null
  total: number
}

export interface DashboardStats {
  summary: {
    total_devices: number
    available_devices: number
    active_employees: number
    active_assignments: number
  }
  devices_by_status: {
    [key: string]: number
  }
  devices_by_type: {
    [key: string]: number
  }
  devices_by_branch: DevicesByBranch[]
  recent_assignments: Assignment[]
  recent_returns: Return[]
}

export const statsService = {
  async getDashboardStats(): Promise<DashboardStats> {
    return apiClient.get<DashboardStats>("/stats/dashboard/")
  },
}
