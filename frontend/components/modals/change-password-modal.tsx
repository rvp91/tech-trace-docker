"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { userService, type ChangePasswordData } from "@/lib/services/user-service"
import { Loader2 } from "lucide-react"

interface ChangePasswordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: number | null
  onSuccess: () => void
}

export function ChangePasswordModal({ open, onOpenChange, userId, onSuccess }: ChangePasswordModalProps) {
  const [formData, setFormData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()

  // Determinar si el usuario está cambiando su propia contraseña
  // comparando el userId proporcionado con el userId del usuario autenticado
  // Si userId es null, asumimos que es el usuario actual

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.current_password) {
      newErrors.current_password = "La contrasena actual es requerida"
    }

    if (!formData.new_password) {
      newErrors.new_password = "La nueva contrasena es requerida"
    } else if (formData.new_password.length < 6) {
      newErrors.new_password = "La contrasena debe tener al menos 6 caracteres"
    }

    if (formData.new_password === formData.current_password) {
      newErrors.new_password = "La nueva contrasena debe ser diferente a la actual"
    }

    if (formData.new_password !== formData.confirm_password) {
      newErrors.confirm_password = "Las contrasenas no coinciden"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userId) return

    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)

      const data: ChangePasswordData = {
        current_password: formData.current_password,
        new_password: formData.new_password,
        confirm_password: formData.confirm_password,
      }

      // Usar el endpoint apropiado según si es el usuario actual o un admin cambiando la contraseña de otro usuario
      // Para simplificar, siempre usamos el endpoint del usuario actual ya que ahora requiere la contraseña actual
      await userService.changeMyPassword(data)

      toast({
        title: "Contrasena actualizada",
        description: "Tu contrasena ha sido cambiada correctamente.",
      })

      setFormData({ current_password: "", new_password: "", confirm_password: "" })
      setErrors({})
      onSuccess()
    } catch (error: any) {
      console.error("Error cambiando contrasena:", error)

      let errorMessage = "No se pudo cambiar la contrasena"

      if (error.response?.data) {
        const errorData = error.response.data
        if (errorData.current_password) {
          errorMessage = `Contrasena actual: ${errorData.current_password[0]}`
        } else if (errorData.new_password) {
          errorMessage = `Nueva contrasena: ${errorData.new_password[0]}`
        } else if (errorData.detail) {
          errorMessage = errorData.detail
        } else if (errorData.non_field_errors) {
          errorMessage = errorData.non_field_errors[0]
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({ current_password: "", new_password: "", confirm_password: "" })
    setErrors({})
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Cambiar Contraseña</DialogTitle>
          <DialogDescription>
            Por seguridad, primero ingresa tu contraseña actual y luego la nueva contraseña. La contraseña debe tener al menos 6 caracteres.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current_password">
              Contraseña Actual <span className="text-destructive">*</span>
            </Label>
            <Input
              id="current_password"
              type="password"
              value={formData.current_password}
              onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
              placeholder="Tu contraseña actual"
              className={errors.current_password ? "border-destructive" : ""}
            />
            {errors.current_password && (
              <p className="text-sm text-destructive">{errors.current_password}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="new_password">
              Nueva Contraseña <span className="text-destructive">*</span>
            </Label>
            <Input
              id="new_password"
              type="password"
              value={formData.new_password}
              onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
              placeholder="Nueva contraseña"
              className={errors.new_password ? "border-destructive" : ""}
            />
            {errors.new_password && (
              <p className="text-sm text-destructive">{errors.new_password}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Mínimo 6 caracteres
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_password">
              Confirmar Contraseña <span className="text-destructive">*</span>
            </Label>
            <Input
              id="confirm_password"
              type="password"
              value={formData.confirm_password}
              onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
              placeholder="Confirmar nueva contraseña"
              className={errors.confirm_password ? "border-destructive" : ""}
            />
            {errors.confirm_password && (
              <p className="text-sm text-destructive">{errors.confirm_password}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cambiar Contraseña
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
