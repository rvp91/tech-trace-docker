"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Plus, Loader2 } from "lucide-react"
import { branchService, type CreateBranchData } from "@/lib/services/branch-service"
import type { Branch } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface BranchModalProps {
  branch?: Branch | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
}

export function BranchModal({ branch, open, onOpenChange, onSuccess }: BranchModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const isControlled = open !== undefined && onOpenChange !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen

  const [formData, setFormData] = useState<CreateBranchData>({
    nombre: "",
    codigo: "",
    direccion: "",
    ciudad: "",
    is_active: true,
  })

  const [errors, setErrors] = useState<Partial<Record<keyof CreateBranchData, string>>>({})

  useEffect(() => {
    if (branch) {
      setFormData({
        nombre: branch.nombre,
        codigo: branch.codigo,
        direccion: branch.direccion || "",
        ciudad: branch.ciudad,
        is_active: branch.is_active,
      })
    } else {
      setFormData({
        nombre: "",
        codigo: "",
        direccion: "",
        ciudad: "",
        is_active: true,
      })
    }
    setErrors({})
  }, [branch, isOpen])

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateBranchData, string>> = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido"
    }

    if (!formData.codigo.trim()) {
      newErrors.codigo = "El código es requerido"
    } else if (!/^[A-Z0-9-]+$/.test(formData.codigo)) {
      newErrors.codigo = "El código debe contener solo letras mayúsculas, números y guiones"
    }

    if (!formData.ciudad.trim()) {
      newErrors.ciudad = "La ciudad es requerida"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name as keyof CreateBranchData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, is_active: checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)

      if (branch) {
        // Update existing branch
        await branchService.updateBranch(branch.id, formData)
        toast({
          title: "Éxito",
          description: "Sucursal actualizada correctamente",
        })
      } else {
        // Create new branch
        await branchService.createBranch(formData)
        toast({
          title: "Éxito",
          description: "Sucursal creada correctamente",
        })
      }

      setIsOpen(false)
      onSuccess?.()
    } catch (error: any) {
      console.error("Error saving branch:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo guardar la sucursal",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setIsOpen(false)
    setFormData({
      nombre: "",
      codigo: "",
      direccion: "",
      ciudad: "",
      is_active: true,
    })
    setErrors({})
  }

  const dialogContent = (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{branch ? "Editar Sucursal" : "Crear Nueva Sucursal"}</DialogTitle>
        <DialogDescription>
          {branch
            ? "Modifica los datos de la sucursal"
            : "Completa los datos para crear una nueva sucursal"}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="nombre">
            Nombre <span className="text-destructive">*</span>
          </Label>
          <Input
            id="nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleInputChange}
            placeholder="Centro, Norte, Sur..."
            disabled={loading}
          />
          {errors.nombre && <p className="text-sm text-destructive mt-1">{errors.nombre}</p>}
        </div>

        <div>
          <Label htmlFor="codigo">
            Código <span className="text-destructive">*</span>
          </Label>
          <Input
            id="codigo"
            name="codigo"
            value={formData.codigo}
            onChange={handleInputChange}
            placeholder="SCL-01, VAL-01..."
            disabled={loading || !!branch}
            className="font-mono"
          />
          {errors.codigo && <p className="text-sm text-destructive mt-1">{errors.codigo}</p>}
          {branch && (
            <p className="text-xs text-muted-foreground mt-1">
              El código no puede ser modificado
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="ciudad">
            Ciudad <span className="text-destructive">*</span>
          </Label>
          <Input
            id="ciudad"
            name="ciudad"
            value={formData.ciudad}
            onChange={handleInputChange}
            placeholder="Santiago, Valparaíso, Concepción..."
            disabled={loading}
          />
          {errors.ciudad && <p className="text-sm text-destructive mt-1">{errors.ciudad}</p>}
        </div>

        <div>
          <Label htmlFor="direccion">Dirección</Label>
          <Textarea
            id="direccion"
            name="direccion"
            value={formData.direccion}
            onChange={handleInputChange}
            placeholder="Av. Principal 123, Piso 4..."
            disabled={loading}
            rows={3}
          />
        </div>

        <div className="flex items-center justify-between space-x-2 py-2">
          <div className="space-y-0.5">
            <Label htmlFor="is_active">Estado Activo</Label>
            <p className="text-xs text-muted-foreground">
              {formData.is_active
                ? "La sucursal está activa y visible"
                : "La sucursal está inactiva"}
            </p>
          </div>
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={handleSwitchChange}
            disabled={loading}
          />
        </div>

        <div className="flex gap-2 justify-end pt-4">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {branch ? "Actualizar" : "Crear"} Sucursal
          </Button>
        </div>
      </form>
    </DialogContent>
  )

  if (isControlled) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        {dialogContent}
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Sucursal
        </Button>
      </DialogTrigger>
      {dialogContent}
    </Dialog>
  )
}
