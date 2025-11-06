"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Eye } from "lucide-react"
import Link from "next/link"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import {
  assignmentService,
  getAssignmentStatusColor,
  getAssignmentStatusLabel,
  getTipoEntregaLabel,
} from "@/lib/services/assignment-service"
import type { Assignment } from "@/lib/types"
import { AssignmentModal } from "@/components/modals/assignment-modal"

export default function AssignmentsPage() {
  const router = useRouter()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [estadoFilter, setEstadoFilter] = useState("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { toast } = useToast()

  const loadAssignments = async () => {
    try {
      setLoading(true)
      const params: any = {}

      if (searchTerm) {
        params.search = searchTerm
      }

      if (estadoFilter !== "all") {
        params.estado_asignacion = estadoFilter
      }

      const response = await assignmentService.getAssignments(params)
      setAssignments(response.data)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las asignaciones",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAssignments()
  }, [searchTerm, estadoFilter])

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
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Empleado</TableHead>
              <TableHead>Dispositivo</TableHead>
              <TableHead>Tipo Entrega</TableHead>
              <TableHead>Fecha Entrega</TableHead>
              <TableHead>Estado</TableHead>
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
                  <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : assignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
                      ? `${assignment.dispositivo_detail.marca} ${assignment.dispositivo_detail.modelo} (${assignment.dispositivo_detail.serie_imei})`
                      : `ID: ${assignment.dispositivo}`}
                  </TableCell>
                  <TableCell>{getTipoEntregaLabel(assignment.tipo_entrega)}</TableCell>
                  <TableCell>
                    {new Date(assignment.fecha_entrega).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge className={getAssignmentStatusColor(assignment.estado_asignacion)}>
                      {getAssignmentStatusLabel(assignment.estado_asignacion)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(assignment.id)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Detalles
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AssignmentModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}
