// Device management service

import { apiClient } from "../api-client"
import type { Device, DeviceHistory, TipoEquipo, EstadoDispositivo } from "../types"

export interface DeviceFilters {
  search?: string
  tipo_equipo?: TipoEquipo | ""
  estado?: EstadoDispositivo | ""
  sucursal?: number
  page?: number
  page_size?: number
  ordering?: string
}

export interface CreateDeviceData {
  tipo_equipo: TipoEquipo
  marca: string
  modelo: string
  serie_imei: string
  numero_telefono?: string
  numero_factura?: string
  estado: EstadoDispositivo
  sucursal: number
  fecha_ingreso: string
}

export interface DevicePaginatedResponse {
  count: number
  next: string | null
  previous: string | null
  results: Device[]
}

export const deviceService = {
  async getDevices(filters: DeviceFilters = {}): Promise<DevicePaginatedResponse> {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value))
      }
    })
    const queryString = params.toString()
    return apiClient.get<DevicePaginatedResponse>(
      `/devices/${queryString ? `?${queryString}` : ""}`
    )
  },

  async getDevice(id: number): Promise<Device> {
    return apiClient.get<Device>(`/devices/${id}/`)
  },

  async getDeviceHistory(id: number): Promise<DeviceHistory> {
    return apiClient.get<DeviceHistory>(`/devices/${id}/history/`)
  },

  async createDevice(data: CreateDeviceData): Promise<Device> {
    return apiClient.post<Device>("/devices/", data)
  },

  async updateDevice(id: number, data: Partial<CreateDeviceData>): Promise<Device> {
    return apiClient.patch<Device>(`/devices/${id}/`, data)
  },

  async deleteDevice(id: number): Promise<void> {
    return apiClient.delete<void>(`/devices/${id}/`)
  },

  async changeDeviceStatus(id: number, newStatus: EstadoDispositivo): Promise<Device> {
    return apiClient.patch<Device>(`/devices/${id}/`, { estado: newStatus })
  },

  async getAvailableDevices(): Promise<Device[]> {
    const response = await this.getDevices({ estado: "DISPONIBLE", page_size: 1000 })
    return response.results
  },
}

// Helper functions for UI
export function getDeviceStatusColor(estado: EstadoDispositivo): string {
  const colors: Record<EstadoDispositivo, string> = {
    DISPONIBLE: "bg-green-100 text-green-800 border-green-200",
    ASIGNADO: "bg-blue-100 text-blue-800 border-blue-200",
    MANTENIMIENTO: "bg-yellow-100 text-yellow-800 border-yellow-200",
    BAJA: "bg-gray-100 text-gray-800 border-gray-200",
    ROBO: "bg-red-100 text-red-800 border-red-200",
  }
  return colors[estado] || "bg-gray-100 text-gray-800 border-gray-200"
}

export function getDeviceStatusLabel(estado: EstadoDispositivo): string {
  const labels: Record<EstadoDispositivo, string> = {
    DISPONIBLE: "Disponible",
    ASIGNADO: "Asignado",
    MANTENIMIENTO: "Mantenimiento",
    BAJA: "Baja",
    ROBO: "Robo",
  }
  return labels[estado] || estado
}

export function getDeviceTypeLabel(tipo: TipoEquipo): string {
  const labels: Record<TipoEquipo, string> = {
    LAPTOP: "Laptop",
    TELEFONO: "Teléfono",
    TABLET: "Tablet",
    SIM: "SIM Card",
    ACCESORIO: "Accesorio",
  }
  return labels[tipo] || tipo
}

export function getDeviceTypeIcon(tipo: TipoEquipo): string {
  const icons: Record<TipoEquipo, string> = {
    LAPTOP: "💻",
    TELEFONO: "📱",
    TABLET: "📱",
    SIM: "📶",
    ACCESORIO: "🔌",
  }
  return icons[tipo] || "📦"
}
