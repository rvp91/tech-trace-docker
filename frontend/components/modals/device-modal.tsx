"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { deviceService, type CreateDeviceData } from "@/lib/services/device-service"
import { branchService } from "@/lib/services/branch-service"
import type { Branch, Device, TipoEquipo, EstadoDispositivo } from "@/lib/types"

interface DeviceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  device?: Device | null
  onSuccess?: () => void
}

export function DeviceModal({ open, onOpenChange, device, onSuccess }: DeviceModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [branches, setBranches] = useState<Branch[]>([])
  const [formData, setFormData] = useState<CreateDeviceData>({
    tipo_equipo: "LAPTOP",
    marca: "",
    modelo: "",
    serie_imei: "",
    numero_telefono: "",
    numero_factura: "",
    estado: "DISPONIBLE",
    sucursal: 0,
    fecha_ingreso: new Date().toISOString().split("T")[0],
  })

  const isEditMode = !!device

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
    if (device && open) {
      setFormData({
        tipo_equipo: device.tipo_equipo,
        marca: device.marca,
        modelo: device.modelo,
        serie_imei: device.serie_imei,
        numero_telefono: device.numero_telefono || "",
        numero_factura: device.numero_factura || "",
        estado: device.estado,
        sucursal: device.sucursal,
        fecha_ingreso: device.fecha_ingreso,
      })
    } else if (!device && open) {
      // Reset form cuando se abre en modo creación
      setFormData({
        tipo_equipo: "LAPTOP",
        marca: "",
        modelo: "",
        serie_imei: "",
        numero_telefono: "",
        numero_factura: "",
        estado: "DISPONIBLE",
        sucursal: 0,
        fecha_ingreso: new Date().toISOString().split("T")[0],
      })
    }
  }, [device, open])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: keyof CreateDeviceData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setFormData({
      tipo_equipo: "LAPTOP",
      marca: "",
      modelo: "",
      serie_imei: "",
      numero_telefono: "",
      numero_factura: "",
      estado: "DISPONIBLE",
      sucursal: 0,
      fecha_ingreso: new Date().toISOString().split("T")[0],
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validación: numero_telefono requerido para TELEFONO y SIM
    if ((formData.tipo_equipo === "TELEFONO" || formData.tipo_equipo === "SIM") && !formData.numero_telefono) {
      toast({
        title: "Campo requerido",
        description: "El número de teléfono es obligatorio para Teléfonos y SIM Cards.",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      if (isEditMode && device) {
        // Modo edición - excluir serie_imei ya que no es editable
        const { serie_imei, ...updateData } = formData
        await deviceService.updateDevice(device.id, updateData)
        toast({
          title: "Dispositivo actualizado",
          description: `${formData.marca} ${formData.modelo} ha sido actualizado exitosamente.`,
        })
      } else {
        // Modo creación
        await deviceService.createDevice(formData)
        toast({
          title: "Dispositivo creado",
          description: `${formData.marca} ${formData.modelo} ha sido creado exitosamente.`,
        })
        resetForm()
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Error al ${isEditMode ? "actualizar" : "crear"} el dispositivo`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Determinar si el campo numero_telefono es requerido
  const isTelefonoRequired = formData.tipo_equipo === "TELEFONO" || formData.tipo_equipo === "SIM"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar Dispositivo" : "Crear Nuevo Dispositivo"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Tipo de Equipo */}
            <div>
              <Label htmlFor="tipo_equipo">Tipo de Equipo *</Label>
              <Select
                value={formData.tipo_equipo}
                onValueChange={(value) => handleSelectChange("tipo_equipo", value as TipoEquipo)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LAPTOP">Laptop</SelectItem>
                  <SelectItem value="TELEFONO">Teléfono</SelectItem>
                  <SelectItem value="TABLET">Tablet</SelectItem>
                  <SelectItem value="SIM">SIM Card</SelectItem>
                  <SelectItem value="ACCESORIO">Accesorio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Marca */}
            <div>
              <Label htmlFor="marca">Marca *</Label>
              <Input
                id="marca"
                name="marca"
                value={formData.marca}
                onChange={handleInputChange}
                placeholder="Apple, Samsung, HP, etc."
                required
              />
            </div>

            {/* Modelo */}
            <div>
              <Label htmlFor="modelo">Modelo *</Label>
              <Input
                id="modelo"
                name="modelo"
                value={formData.modelo}
                onChange={handleInputChange}
                placeholder="MacBook Pro, Galaxy S23, etc."
                required
              />
            </div>

            {/* Serie/IMEI */}
            <div>
              <Label htmlFor="serie_imei">Serie / IMEI *</Label>
              <Input
                id="serie_imei"
                name="serie_imei"
                value={formData.serie_imei}
                onChange={handleInputChange}
                placeholder="C02XYZ123ABC o 123456789012345"
                required
                disabled={isEditMode}
                className={isEditMode ? "bg-muted cursor-not-allowed" : ""}
              />
              {isEditMode && (
                <p className="text-xs text-muted-foreground mt-1">
                  La serie/IMEI no puede ser modificada
                </p>
              )}
            </div>

            {/* Número de Teléfono */}
            <div>
              <Label htmlFor="numero_telefono">
                Número de Teléfono {isTelefonoRequired ? "*" : ""}
              </Label>
              <Input
                id="numero_telefono"
                name="numero_telefono"
                value={formData.numero_telefono}
                onChange={handleInputChange}
                placeholder="+56 9 1234 5678"
                required={isTelefonoRequired}
              />
              {isTelefonoRequired && (
                <p className="text-xs text-muted-foreground mt-1">
                  Requerido para teléfonos y SIM cards
                </p>
              )}
            </div>

            {/* Número de Factura */}
            <div>
              <Label htmlFor="numero_factura">Número de Factura</Label>
              <Input
                id="numero_factura"
                name="numero_factura"
                value={formData.numero_factura}
                onChange={handleInputChange}
                placeholder="FAC-2024-001234"
              />
            </div>

            {/* Estado */}
            <div>
              <Label htmlFor="estado">Estado *</Label>
              <Select
                value={formData.estado}
                onValueChange={(value) => handleSelectChange("estado", value as EstadoDispositivo)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DISPONIBLE">Disponible</SelectItem>
                  <SelectItem value="ASIGNADO">Asignado</SelectItem>
                  <SelectItem value="MANTENIMIENTO">Mantenimiento</SelectItem>
                  <SelectItem value="BAJA">Baja</SelectItem>
                  <SelectItem value="ROBO">Robo</SelectItem>
                </SelectContent>
              </Select>
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

            {/* Fecha de Ingreso */}
            <div>
              <Label htmlFor="fecha_ingreso">Fecha de Ingreso *</Label>
              <Input
                id="fecha_ingreso"
                name="fecha_ingreso"
                type="date"
                value={formData.fecha_ingreso}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : isEditMode ? "Actualizar" : "Crear Dispositivo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
