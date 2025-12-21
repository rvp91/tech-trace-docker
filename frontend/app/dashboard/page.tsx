"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Users, CheckCircle, Activity, Loader2 } from "lucide-react"
import { useDashboardStats } from "@/lib/hooks/use-swr-data"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, PieLabel } from "recharts"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { formatDateLocal } from "@/lib/utils/date-helpers"

// Colores para los gráficos
const COLORS = {
  LAPTOP: "#3b82f6",    // blue
  DESKTOP: "#f97316",   // orange
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
  DESKTOP: "Desktops",
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

// Mapeo de estados de dispositivos en devoluciones
const DEVICE_CONDITION_LABELS: Record<string, string> = {
  OPTIMO: "Óptimo",
  CON_DANOS: "Con Daños",
  NO_FUNCIONAL: "No Funcional",
  ROBO: "Robo/Pérdida"
}

export default function DashboardPage() {
  // Usar SWR para caching y revalidación automática
  const { data: stats, isLoading, error } = useDashboardStats()

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-destructive">Error al cargar las estadísticas del dashboard</p>
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
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Dashboard</h1>
        </div>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dispositivos</CardTitle>
            <Package className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
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
            <CheckCircle className="h-4 w-4 lg:h-5 lg:w-5 text-green-600" />
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
            <Activity className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600" />
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
            <Users className="h-4 w-4 lg:h-5 lg:w-5 text-purple-600" />
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
            <CardTitle>Distribución de Dispositivos por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] lg:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                <Pie
                  data={deviceTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({
                    cx,
                    cy,
                    midAngle,
                    innerRadius,
                    outerRadius,
                    percent,
                    index
                  }: any) => {
                    const RADIAN = Math.PI / 180;
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);

                    return (
                      <text
                        x={x}
                        y={y}
                        fill="white"
                        textAnchor={x > cx ? 'start' : 'end'}
                        dominantBaseline="central"
                        fontSize={12}
                        fontWeight="bold"
                      >
                        {`${(percent * 100).toFixed(0)}%`}
                      </text>
                    );
                  }}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="cantidad"
                >
                  {deviceTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.tipo as keyof typeof COLORS] || "#8884d8"} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Dispositivos por Estado */}
        <Card>
          <CardHeader>
            <CardTitle>Dispositivos por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] lg:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                <Pie
                  data={deviceStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({
                    cx,
                    cy,
                    midAngle,
                    innerRadius,
                    outerRadius,
                    percent,
                    index
                  }: any) => {
                    const RADIAN = Math.PI / 180;
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);

                    return (
                      <text
                        x={x}
                        y={y}
                        fill="white"
                        textAnchor={x > cx ? 'start' : 'end'}
                        dominantBaseline="central"
                        fontSize={12}
                        fontWeight="bold"
                      >
                        {`${(percent * 100).toFixed(0)}%`}
                      </text>
                    );
                  }}
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
            </div>
          </CardContent>
        </Card>
      </div>

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
                        {formatDateLocal(assignment.fecha_entrega)}
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

        {/* Últimas Devoluciones y Robos/Pérdidas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Últimas Devoluciones y Robos/Pérdidas</CardTitle>
            <Link href="/dashboard/assignments" className="text-sm text-primary hover:underline">
              Ver todas
            </Link>
          </CardHeader>
          <CardContent>
            {stats.recent_returns.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay devoluciones ni robos/pérdidas registrados
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
                            returnItem.estado_dispositivo === "ROBO" ? "destructive" :
                            "destructive"
                          }
                        >
                          {DEVICE_CONDITION_LABELS[returnItem.estado_dispositivo] || returnItem.estado_dispositivo}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {returnItem.asignacion_detail?.dispositivo_detail?.tipo_equipo} - {returnItem.asignacion_detail?.dispositivo_detail?.marca} {returnItem.asignacion_detail?.dispositivo_detail?.modelo}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {returnItem.estado_dispositivo === "ROBO" ? "Reportado: " : "Devuelto: "}{formatDateLocal(returnItem.fecha_devolucion)}
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/assignments/${returnItem.asignacion_detail?.id || returnItem.asignacion}`}
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
