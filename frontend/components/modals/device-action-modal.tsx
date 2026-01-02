"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

interface DeviceActionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (data: { motivo?: string; observaciones?: string }) => Promise<void>
  title: string
  description: string
  requiresMotivo?: boolean
  confirmButtonText?: string
  confirmButtonVariant?: "default" | "destructive"
}

export function DeviceActionModal({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  requiresMotivo = false,
  confirmButtonText = "Confirmar",
  confirmButtonVariant = "default",
}: DeviceActionModalProps) {
  const [motivo, setMotivo] = useState("")
  const [observaciones, setObservaciones] = useState("")
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ motivo?: string }>({})

  const handleConfirm = async () => {
    // Validación client-side
    if (requiresMotivo && !motivo.trim()) {
      setErrors({ motivo: "El motivo es requerido" })
      return
    }

    setErrors({})
    setLoading(true)

    try {
      const data: { motivo?: string; observaciones?: string } = {}

      if (requiresMotivo) {
        data.motivo = motivo.trim()
      }

      if (observaciones.trim()) {
        data.observaciones = observaciones.trim()
      }

      await onConfirm(data)

      // Limpiar formulario después de éxito
      setMotivo("")
      setObservaciones("")
      onOpenChange(false)
    } catch (error) {
      // El error ya fue manejado por el padre (toast)
      console.error("Error en acción de dispositivo:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setMotivo("")
    setObservaciones("")
    setErrors({})
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {requiresMotivo && (
            <div className="space-y-2">
              <Label htmlFor="motivo">
                Motivo <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="motivo"
                placeholder="Ingrese el motivo de esta acción..."
                value={motivo}
                onChange={(e) => {
                  setMotivo(e.target.value)
                  if (errors.motivo) {
                    setErrors({ ...errors, motivo: undefined })
                  }
                }}
                className={errors.motivo ? "border-red-500" : ""}
                rows={3}
                disabled={loading}
              />
              {errors.motivo && (
                <p className="text-sm text-red-500">{errors.motivo}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              placeholder="Observaciones adicionales (opcional)..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={3}
              disabled={loading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant={confirmButtonVariant}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
