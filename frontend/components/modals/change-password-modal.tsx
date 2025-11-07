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
    new_password: "",
    confirm_password: "",
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.new_password) {
      newErrors.new_password = "La nueva contrasena es requerida"
    } else if (formData.new_password.length < 6) {
      newErrors.new_password = "La contrasena debe tener al menos 6 caracteres"
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
        new_password: formData.new_password,
        confirm_password: formData.confirm_password,
      }

      await userService.changePassword(userId, data)

      toast({
        title: "Contrasena actualizada",
        description: "La contrasena del usuario ha sido cambiada correctamente.",
      })

      setFormData({ new_password: "", confirm_password: "" })
      setErrors({})
      onSuccess()
    } catch (error: any) {
      console.error("Error cambiando contrasena:", error)

      let errorMessage = "No se pudo cambiar la contrasena"

      if (error.response?.data) {
        const errorData = error.response.data
        if (errorData.new_password) {
          errorMessage = `Contrasena: ${errorData.new_password[0]}`
        } else if (errorData.detail) {
          errorMessage = errorData.detail
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
    setFormData({ new_password: "", confirm_password: "" })
    setErrors({})
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Cambiar Contrasena</DialogTitle>
          <DialogDescription>
            Ingresa una nueva contrasena para el usuario. La contrasena debe tener al menos 6 caracteres.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new_password">
              Nueva Contrasena <span className="text-destructive">*</span>
            </Label>
            <Input
              id="new_password"
              type="password"
              value={formData.new_password}
              onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
              placeholder="Nueva contrasena"
              className={errors.new_password ? "border-destructive" : ""}
            />
            {errors.new_password && (
              <p className="text-sm text-destructive">{errors.new_password}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Minimo 6 caracteres
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_password">
              Confirmar Contrasena <span className="text-destructive">*</span>
            </Label>
            <Input
              id="confirm_password"
              type="password"
              value={formData.confirm_password}
              onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
              placeholder="Confirmar contrasena"
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
              Cambiar Contrasena
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
