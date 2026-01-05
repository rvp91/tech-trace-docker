"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { TablePagination } from "@/components/ui/table-pagination"
import { Search, Edit2, Eye, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { DeviceActionsMenu } from "@/components/devices/device-actions-menu"
import { deviceService, getDeviceStatusColor, getDeviceStatusLabel, getDeviceTypeLabel } from "@/lib/services/device-service"
import { BranchSearchCombobox } from "@/components/ui/branch-search-combobox"
import type { Device, TipoEquipo, EstadoDispositivo } from "@/lib/types"
import { DeviceModal } from "@/components/modals/device-modal"
import { formatDateLocal } from "@/lib/utils/date-helpers"

export default function DevicesPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("")
  const [selectedStatus, setSelectedStatus] = useState<string>("")
  const [selectedBranch, setSelectedBranch] = useState<string>("")
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [deviceToEdit, setDeviceToEdit] = useState<Device | null>(null)

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20 // Tamaño fijo de página
  const [totalCount, setTotalCount] = useState(0)

  // Cargar dispositivos con filtros
  const loadDevices = useCallback(async () => {
    try {
      setLoading(true)
      const response = await deviceService.getDevices({
        search: searchQuery || undefined,
        tipo_equipo: selectedType ? (selectedType as TipoEquipo) : undefined,
        estado: selectedStatus ? (selectedStatus as EstadoDispositivo) : undefined,
        sucursal: selectedBranch ? Number(selectedBranch) : undefined,
        page: currentPage,
        page_size: pageSize,
      })
      setDevices(response.results)
      setTotalCount(response.count)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al cargar dispositivos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [searchQuery, selectedType, selectedStatus, selectedBranch, currentPage, pageSize, toast])

  // Resetear a página 1 cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedType, selectedStatus, selectedBranch])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDevices()
    }, 300) // Debounce de 300ms para la búsqueda

    return () => clearTimeout(timer)
  }, [loadDevices, refreshTrigger])

  // Handlers de paginación
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  const handleDeviceCreated = () => {
    setRefreshTrigger(prev => prev + 1)
    setModalOpen(false)
    setDeviceToEdit(null)
  }

  const handleEditClick = (device: Device) => {
    setDeviceToEdit(device)
    setModalOpen(true)
  }

  const handleCreateClick = () => {
    setDeviceToEdit(null)
    setModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Gestión de Dispositivos</h1>
          <p className="text-muted-foreground mt-1 text-sm lg:text-base">Administra el inventario de dispositivos</p>
        </div>
        <div className="flex gap-2">
          {/* Botón desktop con texto completo */}
          <Button onClick={handleCreateClick} className="hidden lg:inline-flex">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Dispositivo
          </Button>
          {/* Botón móvil con solo icono */}
          <Button onClick={handleCreateClick} size="icon" className="lg:hidden" title="Nuevo Dispositivo">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
        <div className="w-full lg:flex-1">
          <label className="text-sm font-medium mb-2 block">Buscar</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por marca, modelo, serie o IMEI..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="w-full lg:w-[180px]">
          <label className="text-sm font-medium mb-2 block">Tipo</label>
          <Select value={selectedType || "all"} onValueChange={(value) => setSelectedType(value === "all" ? "" : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Todos los tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="LAPTOP">Laptop</SelectItem>
              <SelectItem value="DESKTOP">Desktop</SelectItem>
              <SelectItem value="TELEFONO">Teléfono</SelectItem>
              <SelectItem value="TABLET">Tablet</SelectItem>
              <SelectItem value="TV">TV</SelectItem>
              <SelectItem value="SIM">SIM Card</SelectItem>
              <SelectItem value="ACCESORIO">Accesorio</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full lg:w-[180px]">
          <label className="text-sm font-medium mb-2 block">Estado</label>
          <Select value={selectedStatus || "all"} onValueChange={(value) => setSelectedStatus(value === "all" ? "" : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="DISPONIBLE">Disponible</SelectItem>
              <SelectItem value="ASIGNADO">Asignado</SelectItem>
              <SelectItem value="MANTENIMIENTO">Mantenimiento</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full lg:w-[200px]">
          <label className="text-sm font-medium mb-2 block">Sucursal</label>
          <BranchSearchCombobox
            value={selectedBranch || "all"}
            onChange={(value) => setSelectedBranch(value === "all" ? "" : value)}
            allowAll={true}
            allLabel="Todas las sucursales"
            placeholder="Filtrar por sucursal"
            filter={{ is_active: true }}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dispositivos ({totalCount})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  {/* Columnas visibles en tablet y desktop */}
                  <TableHead className="hidden md:table-cell">Tipo</TableHead>
                  <TableHead className="hidden md:table-cell">Marca</TableHead>
                  {/* Columnas visibles solo en desktop */}
                  <TableHead className="hidden lg:table-cell">Modelo</TableHead>
                  {/* Columnas siempre visibles */}
                  <TableHead>Número de Serie</TableHead>
                  {/* Columnas visibles solo en desktop */}
                  <TableHead className="hidden lg:table-cell">Fecha de Ingreso</TableHead>
                  {/* Columnas siempre visibles */}
                  <TableHead>Estado</TableHead>
                  {/* Columnas visibles solo en desktop */}
                  <TableHead className="hidden lg:table-cell">Sucursal</TableHead>
                  {/* Columnas siempre visibles */}
                  <TableHead className="w-20 lg:w-32">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Skeleton loaders
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : devices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No se encontraron dispositivos
                    </TableCell>
                  </TableRow>
                ) : (
                  devices.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell className="font-medium hidden md:table-cell">{getDeviceTypeLabel(device.tipo_equipo)}</TableCell>
                      <TableCell className="hidden md:table-cell">{device.marca}</TableCell>
                      <TableCell className="hidden lg:table-cell">{device.modelo || "-"}</TableCell>
                      <TableCell>{device.numero_serie || "-"}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {formatDateLocal(device.fecha_ingreso)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getDeviceStatusColor(device.estado)}>
                          {getDeviceStatusLabel(device.estado)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {device.sucursal_detail ? device.sucursal_detail.nombre : `ID: ${device.sucursal}`}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => router.push(`/dashboard/devices/${device.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditClick(device)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <DeviceActionsMenu device={device} onActionComplete={loadDevices} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          {!loading && totalCount > 0 && (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalCount={totalCount}
              onPageChange={handlePageChange}
            />
          )}
        </CardContent>
      </Card>

      {/* Modal de crear/editar */}
      <DeviceModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        device={deviceToEdit}
        onSuccess={handleDeviceCreated}
      />
    </div>
  )
}
