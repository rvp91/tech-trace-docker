"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Eye, Laptop, Smartphone, Tablet as TabletIcon, Download } from "lucide-react"
import { CardSimIcon } from "@/components/ui/icons/lucide-card-sim"
import { InventoryDetailsModal } from "@/components/modals/inventory-details-modal"
import { deviceService, getDeviceStatusColor, getDeviceStatusLabel, getDeviceTypeLabel } from "@/lib/services/device-service"
import { branchService } from "@/lib/services/branch-service"
import { exportToCSV, formatDate } from "@/lib/utils"
import type { Device, Branch, TipoEquipo, EstadoDispositivo } from "@/lib/types"

export default function InventoryPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTipo, setFilterTipo] = useState<TipoEquipo | "todos">("todos")
  const [filterEstado, setFilterEstado] = useState<EstadoDispositivo | "todos">("todos")
  const [filterSucursal, setFilterSucursal] = useState<number | "todos">("todos")
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  // Cargar datos de la API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [devicesResponse, branchesResponse] = await Promise.all([
          deviceService.getDevices({ page_size: 1000 }),
          branchService.getBranches({ page_size: 100 })
        ])
        setDevices(devicesResponse.results)
        setBranches(branchesResponse.results)
      } catch (error) {
        console.error("Error cargando datos:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Calcular totales por tipo y estado
  const summary = useMemo(() => {
    const laptops = devices.filter((d) => d.tipo_equipo === "LAPTOP")
    const telefonos = devices.filter((d) => d.tipo_equipo === "TELEFONO")
    const tablets = devices.filter((d) => d.tipo_equipo === "TABLET")
    const simCards = devices.filter((d) => d.tipo_equipo === "SIM")

    const countByStatus = (devicesList: Device[]) => ({
      total: devicesList.length,
      asignados: devicesList.filter((d) => d.estado === "ASIGNADO").length,
      disponibles: devicesList.filter((d) => d.estado === "DISPONIBLE").length,
      mantenimiento: devicesList.filter((d) => d.estado === "MANTENIMIENTO").length,
    })

    return {
      laptops: countByStatus(laptops),
      telefonos: countByStatus(telefonos),
      tablets: countByStatus(tablets),
      simCards: countByStatus(simCards),
    }
  }, [devices])

  // Filtrar dispositivos
  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const matchesSearch =
        device.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.serie_imei.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.marca.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesTipo = filterTipo === "todos" || device.tipo_equipo === filterTipo
      const matchesEstado = filterEstado === "todos" || device.estado === filterEstado
      const matchesSucursal = filterSucursal === "todos" || device.sucursal === filterSucursal

      return matchesSearch && matchesTipo && matchesEstado && matchesSucursal
    })
  }, [searchTerm, filterTipo, filterEstado, filterSucursal, devices])

  const handleViewDetails = (device: Device) => {
    setSelectedDevice(device)
    setDetailsOpen(true)
  }

  const handleExportCSV = () => {
    const dataForExport = filteredDevices.map((device) => ({
      tipo: getDeviceTypeLabel(device.tipo_equipo),
      marca: device.marca,
      modelo: device.modelo,
      serie_imei: device.serie_imei,
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
      "inventario_general"
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="text-lg font-semibold">Cargando inventario...</div>
          <div className="text-sm text-muted-foreground mt-2">Por favor espera</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventario General</h1>
          <p className="text-muted-foreground mt-1">Vista consolidada de todos los dispositivos de la empresa</p>
        </div>
        <Button onClick={handleExportCSV} className="gap-2">
          <Download className="h-4 w-4" />
          Exportar a CSV
        </Button>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Laptops</CardTitle>
              <Laptop className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{summary.laptops.total}</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Asignados</span>
                  <span className="font-semibold">{summary.laptops.asignados}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Disponibles</span>
                  <span className="font-semibold">{summary.laptops.disponibles}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mantenimiento</span>
                  <span className="font-semibold">{summary.laptops.mantenimiento}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Teléfonos</CardTitle>
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{summary.telefonos.total}</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Asignados</span>
                  <span className="font-semibold">{summary.telefonos.asignados}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Disponibles</span>
                  <span className="font-semibold">{summary.telefonos.disponibles}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mantenimiento</span>
                  <span className="font-semibold">{summary.telefonos.mantenimiento}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Tablets</CardTitle>
              <TabletIcon className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{summary.tablets.total}</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Asignados</span>
                  <span className="font-semibold">{summary.tablets.asignados}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Disponibles</span>
                  <span className="font-semibold">{summary.tablets.disponibles}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mantenimiento</span>
                  <span className="font-semibold">{summary.tablets.mantenimiento}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">SIM Cards</CardTitle>
              <CardSimIcon size={20} className="text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{summary.simCards.total}</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Asignados</span>
                  <span className="font-semibold">{summary.simCards.asignados}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Disponibles</span>
                  <span className="font-semibold">{summary.simCards.disponibles}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mantenimiento</span>
                  <span className="font-semibold">{summary.simCards.mantenimiento}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla Detallada */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <CardTitle>Detalle de Inventario</CardTitle>
              <div className="flex items-center gap-2 bg-input rounded-lg px-3 py-2 w-64">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por modelo o serial..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-0 bg-transparent outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-3">
              <Select value={filterTipo} onValueChange={(value) => setFilterTipo(value as TipoEquipo | "todos")}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  <SelectItem value="LAPTOP">Laptops</SelectItem>
                  <SelectItem value="TELEFONO">Teléfonos</SelectItem>
                  <SelectItem value="TABLET">Tablets</SelectItem>
                  <SelectItem value="SIM">SIM Cards</SelectItem>
                  <SelectItem value="ACCESORIO">Accesorios</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterEstado} onValueChange={(value) => setFilterEstado(value as EstadoDispositivo | "todos")}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="DISPONIBLE">Disponible</SelectItem>
                  <SelectItem value="ASIGNADO">Asignado</SelectItem>
                  <SelectItem value="MANTENIMIENTO">Mantenimiento</SelectItem>
                  <SelectItem value="BAJA">Baja</SelectItem>
                  <SelectItem value="ROBO">Robo</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filterSucursal === "todos" ? "todos" : String(filterSucursal)}
                onValueChange={(value) => setFilterSucursal(value === "todos" ? "todos" : Number(value))}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por sucursal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas las sucursales</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={String(branch.id)}>
                      {branch.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                  <TableHead>Estado</TableHead>
                  <TableHead>Sucursal</TableHead>
                  <TableHead className="w-20">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDevices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No se encontraron dispositivos con los filtros aplicados
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDevices.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell className="font-medium">{getDeviceTypeLabel(device.tipo_equipo)}</TableCell>
                      <TableCell>{device.marca}</TableCell>
                      <TableCell>{device.modelo}</TableCell>
                      <TableCell className="font-mono text-sm">{device.serie_imei}</TableCell>
                      <TableCell>
                        <Badge className={getDeviceStatusColor(device.estado)}>
                          {getDeviceStatusLabel(device.estado)}
                        </Badge>
                      </TableCell>
                      <TableCell>{device.sucursal_detail?.nombre || `ID: ${device.sucursal}`}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleViewDetails(device)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            Mostrando {filteredDevices.length} de {devices.length} dispositivos
          </div>
        </CardContent>
      </Card>

      {/* Modal de Detalles */}
      <InventoryDetailsModal device={selectedDevice} open={detailsOpen} onOpenChange={setDetailsOpen} />
    </div>
  )
}
