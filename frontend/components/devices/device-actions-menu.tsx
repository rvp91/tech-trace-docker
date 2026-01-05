"use client"

import { useState } from "react"
import { MoreVertical, Wrench, CheckCircle, RotateCw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { DeviceActionModal } from "@/components/modals/device-action-modal"
import { deviceService } from "@/lib/services/device-service"
import { useToast } from "@/hooks/use-toast"
import type { Device } from "@/lib/types"

interface DeviceActionsMenuProps {
  device: Device
  onActionComplete?: () => void
}

export function DeviceActionsMenu({ device, onActionComplete }: DeviceActionsMenuProps) {
  const [actionModal, setActionModal] = useState<{
    open: boolean
    type: "maintenance" | "available" | "return-from-maintenance" | "retired" | null
  }>({ open: false, type: null })

  const { toast } = useToast()

  const handleActionConfirm = async (data: { motivo?: string; observaciones?: string }) => {
    if (!actionModal.type) return

    try {
      let response

      switch (actionModal.type) {
        case "maintenance":
          if (!data.motivo) throw new Error("El motivo es requerido")
          response = await deviceService.sendToMaintenance(device.id, {
            motivo: data.motivo,
            observaciones: data.observaciones,
          })
          break
        case "available":
          response = await deviceService.markAvailable(device.id, {
            observaciones: data.observaciones,
          })
          break
        case "return-from-maintenance":
          response = await deviceService.returnFromMaintenance(device.id, {
            observaciones: data.observaciones,
          })
          break
        case "retired":
          if (!data.motivo) throw new Error("El motivo es requerido")
          response = await deviceService.markAsRetired(device.id, {
            motivo: data.motivo,
            observaciones: data.observaciones,
          })
          break
      }

      toast({
        title: "Éxito",
        description: response.message || "Acción completada exitosamente",
      })

      // Cerrar modal y ejecutar callback
      setActionModal({ open: false, type: null })
      onActionComplete?.()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al realizar la acción",
        variant: "destructive",
      })
    }
  }

  const getModalTitle = () => {
    switch (actionModal.type) {
      case "maintenance":
        return "Enviar a Mantenimiento"
      case "available":
        return "Marcar como Disponible"
      case "return-from-maintenance":
        return "Retornar de Mantenimiento"
      case "retired":
        return "Dar de Baja"
      default:
        return ""
    }
  }

  const getModalDescription = () => {
    switch (actionModal.type) {
      case "maintenance":
        return device.estado === "ASIGNADO"
          ? "El dispositivo será enviado a mantenimiento urgente. La asignación permanecerá activa durante la reparación."
          : "El dispositivo será enviado a mantenimiento preventivo. Por favor, indique el motivo."
      case "available":
        return "El dispositivo será marcado como disponible y estará listo para ser asignado nuevamente."
      case "return-from-maintenance":
        return "El dispositivo será retornado al estado ASIGNADO. La asignación permanecerá activa y el empleado volverá a tener el dispositivo."
      case "retired":
        return "El dispositivo será dado de baja permanentemente. Por favor, indique el motivo de la baja."
      default:
        return ""
    }
  }

  const getConfirmButtonText = () => {
    switch (actionModal.type) {
      case "maintenance":
        return "Enviar a Mantenimiento"
      case "available":
        return "Marcar Disponible"
      case "return-from-maintenance":
        return "Retornar al Empleado"
      case "retired":
        return "Dar de Baja"
      default:
        return "Confirmar"
    }
  }

  // Determinar si el dispositivo tiene estados finales
  const isFinalState = device.estado === "BAJA" || device.estado === "ROBO"

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={isFinalState}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          {device.estado === "DISPONIBLE" && (
            <>
              <DropdownMenuItem
                onClick={() => setActionModal({ open: true, type: "maintenance" })}
              >
                <Wrench className="mr-2 h-4 w-4" />
                Enviar a Mantenimiento
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setActionModal({ open: true, type: "retired" })}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Dar de Baja
              </DropdownMenuItem>
            </>
          )}

          {device.estado === "ASIGNADO" && (
            <>
              <DropdownMenuItem
                onClick={() => setActionModal({ open: true, type: "maintenance" })}
              >
                <Wrench className="mr-2 h-4 w-4" />
                Enviar a Mantenimiento
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setActionModal({ open: true, type: "retired" })}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Dar de Baja
              </DropdownMenuItem>
            </>
          )}

          {device.estado === "MANTENIMIENTO" && (
            <>
              {device.asignacion_activa ? (
                <>
                  <DropdownMenuItem
                    onClick={() => setActionModal({ open: true, type: "return-from-maintenance" })}
                  >
                    <RotateCw className="mr-2 h-4 w-4" />
                    Retornar de Mantenimiento
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setActionModal({ open: true, type: "retired" })}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Dar de Baja
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem
                    onClick={() => setActionModal({ open: true, type: "available" })}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Marcar como Disponible
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setActionModal({ open: true, type: "retired" })}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Dar de Baja
                  </DropdownMenuItem>
                </>
              )}
            </>
          )}

          {isFinalState && (
            <DropdownMenuItem disabled>
              Sin acciones disponibles
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modal de confirmación */}
      <DeviceActionModal
        open={actionModal.open}
        onOpenChange={(open) => setActionModal({ ...actionModal, open })}
        onConfirm={handleActionConfirm}
        title={getModalTitle()}
        description={getModalDescription()}
        confirmButtonText={getConfirmButtonText()}
        requiresMotivo={actionModal.type === "maintenance" || actionModal.type === "retired"}
      />
    </>
  )
}
