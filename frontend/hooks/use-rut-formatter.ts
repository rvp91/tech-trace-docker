import { useState, useCallback } from "react"
import { formatRUT, validateRUT } from "@/lib/validations"

interface UseRutFormatterReturn {
  formattedValue: string
  cleanValue: string
  handleChange: (value: string) => void
  isValid: boolean
}

/**
 * Hook personalizado para formateo automático de RUT chileno
 *
 * Características:
 * - Formatea automáticamente mientras el usuario escribe
 * - Elimina caracteres no válidos
 * - Valida dígito verificador en tiempo real
 * - Retorna valor limpio (sin puntos) para enviar al backend
 *
 * @param initialValue - Valor inicial del RUT (con o sin formato)
 * @param onChange - Callback que recibe el valor limpio (sin puntos)
 * @returns Objeto con valor formateado, valor limpio, handler y estado de validez
 */
export function useRutFormatter(
  initialValue: string = "",
  onChange?: (cleanValue: string) => void
): UseRutFormatterReturn {
  const [formattedValue, setFormattedValue] = useState(() => {
    if (!initialValue) return ""
    // Si el valor inicial ya tiene formato, usarlo; si no, formatearlo
    const clean = initialValue.replace(/\./g, "").replace(/-/g, "")
    if (clean.length >= 2) {
      return formatRUT(clean)
    }
    return initialValue
  })

  const [cleanValue, setCleanValue] = useState(() => {
    return initialValue.replace(/\./g, "").replace(/-/g, "").toUpperCase()
  })

  const [isValid, setIsValid] = useState(() => {
    if (!initialValue) return true // Campo vacío no es inválido
    return validateRUT(initialValue)
  })

  const handleChange = useCallback(
    (value: string) => {
      // Eliminar caracteres no permitidos (solo números, K, puntos y guiones)
      const sanitized = value.replace(/[^0-9kK.-]/g, "").toUpperCase()

      // Remover puntos y guiones para obtener valor limpio
      const clean = sanitized.replace(/\./g, "").replace(/-/g, "")

      // Limitar longitud máxima (8 números + 1 dígito verificador = 9)
      const limited = clean.slice(0, 9)

      // Formatear solo si tiene al menos 2 caracteres
      let formatted = limited
      if (limited.length >= 2) {
        formatted = formatRUT(limited)
      }

      // Validar
      const valid = limited.length === 0 || validateRUT(limited)

      setFormattedValue(formatted)
      setCleanValue(limited)
      setIsValid(valid)

      // Llamar al callback con el valor limpio
      onChange?.(limited)
    },
    [onChange]
  )

  return {
    formattedValue,
    cleanValue,
    handleChange,
    isValid,
  }
}
