import useSWR, { SWRConfiguration } from 'swr'
import { apiClient } from '@/lib/api-client'
import { DashboardStats } from '@/lib/services/stats-service'

/**
 * Hook personalizado para usar SWR con ApiClient
 * Proporciona caching automático, revalidación y manejo de errores
 */
export function useSwrData<T>(
  key: string | null,
  params?: Record<string, any>,
  config?: SWRConfiguration<T>
) {
  const { data, error, isLoading, mutate } = useSWR<T>(
    key ? [key, params] : null,
    async ([url, queryParams]) => {
      return await apiClient.get<T>(url, queryParams)
    },
    {
      revalidateOnFocus: false, // No revalidar al enfocar la ventana
      revalidateOnReconnect: true, // Revalidar al reconectar
      dedupingInterval: 2000, // Deduplicar requests en 2 segundos
      ...config,
    }
  )

  return {
    data,
    error,
    isLoading,
    mutate,
  }
}

/**
 * Hook para obtener estadísticas del dashboard con cache
 */
export function useDashboardStats() {
  return useSwrData<DashboardStats>('/stats/dashboard/', undefined, {
    refreshInterval: 60000, // Actualizar cada 60 segundos
  })
}

/**
 * Hook para obtener lista de sucursales con cache
 */
export function useBranches(params?: { page_size?: number }) {
  return useSwrData<{
    count: number
    results: any[]
  }>('/branches/', params || { page_size: 100 }, {
    revalidateOnMount: true,
  })
}

/**
 * Hook para obtener detalles de un empleado con cache
 */
export function useEmployee(id: number | null) {
  return useSwrData<any>(id ? `/employees/${id}/` : null)
}

/**
 * Hook para obtener detalles de un dispositivo con cache
 */
export function useDevice(id: number | null) {
  return useSwrData<any>(id ? `/devices/${id}/` : null)
}

/**
 * Hook para obtener detalles de una asignación con cache
 */
export function useAssignment(id: number | null) {
  return useSwrData<any>(id ? `/assignments/assignments/${id}/` : null)
}
