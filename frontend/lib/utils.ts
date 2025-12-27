import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { toast } from '@/components/ui/use-toast'
import { ApiError } from './api-client'
import { getTodayLocal, formatDateLocal } from './utils/date-helpers'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Maneja errores de API y muestra toast con el mensaje apropiado
 * @param error - Error capturado del try-catch
 * @param defaultMessage - Mensaje por defecto si no se puede extraer uno del error
 */
export function handleApiError(error: unknown, defaultMessage: string = 'Ocurrió un error'): void {
  console.error('API Error:', error)

  // Si es un error con estructura ApiError
  if (error instanceof Error && 'apiError' in error) {
    const apiError = (error as any).apiError as ApiError

    // Mostrar toast con el mensaje del error
    toast({
      variant: 'destructive',
      title: 'Error',
      description: apiError.message,
    })

    // Si hay detalles de validación, mostrarlos en consola (para depuración)
    if (apiError.details) {
      console.log('Detalles de validación:', apiError.details)
    }

    return
  }

  // Para otros tipos de errores
  if (error instanceof Error) {
    toast({
      variant: 'destructive',
      title: 'Error',
      description: error.message || defaultMessage,
    })
    return
  }

  // Fallback para errores desconocidos
  toast({
    variant: 'destructive',
    title: 'Error',
    description: defaultMessage,
  })
}

/**
 * Muestra un toast de éxito
 * @param message - Mensaje a mostrar
 */
export function showSuccessToast(message: string): void {
  toast({
    title: 'Éxito',
    description: message,
  })
}

/**
 * Muestra un toast de advertencia
 * @param message - Mensaje a mostrar
 */
export function showWarningToast(message: string): void {
  toast({
    title: 'Advertencia',
    description: message,
    variant: 'default',
  })
}

/**
 * Exporta datos a un archivo CSV
 * @param data - Array de objetos a exportar
 * @param columns - Configuración de columnas {key: string, header: string}
 * @param filename - Nombre del archivo (sin extensión)
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  columns: { key: keyof T; header: string }[],
  filename: string
): void {
  if (!data || data.length === 0) {
    console.warn('No hay datos para exportar')
    return
  }

  // Crear encabezados
  const headers = columns.map(col => col.header).join(',')

  // Crear filas
  const rows = data.map(item => {
    return columns.map(col => {
      const value = item[col.key]
      // Escapar valores que contengan comas, saltos de línea o comillas
      if (value === null || value === undefined) return ''
      const stringValue = String(value)
      if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      return stringValue
    }).join(',')
  })

  // Combinar encabezados y filas
  const csv = [headers, ...rows].join('\n')

  // Crear blob y descargar
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  // Agregar fecha al nombre del archivo
  const date = getTodayLocal()
  const fullFilename = `${filename}_${date}.csv`

  link.setAttribute('href', url)
  link.setAttribute('download', fullFilename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Formatea una fecha ISO a formato DD-MM-YYYY
 * @deprecated Use formatDateLocal from date-helpers instead
 */
export function formatDate(dateString: string): string {
  return formatDateLocal(dateString)
}

/**
 * Formatea una fecha ISO a formato DD/MM/YYYY HH:MM
 */
export function formatDateTime(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Formatea un número como moneda chilena (CLP)
 * Ejemplo: 800000 -> "800.000"
 * @param value - Valor numérico a formatear
 * @returns String formateado con separadores de miles
 */
export function formatCurrency(value: number | string | undefined | null): string {
  if (value === undefined || value === null || value === '') return ''
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(numValue)) return ''

  // Formatear con separador de miles chileno (punto)
  return Math.round(numValue).toLocaleString('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
}

/**
 * Parsea un string formateado como moneda a número
 * Ejemplo: "800.000" -> 800000
 * @param value - String formateado con separadores
 * @returns Número sin formato
 */
export function parseCurrency(value: string): number {
  if (!value) return 0
  // Remover puntos (separadores de miles) y convertir a número
  const cleanValue = value.replace(/\./g, '')
  return parseFloat(cleanValue) || 0
}

/**
 * Formatea un input mientras el usuario escribe
 * Agrega automáticamente separadores de miles
 * @param value - Valor actual del input
 * @returns Valor formateado con separadores
 */
export function formatCurrencyInput(value: string): string {
  // Remover todo excepto números
  const numbers = value.replace(/\D/g, '')
  if (!numbers) return ''

  // Convertir a número y formatear
  const numValue = parseInt(numbers, 10)
  return formatCurrency(numValue)
}

/**
 * Obtiene el identificador serial de un dispositivo (numero_serie o IMEI)
 * @param device - Objeto dispositivo con campos numero_serie y/o imei
 * @returns El numero_serie, imei o "N/A" si no tiene ninguno
 */
export function getDeviceSerial(device: { numero_serie?: string | null; imei?: string | null }): string {
  return device.numero_serie || device.imei || "N/A"
}

/**
 * Exporta datos a un archivo Excel (.xlsx)
 * Requiere: pnpm add xlsx
 * @param data - Array de objetos a exportar
 * @param columns - Configuración de columnas {key: string, header: string}
 * @param filename - Nombre del archivo (sin extensión)
 * @param sheetName - Nombre de la hoja de Excel
 */
export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  columns: { key: keyof T; header: string }[],
  filename: string,
  sheetName: string = "Datos"
): void {
  if (!data || data.length === 0) {
    console.warn('No hay datos para exportar')
    return
  }

  // Importación dinámica de xlsx para reducir bundle size
  import('xlsx').then((XLSX) => {
    // Crear datos para el worksheet
    const wsData = [
      // Fila de encabezados
      columns.map(col => col.header),
      // Filas de datos
      ...data.map(item =>
        columns.map(col => {
          const value = item[col.key]
          return value ?? ''
        })
      )
    ]

    // Crear worksheet desde array of arrays
    const ws = XLSX.utils.aoa_to_sheet(wsData)

    // Auto-ajustar ancho de columnas basado en contenido
    const colWidths = columns.map((col) => {
      const headerLength = col.header.length
      const maxDataLength = Math.max(
        ...data.map(item => String(item[col.key] ?? '').length)
      )
      return { wch: Math.max(headerLength, maxDataLength, 10) }
    })
    ws['!cols'] = colWidths

    // Crear workbook y agregar worksheet
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, sheetName)

    // Generar y descargar archivo
    const date = getTodayLocal()
    const fullFilename = `${filename}_${date}.xlsx`
    XLSX.writeFile(wb, fullFilename)
  }).catch(error => {
    console.error('Error al exportar a Excel:', error)
    alert('Error al exportar a Excel. Por favor intenta con CSV.')
  })
}
