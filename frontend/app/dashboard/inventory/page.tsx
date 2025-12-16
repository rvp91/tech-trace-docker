"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TablePagination } from "@/components/ui/table-pagination"
import { Search, Eye, Laptop, Smartphone, Tablet as TabletIcon, Download, Tv } from "lucide-react"
import { CardSimIcon } from "@/components/ui/icons/lucide-card-sim"
import { InventoryDetailsModal } from "@/components/modals/inventory-details-modal"
import { deviceService, getDeviceStatusColor, getDeviceStatusLabel, getDeviceTypeLabel } from "@/lib/services/device-service"
import { branchService } from "@/lib/services/branch-service"
import { exportToCSV, getDeviceSerial } from "@/lib/utils"
import { formatDateLocal } from "@/lib/utils/date-helpers"
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
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)

  // Cargar datos de la API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [devices, branchesResponse] = await Promise.all([
          deviceService.getAllDevices(),
          branchService.getBranches({ page_size: 100 })
        ])
        setDevices(devices)
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
    const tvs = devices.filter((d) => d.tipo_equipo === "TV")
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
      tvs: countByStatus(tvs),
      simCards: countByStatus(simCards),
    }
  }, [devices])

  // Filtrar dispositivos
  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch =
        (device.modelo?.toLowerCase() || "").includes(searchLower) ||
        (device.numero_serie?.toLowerCase() || "").includes(searchLower) ||
        (device.imei?.toLowerCase() || "").includes(searchLower) ||
        device.marca.toLowerCase().includes(searchLower)

      const matchesTipo = filterTipo === "todos" || device.tipo_equipo === filterTipo
      const matchesEstado = filterEstado === "todos" || device.estado === filterEstado
      const matchesSucursal = filterSucursal === "todos" || device.sucursal === filterSucursal

      return matchesSearch && matchesTipo && matchesEstado && matchesSucursal
    })
  }, [searchTerm, filterTipo, filterEstado, filterSucursal, devices])

  // Paginar dispositivos filtrados
  const paginatedData = useMemo(() => {
    const totalPages = Math.ceil(filteredDevices.length / pageSize)
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    const pageDevices = filteredDevices.slice(startIndex, endIndex)

    return {
      devices: pageDevices,
      totalPages,
      totalCount: filteredDevices.length
    }
  }, [filteredDevices, currentPage, pageSize])

  // Resetear página cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterTipo, filterEstado, filterSucursal])

  const handleViewDetails = (device: Device) => {
    setSelectedDevice(device)
    setDetailsOpen(true)
  }

  const handleExportCSV = () => {
    const dataForExport = filteredDevices.map((device) => ({
      tipo: getDeviceTypeLabel(device.tipo_equipo),
      marca: device.marca,
      modelo: device.modelo || "N/A",
      serie_imei: getDeviceSerial(device),
      numero_telefono: device.numero_telefono || "N/A",
      estado: getDeviceStatusLabel(device.estado),
      sucursal: device.sucursal_detail?.nombre || `ID: ${device.sucursal}`,
      fecha_ingreso: formatDateLocal(device.fecha_ingreso),
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
              <CardTitle className="text-lg">TVs</CardTitle>
              <Tv className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{summary.tvs.total}</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Asignados</span>
                  <span className="font-semibold">{summary.tvs.asignados}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Disponibles</span>
                  <span className="font-semibold">{summary.tvs.disponibles}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mantenimiento</span>
                  <span className="font-semibold">{summary.tvs.mantenimiento}</span>
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
            <CardTitle>Detalle de Inventario</CardTitle>
            
            {/* Filtros */}
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por modelo o serial..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-[180px]">
                <label className="text-sm font-medium mb-2 block">Tipo</label>
                <Select value={filterTipo} onValueChange={(value) => setFilterTipo(value as TipoEquipo | "todos")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los tipos</SelectItem>
                    <SelectItem value="LAPTOP">Laptops</SelectItem>
                    <SelectItem value="TELEFONO">Teléfonos</SelectItem>
                    <SelectItem value="TABLET">Tablets</SelectItem>
                    <SelectItem value="TV">TVs</SelectItem>
                    <SelectItem value="SIM">SIM Cards</SelectItem>
                    <SelectItem value="ACCESORIO">Accesorios</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-[180px]">
                <label className="text-sm font-medium mb-2 block">Estado</label>
                <Select value={filterEstado} onValueChange={(value) => setFilterEstado(value as EstadoDispositivo | "todos")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
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
              </div>

              <div className="w-[200px]">
                <label className="text-sm font-medium mb-2 block">Sucursal</label>
                <Select
                  value={filterSucursal === "todos" ? "todos" : String(filterSucursal)}
                  onValueChange={(value) => setFilterSucursal(value === "todos" ? "todos" : Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las sucursales" />
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
                {paginatedData.devices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No se encontraron dispositivos con los filtros aplicados
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.devices.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell className="font-medium">{getDeviceTypeLabel(device.tipo_equipo)}</TableCell>
                      <TableCell>{device.marca}</TableCell>
                      <TableCell>{device.modelo || "N/A"}</TableCell>
                      <TableCell className="font-mono text-sm">{getDeviceSerial(device)}</TableCell>
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
          <TablePagination
            currentPage={currentPage}
            totalPages={paginatedData.totalPages}
            pageSize={pageSize}
            totalCount={paginatedData.totalCount}
            onPageChange={setCurrentPage}
            onPageSizeChange={() => {}}
            pageSizeOptions={[]}
          />
        </CardContent>
      </Card>

      {/* Modal de Detalles */}
      <InventoryDetailsModal device={selectedDevice} open={detailsOpen} onOpenChange={setDetailsOpen} />
    </div>
  )
}
