"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { EMPLOYEES, DEVICES } from "@/lib/mock-data"

interface CreateAssignmentModalProps {
  onSubmit?: (data: any) => void
}

export function CreateAssignmentModal({ onSubmit }: CreateAssignmentModalProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    empleado: "",
    dispositivo: "",
  })

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
            <Select value={formData.empleado} onValueChange={(value) => handleSelectChange("empleado", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar empleado" />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYEES.map((emp) => (
                  <SelectItem key={emp.id} value={emp.nombre}>
                    {emp.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="dispositivo">Dispositivo</Label>
            <Select value={formData.dispositivo} onValueChange={(value) => handleSelectChange("dispositivo", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar dispositivo" />
              </SelectTrigger>
              <SelectContent>
                {DEVICES.map((device) => (
                  <SelectItem key={device.id} value={device.modelo}>
                    {device.modelo} ({device.serial})
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
