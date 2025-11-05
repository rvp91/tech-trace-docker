"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Edit2, Trash2 } from "lucide-react"
import { EMPLOYEES } from "@/lib/mock-data"
import { CreateEmployeeModal } from "@/components/modals/create-employee-modal"

export default function EmployeesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Empleados</h1>
          <p className="text-muted-foreground mt-1">Administra los empleados de tu empresa</p>
        </div>
        <CreateEmployeeModal />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Empleados</CardTitle>
            <div className="flex items-center gap-2 bg-input rounded-lg px-3 py-2 w-64">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar empleado..."
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
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Sucursal</TableHead>
                  <TableHead>Puesto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-20">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {EMPLOYEES.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-medium">{emp.nombre}</TableCell>
                    <TableCell>{emp.email}</TableCell>
                    <TableCell>{emp.sucursal}</TableCell>
                    <TableCell>{emp.puesto}</TableCell>
                    <TableCell>
                      <Badge variant={emp.estado === "Activo" ? "default" : "secondary"}>{emp.estado}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
