"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useRutFormatter } from "@/hooks/use-rut-formatter"

export interface RutInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value?: string
  onChange?: (value: string) => void
  error?: boolean
}

/**
 * Componente de input especializado para RUT chileno
 *
 * Características:
 * - Formatea automáticamente mientras el usuario escribe
 * - Acepta RUT con o sin puntos/guiones
 * - Muestra siempre en formato estándar (XX.XXX.XXX-X)
 * - Retorna valor limpio (sin puntos) en el onChange
 * - Indicador visual de validez
 * - Compatible con react-hook-form
 *
 * @example
 * ```tsx
 * <RutInput
 *   value={formData.rut}
 *   onChange={(cleanValue) => setFormData({ ...formData, rut: cleanValue })}
 *   placeholder="12.345.678-9"
 *   error={errors.rut}
 * />
 * ```
 */
const RutInput = React.forwardRef<HTMLInputElement, RutInputProps>(
  ({ className, value = "", onChange, error, disabled, ...props }, ref) => {
    const { formattedValue, handleChange, isValid } = useRutFormatter(value, onChange)

    // Determinar si mostrar error visual
    const hasError = error || (!isValid && formattedValue.length > 0)

    return (
      <Input
        ref={ref}
        type="text"
        value={formattedValue}
        onChange={(e) => handleChange(e.target.value)}
        disabled={disabled}
        className={cn(
          "font-mono",
          hasError && "border-destructive focus-visible:ring-destructive",
          disabled && "cursor-not-allowed",
          className
        )}
        maxLength={12} // XX.XXX.XXX-X = 12 caracteres
        {...props}
      />
    )
  }
)

RutInput.displayName = "RutInput"

export { RutInput }
