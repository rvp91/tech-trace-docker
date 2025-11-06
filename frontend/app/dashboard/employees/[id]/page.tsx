"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Edit2, Package, Mail, Phone, Building2, Briefcase, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { employeeService } from "@/lib/services/employee-service"
import type { Employee, EmployeeHistory } from "@/lib/types"
import { CreateEmployeeModal } from "@/components/modals/create-employee-modal"

export default function EmployeeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()

  const employeeId = Number(params.id)

  const [employee, setEmployee] = useState<Employee | null>(null)
  const [history, setHistory] = useState<EmployeeHistory | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    const loadEmployeeData = async () => {
      try {
        setLoading(true)
        const [employeeData, historyData] = await Promise.all([
          employeeService.getEmployee(employeeId),
          employeeService.getEmployeeHistory(employeeId),
        ])
        setEmployee(employeeData)
        setHistory(historyData)
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Error al cargar datos del empleado",
          variant: "destructive",
        })
        router.push("/dashboard/employees")
      } finally {
        setLoading(false)
      }
    }

    loadEmployeeData()
  }, [employeeId, router, toast, refreshTrigger])

  const handleEmployeeUpdated = () => {
    setRefreshTrigger(prev => prev + 1)
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

  if (!employee || !history) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-muted-foreground">Empleado no encontrado</p>
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
              onClick={() => router.push("/dashboard/employees")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{employee.nombre_completo}</h1>
              <p className="text-muted-foreground">{employee.cargo}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CreateEmployeeModal employee={employee} onSuccess={handleEmployeeUpdated}>
            <Button variant="outline">
              <Edit2 className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </CreateEmployeeModal>
          <Button>
            <Package className="h-4 w-4 mr-2" />
            Asignar Dispositivo
          </Button>
        </div>
      </div>

      {/* Información del empleado */}
      <Card>
        <CardHeader>
          <CardTitle>Información General</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">RUT</p>
                <p className="font-medium font-mono">{employee.rut}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cargo</p>
                <p className="font-medium">{employee.cargo}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sucursal</p>
                <p className="font-medium">
                  {employee.sucursal_detail ? employee.sucursal_detail.nombre : `ID: ${employee.sucursal}`}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unidad de Negocio</p>
                <p className="font-medium">{employee.unidad_negocio || "No asignada"}</p>
              </div>
            </div>

            {employee.correo_corporativo && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Correo Corporativo</p>
                  <p className="font-medium">{employee.correo_corporativo}</p>
                </div>
              </div>
            )}

            {employee.gmail_personal && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gmail Personal</p>
                  <p className="font-medium">{employee.gmail_personal}</p>
                </div>
              </div>
            )}

            {employee.telefono && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Teléfono</p>
                  <p className="font-medium">{employee.telefono}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <Badge variant={employee.estado === "ACTIVO" ? "default" : "secondary"}>
                  {employee.estado}
                </Badge>
              </div>
            </div>
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
              Este empleado no tiene asignaciones registradas
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dispositivo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fecha Entrega</TableHead>
                    <TableHead>Tipo Entrega</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">
                        {/* TODO: Mostrar detalles del dispositivo cuando esté disponible */}
                        Dispositivo #{assignment.dispositivo}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {/* TODO: Mostrar tipo de dispositivo */}
                          -
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(assignment.fechaEntrega).toLocaleDateString("es-CL")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={assignment.tipoEntrega === "permanente" ? "default" : "secondary"}>
                          {assignment.tipoEntrega}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={assignment.estado === "activa" ? "default" : "secondary"}>
                          {assignment.estado}
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
    </div>
  )
}
