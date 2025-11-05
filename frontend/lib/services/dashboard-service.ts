// Dashboard metrics service

import { apiClient } from "../api-client"
import type { DashboardMetrics, InventoryReport } from "../types"

export const dashboardService = {
  async getMetrics(): Promise<DashboardMetrics> {
    return apiClient.get<DashboardMetrics>("/dashboard/metrics")
  },

  async getInventoryReport(filters?: {
    sucursalId?: string
    empleadoId?: string
  }): Promise<InventoryReport> {
    const params = new URLSearchParams()
    if (filters?.sucursalId) params.append("sucursalId", filters.sucursalId)
    if (filters?.empleadoId) params.append("empleadoId", filters.empleadoId)
    return apiClient.get<InventoryReport>(`/inventory/report?${params.toString()}`)
  },
}
