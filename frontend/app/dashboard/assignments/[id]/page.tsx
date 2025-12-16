"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, User, Smartphone, Calendar, FileText, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import {
  assignmentService,
  getAssignmentStatusColor,
  getAssignmentStatusLabel,
  getTipoEntregaLabel,
  getEstadoCartaLabel,
} from "@/lib/services/assignment-service"
import type { Assignment, Return } from "@/lib/types"
import { ReturnModal } from "@/components/modals/return-modal"
import { formatDateLocal } from "@/lib/utils/date-helpers"
import { formatDateTime } from "@/lib/utils/format"

// Mapeo de estados de dispositivos en devoluciones
const DEVICE_CONDITION_LABELS: Record<string, string> = {
  OPTIMO: "Óptimo",
  CON_DANOS: "Con Daños",
  NO_FUNCIONAL: "No Funcional"
}

export default function AssignmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [returnData, setReturnData] = useState<Return | null>(null)
  const [loading, setLoading] = useState(true)
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false)
  const { toast } = useToast()

  const assignmentId = Number(params.id)

  const loadAssignment = async () => {
    try {
      setLoading(true)
      const data = await assignmentService.getAssignment(assignmentId)
      setAssignment(data)

      // Cargar datos de devolución si la asignación está finalizada
      if (data.estado_asignacion === "FINALIZADA") {
        const returnInfo = await assignmentService.getReturnByAssignment(assignmentId)
        setReturnData(returnInfo)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar la asignación",
        variant: "destructive",
      })
      router.push("/dashboard/assignments")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (assignmentId) {
      loadAssignment()
    }
  }, [assignmentId])

  const handleReturnSuccess = () => {
    setIsReturnModalOpen(false)
    loadAssignment()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!assignment) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/assignments">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Asignación #{assignment.id}</h1>
            <p className="text-muted-foreground mt-1">
              Detalles de la asignación de dispositivo
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {assignment.estado_asignacion === "ACTIVA" && (
            <Button onClick={() => setIsReturnModalOpen(true)}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Registrar Devolución
            </Button>
          )}
        </div>
      </div>

      {/* Estado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Estado de la Asignación</span>
            <Badge className={getAssignmentStatusColor(assignment.estado_asignacion)}>
              {getAssignmentStatusLabel(assignment.estado_asignacion)}
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Empleado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Empleado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {assignment.empleado_detail ? (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Nombre</p>
                  <Link
                    href={`/dashboard/employees/${assignment.empleado_detail.id}`}
                    className="font-medium hover:underline"
                  >
                    {assignment.empleado_detail.nombre_completo}
                  </Link>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">RUT</p>
                  <p className="font-medium">{assignment.empleado_detail.rut}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cargo</p>
                  <p className="font-medium">{assignment.empleado_detail.cargo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sucursal</p>
                  <p className="font-medium">
                    {assignment.empleado_detail.sucursal_detail?.nombre || "N/A"}
                  </p>
                </div>
              </>
            ) : (
              <p>ID del empleado: {assignment.empleado}</p>
            )}
          </CardContent>
        </Card>

        {/* Dispositivo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Dispositivo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {assignment.dispositivo_detail ? (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-medium">{assignment.dispositivo_detail.tipo_equipo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Marca y Modelo</p>
                  <Link
                    href={`/dashboard/devices/${assignment.dispositivo_detail.id}`}
                    className="font-medium hover:underline"
                  >
                    {assignment.dispositivo_detail.marca} {assignment.dispositivo_detail.modelo}
                  </Link>
                </div>
                {assignment.dispositivo_detail.numero_serie && (
                  <div>
                    <p className="text-sm text-muted-foreground">Número de Serie</p>
                    <p className="font-medium">{assignment.dispositivo_detail.numero_serie}</p>
                  </div>
                )}
                {assignment.dispositivo_detail.imei && (
                  <div>
                    <p className="text-sm text-muted-foreground">IMEI</p>
                    <p className="font-medium">{assignment.dispositivo_detail.imei}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <p className="font-medium">{assignment.dispositivo_detail.estado}</p>
                </div>
                {assignment.dispositivo_detail.puede_tener_edad &&
                  assignment.dispositivo_detail.edad_dispositivo_display !== null &&
                  assignment.dispositivo_detail.edad_dispositivo_display !== undefined && (
                  <div>
                    <p className="text-sm text-muted-foreground">Edad</p>
                    <p className="font-medium">
                      {assignment.dispositivo_detail.edad_dispositivo_display} año{assignment.dispositivo_detail.edad_dispositivo_display === "5+" || Number(assignment.dispositivo_detail.edad_dispositivo_display) !== 1 ? "s" : ""}
                    </p>
                  </div>
                )}
                {assignment.dispositivo_detail.puede_tener_valor &&
                  assignment.dispositivo_detail.valor_inicial && (
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Inicial</p>
                    <p className="font-medium">
                      ${Number(assignment.dispositivo_detail.valor_inicial).toLocaleString('es-CL')} CLP
                    </p>
                  </div>
                )}
                {assignment.dispositivo_detail.puede_tener_valor &&
                  assignment.dispositivo_detail.valor_depreciado_calculado !== null &&
                  assignment.dispositivo_detail.valor_depreciado_calculado !== undefined && (
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Actual (Depreciado)</p>
                    <p className="font-medium">
                      ${Number(assignment.dispositivo_detail.valor_depreciado_calculado).toLocaleString('es-CL')} CLP
                      {assignment.dispositivo_detail.es_valor_manual && (
                        <Badge variant="outline" className="ml-2">Manual</Badge>
                      )}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p>ID del dispositivo: {assignment.dispositivo}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detalles de la Asignación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Detalles de la Asignación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Tipo de Entrega</p>
              <p className="font-medium">{getTipoEntregaLabel(assignment.tipo_entrega)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fecha de Entrega</p>
              <p className="font-medium">
                {formatDateLocal(assignment.fecha_entrega)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estado de Carta</p>
              <p className="font-medium">{getEstadoCartaLabel(assignment.estado_carta)}</p>
            </div>
            {assignment.fecha_devolucion && (
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Devolución</p>
                <p className="font-medium">
                  {formatDateLocal(assignment.fecha_devolucion)}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Creado por</p>
              <p className="font-medium">{assignment.created_by_username || "Sistema"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fecha de Creación</p>
              <p className="font-medium">
                {formatDateTime(assignment.created_at)}
              </p>
            </div>
          </div>

          {assignment.observaciones && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-1">Observaciones</p>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm whitespace-pre-wrap">{assignment.observaciones}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información de Devolución */}
      {returnData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Información de Devolución
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Devolución</p>
                <p className="font-medium">
                  {formatDateLocal(returnData.fecha_devolucion)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado del Dispositivo</p>
                <p className="font-medium">{DEVICE_CONDITION_LABELS[returnData.estado_dispositivo] || returnData.estado_dispositivo}</p>
              </div>
              {returnData.observaciones && (
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground mb-1">Observaciones</p>
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-sm whitespace-pre-wrap">{returnData.observaciones}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <ReturnModal
        open={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        onSuccess={handleReturnSuccess}
        assignment={assignment}
      />
    </div>
  )
}
