"use client"

import { useState, useEffect, useCallback } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TablePagination } from "@/components/ui/table-pagination"
import { Badge } from "@/components/ui/badge"
import { Download, FileSpreadsheet } from "lucide-react"
import { BranchSearchCombobox } from "@/components/ui/branch-search-combobox"
import { exportToCSV, exportToExcel, getDeviceSerial, formatCurrency } from "@/lib/utils"
import { formatDateLocal, formatDateTimeToDate } from "@/lib/utils/date-helpers"
import { reportService } from "@/lib/services/report-service"
import { getDeviceTypeLabel } from "@/lib/services/device-service"
import type { Assignment, DiscountReportFilters, ActiveAssignmentReportFilters, RetiredDevicesFilters, TipoEquipo, Device } from "@/lib/types"

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("active-assignments")

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Reportes</h1>
        <p className="text-muted-foreground mt-1">
          Gestión de reportes del sistema
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active-assignments">
            Dispositivos Asignados
          </TabsTrigger>
          <TabsTrigger value="discounts">
            Descuentos por Robo/Pérdida
          </TabsTrigger>
          <TabsTrigger value="retired-devices">
            Dispositivos Dados de Baja
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active-assignments" className="space-y-6 mt-6">
          <ActiveAssignmentsReport />
        </TabsContent>

        <TabsContent value="discounts" className="space-y-6 mt-6">
          <DiscountsReport />
        </TabsContent>

        <TabsContent value="retired-devices" className="space-y-6 mt-6">
          <RetiredDevicesReport />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Componente para el reporte de asignaciones activas
