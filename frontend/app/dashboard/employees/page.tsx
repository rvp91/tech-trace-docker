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
import { Search, Edit2, Trash2, Eye, UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { employeeService } from "@/lib/services/employee-service"
import { BranchSearchCombobox } from "@/components/ui/branch-search-combobox"
import type { Employee } from "@/lib/types"
import { CreateEmployeeModal } from "@/components/modals/create-employee-modal"
import { formatRUT } from "@/lib/validations"

export default function EmployeesPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBranch, setSelectedBranch] = useState<string>("")
  const [selectedStatus, setSelectedStatus] = useState<string>("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20 // Tamaño fijo de página
  const [totalCount, setTotalCount] = useState(0)

  // Cargar empleados con filtros
  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true)
      const response = await employeeService.getEmployees({
        search: searchQuery || undefined,
        sucursal: selectedBranch ? Number(selectedBranch) : undefined,
        estado: selectedStatus ? (selectedStatus as "ACTIVO" | "INACTIVO") : undefined,
        page: currentPage,
        page_size: pageSize,
      })
      setEmployees(response.results)
      setTotalCount(response.count)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al cargar empleados",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [searchQuery, selectedBranch, selectedStatus, currentPage, pageSize, toast])

  // Resetear a página 1 cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedBranch, selectedStatus])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadEmployees()
    }, 300) // Debounce de 300ms para la búsqueda

    return () => clearTimeout(timer)
  }, [loadEmployees, refreshTrigger])

  // Handlers de paginación
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  const handleDelete = async () => {
    if (!employeeToDelete) return

    try {
      setIsDeleting(true)
      await employeeService.deleteEmployee(employeeToDelete.id)
      toast({
        title: "Empleado eliminado",
        description: `${employeeToDelete.nombre_completo} ha sido eliminado exitosamente.`,
      })
      setRefreshTrigger(prev => prev + 1)
      setDeleteDialogOpen(false)
      setEmployeeToDelete(null)
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : "No se pudo eliminar el empleado. Puede estar siendo referenciado por otros registros."

      toast({
        title: "Error al eliminar",
        description: errorMessage,
        variant: "destructive",
        duration: 6000, // Mostrar por más tiempo para errores largos
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEmployeeCreated = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Gestión de Empleados</h1>
          <p className="text-muted-foreground mt-1 text-sm lg:text-base">Administra los empleados de tu empresa</p>
        </div>
        <div className="flex gap-2">
          {/* Botón desktop con texto completo */}
          <CreateEmployeeModal onSuccess={handleEmployeeCreated}>
            <Button className="hidden lg:inline-flex">
              <UserPlus className="h-4 w-4 mr-2" />
              Nuevo Empleado
            </Button>
          </CreateEmployeeModal>
          {/* Botón móvil con solo icono */}
          <CreateEmployeeModal onSuccess={handleEmployeeCreated}>
            <Button size="icon" className="lg:hidden" title="Nuevo Empleado">
              <UserPlus className="h-4 w-4" />
            </Button>
          </CreateEmployeeModal>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
        <div className="w-full lg:flex-1">
          <label className="text-sm font-medium mb-2 block">Buscar</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o RUT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
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

        <div className="w-full lg:w-[150px]">
          <label className="text-sm font-medium mb-2 block">Estado</label>
          <Select value={selectedStatus || "all"} onValueChange={(value) => setSelectedStatus(value === "all" ? "" : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ACTIVO">Activos</SelectItem>
              <SelectItem value="INACTIVO">Inactivos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Empleados ({totalCount})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  {/* Columnas visibles solo en desktop */}
                  <TableHead className="hidden lg:table-cell">RUT</TableHead>
                  {/* Columnas siempre visibles */}
                  <TableHead>Nombre</TableHead>
                  {/* Columnas visibles en tablet y desktop */}
                  <TableHead className="hidden md:table-cell">Cargo</TableHead>
                  {/* Columnas siempre visibles */}
                  <TableHead>Sucursal</TableHead>
                  {/* Columnas visibles solo en desktop */}
                  <TableHead className="hidden lg:table-cell">Unidad de Negocio</TableHead>
                  <TableHead className="hidden lg:table-cell">Dispositivos Asignados</TableHead>
                  {/* Columnas visibles en tablet y desktop */}
                  <TableHead className="hidden md:table-cell">Estado</TableHead>
                  {/* Columnas siempre visibles */}
                  <TableHead className="w-20 lg:w-32">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Skeleton loaders
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : employees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No se encontraron empleados
                    </TableCell>
                  </TableRow>
                ) : (
                  employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-mono text-sm hidden lg:table-cell">{formatRUT(employee.rut)}</TableCell>
                      <TableCell className="font-medium">{employee.nombre_completo}</TableCell>
                      <TableCell className="hidden md:table-cell">{employee.cargo}</TableCell>
                      <TableCell>
                        {employee.sucursal_detail ? employee.sucursal_detail.nombre : `ID: ${employee.sucursal}`}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {employee.unidad_negocio_detail?.nombre || "-"}
                      </TableCell>
                      <TableCell className="text-center font-medium hidden lg:table-cell">
                        {employee.dispositivos_asignados}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant={employee.estado === "ACTIVO" ? "default" : "secondary"}>
                          {employee.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => router.push(`/dashboard/employees/${employee.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <CreateEmployeeModal
                            employee={employee}
                            onSuccess={handleEmployeeCreated}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </CreateEmployeeModal>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => {
                              setEmployeeToDelete(employee)
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

      {/* Dialog de confirmación de eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar empleado?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar a <strong>{employeeToDelete?.nombre_completo}</strong>?
              Esta acción no se puede deshacer.
              {employeeToDelete && (
                <span className="block mt-2 text-sm text-amber-600 dark:text-amber-500">
                  <strong>Nota:</strong> No se podrá eliminar si el empleado tiene asignaciones, solicitudes u otros registros asociados.
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
