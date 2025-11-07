"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Users, CheckCircle, Activity, Loader2 } from "lucide-react"
import { statsService, DashboardStats } from "@/lib/services/stats-service"
import { useToast } from "@/hooks/use-toast"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

// Colores para los gráficos
const COLORS = {
  LAPTOP: "#3b82f6",    // blue
  TELEFONO: "#10b981",  // green
  TABLET: "#f59e0b",    // amber
  SIM: "#8b5cf6",       // purple
  ACCESORIO: "#6366f1"  // indigo
}

const STATUS_COLORS = {
  DISPONIBLE: "#22c55e",
  ASIGNADO: "#3b82f6",
  MANTENIMIENTO: "#f59e0b",
  BAJA: "#6b7280",
  ROBO: "#ef4444"
}

// Mapeo de labels en español
const DEVICE_TYPE_LABELS: Record<string, string> = {
  LAPTOP: "Laptops",
  TELEFONO: "Teléfonos",
  TABLET: "Tablets",
  SIM: "SIM Cards",
  ACCESORIO: "Accesorios"
}

const STATUS_LABELS: Record<string, string> = {
  DISPONIBLE: "Disponibles",
  ASIGNADO: "Asignados",
  MANTENIMIENTO: "Mantenimiento",
  BAJA: "De Baja",
  ROBO: "Robo/Pérdida"
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const loadStats = async () => {
    try {
      setLoading(true)
      const data = await statsService.getDashboardStats()
      setStats(data)
    } catch (error) {
      console.error("Error loading dashboard stats:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas del dashboard",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()

    // Actualización automática cada 60 segundos
    const interval = setInterval(() => {
      loadStats()
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Preparar datos para gráfico de tipos
  const deviceTypeData = Object.entries(stats.devices_by_type).map(([tipo, cantidad]) => ({
    name: DEVICE_TYPE_LABELS[tipo] || tipo,
    cantidad,
    tipo
  }))

  // Preparar datos para gráfico de estados
  const deviceStatusData = Object.entries(stats.devices_by_status).map(([estado, cantidad]) => ({
    name: STATUS_LABELS[estado] || estado,
    cantidad,
    estado
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Panel de Control</h1>
          <p className="text-muted-foreground mt-1">
            Última actualización: {new Date().toLocaleTimeString("es-CL")}
          </p>
        </div>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dispositivos</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.summary.total_devices}</div>
            <p className="text-xs text-muted-foreground mt-1">
              En todo el sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.summary.available_devices}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Listos para asignar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asignaciones Activas</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.summary.active_assignments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              En uso actualmente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empleados Activos</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.summary.active_employees}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Personal registrado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Dispositivos por Tipo */}
        <Card>
          <CardHeader>
            <CardTitle>Dispositivos por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={deviceTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="cantidad"
                  fill="#3b82f6"
                  name="Cantidad"
                  radius={[8, 8, 0, 0]}
                >
                  {deviceTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.tipo as keyof typeof COLORS] || "#3b82f6"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Dispositivos por Estado */}
        <Card>
          <CardHeader>
            <CardTitle>Dispositivos por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={deviceStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="cantidad"
                >
                  {deviceStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.estado as keyof typeof STATUS_COLORS] || "#8884d8"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Dispositivos por Sucursal */}
      {stats.devices_by_branch.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Dispositivos por Sucursal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.devices_by_branch}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sucursal__codigo" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#8b5cf6" name="Dispositivos" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Últimas Asignaciones y Devoluciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimas Asignaciones */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Últimas Asignaciones</CardTitle>
            <Link href="/dashboard/assignments" className="text-sm text-primary hover:underline">
              Ver todas
            </Link>
          </CardHeader>
          <CardContent>
            {stats.recent_assignments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay asignaciones registradas
              </p>
            ) : (
              <div className="space-y-4">
                {stats.recent_assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {assignment.empleado_detail?.nombre_completo || "Empleado desconocido"}
                        </p>
                        <Badge variant={assignment.estado_asignacion === "ACTIVA" ? "default" : "secondary"}>
                          {assignment.estado_asignacion}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {assignment.dispositivo_detail?.tipo_equipo} - {assignment.dispositivo_detail?.marca} {assignment.dispositivo_detail?.modelo}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(assignment.fecha_entrega).toLocaleDateString("es-CL")}
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/assignments/${assignment.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      Ver detalles
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Últimas Devoluciones */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Últimas Devoluciones</CardTitle>
            <Link href="/dashboard/assignments" className="text-sm text-primary hover:underline">
              Ver todas
            </Link>
          </CardHeader>
          <CardContent>
            {stats.recent_returns.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay devoluciones registradas
              </p>
            ) : (
              <div className="space-y-4">
                {stats.recent_returns.map((returnItem) => (
                  <div
                    key={returnItem.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {returnItem.asignacion_detail?.empleado_detail?.nombre_completo || "Empleado desconocido"}
                        </p>
                        <Badge
                          variant={
                            returnItem.estado_dispositivo === "OPTIMO" ? "default" :
                            returnItem.estado_dispositivo === "CON_DANOS" ? "outline" :
                            "destructive"
                          }
                        >
                          {returnItem.estado_dispositivo}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {returnItem.asignacion_detail?.dispositivo_detail?.tipo_equipo} - {returnItem.asignacion_detail?.dispositivo_detail?.marca} {returnItem.asignacion_detail?.dispositivo_detail?.modelo}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Devuelto: {new Date(returnItem.fecha_devolucion).toLocaleDateString("es-CL")}
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/assignments/${returnItem.asignacion}`}
                      className="text-sm text-primary hover:underline"
                    >
                      Ver detalles
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