function ActiveAssignmentsReport() {
  // Estado para datos y carga
  const [reports, setReports] = useState<Assignment[]>([])
  const [totalReports, setTotalReports] = useState(0)
  const [loading, setLoading] = useState(true)

  // Estado para filtros
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [filterSucursal, setFilterSucursal] = useState<number | undefined>(undefined)
  const [filterTipoDispositivo, setFilterTipoDispositivo] = useState<string>("ALL")

  // Estado para paginación
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20 // Tamaño fijo de página

  // Cargar reportes
  const loadReports = useCallback(async () => {
    // VALIDACIÓN: No hacer petición si faltan fechas obligatorias
    if (!fechaInicio || !fechaFin) {
      setReports([])
      setTotalReports(0)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const filters: ActiveAssignmentReportFilters = {
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      }

      if (filterSucursal) filters.sucursal = filterSucursal
      if (filterTipoDispositivo && filterTipoDispositivo !== "ALL") {
        filters.tipo_dispositivo = filterTipoDispositivo as TipoEquipo
      }

      const response = await reportService.getActiveAssignmentReports({
        ...filters,
        page: currentPage,
        page_size: pageSize,
      })

      setReports(response.results)
      setTotalReports(response.count)
    } catch (error) {
      console.error("Error cargando reportes:", error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, fechaInicio, fechaFin, filterSucursal, filterTipoDispositivo])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  // Reset página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [fechaInicio, fechaFin, filterSucursal, filterTipoDispositivo])

  // Exportar a CSV
  const handleExportCSV = async () => {
    // Validar que las fechas estén presentes
    if (!fechaInicio || !fechaFin) {
      alert("Debe seleccionar un rango de fechas para exportar")
      return
    }

    try {
      const filters: ActiveAssignmentReportFilters = {
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      }
      if (filterSucursal) filters.sucursal = filterSucursal
      if (filterTipoDispositivo && filterTipoDispositivo !== "ALL") {
        filters.tipo_dispositivo = filterTipoDispositivo as TipoEquipo
      }

      const allReports = await reportService.getAllActiveAssignmentReports(filters)

      const dataForExport = allReports.map((assignment) => ({
        empleado_nombre: assignment.empleado_detail?.nombre_completo || "N/A",
        empleado_rut: assignment.empleado_detail?.rut || "N/A",
        cargo: assignment.empleado_detail?.cargo || "N/A",
        sucursal: assignment.empleado_detail?.sucursal_detail?.nombre || "N/A",
        tipo_dispositivo: getDeviceTypeLabel(assignment.dispositivo_detail?.tipo_equipo || "LAPTOP"),
        marca: assignment.dispositivo_detail?.marca || "N/A",
        modelo: assignment.dispositivo_detail?.modelo || "N/A",
        numero_serie: assignment.dispositivo_detail?.numero_serie || "-",
        imei: assignment.dispositivo_detail?.imei || "-",
        fecha_entrega: formatDateLocal(assignment.fecha_entrega),
        tipo_entrega: assignment.tipo_entrega === "PERMANENTE" ? "Permanente" : "Temporal",
        estado_carta: assignment.estado_carta_display || assignment.estado_carta,
        fecha_firma: assignment.fecha_firma ? formatDateTimeToDate(assignment.fecha_firma) : "-",
      }))

      exportToCSV(
        dataForExport,
        [
          { key: "empleado_nombre", header: "Empleado" },
          { key: "empleado_rut", header: "RUT" },
          { key: "cargo", header: "Cargo" },
          { key: "sucursal", header: "Sucursal" },
          { key: "tipo_dispositivo", header: "Tipo Dispositivo" },
          { key: "marca", header: "Marca" },
          { key: "modelo", header: "Modelo" },
          { key: "numero_serie", header: "Número de Serie" },
          { key: "imei", header: "IMEI" },
          { key: "fecha_entrega", header: "Fecha Entrega" },
          { key: "tipo_entrega", header: "Tipo Entrega" },
          { key: "estado_carta", header: "Estado Carta" },
          { key: "fecha_firma", header: "Fecha Firma" },
        ],
        "reporte_dispositivos_asignados"
      )
    } catch (error) {
      console.error("Error exportando CSV:", error)
    }
  }

  // Exportar a Excel
  const handleExportExcel = async () => {
    // Validar que las fechas estén presentes
    if (!fechaInicio || !fechaFin) {
      alert("Debe seleccionar un rango de fechas para exportar")
      return
    }

    try {
      const filters: ActiveAssignmentReportFilters = {
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      }
      if (filterSucursal) filters.sucursal = filterSucursal
      if (filterTipoDispositivo && filterTipoDispositivo !== "ALL") {
        filters.tipo_dispositivo = filterTipoDispositivo as TipoEquipo
      }

      const allReports = await reportService.getAllActiveAssignmentReports(filters)

      const dataForExport = allReports.map((assignment) => ({
        empleado_nombre: assignment.empleado_detail?.nombre_completo || "N/A",
        empleado_rut: assignment.empleado_detail?.rut || "N/A",
        cargo: assignment.empleado_detail?.cargo || "N/A",
        sucursal: assignment.empleado_detail?.sucursal_detail?.nombre || "N/A",
        tipo_dispositivo: getDeviceTypeLabel(assignment.dispositivo_detail?.tipo_equipo || "LAPTOP"),
        marca: assignment.dispositivo_detail?.marca || "N/A",
        modelo: assignment.dispositivo_detail?.modelo || "N/A",
        numero_serie: assignment.dispositivo_detail?.numero_serie || "-",
        imei: assignment.dispositivo_detail?.imei || "-",
        fecha_entrega: formatDateLocal(assignment.fecha_entrega),
        tipo_entrega: assignment.tipo_entrega === "PERMANENTE" ? "Permanente" : "Temporal",
        estado_carta: assignment.estado_carta_display || assignment.estado_carta,
        fecha_firma: assignment.fecha_firma ? formatDateTimeToDate(assignment.fecha_firma) : "-",
      }))

      exportToExcel(
        dataForExport,
        [
          { key: "empleado_nombre", header: "Empleado" },
          { key: "empleado_rut", header: "RUT" },
          { key: "cargo", header: "Cargo" },
          { key: "sucursal", header: "Sucursal" },
          { key: "tipo_dispositivo", header: "Tipo Dispositivo" },
          { key: "marca", header: "Marca" },
          { key: "modelo", header: "Modelo" },
          { key: "numero_serie", header: "Número de Serie" },
          { key: "imei", header: "IMEI" },
          { key: "fecha_entrega", header: "Fecha Entrega" },
          { key: "tipo_entrega", header: "Tipo Entrega" },
          { key: "estado_carta", header: "Estado Carta" },
          { key: "fecha_firma", header: "Fecha Firma" },
        ],
        "reporte_dispositivos_asignados",
        "Asignaciones Activas"
      )
    } catch (error) {
      console.error("Error exportando Excel:", error)
    }
  }

  const totalPages = Math.ceil(totalReports / pageSize)

  // Mostrar mensaje si no hay fechas seleccionadas
  if (!fechaInicio || !fechaFin) {
    return (
      <>
        <div className="flex items-center justify-between">
          <div className="flex-1" />
          <div className="flex gap-2">
            <Button onClick={handleExportCSV} variant="outline" disabled>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
            <Button onClick={handleExportExcel} disabled>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros de Búsqueda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Fecha Inicio <span className="text-destructive">*</span>
                </label>
                <Input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Fecha Fin <span className="text-destructive">*</span>
                </label>
                <Input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Sucursal</label>
                <BranchSearchCombobox
                  value={filterSucursal}
                  onChange={(value) => setFilterSucursal(value ? parseInt(value) : undefined)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Tipo de Dispositivo</label>
                <Select value={filterTipoDispositivo} onValueChange={setFilterTipoDispositivo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos los tipos</SelectItem>
                    <SelectItem value="LAPTOP">Laptop</SelectItem>
                    <SelectItem value="DESKTOP">Desktop</SelectItem>
                    <SelectItem value="TELEFONO">Teléfono</SelectItem>
                    <SelectItem value="TABLET">Tablet</SelectItem>
                    <SelectItem value="TV">TV</SelectItem>
                    <SelectItem value="SIM">SIM Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFechaInicio("")
                    setFechaFin("")
                    setFilterSucursal(undefined)
                    setFilterTipoDispositivo("ALL")
                  }}
                  className="w-full"
                >
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg">Seleccione un rango de fechas para ver las asignaciones activas</p>
              <p className="text-sm mt-2">Los campos de fecha son obligatorios</p>
            </div>
          </CardContent>
        </Card>
      </>
    )
  }

  if (loading && reports.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="text-lg font-semibold">Cargando reportes...</div>
          <div className="text-sm text-muted-foreground mt-2">Por favor espera</div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex-1" />
        <div className="flex gap-2">
          <Button onClick={handleExportCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button onClick={handleExportExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Fecha Inicio <span className="text-destructive">*</span>
              </label>
              <Input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Fecha Fin <span className="text-destructive">*</span>
              </label>
              <Input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Sucursal</label>
              <BranchSearchCombobox
                value={filterSucursal}
                onChange={(value) => setFilterSucursal(value ? parseInt(value) : undefined)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Tipo de Dispositivo</label>
              <Select value={filterTipoDispositivo} onValueChange={setFilterTipoDispositivo}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los tipos</SelectItem>
                  <SelectItem value="LAPTOP">Laptop</SelectItem>
                  <SelectItem value="DESKTOP">Desktop</SelectItem>
                  <SelectItem value="TELEFONO">Teléfono</SelectItem>
                  <SelectItem value="TABLET">Tablet</SelectItem>
                  <SelectItem value="TV">TV</SelectItem>
                  <SelectItem value="SIM">SIM Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setFechaInicio("")
                  setFechaFin("")
                  setFilterSucursal(undefined)
                  setFilterTipoDispositivo("ALL")
                }}
                className="w-full"
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Resultados ({totalReports} {totalReports === 1 ? "registro" : "registros"})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Sucursal</TableHead>
                  <TableHead>Dispositivo</TableHead>
                  <TableHead>Número de Serie</TableHead>
                  <TableHead>Fecha Entrega</TableHead>
                  <TableHead>Tipo Entrega</TableHead>
                  <TableHead>Estado Carta</TableHead>
                  <TableHead>Fecha Firma</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No se encontraron asignaciones activas con los filtros aplicados
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">
                        {assignment.empleado_detail?.nombre_completo || "N/A"}<br />
                        <span className="text-xs text-muted-foreground">
                          {assignment.empleado_detail?.rut || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell>{assignment.empleado_detail?.cargo || "N/A"}</TableCell>
                      <TableCell>{assignment.empleado_detail?.sucursal_detail?.nombre || "N/A"}</TableCell>
                      <TableCell>
                        {getDeviceTypeLabel(assignment.dispositivo_detail?.tipo_equipo || "LAPTOP")}<br />
                        <span className="text-xs text-muted-foreground">
                          {assignment.dispositivo_detail?.marca} {assignment.dispositivo_detail?.modelo}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {assignment.dispositivo_detail ? getDeviceSerial(assignment.dispositivo_detail) : "N/A"}
                      </TableCell>
                      <TableCell>{formatDateLocal(assignment.fecha_entrega)}</TableCell>
                      <TableCell>
                        <Badge variant={assignment.tipo_entrega === "PERMANENTE" ? "default" : "secondary"}>
                          {assignment.tipo_entrega === "PERMANENTE" ? "Permanente" : "Temporal"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          assignment.estado_carta === "FIRMADA" ? "default" :
                          assignment.estado_carta === "PENDIENTE" ? "outline" : "secondary"
                        }>
                          {assignment.estado_carta_display || assignment.estado_carta}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {assignment.fecha_firma ? formatDateTimeToDate(assignment.fecha_firma) : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalReports > 0 && (
            <div className="mt-4">
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalCount={totalReports}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}

// Componente para el reporte de descuentos (migrado desde discounts/page.tsx)
function DiscountsReport() {
  // Estado para datos y carga
  const [reports, setReports] = useState<Assignment[]>([])
  const [totalReports, setTotalReports] = useState(0)
  const [loading, setLoading] = useState(true)

  // Estado para filtros
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [filterSucursal, setFilterSucursal] = useState<number | undefined>(undefined)
  const [filterTipoDispositivo, setFilterTipoDispositivo] = useState<string>("ALL")

  // Estado para paginación
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20 // Tamaño fijo de página

  // Cargar reportes
  const loadReports = useCallback(async () => {
    try {
      setLoading(true)
      const filters: DiscountReportFilters = {}

      if (fechaInicio) filters.fecha_inicio = fechaInicio
      if (fechaFin) filters.fecha_fin = fechaFin
      if (filterSucursal) filters.sucursal = filterSucursal
      if (filterTipoDispositivo && filterTipoDispositivo !== "ALL") filters.tipo_dispositivo = filterTipoDispositivo as TipoEquipo

      const response = await reportService.getDiscountReports({
        ...filters,
        page: currentPage,
        page_size: pageSize,
      })

      setReports(response.results)
      setTotalReports(response.count)
    } catch (error) {
      console.error("Error cargando reportes:", error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, fechaInicio, fechaFin, filterSucursal, filterTipoDispositivo])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  // Reset página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [fechaInicio, fechaFin, filterSucursal, filterTipoDispositivo])

  // Exportar a CSV
  const handleExportCSV = async () => {
    try {
      const filters: DiscountReportFilters = {}
      if (fechaInicio) filters.fecha_inicio = fechaInicio
      if (fechaFin) filters.fecha_fin = fechaFin
      if (filterSucursal) filters.sucursal = filterSucursal
      if (filterTipoDispositivo && filterTipoDispositivo !== "ALL") filters.tipo_dispositivo = filterTipoDispositivo as TipoEquipo

      const allReports = await reportService.getAllDiscountReports(filters)

      const dataForExport = allReports.map((assignment) => ({
        empleado_nombre: assignment.empleado_detail?.nombre_completo || "N/A",
        empleado_rut: assignment.empleado_detail?.rut || "N/A",
        sucursal: assignment.empleado_detail?.sucursal_detail?.nombre || "N/A",
        tipo_dispositivo: getDeviceTypeLabel(assignment.dispositivo_detail?.tipo_equipo || "LAPTOP"),
        marca: assignment.dispositivo_detail?.marca || "N/A",
        modelo: assignment.dispositivo_detail?.modelo || "N/A",
        numero_serie: assignment.dispositivo_detail ? getDeviceSerial(assignment.dispositivo_detail) : "N/A",
        fecha_reporte: formatDateTimeToDate(assignment.updated_at),
        monto_total: assignment.discount_data?.monto_total || "N/A",
        numero_cuotas: assignment.discount_data?.numero_cuotas || "N/A",
        mes_primera_cuota: assignment.discount_data?.mes_primera_cuota || "N/A",
      }))

      exportToCSV(
        dataForExport,
        [
          { key: "empleado_nombre", header: "Empleado" },
          { key: "empleado_rut", header: "RUT" },
          { key: "sucursal", header: "Sucursal" },
          { key: "tipo_dispositivo", header: "Tipo Dispositivo" },
          { key: "marca", header: "Marca" },
          { key: "modelo", header: "Modelo" },
          { key: "numero_serie", header: "Número de Serie" },
          { key: "fecha_reporte", header: "Fecha Reporte" },
          { key: "monto_total", header: "Monto Total" },
          { key: "numero_cuotas", header: "Número Cuotas" },
          { key: "mes_primera_cuota", header: "Mes Primera Cuota" },
        ],
        "reporte_descuentos_robo_perdida"
      )
    } catch (error) {
      console.error("Error exportando CSV:", error)
    }
  }

  // Exportar a Excel
  const handleExportExcel = async () => {
    try {
      const filters: DiscountReportFilters = {}
      if (fechaInicio) filters.fecha_inicio = fechaInicio
      if (fechaFin) filters.fecha_fin = fechaFin
      if (filterSucursal) filters.sucursal = filterSucursal
      if (filterTipoDispositivo && filterTipoDispositivo !== "ALL") filters.tipo_dispositivo = filterTipoDispositivo as TipoEquipo

      const allReports = await reportService.getAllDiscountReports(filters)

      const dataForExport = allReports.map((assignment) => ({
        empleado_nombre: assignment.empleado_detail?.nombre_completo || "N/A",
        empleado_rut: assignment.empleado_detail?.rut || "N/A",
        sucursal: assignment.empleado_detail?.sucursal_detail?.nombre || "N/A",
        tipo_dispositivo: getDeviceTypeLabel(assignment.dispositivo_detail?.tipo_equipo || "LAPTOP"),
        marca: assignment.dispositivo_detail?.marca || "N/A",
        modelo: assignment.dispositivo_detail?.modelo || "N/A",
        numero_serie: assignment.dispositivo_detail ? getDeviceSerial(assignment.dispositivo_detail) : "N/A",
        fecha_reporte: formatDateTimeToDate(assignment.updated_at),
        monto_total: assignment.discount_data?.monto_total || "N/A",
        numero_cuotas: assignment.discount_data?.numero_cuotas || "N/A",
        mes_primera_cuota: assignment.discount_data?.mes_primera_cuota || "N/A",
      }))

      exportToExcel(
        dataForExport,
        [
          { key: "empleado_nombre", header: "Empleado" },
          { key: "empleado_rut", header: "RUT" },
          { key: "sucursal", header: "Sucursal" },
          { key: "tipo_dispositivo", header: "Tipo Dispositivo" },
          { key: "marca", header: "Marca" },
          { key: "modelo", header: "Modelo" },
          { key: "numero_serie", header: "Número de Serie" },
          { key: "fecha_reporte", header: "Fecha Reporte" },
          { key: "monto_total", header: "Monto Total" },
          { key: "numero_cuotas", header: "Número Cuotas" },
          { key: "mes_primera_cuota", header: "Mes Primera Cuota" },
        ],
        "reporte_descuentos_robo_perdida",
        "Descuentos"
      )
    } catch (error) {
      console.error("Error exportando Excel:", error)
    }
  }

  const totalPages = Math.ceil(totalReports / pageSize)

  if (loading && reports.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="text-lg font-semibold">Cargando reportes...</div>
          <div className="text-sm text-muted-foreground mt-2">Por favor espera</div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex-1" />
        <div className="flex gap-2">
          <Button onClick={handleExportCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button onClick={handleExportExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Fecha Inicio</label>
              <Input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Fecha Fin</label>
              <Input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Sucursal</label>
              <BranchSearchCombobox
                value={filterSucursal}
                onChange={(value) => setFilterSucursal(value ? parseInt(value) : undefined)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Tipo de Dispositivo</label>
              <Select value={filterTipoDispositivo} onValueChange={setFilterTipoDispositivo}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los tipos</SelectItem>
                  <SelectItem value="LAPTOP">Laptop</SelectItem>
                  <SelectItem value="DESKTOP">Desktop</SelectItem>
                  <SelectItem value="TELEFONO">Teléfono</SelectItem>
                  <SelectItem value="TABLET">Tablet</SelectItem>
                  <SelectItem value="TV">TV</SelectItem>
                  <SelectItem value="SIM">SIM Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setFechaInicio("")
                  setFechaFin("")
                  setFilterSucursal(undefined)
                  setFilterTipoDispositivo("ALL")
                }}
                className="w-full"
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Resultados ({totalReports} {totalReports === 1 ? "registro" : "registros"})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Sucursal</TableHead>
                  <TableHead>Dispositivo</TableHead>
                  <TableHead>Número de Serie</TableHead>
                  <TableHead>Fecha Reporte</TableHead>
                  <TableHead className="text-right">Monto Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No se encontraron reportes con los filtros aplicados
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">
                        {assignment.empleado_detail?.nombre_completo || "N/A"}<br />
                        <span className="text-xs text-muted-foreground">
                          {assignment.empleado_detail?.rut || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell>{assignment.empleado_detail?.sucursal_detail?.nombre || "N/A"}</TableCell>
                      <TableCell>
                        {getDeviceTypeLabel(assignment.dispositivo_detail?.tipo_equipo || "LAPTOP")}<br />
                        <span className="text-xs text-muted-foreground">
                          {assignment.dispositivo_detail?.marca} {assignment.dispositivo_detail?.modelo}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {assignment.dispositivo_detail ? getDeviceSerial(assignment.dispositivo_detail) : "N/A"}
                      </TableCell>
                      <TableCell>{formatDateTimeToDate(assignment.updated_at)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {assignment.discount_data?.monto_total
                          ? formatCurrency(parseInt(assignment.discount_data.monto_total))
                          : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalReports > 0 && (
            <div className="mt-4">
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalCount={totalReports}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}

// Componente para el reporte de dispositivos dados de baja
function RetiredDevicesReport() {
  // Estado para datos y carga
  const [reports, setReports] = useState<Device[]>([])
  const [totalReports, setTotalReports] = useState(0)
  const [loading, setLoading] = useState(true)

  // Estado para filtros
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [filterSucursal, setFilterSucursal] = useState<number | undefined>(undefined)
  const [filterTipoDispositivo, setFilterTipoDispositivo] = useState<string>("ALL")

  // Estado para paginación
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20 // Tamaño fijo de página

  // Cargar reportes
  const loadReports = useCallback(async () => {
    try {
      setLoading(true)
      const filters: RetiredDevicesFilters = {}

      if (fechaInicio) filters.fecha_inicio = fechaInicio
      if (fechaFin) filters.fecha_fin = fechaFin
      if (filterSucursal) filters.sucursal = filterSucursal
      if (filterTipoDispositivo && filterTipoDispositivo !== "ALL") {
        filters.tipo_dispositivo = filterTipoDispositivo as TipoEquipo
      }

      const response = await reportService.getRetiredDevicesReport({
        ...filters,
        page: currentPage,
        page_size: pageSize,
      })

      setReports(response.results)
      setTotalReports(response.count)
    } catch (error) {
      console.error("Error cargando reportes:", error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, fechaInicio, fechaFin, filterSucursal, filterTipoDispositivo])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  // Reset página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [fechaInicio, fechaFin, filterSucursal, filterTipoDispositivo])

  // Exportar a CSV
  const handleExportCSV = async () => {
    try {
      const filters: RetiredDevicesFilters = {}
      if (fechaInicio) filters.fecha_inicio = fechaInicio
      if (fechaFin) filters.fecha_fin = fechaFin
      if (filterSucursal) filters.sucursal = filterSucursal
      if (filterTipoDispositivo && filterTipoDispositivo !== "ALL") {
        filters.tipo_dispositivo = filterTipoDispositivo as TipoEquipo
      }

      const allReports = await reportService.getAllRetiredDevicesReport(filters)

      const dataForExport = allReports.map((device) => ({
        tipo_dispositivo: getDeviceTypeLabel(device.tipo_equipo),
        marca: device.marca || "N/A",
        modelo: device.modelo || "N/A",
        numero_serie: device.numero_serie || "-",
        imei: device.imei || "-",
        sucursal: device.sucursal_detail?.nombre || "N/A",
        fecha_ingreso: formatDateLocal(device.fecha_ingreso),
        fecha_baja: device.fecha_inactivacion ? formatDateTimeToDate(device.fecha_inactivacion) : "N/A",
      }))

      exportToCSV(
        dataForExport,
        [
          { key: "tipo_dispositivo", header: "Tipo Dispositivo" },
          { key: "marca", header: "Marca" },
          { key: "modelo", header: "Modelo" },
          { key: "numero_serie", header: "Número de Serie" },
          { key: "imei", header: "IMEI" },
          { key: "sucursal", header: "Sucursal" },
          { key: "fecha_ingreso", header: "Fecha Ingreso" },
          { key: "fecha_baja", header: "Fecha Baja" },
        ],
        "reporte_dispositivos_dados_baja"
      )
    } catch (error) {
      console.error("Error exportando CSV:", error)
    }
  }

  // Exportar a Excel
  const handleExportExcel = async () => {
    try {
      const filters: RetiredDevicesFilters = {}
      if (fechaInicio) filters.fecha_inicio = fechaInicio
      if (fechaFin) filters.fecha_fin = fechaFin
      if (filterSucursal) filters.sucursal = filterSucursal
      if (filterTipoDispositivo && filterTipoDispositivo !== "ALL") {
        filters.tipo_dispositivo = filterTipoDispositivo as TipoEquipo
      }

      const allReports = await reportService.getAllRetiredDevicesReport(filters)

      const dataForExport = allReports.map((device) => ({
        tipo_dispositivo: getDeviceTypeLabel(device.tipo_equipo),
        marca: device.marca || "N/A",
        modelo: device.modelo || "N/A",
        numero_serie: device.numero_serie || "-",
        imei: device.imei || "-",
        sucursal: device.sucursal_detail?.nombre || "N/A",
        fecha_ingreso: formatDateLocal(device.fecha_ingreso),
        fecha_baja: device.fecha_inactivacion ? formatDateTimeToDate(device.fecha_inactivacion) : "N/A",
      }))

      exportToExcel(
        dataForExport,
        [
          { key: "tipo_dispositivo", header: "Tipo Dispositivo" },
          { key: "marca", header: "Marca" },
          { key: "modelo", header: "Modelo" },
          { key: "numero_serie", header: "Número de Serie" },
          { key: "imei", header: "IMEI" },
          { key: "sucursal", header: "Sucursal" },
          { key: "fecha_ingreso", header: "Fecha Ingreso" },
          { key: "fecha_baja", header: "Fecha Baja" },
        ],
        "reporte_dispositivos_dados_baja",
        "Dispositivos Baja"
      )
    } catch (error) {
      console.error("Error exportando Excel:", error)
    }
  }

  const totalPages = Math.ceil(totalReports / pageSize)

  if (loading && reports.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="text-lg font-semibold">Cargando reportes...</div>
          <div className="text-sm text-muted-foreground mt-2">Por favor espera</div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex-1" />
        <div className="flex gap-2">
          <Button onClick={handleExportCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button onClick={handleExportExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Fecha Inicio</label>
              <Input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Fecha Fin</label>
              <Input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Sucursal</label>
              <BranchSearchCombobox
                value={filterSucursal}
                onChange={(value) => setFilterSucursal(value ? parseInt(value) : undefined)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Tipo de Dispositivo</label>
              <Select value={filterTipoDispositivo} onValueChange={setFilterTipoDispositivo}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los tipos</SelectItem>
                  <SelectItem value="LAPTOP">Laptop</SelectItem>
                  <SelectItem value="DESKTOP">Desktop</SelectItem>
                  <SelectItem value="TELEFONO">Teléfono</SelectItem>
                  <SelectItem value="TABLET">Tablet</SelectItem>
                  <SelectItem value="TV">TV</SelectItem>
                  <SelectItem value="SIM">SIM Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setFechaInicio("")
                  setFechaFin("")
                  setFilterSucursal(undefined)
                  setFilterTipoDispositivo("ALL")
                }}
                className="w-full"
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Resultados ({totalReports} {totalReports === 1 ? "registro" : "registros"})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Marca / Modelo</TableHead>
                  <TableHead>Número de Serie</TableHead>
                  <TableHead>Sucursal</TableHead>
                  <TableHead>Fecha Ingreso</TableHead>
                  <TableHead>Fecha Baja</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No se encontraron dispositivos dados de baja con los filtros aplicados
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell className="font-medium">
                        {getDeviceTypeLabel(device.tipo_equipo)}
                      </TableCell>
                      <TableCell>
                        {device.marca || "N/A"}<br />
                        <span className="text-xs text-muted-foreground">
                          {device.modelo || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {getDeviceSerial(device)}
                      </TableCell>
                      <TableCell>{device.sucursal_detail?.nombre || "N/A"}</TableCell>
                      <TableCell>{formatDateLocal(device.fecha_ingreso)}</TableCell>
                      <TableCell>
                        {device.fecha_inactivacion ? formatDateTimeToDate(device.fecha_inactivacion) : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalReports > 0 && (
            <div className="mt-4">
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalCount={totalReports}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
