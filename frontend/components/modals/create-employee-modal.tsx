"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { BRANCHES } from "@/lib/mock-data"

interface CreateEmployeeModalProps {
  onSubmit?: (data: any) => void
}

export function CreateEmployeeModal({ onSubmit }: CreateEmployeeModalProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    sucursal: "",
    puesto: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Employee data submitted:", formData)
    onSubmit?.(formData)
    setFormData({ nombre: "", email: "", sucursal: "", puesto: "" })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Empleado
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Empleado</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nombre">Nombre Completo</Label>
            <Input
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              placeholder="Juan Pérez"
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="juan@empresa.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="sucursal">Sucursal</Label>
            <Select value={formData.sucursal} onValueChange={(value) => handleSelectChange("sucursal", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar sucursal" />
              </SelectTrigger>
              <SelectContent>
                {BRANCHES.map((branch) => (
                  <SelectItem key={branch.id} value={branch.nombre}>
                    {branch.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="puesto">Puesto</Label>
            <Select value={formData.puesto} onValueChange={(value) => handleSelectChange("puesto", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar puesto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Gerente">Gerente</SelectItem>
                <SelectItem value="Analista">Analista</SelectItem>
                <SelectItem value="Técnico">Técnico</SelectItem>
                <SelectItem value="Operador">Operador</SelectItem>
                <SelectItem value="Administrador">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Crear Empleado</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
