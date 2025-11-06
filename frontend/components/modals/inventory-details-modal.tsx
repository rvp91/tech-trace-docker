"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Laptop, Smartphone, Tablet, MapPin, User, Calendar } from "lucide-react"
import { CardSimIcon } from "@/components/ui/icons/lucide-card-sim"

interface InventoryDetailsModalProps {
  device: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InventoryDetailsModal({ device, open, onOpenChange }: InventoryDetailsModalProps) {
  if (!device) return null

  const getDeviceIcon = () => {
    switch (device.tipo) {
      case "Laptop":
        return <Laptop className="h-6 w-6 text-primary" />
      case "Teléfono":
        return <Smartphone className="h-6 w-6 text-primary" />
      case "Tablet":
        return <Tablet className="h-6 w-6 text-primary" />
      case "SIM Card":
        return <CardSimIcon size={24} className="text-primary" />
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getDeviceIcon()}
            <DialogTitle>Detalles del Dispositivo</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Información Básica */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Tipo</label>
              <p className="text-base font-semibold">{device.tipo}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Modelo</label>
              <p className="text-base font-semibold">{device.modelo}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Número de Serie</label>
              <p className="text-base font-mono">{device.serial}</p>
            </div>
          </div>

          {/* Estado */}
          <div className="pt-3 border-t">
            <label className="text-sm font-medium text-muted-foreground">Estado Actual</label>
            <div className="mt-2">
              <Badge
                variant={
                  device.estado === "Asignado"
                    ? "default"
                    : device.estado === "En Stock"
                      ? "secondary"
                      : "outline"
                }
                className="text-sm px-3 py-1"
              >
                {device.estado}
              </Badge>
            </div>
          </div>

          {/* Ubicación */}
          <div className="pt-3 border-t">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <label className="text-sm font-medium text-muted-foreground">Ubicación</label>
            </div>
            <p className="text-base font-semibold">Sucursal {device.sucursal}</p>
          </div>

          {/* Asignación */}
          {device.empleadoAsignado && (
            <div className="pt-3 border-t">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <label className="text-sm font-medium text-muted-foreground">Asignado a</label>
              </div>
              <p className="text-base font-semibold">{device.empleadoAsignado}</p>
            </div>
          )}

          {!device.empleadoAsignado && device.estado === "En Stock" && (
            <div className="pt-3 border-t">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <label className="text-sm font-medium text-muted-foreground">Disponibilidad</label>
              </div>
              <p className="text-base text-green-600 font-semibold">Disponible para asignación</p>
            </div>
          )}

          {device.estado === "Mantenimiento" && (
            <div className="pt-3 border-t bg-yellow-50 -mx-6 -mb-6 p-4 rounded-b-lg">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-yellow-600" />
                <label className="text-sm font-medium text-yellow-800">En Mantenimiento</label>
              </div>
              <p className="text-sm text-yellow-700">Este dispositivo está temporalmente fuera de servicio</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
