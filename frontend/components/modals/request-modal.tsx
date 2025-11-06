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
import { useToast } from "@/hooks/use-toast"
import { requestService } from "@/lib/services/request-service"
import { employeeService } from "@/lib/services/employee-service"
import type { Request, Employee } from "@/lib/types"

interface RequestModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  request?: Request | null
}

const TIPOS_DISPOSITIVO = [
  { value: "LAPTOP", label: "Laptop" },
  { value: "TELEFONO", label: "Teléfono" },
  { value: "TABLET", label: "Tablet" },
  { value: "SIM", label: "SIM Card" },
  { value: "ACCESORIO", label: "Accesorio" },
]

export function RequestModal({ open, onClose, onSuccess, request }: RequestModalProps) {
  const [loading, setLoading] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [formData, setFormData] = useState({
    empleado: "",
    jefatura_solicitante: "",
    tipo_dispositivo: "",
    justificacion: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      loadEmployees()
      if (request) {
        setFormData({
          empleado: String(request.empleado),
          jefatura_solicitante: request.jefatura_solicitante,
          tipo_dispositivo: request.tipo_dispositivo,
          justificacion: request.justificacion || "",
        })
      } else {
        setFormData({
          empleado: "",
          jefatura_solicitante: "",
          tipo_dispositivo: "",
          justificacion: "",
        })
      }
    }
  }, [open, request])

  const loadEmployees = async () => {
    try {
      const response = await employeeService.getEmployees({ estado: "ACTIVO", page_size: 1000 })
      setEmployees(response.results)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los empleados",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.empleado || !formData.jefatura_solicitante || !formData.tipo_dispositivo) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      const data = {
        empleado: Number(formData.empleado),
        jefatura_solicitante: formData.jefatura_solicitante,
        tipo_dispositivo: formData.tipo_dispositivo,
        justificacion: formData.justificacion || undefined,
      }

      if (request) {
        await requestService.updateRequest(request.id, data)
        toast({
          title: "Solicitud actualizada",
          description: "La solicitud ha sido actualizada exitosamente",
        })
      } else {
        await requestService.createRequest(data)
        toast({
          title: "Solicitud creada",
          description: "La solicitud ha sido creada exitosamente",
        })
      }
      onSuccess()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la solicitud",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {request ? "Ver Solicitud" : "Nueva Solicitud de Dispositivo"}
          </DialogTitle>
          <DialogDescription>
            {request
              ? "Detalles de la solicitud de dispositivo"
              : "Crea una nueva solicitud de dispositivo para un empleado"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="empleado">
                Empleado <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.empleado}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, empleado: value }))
                }
                disabled={!!request}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un empleado" />
                </SelectTrigger>
                <SelectContent>
                  {employees && employees.length > 0 ? (
                    employees.map((employee) => (
                      <SelectItem key={employee.id} value={String(employee.id)}>
                        {employee.nombre_completo} - {employee.rut}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      Cargando empleados...
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="jefatura_solicitante">
                Jefatura Solicitante <span className="text-red-500">*</span>
              </Label>
              <Input
                id="jefatura_solicitante"
                value={formData.jefatura_solicitante}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    jefatura_solicitante: e.target.value,
                  }))
                }
                placeholder="Nombre de la jefatura"
                disabled={!!request}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tipo_dispositivo">
                Tipo de Dispositivo <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.tipo_dispositivo}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, tipo_dispositivo: value }))
                }
                disabled={!!request}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_DISPOSITIVO.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="justificacion">Justificación</Label>
              <Textarea
                id="justificacion"
                value={formData.justificacion}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, justificacion: e.target.value }))
                }
                placeholder="Ingresa la justificación de la solicitud..."
                rows={4}
                disabled={!!request}
              />
            </div>

            {request && (
              <div className="grid gap-2">
                <Label>Estado</Label>
                <div className="text-sm text-muted-foreground">
                  {request.estado}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {request ? "Cerrar" : "Cancelar"}
            </Button>
            {!request && (
              <Button type="submit" disabled={loading}>
                {loading ? "Creando..." : "Crear Solicitud"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
