"use client"

import { useEffect, useState, useCallback } from "react"
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
import { Search, Edit2, Trash2, UserPlus, Key, UserX, UserCheck, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { userService } from "@/lib/services/user-service"
import type { User } from "@/lib/types"
import { UserModal } from "@/components/modals/user-modal"
import { ChangePasswordModal } from "@/components/modals/change-password-modal"
import { useAuthStore } from "@/lib/store/auth-store"
import { TablePagination } from "@/components/ui/table-pagination"
import { useRouter } from "next/navigation"

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [passwordUserId, setPasswordUserId] = useState<number | null>(null)
  const { toast } = useToast()
  const currentUser = useAuthStore((state) => state.user)
  const router = useRouter()

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20 // Tamaño fijo de página
  const [totalCount, setTotalCount] = useState(0)

  // Verificar que solo Admin puede acceder
  useEffect(() => {
    if (currentUser && currentUser.role !== "ADMIN") {
      toast({
        title: "Acceso denegado",
        description: "Solo los administradores pueden acceder a esta sección.",
        variant: "destructive",
      })
      router.replace("/dashboard")
    }
  }, [currentUser, toast, router])

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      const filters: any = {
        page: currentPage,
        page_size: pageSize,
      }

      if (searchQuery) filters.search = searchQuery
      if (roleFilter !== "all") filters.role = roleFilter
      if (statusFilter !== "all") filters.is_active = statusFilter === "active"

      const response = await userService.getUsers(filters)
      setUsers(response.results)
      setTotalCount(response.count)
    } catch (error) {
      console.error("Error cargando usuarios:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [searchQuery, roleFilter, statusFilter, currentPage, pageSize, toast])

  // Resetear a página 1 cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, roleFilter, statusFilter])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleCreateUser = () => {
    setSelectedUser(null)
    setUserModalOpen(true)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setUserModalOpen(true)
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return

    try {
      await userService.deleteUser(userToDelete.id)
      toast({
        title: "Usuario eliminado",
        description: `El usuario ${userToDelete.username} ha sido eliminado correctamente.`,
      })
      loadUsers()
    } catch (error) {
      console.error("Error eliminando usuario:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el usuario",
        variant: "destructive",
      })
    } finally {
      setUserToDelete(null)
    }
  }

  const handleToggleStatus = async (user: User) => {
    try {
      if (user.is_active) {
        await userService.deactivateUser(user.id)
        toast({
          title: "Usuario desactivado",
          description: `El usuario ${user.username} ha sido desactivado.`,
        })
      } else {
        await userService.activateUser(user.id)
        toast({
          title: "Usuario activado",
          description: `El usuario ${user.username} ha sido activado.`,
        })
      }
      loadUsers()
    } catch (error) {
      console.error("Error cambiando estado del usuario:", error)
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado del usuario",
        variant: "destructive",
      })
    }
  }

  const handleChangePassword = (userId: number) => {
    setPasswordUserId(userId)
    setPasswordModalOpen(true)
  }

  const handleUserSaved = () => {
    setUserModalOpen(false)
    setSelectedUser(null)
    loadUsers()
  }

  const handlePasswordChanged = () => {
    setPasswordModalOpen(false)
    setPasswordUserId(null)
  }

  // Handlers de paginación
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  // No renderizar nada si el usuario no es admin
  if (currentUser && currentUser.role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center space-y-4">
          <div className="text-6xl">🔒</div>
          <h2 className="text-2xl font-bold">Acceso Denegado</h2>
          <p className="text-muted-foreground">Solo los administradores pueden acceder a esta sección.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Gestión de Usuarios</h1>
          <p className="text-muted-foreground mt-1 text-sm lg:text-base">Administra los usuarios del sistema</p>
        </div>
        <div className="flex gap-2">
          {/* Botón desktop con texto completo */}
          <Button onClick={handleCreateUser} className="hidden lg:inline-flex">
            <UserPlus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </Button>
          {/* Botón móvil con solo icono */}
          <Button onClick={handleCreateUser} size="icon" className="lg:hidden" title="Nuevo Usuario">
            <UserPlus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios</CardTitle>
          
          {/* Filtros */}
          <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
            <div className="w-full lg:flex-1">
              <label className="text-sm font-medium mb-2 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="w-full lg:w-[150px]">
              <label className="text-sm font-medium mb-2 block">Rol</label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="OPERADOR">Operador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full lg:w-[150px]">
              <label className="text-sm font-medium mb-2 block">Estado</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron usuarios
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    {/* Columnas siempre visibles */}
                    <TableHead>Username</TableHead>
                    {/* Columnas visibles solo en desktop */}
                    <TableHead className="hidden lg:table-cell">Nombre</TableHead>
                    {/* Columnas visibles en tablet y desktop */}
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    {/* Columnas siempre visibles */}
                    <TableHead>Rol</TableHead>
                    {/* Columnas visibles solo en desktop */}
                    <TableHead className="hidden lg:table-cell">Estado</TableHead>
                    {/* Columnas siempre visibles */}
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.filter((user) => user.username !== "admin").map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {user.first_name || user.last_name
                          ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
                          : "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                          {user.role === "ADMIN" ? "Administrador" : "Operador"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant={user.is_active ? "default" : "secondary"}>
                          {user.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditUser(user)}
                            title="Editar usuario"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleChangePassword(user.id)}
                            title="Cambiar contraseña"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleToggleStatus(user)}
                            title={user.is_active ? "Desactivar usuario" : "Activar usuario"}
                          >
                            {user.is_active ? (
                              <UserX className="h-4 w-4 text-orange-500" />
                            ) : (
                              <UserCheck className="h-4 w-4 text-green-500" />
                            )}
                          </Button>
                          {currentUser?.id !== user.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setUserToDelete(user)}
                              title="Eliminar usuario"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
              onPageSizeChange={() => {}} // No-op: tamaño fijo
              pageSizeOptions={[20]} // Solo mostrar 20 como opción
            />
          )}
        </CardContent>
      </Card>

      {/* Modal de crear/editar usuario */}
      <UserModal
        open={userModalOpen}
        onOpenChange={setUserModalOpen}
        user={selectedUser}
        onSuccess={handleUserSaved}
      />

      {/* Modal de cambiar contraseña */}
      <ChangePasswordModal
        open={passwordModalOpen}
        onOpenChange={setPasswordModalOpen}
        userId={passwordUserId}
        onSuccess={handlePasswordChanged}
      />

      {/* Diálogo de confirmación de eliminación */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el usuario{" "}
              <strong>{userToDelete?.username}</strong> del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
