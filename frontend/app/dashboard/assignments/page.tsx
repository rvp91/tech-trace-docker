"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, CheckCircle } from "lucide-react"
import { ASSIGNMENTS } from "@/lib/mock-data"
import { CreateAssignmentModal } from "@/components/modals/create-assignment-modal"

export default function AssignmentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Asignaciones de Dispositivos</h1>
          <p className="text-muted-foreground mt-1">Gestiona las asignaciones y devoluciones</p>
        </div>
        <CreateAssignmentModal />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Asignaciones</CardTitle>
            <div className="flex items-center gap-2 bg-input rounded-lg px-3 py-2 w-64">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar asignación..."
                className="border-0 bg-transparent outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Dispositivo</TableHead>
                  <TableHead>Fecha de Asignación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-20">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ASSIGNMENTS.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">{assignment.empleado}</TableCell>
                    <TableCell>{assignment.dispositivo}</TableCell>
                    <TableCell>{assignment.fecha}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          assignment.estado === "Activa"
                            ? "default"
                            : assignment.estado === "Devuelto"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {assignment.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {assignment.estado === "Activa" ? (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-success hover:text-success">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
