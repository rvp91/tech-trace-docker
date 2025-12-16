"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { employeeService } from "@/lib/services/employee-service"
import { deviceService } from "@/lib/services/device-service"
import type { Employee, Device } from "@/lib/types"

interface CreateAssignmentModalProps {
  onSubmit?: (data: any) => void
}

export function CreateAssignmentModal({ onSubmit }: CreateAssignmentModalProps) {
  const [open, setOpen] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false)
  const [isLoadingDevices, setIsLoadingDevices] = useState(false)
  const [formData, setFormData] = useState({
    empleado: "",
    dispositivo: "",
  })

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open])

  const loadData = async () => {
    // Cargar empleados y dispositivos en paralelo
    await Promise.all([loadEmployees(), loadDevices()])
  }

  const loadEmployees = async () => {
    setIsLoadingEmployees(true)
    try {
      const activeEmployees = await employeeService.getActiveEmployees()
      setEmployees(activeEmployees)
    } catch (error) {
      console.error("Error loading employees:", error)
    } finally {
      setIsLoadingEmployees(false)
    }
  }

  const loadDevices = async () => {
    setIsLoadingDevices(true)
    try {
      const availableDevices = await deviceService.getAvailableDevices()
      setDevices(availableDevices)
    } catch (error) {
      console.error("Error loading devices:", error)
    } finally {
      setIsLoadingDevices(false)
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Assignment data submitted:", formData)
    onSubmit?.(formData)
    setFormData({ empleado: "", dispositivo: "" })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Asignación
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crear Nueva Asignación</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="empleado">Empleado</Label>
            <Select value={formData.empleado} onValueChange={(value) => handleSelectChange("empleado", value)} disabled={isLoadingEmployees}>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingEmployees ? "Cargando..." : "Seleccionar empleado"} />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={String(emp.id)}>
                    {emp.nombre_completo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="dispositivo">Dispositivo</Label>
            <Select value={formData.dispositivo} onValueChange={(value) => handleSelectChange("dispositivo", value)} disabled={isLoadingDevices}>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingDevices ? "Cargando..." : "Seleccionar dispositivo"} />
              </SelectTrigger>
              <SelectContent>
                {devices.map((device) => (
                  <SelectItem key={device.id} value={String(device.id)}>
                    {device.marca} {device.modelo} ({device.numero_serie})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Crear Asignación</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
