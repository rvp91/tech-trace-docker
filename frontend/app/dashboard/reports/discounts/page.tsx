"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TablePagination } from "@/components/ui/table-pagination"
import { Download, FileSpreadsheet } from "lucide-react"
import { BranchSearchCombobox } from "@/components/ui/branch-search-combobox"
import { EmployeeSearchCombobox } from "@/components/ui/employee-search-combobox"
import { exportToCSV, exportToExcel, getDeviceSerial, formatCurrency } from "@/lib/utils"
import { formatDateLocal } from "@/lib/utils/date-helpers"
import { reportService } from "@/lib/services/report-service"
import { getDeviceTypeLabel } from "@/lib/services/device-service"
import type { Assignment, DiscountReportFilters, TipoEquipo } from "@/lib/types"

export default function DiscountReportsPage() {
  // Estado para datos y carga
  const [reports, setReports] = useState<Assignment[]>([])
  const [totalReports, setTotalReports] = useState(0)
  const [loading, setLoading] = useState(true)

  // Estado para filtros
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [filterEmpleado, setFilterEmpleado] = useState<number | undefined>(undefined)
  const [filterSucursal, setFilterSucursal] = useState<number | undefined>(undefined)
  const [filterTipoDispositivo, setFilterTipoDispositivo] = useState<string>("ALL")

  // Estado para paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Cargar reportes
  const loadReports = useCallback(async () => {
    try {
      setLoading(true)
      const filters: DiscountReportFilters = {}

      if (fechaInicio) filters.fecha_inicio = fechaInicio
      if (fechaFin) filters.fecha_fin = fechaFin
      if (filterEmpleado) filters.empleado = filterEmpleado
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
  }, [currentPage, pageSize, fechaInicio, fechaFin, filterEmpleado, filterSucursal, filterTipoDispositivo])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  // Reset página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [fechaInicio, fechaFin, filterEmpleado, filterSucursal, filterTipoDispositivo])

  // Exportar a CSV
  const handleExportCSV = async () => {
    try {
      const filters: DiscountReportFilters = {}
      if (fechaInicio) filters.fecha_inicio = fechaInicio
      if (fechaFin) filters.fecha_fin = fechaFin
      if (filterEmpleado) filters.empleado = filterEmpleado
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
        serie_imei: assignment.dispositivo_detail ? getDeviceSerial(assignment.dispositivo_detail) : "N/A",
        fecha_reporte: formatDateLocal(assignment.updated_at),
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
          { key: "serie_imei", header: "Serie/IMEI" },
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
      if (filterEmpleado) filters.empleado = filterEmpleado
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
        serie_imei: assignment.dispositivo_detail ? getDeviceSerial(assignment.dispositivo_detail) : "N/A",
        fecha_reporte: formatDateLocal(assignment.updated_at),
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
          { key: "serie_imei", header: "Serie/IMEI" },
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
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reportes de Descuentos</h1>
          <p className="text-muted-foreground mt-1">
            Equipos descontados por robo o pérdida
          </p>
        </div>
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
              <label className="text-sm font-medium mb-1.5 block">Empleado</label>
              <EmployeeSearchCombobox
                value={filterEmpleado}
                onChange={(value) => setFilterEmpleado(value ? parseInt(value) : undefined)}
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
                  setFilterEmpleado(undefined)
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
                  <TableHead>RUT</TableHead>
                  <TableHead>Sucursal</TableHead>
                  <TableHead>Dispositivo</TableHead>
                  <TableHead>Serie/IMEI</TableHead>
                  <TableHead>Fecha Reporte</TableHead>
                  <TableHead className="text-right">Monto Total</TableHead>
                  <TableHead className="text-center">Cuotas</TableHead>
                  <TableHead>Primera Cuota</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No se encontraron reportes con los filtros aplicados
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">
                        {assignment.empleado_detail?.nombre_completo || "N/A"}
                      </TableCell>
                      <TableCell>{assignment.empleado_detail?.rut || "N/A"}</TableCell>
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
                      <TableCell>{formatDateLocal(assignment.updated_at)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {assignment.discount_data?.monto_total
                          ? formatCurrency(parseInt(assignment.discount_data.monto_total))
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-center">
                        {assignment.discount_data?.numero_cuotas || "N/A"}
                      </TableCell>
                      <TableCell>
                        {assignment.discount_data?.mes_primera_cuota || "N/A"}
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
                onPageSizeChange={setPageSize}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
