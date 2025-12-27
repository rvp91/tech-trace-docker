// Utilidades para manejo de fechas date-only (sin hora)
// Estas funciones tratan fechas como strings para evitar problemas de zona horaria

/**
 * Formatea fecha date-only para display
 * Input: "2025-12-11" | Output: "11-12-2025"
 */
export function formatDateLocal(dateString: string | null | undefined): string {
  if (!dateString) return ""

  try {
    // Parse manual evitando interpretación UTC
    const [year, month, day] = dateString.split("-").map(Number)
    if (!year || !month || !day) return dateString

    // Formatear DD-MM-YYYY
    return `${day.toString().padStart(2, "0")}-${month.toString().padStart(2, "0")}-${year}`
  } catch (error) {
    console.warn(`Error formateando fecha: ${dateString}`, error)
    return dateString
  }
}

/**
 * Obtiene fecha de hoy en formato YYYY-MM-DD para inputs y envío al backend
 */
export function getTodayLocal(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = (now.getMonth() + 1).toString().padStart(2, "0")
  const day = now.getDate().toString().padStart(2, "0")

  return `${year}-${month}-${day}`
}

/**
 * Convierte Date object a string YYYY-MM-DD en timezone local
 */
export function dateToLocalString(date: Date): string {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")

  return `${year}-${month}-${day}`
}

/**
 * Parse seguro a Date object en timezone local (solo cuando sea necesario)
 */
export function parseDateLocal(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number)
  return new Date(year, month - 1, day) // Meses son 0-indexed
}

/**
 * Formatea fecha en formato largo: "11 de diciembre de 2025"
 */
export function formatDateLong(dateString: string | null | undefined): string {
  if (!dateString) return ""

  try {
    const date = parseDateLocal(dateString)
    return date.toLocaleDateString("es-CL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  } catch (error) {
    console.warn(`Error formateando fecha larga: ${dateString}`, error)
    return dateString
  }
}

/**
 * Calcula diferencia en días entre dos fechas
 */
export function getDaysDifference(date1: string, date2: string): number {
  const d1 = parseDateLocal(date1)
  const d2 = parseDateLocal(date2)
  const diffMs = d2.getTime() - d1.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Formatea un datetime ISO a formato DD-MM-YYYY (solo fecha, sin hora)
 * Input: "2025-12-11T15:30:00Z" | Output: "11-12-2025"
 */
export function formatDateTimeToDate(dateTimeString: string | null | undefined): string {
  if (!dateTimeString) return ""

  try {
    const date = new Date(dateTimeString)
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()

    return `${day}-${month}-${year}`
  } catch (error) {
    console.warn(`Error formateando datetime: ${dateTimeString}`, error)
    return dateTimeString
  }
}
