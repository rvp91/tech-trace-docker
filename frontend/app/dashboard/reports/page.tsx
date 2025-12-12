"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Package, Building2, User } from "lucide-react"
import { deviceService, getDeviceStatusColor, getDeviceStatusLabel, getDeviceTypeLabel } from "@/lib/services/device-service"
import { branchService } from "@/lib/services/branch-service"
import { employeeService } from "@/lib/services/employee-service"
import { exportToCSV, formatDate, getDeviceSerial } from "@/lib/utils"
import type { Device, Branch, Employee } from "@/lib/types"

export default function ReportsPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [selectedBranch, setSelectedBranch] = useState<number | "todos">("todos")
  const [selectedEmployee, setSelectedEmployee] = useState<number | "todos">("todos")

  // Cargar datos de la API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [devicesResponse, branchesResponse, employeesResponse] = await Promise.all([
          deviceService.getDevices({ page_size: 1000 }),
          branchService.getBranches({ page_size: 100 }),
          employeeService.getEmployees({ page_size: 1000, estado: "ACTIVO" })
        ])
        setDevices(devicesResponse.results)
        setBranches(branchesResponse.results)
        setEmployees(employeesResponse.results)
      } catch (error) {
        console.error("Error cargando datos:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // SECCIÓN 1: INVENTARIO GENERAL
  const generalInventory = useMemo(() => {
    const byType = {
      LAPTOP: devices.filter(d => d.tipo_equipo === "LAPTOP").length,
      TELEFONO: devices.filter(d => d.tipo_equipo === "TELEFONO").length,
      TABLET: devices.filter(d => d.tipo_equipo === "TABLET").length,
      SIM: devices.filter(d => d.tipo_equipo === "SIM").length,
      ACCESORIO: devices.filter(d => d.tipo_equipo === "ACCESORIO").length,
    }

    const byStatus = {
      DISPONIBLE: devices.filter(d => d.estado === "DISPONIBLE").length,
      ASIGNADO: devices.filter(d => d.estado === "ASIGNADO").length,
      MANTENIMIENTO: devices.filter(d => d.estado === "MANTENIMIENTO").length,
      BAJA: devices.filter(d => d.estado === "BAJA").length,
      ROBO: devices.filter(d => d.estado === "ROBO").length,
    }

    return { byType, byStatus, total: devices.length }
  }, [devices])

  const handleExportGeneralInventory = () => {
    const dataForExport = devices.map((device) => ({
      tipo: getDeviceTypeLabel(device.tipo_equipo),
      marca: device.marca,
      modelo: device.modelo || "N/A",
      serie_imei: getDeviceSerial(device),
      numero_telefono: device.numero_telefono || "N/A",
      estado: getDeviceStatusLabel(device.estado),
      sucursal: device.sucursal_detail?.nombre || `ID: ${device.sucursal}`,
      fecha_ingreso: formatDate(device.fecha_ingreso),
    }))

    exportToCSV(
      dataForExport,
      [
        { key: "tipo", header: "Tipo" },
        { key: "marca", header: "Marca" },
        { key: "modelo", header: "Modelo" },
        { key: "serie_imei", header: "Serie/IMEI" },
        { key: "numero_telefono", header: "Número Teléfono" },
        { key: "estado", header: "Estado" },
        { key: "sucursal", header: "Sucursal" },
        { key: "fecha_ingreso", header: "Fecha Ingreso" },
      ],
      "reporte_inventario_general"
    )
  }

  // SECCIÓN 2: INVENTARIO POR SUCURSAL
  const branchInventory = useMemo(() => {
    const emptyStatus = {
      DISPONIBLE: 0,
      ASIGNADO: 0,
      MANTENIMIENTO: 0,
      BAJA: 0,
      ROBO: 0,
    }

    if (selectedBranch === "todos") {
      return { devices: [], total: 0, byStatus: emptyStatus }
    }

    const branchDevices = devices.filter(d => d.sucursal === selectedBranch)
    const byStatus = {
      DISPONIBLE: branchDevices.filter(d => d.estado === "DISPONIBLE").length,
      ASIGNADO: branchDevices.filter(d => d.estado === "ASIGNADO").length,
      MANTENIMIENTO: branchDevices.filter(d => d.estado === "MANTENIMIENTO").length,
      BAJA: branchDevices.filter(d => d.estado === "BAJA").length,
      ROBO: branchDevices.filter(d => d.estado === "ROBO").length,
    }

    return { devices: branchDevices, total: branchDevices.length, byStatus }
  }, [devices, selectedBranch])

  const handleExportBranchInventory = () => {
    if (selectedBranch === "todos") {
      alert("Por favor selecciona una sucursal")
      return
    }

    const branch = branches.find(b => b.id === selectedBranch)
    const dataForExport = branchInventory.devices.map((device) => ({
      tipo: getDeviceTypeLabel(device.tipo_equipo),
      marca: device.marca,
      modelo: device.modelo || "N/A",
      serie_imei: getDeviceSerial(device),
      numero_telefono: device.numero_telefono || "N/A",
      estado: getDeviceStatusLabel(device.estado),
      fecha_ingreso: formatDate(device.fecha_ingreso),
    }))

    exportToCSV(
      dataForExport,
      [
        { key: "tipo", header: "Tipo" },
        { key: "marca", header: "Marca" },
        { key: "modelo", header: "Modelo" },
        { key: "serie_imei", header: "Serie/IMEI" },
        { key: "numero_telefono", header: "Número Teléfono" },
        { key: "estado", header: "Estado" },
        { key: "fecha_ingreso", header: "Fecha Ingreso" },
      ],
      `reporte_inventario_sucursal_${branch?.codigo || selectedBranch}`
    )
  }

  // SECCIÓN 3: INVENTARIO POR EMPLEADO
  const employeeInventory = useMemo(() => {
    if (selectedEmployee === "todos") {
      return { devices: [], employee: null }
    }

    const employee = employees.find(e => e.id === selectedEmployee)
    const employeeDevices = devices.filter(d =>
      d.estado === "ASIGNADO" &&
      d.sucursal === employee?.sucursal
    )

    return { devices: employeeDevices, employee }
  }, [devices, employees, selectedEmployee])

  const handleExportEmployeeInventory = () => {
    if (selectedEmployee === "todos") {
      alert("Por favor selecciona un empleado")
      return
    }

    const dataForExport = employeeInventory.devices.map((device) => ({
      tipo: getDeviceTypeLabel(device.tipo_equipo),
      marca: device.marca,
      modelo: device.modelo || "N/A",
      serie_imei: getDeviceSerial(device),
      numero_telefono: device.numero_telefono || "N/A",
      fecha_ingreso: formatDate(device.fecha_ingreso),
    }))

    exportToCSV(
      dataForExport,
      [
        { key: "tipo", header: "Tipo" },
        { key: "marca", header: "Marca" },
        { key: "modelo", header: "Modelo" },
        { key: "serie_imei", header: "Serie/IMEI" },
        { key: "numero_telefono", header: "Número Teléfono" },
        { key: "fecha_ingreso", header: "Fecha Ingreso" },
      ],
      `reporte_dispositivos_empleado_${employeeInventory.employee?.rut.replace(/\./g, "")}`
    )
  }

  if (loading) {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reportes e Inventario</h1>
          <p className="text-muted-foreground mt-1">Análisis e informes consolidados del sistema</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="general" className="gap-2">
            <Package className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="branch" className="gap-2">
            <Building2 className="h-4 w-4" />
            Por Sucursal
          </TabsTrigger>
          <TabsTrigger value="employee" className="gap-2">
            <User className="h-4 w-4" />
            Por Empleado
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: INVENTARIO GENERAL */}
        <TabsContent value="general" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Inventario General</h2>
            <Button onClick={handleExportGeneralInventory} className="gap-2">
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumen General</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{generalInventory.total}</div>
                <p className="text-sm text-muted-foreground mt-1">Total de dispositivos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Por Tipo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Laptops</span>
                  <span className="font-semibold">{generalInventory.byType.LAPTOP}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Teléfonos</span>
                  <span className="font-semibold">{generalInventory.byType.TELEFONO}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tablets</span>
                  <span className="font-semibold">{generalInventory.byType.TABLET}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>SIM Cards</span>
                  <span className="font-semibold">{generalInventory.byType.SIM}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Por Estado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Disponibles</span>
                  <span className="font-semibold text-green-600">{generalInventory.byStatus.DISPONIBLE}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Asignados</span>
                  <span className="font-semibold text-blue-600">{generalInventory.byStatus.ASIGNADO}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Mantenimiento</span>
                  <span className="font-semibold text-yellow-600">{generalInventory.byStatus.MANTENIMIENTO}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Baja/Robo</span>
                  <span className="font-semibold text-gray-600">{generalInventory.byStatus.BAJA + generalInventory.byStatus.ROBO}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detalle Completo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Serie/IMEI</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Sucursal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {devices.slice(0, 50).map((device) => (
                      <TableRow key={device.id}>
                        <TableCell>{getDeviceTypeLabel(device.tipo_equipo)}</TableCell>
                        <TableCell>{device.marca}</TableCell>
                        <TableCell>{device.modelo || "N/A"}</TableCell>
                        <TableCell className="font-mono text-sm">{getDeviceSerial(device)}</TableCell>
                        <TableCell>
                          <Badge className={getDeviceStatusColor(device.estado)}>
                            {getDeviceStatusLabel(device.estado)}
                          </Badge>
                        </TableCell>
                        <TableCell>{device.sucursal_detail?.nombre || `ID: ${device.sucursal}`}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Mostrando primeros 50 de {devices.length} dispositivos. Exporta a CSV para ver el listado completo.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: INVENTARIO POR SUCURSAL */}
        <TabsContent value="branch" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Inventario por Sucursal</h2>
            <Button
              onClick={handleExportBranchInventory}
              className="gap-2"
              disabled={selectedBranch === "todos"}
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Seleccionar Sucursal</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedBranch === "todos" ? "todos" : String(selectedBranch)}
                onValueChange={(value) => setSelectedBranch(value === "todos" ? "todos" : Number(value))}
              >
                <SelectTrigger className="w-full max-w-sm">
                  <SelectValue placeholder="Selecciona una sucursal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Selecciona una sucursal...</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={String(branch.id)}>
                      {branch.nombre} - {branch.ciudad}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedBranch !== "todos" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Total en Sucursal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{branchInventory.total}</div>
                    <p className="text-sm text-muted-foreground mt-1">Dispositivos totales</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Por Estado</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Disponibles</span>
                      <span className="font-semibold text-green-600">{branchInventory.byStatus.DISPONIBLE}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Asignados</span>
                      <span className="font-semibold text-blue-600">{branchInventory.byStatus.ASIGNADO}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Mantenimiento</span>
                      <span className="font-semibold text-yellow-600">{branchInventory.byStatus.MANTENIMIENTO}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Información Sucursal</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Nombre: </span>
                      <span className="font-semibold">
                        {branches.find(b => b.id === selectedBranch)?.nombre}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Ciudad: </span>
                      <span className="font-semibold">
                        {branches.find(b => b.id === selectedBranch)?.ciudad}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Dispositivos en esta Sucursal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Marca</TableHead>
                          <TableHead>Modelo</TableHead>
                          <TableHead>Serie/IMEI</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {branchInventory.devices.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                              No hay dispositivos en esta sucursal
                            </TableCell>
                          </TableRow>
                        ) : (
                          branchInventory.devices.map((device) => (
                            <TableRow key={device.id}>
                              <TableCell>{getDeviceTypeLabel(device.tipo_equipo)}</TableCell>
                              <TableCell>{device.marca}</TableCell>
                              <TableCell>{device.modelo || "N/A"}</TableCell>
                              <TableCell className="font-mono text-sm">{getDeviceSerial(device)}</TableCell>
                              <TableCell>
                                <Badge className={getDeviceStatusColor(device.estado)}>
                                  {getDeviceStatusLabel(device.estado)}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* TAB 3: INVENTARIO POR EMPLEADO */}
        <TabsContent value="employee" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Dispositivos por Empleado</h2>
            <Button
              onClick={handleExportEmployeeInventory}
              className="gap-2"
              disabled={selectedEmployee === "todos"}
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Seleccionar Empleado</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedEmployee === "todos" ? "todos" : String(selectedEmployee)}
                onValueChange={(value) => setSelectedEmployee(value === "todos" ? "todos" : Number(value))}
              >
                <SelectTrigger className="w-full max-w-sm">
                  <SelectValue placeholder="Selecciona un empleado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Selecciona un empleado...</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={String(employee.id)}>
                      {employee.nombre_completo} - {employee.rut}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedEmployee !== "todos" && employeeInventory.employee && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Información del Empleado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Nombre Completo</p>
                      <p className="font-semibold">{employeeInventory.employee.nombre_completo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">RUT</p>
                      <p className="font-semibold">{employeeInventory.employee.rut}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cargo</p>
                      <p className="font-semibold">{employeeInventory.employee.cargo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Sucursal</p>
                      <p className="font-semibold">{employeeInventory.employee.sucursal_detail?.nombre || `ID: ${employeeInventory.employee.sucursal}`}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Correo Corporativo</p>
                      <p className="font-semibold">{employeeInventory.employee.correo_corporativo || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Teléfono</p>
                      <p className="font-semibold">{employeeInventory.employee.telefono || "N/A"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Dispositivos Asignados en su Sucursal</CardTitle>
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {employeeInventory.devices.length} dispositivos
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Marca</TableHead>
                          <TableHead>Modelo</TableHead>
                          <TableHead>Serie/IMEI</TableHead>
                          <TableHead>Fecha Ingreso</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employeeInventory.devices.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                              No hay dispositivos asignados en la sucursal de este empleado
                            </TableCell>
                          </TableRow>
                        ) : (
                          employeeInventory.devices.map((device) => (
                            <TableRow key={device.id}>
                              <TableCell>{getDeviceTypeLabel(device.tipo_equipo)}</TableCell>
                              <TableCell>{device.marca}</TableCell>
                              <TableCell>{device.modelo || "N/A"}</TableCell>
                              <TableCell className="font-mono text-sm">{getDeviceSerial(device)}</TableCell>
                              <TableCell>{formatDate(device.fecha_ingreso)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    Nota: Este reporte muestra todos los dispositivos asignados en la sucursal del empleado.
                    Para ver el historial específico de asignaciones del empleado, visita la sección de Empleados.
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
