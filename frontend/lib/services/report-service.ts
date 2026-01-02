import { apiClient } from "@/lib/api-client"
import type { Assignment, DiscountReportFilters, ActiveAssignmentReportFilters } from "@/lib/types"

interface GetDiscountReportsParams extends DiscountReportFilters {
  page?: number
  page_size?: number
}

interface GetActiveAssignmentReportsParams extends ActiveAssignmentReportFilters {
  page?: number
  page_size?: number
}

export const reportService = {
  /**
   * Obtener reportes de descuentos con filtros y paginación
   */
  async getDiscountReports(params?: GetDiscountReportsParams): Promise<{
    results: Assignment[]
    count: number
  }> {
    return await apiClient.get<{
      count: number
      results: Assignment[]
    }>("/assignments/assignments/discount-reports/", params)
  },

  /**
   * Obtener todos los reportes de descuentos (para exportación)
   * Usa page_size alto para obtener todos los registros filtrados
   */
  async getAllDiscountReports(filters?: DiscountReportFilters): Promise<Assignment[]> {
    const response = await apiClient.get<{
      count: number
      results: Assignment[]
    }>("/assignments/assignments/discount-reports/", {
      ...filters,
      page_size: 1000, // Límite alto para exportación
    })

    return response.results
  },

  /**
   * Obtener reportes de dispositivos asignados activos con filtros y paginación
   */
  async getActiveAssignmentReports(params: GetActiveAssignmentReportsParams): Promise<{
    results: Assignment[]
    count: number
  }> {
    return await apiClient.get<{
      count: number
      results: Assignment[]
    }>("/assignments/assignments/active-assignments-report/", params)
  },

  /**
   * Obtener todos los reportes de asignaciones activas (para exportación)
   * Usa page_size alto para obtener todos los registros filtrados
   */
  async getAllActiveAssignmentReports(filters: ActiveAssignmentReportFilters): Promise<Assignment[]> {
    const response = await apiClient.get<{
      count: number
      results: Assignment[]
    }>("/assignments/assignments/active-assignments-report/", {
      ...filters,
      page_size: 1000,
    })

    return response.results
  },
}
