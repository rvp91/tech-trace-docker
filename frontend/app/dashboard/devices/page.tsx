"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Edit2, Trash2 } from "lucide-react"
import { DEVICES } from "@/lib/mock-data"
import { CreateDeviceModal } from "@/components/modals/create-device-modal"

export default function DevicesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Dispositivos</h1>
          <p className="text-muted-foreground mt-1">Administra el inventario de dispositivos</p>
        </div>
        <CreateDeviceModal />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Dispositivos</CardTitle>
            <div className="flex items-center gap-2 bg-input rounded-lg px-3 py-2 w-64">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar dispositivo..."
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
                  <TableHead>Modelo</TableHead>
                  <TableHead>Serial</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Sucursal</TableHead>
                  <TableHead className="w-20">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DEVICES.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell className="font-medium">{device.modelo}</TableCell>
                    <TableCell className="font-mono text-sm">{device.serial}</TableCell>
                    <TableCell>{device.tipo}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          device.estado === "Asignado"
                            ? "default"
                            : device.estado === "En Stock"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {device.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>{device.sucursal}</TableCell>
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
