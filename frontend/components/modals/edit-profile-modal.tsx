"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { userService, type UpdateUserData } from "@/lib/services/user-service"
import type { User } from "@/lib/types"
import { Loader2 } from "lucide-react"

interface EditProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  onSuccess: (updatedUser: User) => void
}

export function EditProfileModal({ open, onOpenChange, user, onSuccess }: EditProfileModalProps) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()

  // Inicializar el formulario con los datos del usuario
  useEffect(() => {
    if (user && open) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
      })
    }
  }, [user, open])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.first_name?.trim()) {
      newErrors.first_name = "El nombre es requerido"
    }

    if (!formData.last_name?.trim()) {
      newErrors.last_name = "El apellido es requerido"
    }

    if (!formData.email?.trim()) {
      newErrors.email = "El email es requerido"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)

      const data: UpdateUserData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
      }

      const updatedUser = await userService.updateProfile(data)

      toast({
        title: "Perfil actualizado",
        description: "Tus datos han sido actualizados correctamente.",
      })

      onSuccess(updatedUser)
    } catch (error: any) {
      console.error("Error actualizando perfil:", error)

      let errorMessage = "No se pudo actualizar el perfil"

      if (error.response?.data) {
        const errorData = error.response.data
        if (errorData.email) {
          errorMessage = `Email: ${errorData.email[0]}`
        } else if (errorData.first_name) {
          errorMessage = `Nombre: ${errorData.first_name[0]}`
        } else if (errorData.last_name) {
          errorMessage = `Apellido: ${errorData.last_name[0]}`
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
    setErrors({})
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogDescription>
            Actualiza tu información personal. Los cambios se verán reflejados en tu cuenta.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="first_name"
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              placeholder="Tu nombre"
              className={errors.first_name ? "border-destructive" : ""}
            />
            {errors.first_name && (
              <p className="text-sm text-destructive">{errors.first_name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name">
              Apellido <span className="text-destructive">*</span>
            </Label>
            <Input
              id="last_name"
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              placeholder="Tu apellido"
              className={errors.last_name ? "border-destructive" : ""}
            />
            {errors.last_name && (
              <p className="text-sm text-destructive">{errors.last_name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="tu@email.com"
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
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
              Guardar Cambios
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
