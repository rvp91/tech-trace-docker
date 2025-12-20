"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { assignmentService } from "@/lib/services/assignment-service"
import type { Assignment } from "@/lib/types"
import { AlertTriangle } from "lucide-react"

interface MarkSignedConfirmationModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  assignment: Assignment | null
}

export function MarkSignedConfirmationModal({
  open,
  onClose,
  onSuccess,
  assignment,
}: MarkSignedConfirmationModalProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleConfirm = async () => {
    if (!assignment) return

    setLoading(true)

    try {
      await assignmentService.markAsSigned(assignment.id)

      toast({
        title: "Carta marcada como firmada",
        description: "La carta de responsabilidad ha sido marcada como firmada exitosamente",
      })

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error al marcar carta como firmada:', error)
      toast({
        title: "Error",
        description: error.message || "No se pudo marcar la carta como firmada",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!assignment) return null

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Confirmar Firma de Carta
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 pt-2">
            <p>
              ¿Está seguro que desea marcar como firmada la carta de responsabilidad de la asignación #{assignment.id}?
            </p>
            <div className="bg-muted p-3 rounded-md space-y-1 text-sm">
              <p><span className="font-medium">Empleado:</span> {assignment.empleado_detail?.nombre_completo || 'N/A'}</p>
              <p><span className="font-medium">Dispositivo:</span> {assignment.dispositivo_detail ? `${assignment.dispositivo_detail.marca} ${assignment.dispositivo_detail.modelo}` : 'N/A'}</p>
            </div>
            <p className="text-destructive font-medium">
              ⚠️ Esta acción NO puede deshacerse. La firma quedará registrada permanentemente.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? "Procesando..." : "Confirmar Firma"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
