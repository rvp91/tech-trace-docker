import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
  const date = new Date().toISOString().split('T')[0]
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
 * Formatea una fecha ISO a formato DD/MM/YYYY
 */
export function formatDate(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
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
