"use client"

import { useState, useEffect } from "react"
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
import { deviceService, getDeviceStatusColor, getDeviceStatusLabel, getDeviceTypeLabel, type InventoryStats } from "@/lib/services/device-service"
import { BranchSearchCombobox } from "@/components/ui/branch-search-combobox"
import { exportToCSV, getDeviceSerial } from "@/lib/utils"
import { formatDateLocal } from "@/lib/utils/date-helpers"
import type { Device, TipoEquipo, EstadoDispositivo } from "@/lib/types"

export default function InventoryPage() {
  // Estado para dispositivos paginados
  const [devices, setDevices] = useState<Device[]>([])
  const [totalDevices, setTotalDevices] = useState(0)
  const [loading, setLoading] = useState(true)

  // Estado para estadísticas
  const [stats, setStats] = useState<InventoryStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  // Estado para filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTipo, setFilterTipo] = useState<TipoEquipo | "">("")
  const [filterEstado, setFilterEstado] = useState<EstadoDispositivo | "">("")
  const [filterSucursal, setFilterSucursal] = useState<number | undefined>(undefined)

  // Estado para paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Estado para modal
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  // OPTIMIZADO: Cargar estadísticas una sola vez al montar
  useEffect(() => {
    const loadStats = async () => {
      try {
        setStatsLoading(true)
        const data = await deviceService.getInventoryStats()
        setStats(data)
      } catch (error) {
        console.error("Error cargando estadísticas:", error)
      } finally {
        setStatsLoading(false)
      }
    }

    loadStats()
  }, [])


  // OPTIMIZADO: Cargar dispositivos con paginación backend (cuando cambien filtros o paginación)
  useEffect(() => {
    const loadDevices = async () => {
      try {
        setLoading(true)

        // Construir filtros para el backend
        const filters: Record<string, any> = {
          page: currentPage,
          page_size: pageSize,
        }

        if (searchTerm) filters.search = searchTerm
        if (filterTipo) filters.tipo_equipo = filterTipo
        if (filterEstado) filters.estado = filterEstado
        if (filterSucursal) filters.sucursal = filterSucursal

        // Hacer petición paginada al backend
        const response = await deviceService.getDevices(filters)
        setDevices(response.results)
        setTotalDevices(response.count)
      } catch (error) {
        console.error("Error cargando dispositivos:", error)
      } finally {
        setLoading(false)
      }
    }

    loadDevices()
  }, [currentPage, pageSize, searchTerm, filterTipo, filterEstado, filterSucursal])

  // Resetear página cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterTipo, filterEstado, filterSucursal])

  const handleViewDetails = (device: Device) => {
    setSelectedDevice(device)
    setDetailsOpen(true)
  }

  const handleExportCSV = async () => {
    try {
      // Para exportar, cargar TODOS los dispositivos con los filtros actuales
      const filters: Record<string, any> = {}
      if (searchTerm) filters.search = searchTerm
      if (filterTipo) filters.tipo_equipo = filterTipo
      if (filterEstado) filters.estado = filterEstado
      if (filterSucursal) filters.sucursal = filterSucursal

      const allDevices = await deviceService.getAllDevices(filters)

      const dataForExport = allDevices.map((device) => ({
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
    } catch (error) {
      console.error("Error exportando CSV:", error)
    }
  }

  const totalPages = Math.ceil(totalDevices / pageSize)

  if (statsLoading || loading) {
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

      {/* Tarjetas de Resumen - OPTIMIZADO: Usa stats del backend */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Laptops</CardTitle>
                <Laptop className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{stats.laptops.total}</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Asignados</span>
                    <span className="font-semibold">{stats.laptops.asignados}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Disponibles</span>
                    <span className="font-semibold">{stats.laptops.disponibles}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mantenimiento</span>
                    <span className="font-semibold">{stats.laptops.mantenimiento}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Desktops</CardTitle>
                <Laptop className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{stats.desktops.total}</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Asignados</span>
                    <span className="font-semibold">{stats.desktops.asignados}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Disponibles</span>
                    <span className="font-semibold">{stats.desktops.disponibles}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mantenimiento</span>
                    <span className="font-semibold">{stats.desktops.mantenimiento}</span>
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
                <div className="text-2xl font-bold">{stats.telefonos.total}</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Asignados</span>
                    <span className="font-semibold">{stats.telefonos.asignados}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Disponibles</span>
                    <span className="font-semibold">{stats.telefonos.disponibles}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mantenimiento</span>
                    <span className="font-semibold">{stats.telefonos.mantenimiento}</span>
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
              <div className="text-2xl font-bold">{stats.tablets.total}</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Asignados</span>
                  <span className="font-semibold">{stats.tablets.asignados}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Disponibles</span>
                  <span className="font-semibold">{stats.tablets.disponibles}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mantenimiento</span>
                  <span className="font-semibold">{stats.tablets.mantenimiento}</span>
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
              <div className="text-2xl font-bold">{stats.tvs.total}</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Asignados</span>
                  <span className="font-semibold">{stats.tvs.asignados}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Disponibles</span>
                  <span className="font-semibold">{stats.tvs.disponibles}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mantenimiento</span>
                  <span className="font-semibold">{stats.tvs.mantenimiento}</span>
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
              <div className="text-2xl font-bold">{stats.simCards.total}</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Asignados</span>
                  <span className="font-semibold">{stats.simCards.asignados}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Disponibles</span>
                  <span className="font-semibold">{stats.simCards.disponibles}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mantenimiento</span>
                  <span className="font-semibold">{stats.simCards.mantenimiento}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Tabla Detallada */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <CardTitle>Detalle de Inventario ({totalDevices} dispositivos)</CardTitle>
            
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
                <Select value={filterTipo || "all"} onValueChange={(value) => setFilterTipo(value === "all" ? "" : value as TipoEquipo)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="LAPTOP">Laptops</SelectItem>
                    <SelectItem value="DESKTOP">Desktops</SelectItem>
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
                <Select value={filterEstado || "all"} onValueChange={(value) => setFilterEstado(value === "all" ? "" : value as EstadoDispositivo)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
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
                <BranchSearchCombobox
                  value={filterSucursal ? String(filterSucursal) : "all"}
                  onChange={(value) => setFilterSucursal(value === "all" ? undefined : Number(value))}
                  allowAll={true}
                  allLabel="Todas las sucursales"
                  placeholder="Filtrar por sucursal"
                  filter={{ is_active: true }}
                />
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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Cargando...
                    </TableCell>
                  </TableRow>
                ) : devices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No se encontraron dispositivos con los filtros aplicados
                    </TableCell>
                  </TableRow>
                ) : (
                  devices.map((device) => (
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
            totalPages={totalPages}
            pageSize={pageSize}
            totalCount={totalDevices}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 20, 50, 100]}
          />
        </CardContent>
      </Card>

      {/* Modal de Detalles */}
      <InventoryDetailsModal device={selectedDevice} open={detailsOpen} onOpenChange={setDetailsOpen} />
    </div>
  )
}
