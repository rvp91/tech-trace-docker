"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Edit2, Trash2, Building2, Laptop, Smartphone, Tablet, Tv, Users, Search, Plus, Monitor } from "lucide-react"
import { CardSimIcon } from "@/components/ui/icons/lucide-card-sim"
import { branchService } from "@/lib/services/branch-service"
import { BranchModal } from "@/components/modals/branch-modal"
import type { Branch } from "@/lib/types"
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
import { useToast } from "@/hooks/use-toast"
import { TablePagination } from "@/components/ui/table-pagination"

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageSize, setPageSize] = useState(8)
  const { toast } = useToast()

  const loadBranches = async (page: number = 1) => {
    try {
      setLoading(true)
      const data = await branchService.getBranches({
        page,
        page_size: pageSize,
        search: searchQuery || undefined
      })
      setBranches(data.results)
      setFilteredBranches(data.results)
      setTotalCount(data.count)
      setCurrentPage(page)
    } catch (error) {
      console.error("Error loading branches:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las sucursales",
      })
    } finally {
      setLoading(false)
    }
  }

  // Resetear a página 1 cuando cambie la búsqueda
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  // Cargar sucursales con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadBranches(currentPage)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, currentPage, pageSize])

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch)
    setModalOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingBranch) return

    try {
      await branchService.deleteBranch(deletingBranch.id)
      toast({
        title: "Éxito",
        description: "Sucursal eliminada correctamente",
      })
      loadBranches()
    } catch (error) {
      console.error("Error deleting branch:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar la sucursal",
      })
    } finally {
      setDeletingBranch(null)
    }
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setEditingBranch(null)
  }

  const handleSuccess = () => {
    loadBranches(currentPage)
    handleModalClose()
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1) // Resetear a la primera página cuando cambia el tamaño
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Gestión de Sucursales</h1>
            <p className="text-muted-foreground mt-1 text-sm lg:text-base">Administra las sucursales de tu empresa</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-6 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Gestión de Sucursales</h1>
          <p className="text-muted-foreground mt-1 text-sm lg:text-base">Administra las sucursales de tu empresa</p>
        </div>
        <div className="flex gap-2">
          {/* Botón desktop con texto completo */}
          <Button onClick={() => setModalOpen(true)} className="hidden lg:inline-flex">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Sucursal
          </Button>
          {/* Botón móvil con solo icono */}
          <Button onClick={() => setModalOpen(true)} size="icon" className="lg:hidden" title="Nueva Sucursal">
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
              placeholder="Buscar por nombre o código..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {filteredBranches.length === 0 && branches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay sucursales registradas</h3>
            <p className="text-muted-foreground mb-4">Comienza creando tu primera sucursal</p>
            <Button onClick={() => setModalOpen(true)}>
              <Building2 className="h-4 w-4 mr-2" />
              Crear Primera Sucursal
            </Button>
          </CardContent>
        </Card>
      ) : filteredBranches.length === 0 && branches.length > 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Search className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No se encontraron sucursales</h3>
            <p className="text-muted-foreground mb-4">Intenta con otros términos de búsqueda</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredBranches.map((branch) => (
            <Card key={branch.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{branch.nombre}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(branch)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeletingBranch(branch)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Total Dispositivos */}
                  <div className="flex items-center justify-between text-sm pb-2 border-b">
                    <span className="text-muted-foreground font-medium">Total Dispositivos</span>
                    <span className="font-bold text-lg">{branch.total_dispositivos || 0}</span>
                  </div>

                  {/* Dispositivos por tipo */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Laptop className="h-4 w-4" />
                        Laptops
                      </span>
                      <span className="font-semibold">
                        {branch.dispositivos_por_tipo?.LAPTOP || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Monitor className="h-4 w-4" />
                        Desktops
                      </span>
                      <span className="font-semibold">
                        {branch.dispositivos_por_tipo?.DESKTOP || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Smartphone className="h-4 w-4" />
                        Teléfonos
                      </span>
                      <span className="font-semibold">
                        {branch.dispositivos_por_tipo?.TELEFONO || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Tablet className="h-4 w-4" />
                        Tablets
                      </span>
                      <span className="font-semibold">
                        {branch.dispositivos_por_tipo?.TABLET || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <CardSimIcon size={16} />
                        SIM Cards
                      </span>
                      <span className="font-semibold">
                        {branch.dispositivos_por_tipo?.SIM || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Tv className="h-4 w-4" />
                        TVs
                      </span>
                      <span className="font-semibold">
                        {branch.dispositivos_por_tipo?.TV || 0}
                      </span>
                    </div>
                  </div>

                  {/* Total Empleados */}
                  <div className="flex items-center justify-between text-sm pt-2 border-t">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      Empleados
                    </span>
                    <span className="font-semibold">{branch.total_empleados || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Paginación */}
      {!loading && totalCount > 0 && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          pageSizeOptions={[8, 16, 24, 32]}
        />
      )}

      <BranchModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        branch={editingBranch}
        onSuccess={handleSuccess}
      />

      <AlertDialog open={!!deletingBranch} onOpenChange={() => setDeletingBranch(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la sucursal "
              {deletingBranch?.nombre}" y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
