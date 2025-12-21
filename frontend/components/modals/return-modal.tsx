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
import { assignmentService } from "@/lib/services/assignment-service"
import { getDeviceSerial } from "@/lib/utils"
import type { Assignment } from "@/lib/types"
import { formatDateLocal, getTodayLocal } from "@/lib/utils/date-helpers"

interface ReturnModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  assignment: Assignment
}

export function ReturnModal({ open, onClose, onSuccess, assignment }: ReturnModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fecha_devolucion: "",
    estado_dispositivo: "",
    observaciones: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      // Pre-llenar con la fecha actual
      setFormData({
        fecha_devolucion: getTodayLocal(),
        estado_dispositivo: "",
        observaciones: "",
      })
    }
  }, [open])

  const validateDates = (): boolean => {
    const fechaEntrega = new Date(assignment.fecha_entrega)
    const fechaDevolucion = new Date(formData.fecha_devolucion)

    if (fechaDevolucion < fechaEntrega) {
      toast({
        title: "Error de validación",
        description: "La fecha de devolución no puede ser anterior a la fecha de entrega",
        variant: "destructive",
      })
      return false
    }

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    if (fechaDevolucion > hoy) {
      toast({
        title: "Error de validación",
        description: "La fecha de devolución no puede ser futura",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.fecha_devolucion || !formData.estado_dispositivo) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    // Validar fechas
    if (!validateDates()) {
      return
    }

    try {
      setLoading(true)

      // Crear el registro de devolución
      await assignmentService.createReturn({
        asignacion: assignment.id,
        fecha_devolucion: formData.fecha_devolucion,
        estado_dispositivo: formData.estado_dispositivo as any,
        observaciones: formData.observaciones || undefined,
      })

      toast({
        title: "Devolución registrada",
        description: "La devolución ha sido registrada exitosamente. La asignación ahora está FINALIZADA.",
      })

      onSuccess()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo registrar la devolución",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Devolución de Dispositivo</DialogTitle>
          <DialogDescription>
            Registra la devolución del dispositivo asignado al empleado{" "}
            <strong>{assignment.empleado_detail?.nombre_completo}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Información del dispositivo */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-900 mb-1">
                Dispositivo a devolver:
              </p>
              <p className="text-sm text-blue-800">
                {assignment.dispositivo_detail
                  ? `${assignment.dispositivo_detail.tipo_equipo} - ${assignment.dispositivo_detail.marca} ${assignment.dispositivo_detail.modelo || "N/A"} (${getDeviceSerial(assignment.dispositivo_detail)})`
                  : `ID: ${assignment.dispositivo}`}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fecha_devolucion">
                Fecha de Devolución <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fecha_devolucion"
                type="date"
                value={formData.fecha_devolucion}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, fecha_devolucion: e.target.value }))
                }
                max={getTodayLocal()}
                min={assignment.fecha_entrega}
              />
              <p className="text-xs text-muted-foreground">
                Fecha de entrega: {formatDateLocal(assignment.fecha_entrega)}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="estado_dispositivo">
                Estado del Dispositivo <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.estado_dispositivo}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, estado_dispositivo: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPTIMO">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>Óptimo - El dispositivo está en perfecto estado</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="CON_DANOS">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500" />
                      <span>Con Daños - El dispositivo tiene daños menores</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="NO_FUNCIONAL">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span>No Funcional - El dispositivo no funciona</span>
                    </div>
                  </SelectItem>
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
                placeholder="Describe el estado del dispositivo, daños encontrados, accesorios devueltos, etc..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Registra cualquier detalle importante sobre la devolución
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-900">
                ⚠️ <strong>Nota:</strong> Al registrar la devolución:
              </p>
              <ul className="text-xs text-amber-800 mt-1 ml-4 list-disc space-y-1">
                <li>La asignación cambiará a estado <strong>FINALIZADA</strong></li>
                <li>
                  El dispositivo cambiará a estado{" "}
                  <strong>
                    {formData.estado_dispositivo === "OPTIMO"
                      ? "DISPONIBLE"
                      : "MANTENIMIENTO"}
                  </strong>
                </li>
                <li>Esta acción quedará registrada en el historial</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Registrando..." : "Registrar Devolución"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
