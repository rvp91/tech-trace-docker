"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Edit2, Package, Building2, Calendar, Hash, Smartphone, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { deviceService, getDeviceStatusColor, getDeviceStatusLabel, getDeviceTypeLabel } from "@/lib/services/device-service"
import type { Device, DeviceHistory } from "@/lib/types"
import { DeviceModal } from "@/components/modals/device-modal"
import { AssignmentModal } from "@/components/modals/assignment-modal"
import { formatDateLocal } from "@/lib/utils/date-helpers"

export default function DeviceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()

  const deviceId = Number(params.id)

  const [device, setDevice] = useState<Device | null>(null)
  const [history, setHistory] = useState<DeviceHistory | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [assignModalOpen, setAssignModalOpen] = useState(false)

  useEffect(() => {
    const loadDeviceData = async () => {
      try {
        setLoading(true)
        const [deviceData, historyData] = await Promise.all([
          deviceService.getDevice(deviceId),
          deviceService.getDeviceHistory(deviceId),
        ])
        setDevice(deviceData)
        setHistory(historyData)
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Error al cargar datos del dispositivo",
          variant: "destructive",
        })
        router.push("/dashboard/devices")
      } finally {
        setLoading(false)
      }
    }

    loadDeviceData()
  }, [deviceId, router, toast, refreshTrigger])

  const handleDeviceUpdated = () => {
    setRefreshTrigger(prev => prev + 1)
    setEditModalOpen(false)
  }

  const handleAssignmentCreated = () => {
    setRefreshTrigger(prev => prev + 1)
    setAssignModalOpen(false)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!device || !history) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-muted-foreground">Dispositivo no encontrado</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard/devices")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{device.marca} {device.modelo}</h1>
              <p className="text-muted-foreground">{getDeviceTypeLabel(device.tipo_equipo)}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setEditModalOpen(true)}>
            <Edit2 className="h-4 w-4 mr-2" />
            Editar
          </Button>
          {device.estado === "DISPONIBLE" && (
            <Button onClick={() => setAssignModalOpen(true)}>
              <Package className="h-4 w-4 mr-2" />
              Asignar
            </Button>
          )}
        </div>
      </div>

      {/* Información del dispositivo */}
      <Card>
        <CardHeader>
          <CardTitle>Información General</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo de Equipo</p>
                <p className="font-medium">{getDeviceTypeLabel(device.tipo_equipo)}</p>
              </div>
            </div>

{device.numero_serie && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Hash className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Número de Serie</p>
                  <p className="font-medium font-mono">{device.numero_serie}</p>
                </div>
              </div>
            )}

            {device.imei && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Smartphone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">IMEI</p>
                  <p className="font-medium font-mono">{device.imei}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Marca</p>
                <p className="font-medium">{device.marca}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Modelo</p>
                <p className="font-medium">{device.modelo}</p>
              </div>
            </div>

            {device.numero_telefono && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Smartphone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Número de Teléfono</p>
                  <p className="font-medium">{device.numero_telefono}</p>
                </div>
              </div>
            )}

            {device.numero_factura && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Hash className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Número de Factura</p>
                  <p className="font-medium">{device.numero_factura}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sucursal</p>
                <p className="font-medium">
                  {device.sucursal_detail ? device.sucursal_detail.nombre : `ID: ${device.sucursal}`}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Ingreso</p>
                <p className="font-medium">
                  {formatDateLocal(device.fecha_ingreso)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <RefreshCw className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado Actual</p>
                <Badge className={getDeviceStatusColor(device.estado)}>
                  {getDeviceStatusLabel(device.estado)}
                </Badge>
              </div>
            </div>

            {device.puede_tener_edad &&
              device.edad_dispositivo_display !== null &&
              device.edad_dispositivo_display !== undefined && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Edad del Dispositivo</p>
                  <p className="font-medium">
                    {device.edad_dispositivo_display} año{device.edad_dispositivo_display === "5+" || Number(device.edad_dispositivo_display) !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            )}

            {device.puede_tener_valor && device.valor_inicial && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Hash className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Inicial</p>
                  <p className="font-medium">
                    ${Number(device.valor_inicial).toLocaleString('es-CL')} CLP
                  </p>
                </div>
              </div>
            )}

            {device.puede_tener_valor &&
              device.valor_depreciado_calculado !== null &&
              device.valor_depreciado_calculado !== undefined && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Hash className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Actual (Depreciado)</p>
                  <p className="font-medium">
                    ${Number(device.valor_depreciado_calculado).toLocaleString('es-CL')} CLP
                    {device.es_valor_manual && (
                      <Badge variant="outline" className="ml-2 text-xs">Manual</Badge>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Asignaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{history.total_assignments || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Asignaciones Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {history.active_assignments || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Asignaciones Finalizadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-muted-foreground">
              {(history.total_assignments || 0) - (history.active_assignments || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historial de asignaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Asignaciones</CardTitle>
        </CardHeader>
        <CardContent>
          {history.assignments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Este dispositivo no tiene asignaciones registradas
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Fecha Entrega</TableHead>
                    <TableHead>Fecha Devolución</TableHead>
                    <TableHead>Tipo Entrega</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">
                        {assignment.empleado_detail
                          ? assignment.empleado_detail.nombre_completo
                          : `Empleado #${assignment.empleado}`}
                      </TableCell>
                      <TableCell>
                        {formatDateLocal(assignment.fecha_entrega)}
                      </TableCell>
                      <TableCell>
                        {assignment.fecha_devolucion
                          ? formatDateLocal(assignment.fecha_devolucion)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={assignment.tipo_entrega === "PERMANENTE" ? "default" : "secondary"}>
                          {assignment.tipo_entrega}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={assignment.estado_asignacion === "ACTIVA" ? "default" : "secondary"}>
                          {assignment.estado_asignacion}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/assignments/${assignment.id}`)}
                        >
                          Ver detalles
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de edición */}
      <DeviceModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        device={device}
        onSuccess={handleDeviceUpdated}
      />

      {/* Modal de asignación */}
      <AssignmentModal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        onSuccess={handleAssignmentCreated}
        preSelectedDevice={deviceId}
      />
    </div>
  )
}
