"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { employeeService, type CreateEmployeeData } from "@/lib/services/employee-service"
import { branchService } from "@/lib/services/branch-service"
import type { Branch, Employee } from "@/lib/types"

interface CreateEmployeeModalProps {
  employee?: Employee
  children?: React.ReactNode
  onSuccess?: () => void
}

export function CreateEmployeeModal({ employee, children, onSuccess }: CreateEmployeeModalProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [branches, setBranches] = useState<Branch[]>([])
  const [formData, setFormData] = useState<CreateEmployeeData>({
    rut: "",
    nombre_completo: "",
    cargo: "",
    sucursal: 0,
    correo_corporativo: "",
    gmail_personal: "",
    telefono: "",
    unidad_negocio: "",
    estado: "ACTIVO",
  })

  const isEditMode = !!employee

  // Cargar sucursales
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const response = await branchService.getBranches({ page_size: 100 })
        setBranches(response.results)
      } catch (error) {
        console.error("Error al cargar sucursales:", error)
      }
    }
    if (open) {
      loadBranches()
    }
  }, [open])

  // Pre-llenar formulario en modo edición
  useEffect(() => {
    if (employee && open) {
      setFormData({
        rut: employee.rut,
        nombre_completo: employee.nombre_completo,
        cargo: employee.cargo,
        sucursal: employee.sucursal,
        correo_corporativo: employee.correo_corporativo || "",
        gmail_personal: employee.gmail_personal || "",
        telefono: employee.telefono || "",
        unidad_negocio: employee.unidad_negocio || "",
        estado: employee.estado,
      })
    }
  }, [employee, open])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: keyof CreateEmployeeData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setFormData({
      rut: "",
      nombre_completo: "",
      cargo: "",
      sucursal: 0,
      correo_corporativo: "",
      gmail_personal: "",
      telefono: "",
      unidad_negocio: "",
      estado: "ACTIVO",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)

      if (isEditMode) {
        // Modo edición
        const { rut, ...updateData } = formData // Excluir RUT en edición
        await employeeService.updateEmployee(employee.id, updateData)
        toast({
          title: "Empleado actualizado",
          description: `${formData.nombre_completo} ha sido actualizado exitosamente.`,
        })
      } else {
        // Modo creación
        await employeeService.createEmployee(formData)
        toast({
          title: "Empleado creado",
          description: `${formData.nombre_completo} ha sido creado exitosamente.`,
        })
        resetForm()
      }

      setOpen(false)
      onSuccess?.()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Error al ${isEditMode ? "actualizar" : "crear"} el empleado`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar Empleado" : "Crear Nuevo Empleado"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* RUT */}
            <div>
              <Label htmlFor="rut">RUT *</Label>
              <Input
                id="rut"
                name="rut"
                value={formData.rut}
                onChange={handleInputChange}
                placeholder="12.345.678-9"
                required
                disabled={isEditMode} // RUT no editable
                className={isEditMode ? "bg-muted cursor-not-allowed" : ""}
              />
            </div>

            {/* Nombre Completo */}
            <div>
              <Label htmlFor="nombre_completo">Nombre Completo *</Label>
              <Input
                id="nombre_completo"
                name="nombre_completo"
                value={formData.nombre_completo}
                onChange={handleInputChange}
                placeholder="Juan Pérez González"
                required
              />
            </div>

            {/* Cargo */}
            <div>
              <Label htmlFor="cargo">Cargo *</Label>
              <Input
                id="cargo"
                name="cargo"
                value={formData.cargo}
                onChange={handleInputChange}
                placeholder="Analista de Sistemas"
                required
              />
            </div>

            {/* Sucursal */}
            <div>
              <Label htmlFor="sucursal">Sucursal *</Label>
              <Select
                value={formData.sucursal ? String(formData.sucursal) : ""}
                onValueChange={(value) => handleSelectChange("sucursal", Number(value))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar sucursal" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={String(branch.id)}>
                      {branch.nombre} ({branch.codigo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Correo Corporativo */}
            <div>
              <Label htmlFor="correo_corporativo">Correo Corporativo</Label>
              <Input
                id="correo_corporativo"
                name="correo_corporativo"
                type="email"
                value={formData.correo_corporativo}
                onChange={handleInputChange}
                placeholder="juan.perez@empresa.com"
              />
            </div>

            {/* Gmail Personal */}
            <div>
              <Label htmlFor="gmail_personal">Gmail Personal</Label>
              <Input
                id="gmail_personal"
                name="gmail_personal"
                type="email"
                value={formData.gmail_personal}
                onChange={handleInputChange}
                placeholder="juanperez@gmail.com"
              />
            </div>

            {/* Teléfono */}
            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                placeholder="+56 9 1234 5678"
              />
            </div>

            {/* Unidad de Negocio */}
            <div>
              <Label htmlFor="unidad_negocio">Unidad de Negocio</Label>
              <Select
                value={formData.unidad_negocio || "none"}
                onValueChange={(value) => handleSelectChange("unidad_negocio", value === "none" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar unidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  <SelectItem value="Operaciones">Operaciones</SelectItem>
                  <SelectItem value="Tecnología">Tecnología</SelectItem>
                  <SelectItem value="Soporte Técnico">Soporte Técnico</SelectItem>
                  <SelectItem value="Logística">Logística</SelectItem>
                  <SelectItem value="Administración">Administración</SelectItem>
                  <SelectItem value="Recursos Humanos">Recursos Humanos</SelectItem>
                  <SelectItem value="Ventas">Ventas</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Estado */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="estado">Estado del Empleado</Label>
              <div className="text-sm text-muted-foreground">
                {formData.estado === "ACTIVO" ? "El empleado está activo" : "El empleado está inactivo"}
              </div>
            </div>
            <Switch
              id="estado"
              checked={formData.estado === "ACTIVO"}
              onCheckedChange={(checked) => handleSelectChange("estado", checked ? "ACTIVO" : "INACTIVO")}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : isEditMode ? "Actualizar" : "Crear Empleado"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
