// Statistics and dashboard service

import { apiClient } from "../api-client"

export interface DashboardStats {
  total_dispositivos: number
  disponibles: number
  asignados: number
  en_mantenimiento: number
  total_empleados: number
  total_sucursales: number
  dispositivos_por_tipo: {
    tipo: string
    cantidad: number
  }[]
  dispositivos_por_estado: {
    estado: string
    cantidad: number
  }[]
  ultimas_asignaciones: any[]
}

export const statsService = {
  async getDashboardStats(): Promise<DashboardStats> {
    return apiClient.get<DashboardStats>("/stats/dashboard/")
  },
}
