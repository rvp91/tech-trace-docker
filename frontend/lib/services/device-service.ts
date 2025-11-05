// Device management service

import { apiClient } from "../api-client"
import type { Device, PaginatedResponse } from "../types"

export interface DeviceFilters {
  search?: string
  tipoEquipo?: string
  estado?: string
  sucursalId?: string
  procedencia?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export interface CreateDeviceData {
  tipoEquipo: "laptop" | "telefono" | "tablet" | "sim_card" | "accesorio"
  marca: string
  modelo: string
  serieImei: string
  numeroTelefono?: string
  procedencia: "compra" | "arriendo" | "leasing" | "otro"
  sucursalId: string
  fechaIngreso: string
  estado: "disponible" | "mantenimiento" | "baja"
  observaciones?: string
}

export const deviceService = {
  async getDevices(filters: DeviceFilters = {}): Promise<PaginatedResponse<Device>> {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "todos") {
        params.append(key, String(value))
      }
    })
    return apiClient.get<PaginatedResponse<Device>>(`/devices?${params.toString()}`)
  },

  async getDevice(id: string): Promise<Device> {
    return apiClient.get<Device>(`/devices/${id}`)
  },

  async createDevice(data: CreateDeviceData): Promise<Device> {
    return apiClient.post<Device>("/devices", data)
  },

  async updateDevice(id: string, data: Partial<CreateDeviceData>): Promise<Device> {
    return apiClient.put<Device>(`/devices/${id}`, data)
  },

  async deleteDevice(id: string): Promise<void> {
    return apiClient.delete<void>(`/devices/${id}`)
  },

  async getAvailableDevices(): Promise<Device[]> {
    const response = await apiClient.get<PaginatedResponse<Device>>("/devices?estado=disponible&pageSize=1000")
    return response.data
  },

  async checkSerieExists(serie: string, excludeId?: string): Promise<boolean> {
    const response = await apiClient.get<{ exists: boolean }>(
      `/devices/check-serie?serie=${serie}${excludeId ? `&excludeId=${excludeId}` : ""}`,
    )
    return response.exists
  },
}
