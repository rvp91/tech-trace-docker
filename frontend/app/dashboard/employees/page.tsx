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
import { Search, Edit2, Trash2, Eye, UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { employeeService } from "@/lib/services/employee-service"
import { branchService } from "@/lib/services/branch-service"
import type { Employee, Branch } from "@/lib/types"
import { CreateEmployeeModal } from "@/components/modals/create-employee-modal"

export default function EmployeesPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [employees, setEmployees] = useState<Employee[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBranch, setSelectedBranch] = useState<string>("")
  const [selectedStatus, setSelectedStatus] = useState<string>("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Cargar empleados con filtros
  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true)
      const response = await employeeService.getEmployees({
        search: searchQuery || undefined,
        sucursal: selectedBranch ? Number(selectedBranch) : undefined,
        estado: selectedStatus ? (selectedStatus as "ACTIVO" | "INACTIVO") : undefined,
        page_size: 100,
      })
      setEmployees(response.results)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al cargar empleados",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [searchQuery, selectedBranch, selectedStatus, toast])

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

  useEffect(() => {
    const timer = setTimeout(() => {
      loadEmployees()
    }, 300) // Debounce de 300ms para la búsqueda

    return () => clearTimeout(timer)
  }, [loadEmployees, refreshTrigger])

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
      toast({
        title: "Error al eliminar",
        description: error instanceof Error ? error.message : "No se pudo eliminar el empleado. Puede tener asignaciones activas.",
        variant: "destructive",
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
          <h1 className="text-3xl font-bold">Gestión de Empleados</h1>
          <p className="text-muted-foreground mt-1">Administra los empleados de tu empresa</p>
        </div>
        <CreateEmployeeModal onSuccess={handleEmployeeCreated}>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Nuevo Empleado
          </Button>
        </CreateEmployeeModal>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <CardTitle>Empleados ({employees.length})</CardTitle>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Búsqueda */}
              <div className="flex items-center gap-2 bg-input rounded-lg px-3 py-2 flex-1">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por nombre o RUT..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-0 bg-transparent outline-none placeholder:text-muted-foreground"
                />
              </div>

              {/* Filtro por sucursal */}
              <Select value={selectedBranch || "all"} onValueChange={(value) => setSelectedBranch(value === "all" ? "" : value)}>
                <SelectTrigger className="w-[200px]">
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

              {/* Filtro por estado */}
              <Select value={selectedStatus || "all"} onValueChange={(value) => setSelectedStatus(value === "all" ? "" : value)}>
                <SelectTrigger className="w-[150px]">
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
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>RUT</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Sucursal</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-32">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Skeleton loaders
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : employees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No se encontraron empleados
                    </TableCell>
                  </TableRow>
                ) : (
                  employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-mono text-sm">{employee.rut}</TableCell>
                      <TableCell className="font-medium">{employee.nombre_completo}</TableCell>
                      <TableCell>{employee.cargo}</TableCell>
                      <TableCell>
                        {employee.sucursal_detail ? employee.sucursal_detail.nombre : `ID: ${employee.sucursal}`}
                      </TableCell>
                      <TableCell>
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
                <span className="block mt-2 text-sm">
                  Si el empleado tiene asignaciones activas, no podrá ser eliminado.
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
