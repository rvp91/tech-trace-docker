"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Eye, CheckCircle2, FileText, MoreVertical, RotateCcw } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { TablePagination } from "@/components/ui/table-pagination"
import { useToast } from "@/hooks/use-toast"
import {
  assignmentService,
  getAssignmentStatusColor,
  getAssignmentStatusLabel,
  getTipoEntregaLabel,
  getEstadoCartaColor,
  getEstadoCartaLabel,
} from "@/lib/services/assignment-service"
import { getDeviceSerial } from "@/lib/utils"
import type { Assignment } from "@/lib/types"
import { AssignmentModal } from "@/components/modals/assignment-modal"
import { MarkSignedConfirmationModal } from "@/components/modals/mark-signed-confirmation-modal"
import { ReturnModal } from "@/components/modals/return-modal"
import { ResponsibilityLetterModal } from "@/components/modals/responsibility-letter-modal"
import { DiscountLetterModal } from "@/components/modals/discount-letter-modal"
import { formatDateLocal } from "@/lib/utils/date-helpers"

export default function AssignmentsPage() {
  const router = useRouter()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [estadoFilter, setEstadoFilter] = useState("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [isMarkSignedModalOpen, setIsMarkSignedModalOpen] = useState(false)
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false)
  const [isResponsibilityModalOpen, setIsResponsibilityModalOpen] = useState(false)
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false)
  const { toast } = useToast()

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20 // Tamaño fijo de página
  const [totalCount, setTotalCount] = useState(0)

  const loadAssignments = useCallback(async () => {
    try {
      setLoading(true)
      const params: any = {
        page: currentPage,
        page_size: pageSize,
      }

      if (searchTerm) {
        params.search = searchTerm
      }

      if (estadoFilter !== "all") {
        params.estado_asignacion = estadoFilter
      }

      const response = await assignmentService.getAssignments(params)
      setAssignments(response.data)
      setTotalCount(response.total)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las asignaciones",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [searchTerm, estadoFilter, currentPage, pageSize, toast])

  // Resetear a página 1 cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, estadoFilter])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAssignments()
    }, 300) // Debounce de 300ms

    return () => clearTimeout(timer)
  }, [loadAssignments])

  const handleCreateAssignment = () => {
    setIsModalOpen(true)
  }

  const handleModalSuccess = () => {
    setIsModalOpen(false)
    loadAssignments()
  }

  const handleViewDetails = (id: number) => {
    router.push(`/dashboard/assignments/${id}`)
  }

  const handleMarkAsSigned = (assignment: Assignment) => {
    setSelectedAssignment(assignment)
    setIsMarkSignedModalOpen(true)
  }

  const handleMarkSignedSuccess = () => {
    setIsMarkSignedModalOpen(false)
    setSelectedAssignment(null)
    loadAssignments()
  }

  const handleOpenReturnModal = (assignment: Assignment) => {
    setSelectedAssignment(assignment)
    setIsReturnModalOpen(true)
  }

  const handleOpenResponsibilityModal = (assignment: Assignment) => {
    setSelectedAssignment(assignment)
    setIsResponsibilityModalOpen(true)
  }

  const handleOpenDiscountModal = (assignment: Assignment) => {
    setSelectedAssignment(assignment)
    setIsDiscountModalOpen(true)
  }

  const handleModalClose = () => {
    setIsReturnModalOpen(false)
    setIsResponsibilityModalOpen(false)
    setIsDiscountModalOpen(false)
    setSelectedAssignment(null)
  }

  const handleReturnSuccess = () => {
    handleModalClose()
    loadAssignments()
  }

  // Handlers de paginación
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Asignaciones de Dispositivos</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona las asignaciones activas y finalizadas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/assignments/requests">
              Ver Solicitudes
            </Link>
          </Button>
          <Button onClick={handleCreateAssignment}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Asignación
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Buscar</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por empleado o dispositivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="w-[200px]">
          <label className="text-sm font-medium mb-2 block">Estado</label>
          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ACTIVA">Activas</SelectItem>
              <SelectItem value="FINALIZADA">Finalizadas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Asignaciones ({totalCount})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Dispositivo</TableHead>
                  <TableHead>Tipo Entrega</TableHead>
                  <TableHead>Fecha Entrega</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Estado Carta</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Skeleton loaders
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : assignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No se encontraron asignaciones
                    </TableCell>
                  </TableRow>
                ) : (
                  assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">#{assignment.id}</TableCell>
                      <TableCell>
                        {assignment.empleado_detail?.nombre_completo || `ID: ${assignment.empleado}`}
                      </TableCell>
                      <TableCell>
                        {assignment.dispositivo_detail
                          ? `${assignment.dispositivo_detail.marca} ${assignment.dispositivo_detail.modelo || "N/A"}`
                          : `ID: ${assignment.dispositivo}`}
                      </TableCell>
                      <TableCell>{getTipoEntregaLabel(assignment.tipo_entrega)}</TableCell>
                      <TableCell>
                        {formatDateLocal(assignment.fecha_entrega)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getAssignmentStatusColor(assignment.estado_asignacion)}>
                          {getAssignmentStatusLabel(assignment.estado_asignacion)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getEstadoCartaColor(assignment.estado_carta)}>
                          {getEstadoCartaLabel(assignment.estado_carta)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {assignment.estado_asignacion === "ACTIVA" && (
                            <>
                              {assignment.estado_carta === "PENDIENTE" && (
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => handleMarkAsSigned(assignment)}
                                  className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  title="Marcar como Firmada"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                              )}

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-8 w-8"
                                    title="Generar Cartas"
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {(assignment.dispositivo_detail?.tipo_equipo === "LAPTOP" ||
                                    assignment.dispositivo_detail?.tipo_equipo === "DESKTOP" ||
                                    assignment.dispositivo_detail?.tipo_equipo === "TELEFONO") && (
                                    <DropdownMenuItem onClick={() => handleOpenResponsibilityModal(assignment)}>
                                      <FileText className="mr-2 h-4 w-4" />
                                      Carta de Responsabilidad
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => handleOpenDiscountModal(assignment)}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Carta de Descuento
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>

                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => handleOpenReturnModal(assignment)}
                                className="h-8 w-8"
                                title="Registrar Devolución"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            </>
                          )}

                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleViewDetails(assignment.id)}
                            className="h-8 w-8"
                            title="Ver Detalles"
                          >
                            <Eye className="h-4 w-4" />
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

      <AssignmentModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />

      <MarkSignedConfirmationModal
        open={isMarkSignedModalOpen}
        onClose={() => {
          setIsMarkSignedModalOpen(false)
          setSelectedAssignment(null)
        }}
        onSuccess={handleMarkSignedSuccess}
        assignment={selectedAssignment}
      />

      {selectedAssignment && (
        <>
          <ReturnModal
            open={isReturnModalOpen}
            onClose={handleModalClose}
            onSuccess={handleReturnSuccess}
            assignment={selectedAssignment}
          />

          <ResponsibilityLetterModal
            open={isResponsibilityModalOpen}
            onClose={handleModalClose}
            assignment={selectedAssignment}
          />

          <DiscountLetterModal
            open={isDiscountModalOpen}
            onClose={handleModalClose}
            onSuccess={loadAssignments}
            assignment={selectedAssignment}
          />
        </>
      )}
    </div>
  )
}
