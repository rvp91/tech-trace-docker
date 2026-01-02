"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EmployeeSearchCombobox } from "@/components/ui/employee-search-combobox"
import { DeviceSearchCombobox } from "@/components/ui/device-search-combobox"
import { useToast } from "@/hooks/use-toast"
import { assignmentService } from "@/lib/services/assignment-service"
import type { Assignment, Request } from "@/lib/types"
import { getTodayLocal } from "@/lib/utils/date-helpers"

interface AssignmentModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  assignment?: Assignment | null
  preSelectedEmployee?: number
  preSelectedDevice?: number
  preSelectedRequest?: Request | null
}

export function AssignmentModal({
  open,
  onClose,
  onSuccess,
  assignment,
  preSelectedEmployee,
  preSelectedDevice,
  preSelectedRequest,
}: AssignmentModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    empleado: "",
    dispositivo: "",
    tipo_entrega: "",
    fecha_entrega: "",
    estado_carta: "",
    observaciones: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      if (assignment) {
        setFormData({
          empleado: String(assignment.empleado),
          dispositivo: String(assignment.dispositivo),
          tipo_entrega: assignment.tipo_entrega,
          fecha_entrega: assignment.fecha_entrega,
          estado_carta: assignment.estado_carta,
          observaciones: assignment.observaciones || "",
        })
      } else {
        // Si hay un empleado o dispositivo preseleccionado
        const empleadoId = preSelectedEmployee
          ? String(preSelectedEmployee)
          : ""
        const dispositivoId = preSelectedDevice
          ? String(preSelectedDevice)
          : ""

        setFormData({
          empleado: empleadoId,
          dispositivo: dispositivoId,
          tipo_entrega: "PERMANENTE",
          fecha_entrega: getTodayLocal(),
          estado_carta: "PENDIENTE",
          observaciones: "",
        })
      }
    }
  }, [open, assignment, preSelectedEmployee, preSelectedDevice])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.empleado ||
      !formData.dispositivo ||
      !formData.tipo_entrega ||
      !formData.fecha_entrega ||
      !formData.estado_carta
    ) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      const data: any = {
        empleado: Number(formData.empleado),
        dispositivo: Number(formData.dispositivo),
        tipo_entrega: formData.tipo_entrega,
        fecha_entrega: formData.fecha_entrega,
        estado_carta: formData.estado_carta,
        observaciones: formData.observaciones || undefined,
      }

      // Si hay una solicitud preseleccionada, incluir su ID
      if (preSelectedRequest) {
        data.solicitud = preSelectedRequest.id
      }

      if (assignment) {
        await assignmentService.updateAssignment(assignment.id, data)
        toast({
          title: "Asignación actualizada",
          description: "La asignación ha sido actualizada exitosamente",
        })
      } else {
        await assignmentService.createAssignment(data)
        toast({
          title: "Asignación creada",
          description: "La asignación ha sido creada exitosamente. El dispositivo ahora está ASIGNADO.",
        })
      }
      onSuccess()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la asignación",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {assignment ? "Editar Asignación" : "Nueva Asignación de Dispositivo"}
          </DialogTitle>
          <DialogDescription>
            {assignment
              ? "Modifica los datos de la asignación"
              : "Asigna un dispositivo disponible a un empleado"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="empleado">
                Empleado <span className="text-red-500">*</span>
              </Label>
              <EmployeeSearchCombobox
                value={formData.empleado}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, empleado: value }))
                }
                disabled={!!assignment || !!preSelectedEmployee}
                placeholder="Buscar empleado..."
                filter={{ estado: "ACTIVO" }}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dispositivo">
                Dispositivo <span className="text-red-500">*</span>
              </Label>
              <DeviceSearchCombobox
                value={formData.dispositivo}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, dispositivo: value }))
                }
                disabled={!!assignment || !!preSelectedDevice}
                placeholder="Buscar dispositivo..."
                filter={{ estado: "DISPONIBLE" }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="tipo_entrega">
                  Tipo de Entrega <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.tipo_entrega}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, tipo_entrega: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERMANENTE">Permanente</SelectItem>
                    <SelectItem value="TEMPORAL">Temporal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="fecha_entrega">
                  Fecha de Entrega <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fecha_entrega"
                  type="date"
                  value={formData.fecha_entrega}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, fecha_entrega: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="estado_carta">
                Estado de Carta <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.estado_carta}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, estado_carta: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIRMADA">Firmada</SelectItem>
                  <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                  <SelectItem value="NO_APLICA">No Aplica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, observaciones: e.target.value }))
                }
                placeholder="Ingresa observaciones adicionales..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : assignment ? "Actualizar" : "Crear Asignación"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
