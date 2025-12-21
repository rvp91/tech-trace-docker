"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { userService, type CreateUserData, type UpdateUserData } from "@/lib/services/user-service"
import type { User } from "@/lib/types"
import { Loader2 } from "lucide-react"

interface UserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: User | null
  onSuccess: () => void
}

export function UserModal({ open, onOpenChange, user, onSuccess }: UserModalProps) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "OPERADOR" as "ADMIN" | "OPERADOR",
    first_name: "",
    last_name: "",
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()

  const isEditMode = !!user

  useEffect(() => {
    if (open) {
      if (user) {
        setFormData({
          username: user.username,
          email: user.email,
          password: "",
          confirmPassword: "",
          role: user.role,
          first_name: user.first_name || "",
          last_name: user.last_name || "",
        })
      } else {
        setFormData({
          username: "",
          email: "",
          password: "",
          confirmPassword: "",
          role: "OPERADOR",
          first_name: "",
          last_name: "",
        })
      }
      setErrors({})
    }
  }, [open, user])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.username.trim()) {
      newErrors.username = "El username es requerido"
    } else if (formData.username.length < 3) {
      newErrors.username = "El username debe tener al menos 3 caracteres"
    }

    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "El email no es valido"
    }

    if (!isEditMode) {
      if (!formData.password) {
        newErrors.password = "La contrasena es requerida"
      } else if (formData.password.length < 6) {
        newErrors.password = "La contrasena debe tener al menos 6 caracteres"
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Las contrasenas no coinciden"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)

      if (isEditMode) {
        const updateData: UpdateUserData = {
          email: formData.email,
          role: formData.role,
          first_name: formData.first_name || undefined,
          last_name: formData.last_name || undefined,
        }

        await userService.updateUser(user.id, updateData)

        toast({
          title: "Usuario actualizado",
          description: `El usuario ${formData.username} ha sido actualizado correctamente.`,
        })
      } else {
        const createData: CreateUserData = {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          first_name: formData.first_name || undefined,
          last_name: formData.last_name || undefined,
        }

        await userService.createUser(createData)

        toast({
          title: "Usuario creado",
          description: `El usuario ${formData.username} ha sido creado correctamente.`,
        })
      }

      onSuccess()
    } catch (error: any) {
      console.error("Error guardando usuario:", error)

      let errorMessage = "No se pudo guardar el usuario"

      if (error.response?.data) {
        const errorData = error.response.data
        if (errorData.username) {
          errorMessage = `Username: ${errorData.username[0]}`
        } else if (errorData.email) {
          errorMessage = `Email: ${errorData.email[0]}`
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar Usuario" : "Crear Nuevo Usuario"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Actualiza la informacion del usuario. El username no se puede modificar."
              : "Completa el formulario para crear un nuevo usuario en el sistema."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">
                Username <span className="text-destructive">*</span>
              </Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="usuario123"
                disabled={isEditMode}
                className={errors.username ? "border-destructive" : ""}
              />
              {errors.username && (
                <p className="text-sm text-destructive">{errors.username}</p>
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
                placeholder="usuario@empresa.com"
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Nombre</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="Juan"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Apellido</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Perez"
              />
            </div>
          </div>

          {!isEditMode && (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">
                  Contrasena <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Contrasena"
                  className={errors.password ? "border-destructive" : ""}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Minimo 6 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirmar Contrasena <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirmar contrasena"
                  className={errors.confirmPassword ? "border-destructive" : ""}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="role">
              Rol <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value as "ADMIN" | "OPERADOR" })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Administrador</SelectItem>
                <SelectItem value="OPERADOR">Operador</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {formData.role === "ADMIN"
                ? "Los administradores tienen acceso completo al sistema"
                : "Los operadores solo pueden ver y editar, no eliminar"}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? "Actualizar" : "Crear"} Usuario
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
