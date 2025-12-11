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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { TablePagination } from "@/components/ui/table-pagination"
import { Search, Edit2, Trash2, Eye, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { deviceService, getDeviceStatusColor, getDeviceStatusLabel, getDeviceTypeLabel, formatCurrency, formatEdadDispositivo } from "@/lib/services/device-service"
import { branchService } from "@/lib/services/branch-service"
import type { Device, Branch, TipoEquipo, EstadoDispositivo } from "@/lib/types"
import { DeviceModal } from "@/components/modals/device-modal"

export default function DevicesPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [devices, setDevices] = useState<Device[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("")
  const [selectedStatus, setSelectedStatus] = useState<string>("")
  const [selectedBranch, setSelectedBranch] = useState<string>("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
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

  // Cargar sucursales
  const loadBranches = useCallback(async () => {
    try {
      const response = await branchService.getBranches({ page_size: 100 })
      setBranches(response.results)
    } catch (error) {
      console.error("Error al cargar sucursales:", error)
    }
  }, [])

  useEffect(() => {
    loadBranches()
  }, [loadBranches])

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

  const handleDelete = async () => {
    if (!deviceToDelete) return

    try {
      setIsDeleting(true)
      await deviceService.deleteDevice(deviceToDelete.id)
      toast({
        title: "Dispositivo eliminado",
        description: `${deviceToDelete.marca} ${deviceToDelete.modelo} ha sido eliminado exitosamente.`,
      })
      setRefreshTrigger(prev => prev + 1)
      setDeleteDialogOpen(false)
      setDeviceToDelete(null)
    } catch (error) {
      toast({
        title: "Error al eliminar",
        description: error instanceof Error ? error.message : "No se pudo eliminar el dispositivo. Puede tener asignaciones activas.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

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
          <h1 className="text-3xl font-bold">Gestión de Dispositivos</h1>
          <p className="text-muted-foreground mt-1">Administra el inventario de dispositivos</p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Dispositivo
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
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

        <div className="w-[180px]">
          <label className="text-sm font-medium mb-2 block">Tipo</label>
          <Select value={selectedType || "all"} onValueChange={(value) => setSelectedType(value === "all" ? "" : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Todos los tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="LAPTOP">Laptop</SelectItem>
              <SelectItem value="TELEFONO">Teléfono</SelectItem>
              <SelectItem value="TABLET">Tablet</SelectItem>
              <SelectItem value="TV">TV</SelectItem>
              <SelectItem value="SIM">SIM Card</SelectItem>
              <SelectItem value="ACCESORIO">Accesorio</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-[180px]">
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
              <SelectItem value="BAJA">Baja</SelectItem>
              <SelectItem value="ROBO">Robo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-[200px]">
          <label className="text-sm font-medium mb-2 block">Sucursal</label>
          <Select value={selectedBranch || "all"} onValueChange={(value) => setSelectedBranch(value === "all" ? "" : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Todas las sucursales" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las sucursales</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={String(branch.id)}>
                  {branch.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                  <TableHead>Tipo</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>N° Serie</TableHead>
                  <TableHead>IMEI</TableHead>
                  <TableHead>Edad</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Sucursal</TableHead>
                  <TableHead className="w-32">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Skeleton loaders
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : devices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No se encontraron dispositivos
                    </TableCell>
                  </TableRow>
                ) : (
                  devices.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell className="font-medium">{getDeviceTypeLabel(device.tipo_equipo)}</TableCell>
                      <TableCell>{device.marca}</TableCell>
                      <TableCell>{device.modelo || "-"}</TableCell>
                      <TableCell className="font-mono text-sm">{device.numero_serie || "-"}</TableCell>
                      <TableCell className="font-mono text-sm">{device.imei || "-"}</TableCell>
                      <TableCell>
                        {device.puede_tener_edad
                          ? formatEdadDispositivo(device.edad_dispositivo_display)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {device.puede_tener_valor && device.valor_depreciado_calculado
                          ? (
                            <div className="flex flex-col">
                              <span className="font-medium">{formatCurrency(device.valor_depreciado_calculado)}</span>
                              {device.es_valor_manual && (
                                <span className="text-xs text-blue-600">Manual</span>
                              )}
                            </div>
                          )
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge className={getDeviceStatusColor(device.estado)}>
                          {getDeviceStatusLabel(device.estado)}
                        </Badge>
                      </TableCell>
                      <TableCell>
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
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => {
                              setDeviceToDelete(device)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
              onPageSizeChange={() => {}} // No-op: tamaño fijo
              pageSizeOptions={[20]} // Solo mostrar 20 como opción
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

      {/* Dialog de confirmación de eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar dispositivo?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar el dispositivo <strong>{deviceToDelete?.marca} {deviceToDelete?.modelo}</strong>?
              Esta acción no se puede deshacer.
              {deviceToDelete && (
                <span className="block mt-2 text-sm">
                  Si el dispositivo tiene asignaciones activas, no podrá ser eliminado.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
