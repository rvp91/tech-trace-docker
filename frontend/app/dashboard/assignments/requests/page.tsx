"use client"

import { useEffect, useState } from "react"
import { Plus, Search } from "lucide-react"
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
import { requestService, getRequestStatusColor, getRequestStatusLabel } from "@/lib/services/request-service"
import type { Request } from "@/lib/types"
import { RequestModal } from "@/components/modals/request-modal"
import { AssignmentModal } from "@/components/modals/assignment-modal"

export default function RequestsPage() {
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [estadoFilter, setEstadoFilter] = useState("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [requestToAssign, setRequestToAssign] = useState<Request | null>(null)
  const { toast } = useToast()

  const loadRequests = async () => {
    try {
      setLoading(true)
      const params: any = {}

      if (searchTerm) {
        params.search = searchTerm
      }

      if (estadoFilter !== "all") {
        params.estado = estadoFilter
      }

      const response = await requestService.getRequests(params)
      setRequests(response.data)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las solicitudes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [searchTerm, estadoFilter])

  const handleCreateRequest = () => {
    setSelectedRequest(null)
    setIsModalOpen(true)
  }

  const handleEditRequest = (request: Request) => {
    setSelectedRequest(request)
    setIsModalOpen(true)
  }

  const handleApprove = async (id: number) => {
    try {
      await requestService.approveRequest(id)
      toast({
        title: "Solicitud aprobada",
        description: "La solicitud ha sido aprobada exitosamente",
      })
      loadRequests()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo aprobar la solicitud",
        variant: "destructive",
      })
    }
  }

  const handleReject = async (id: number) => {
    try {
      await requestService.rejectRequest(id)
      toast({
        title: "Solicitud rechazada",
        description: "La solicitud ha sido rechazada",
      })
      loadRequests()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo rechazar la solicitud",
        variant: "destructive",
      })
    }
  }

  const handleModalSuccess = () => {
    setIsModalOpen(false)
    setSelectedRequest(null)
    loadRequests()
  }

  const handleAssign = (request: Request) => {
    setRequestToAssign(request)
    setIsAssignmentModalOpen(true)
  }

  const handleAssignmentSuccess = async () => {
    setIsAssignmentModalOpen(false)

    // Marcar la solicitud como completada
    if (requestToAssign) {
      try {
        await requestService.updateRequest(requestToAssign.id, { estado: "COMPLETADA" })
        toast({
          title: "Asignación completada",
          description: "La solicitud ha sido marcada como completada",
        })
      } catch (error) {
        // Solo un warning, la asignación ya fue creada
        console.error("Error al actualizar solicitud:", error)
      }
    }

    setRequestToAssign(null)
    loadRequests()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Solicitudes de Dispositivos</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona las solicitudes de dispositivos de los empleados
          </p>
        </div>
        <Button onClick={handleCreateRequest}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Solicitud
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Buscar</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por empleado..."
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
              <SelectItem value="PENDIENTE">Pendiente</SelectItem>
              <SelectItem value="APROBADA">Aprobada</SelectItem>
              <SelectItem value="RECHAZADA">Rechazada</SelectItem>
              <SelectItem value="COMPLETADA">Completada</SelectItem>
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
              <TableHead>Tipo de Dispositivo</TableHead>
              <TableHead>Jefatura</TableHead>
              <TableHead>Fecha Solicitud</TableHead>
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
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No se encontraron solicitudes
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">#{request.id}</TableCell>
                  <TableCell>
                    {request.empleado_detail?.nombre_completo || `ID: ${request.empleado}`}
                  </TableCell>
                  <TableCell>{request.tipo_dispositivo}</TableCell>
                  <TableCell>{request.jefatura_solicitante}</TableCell>
                  <TableCell>
                    {new Date(request.fecha_solicitud).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge className={getRequestStatusColor(request.estado)}>
                      {getRequestStatusLabel(request.estado)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {request.estado === "PENDIENTE" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-600 hover:bg-green-50"
                            onClick={() => handleApprove(request.id)}
                          >
                            Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                            onClick={() => handleReject(request.id)}
                          >
                            Rechazar
                          </Button>
                        </>
                      )}
                      {(request.estado === "PENDIENTE" || request.estado === "APROBADA") && (
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleAssign(request)}
                        >
                          Asignar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditRequest(request)}
                      >
                        Ver
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <RequestModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        request={selectedRequest}
      />

      <AssignmentModal
        open={isAssignmentModalOpen}
        onClose={() => {
          setIsAssignmentModalOpen(false)
          setRequestToAssign(null)
        }}
        onSuccess={handleAssignmentSuccess}
        preSelectedEmployee={requestToAssign?.empleado}
        preSelectedRequest={requestToAssign}
      />
    </div>
  )
}
