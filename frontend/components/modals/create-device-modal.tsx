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

interface CreateDeviceModalProps {
  onSubmit?: (data: any) => void
}

export function CreateDeviceModal({ onSubmit }: CreateDeviceModalProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    modelo: "",
    serial: "",
    tipo: "",
    sucursal: "",
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
    console.log("[v0] Device data submitted:", formData)
    onSubmit?.(formData)
    setFormData({ modelo: "", serial: "", tipo: "", sucursal: "" })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Dispositivo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Dispositivo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="modelo">Modelo</Label>
            <Input
              id="modelo"
              name="modelo"
              value={formData.modelo}
              onChange={handleInputChange}
              placeholder="MacBook Pro 15"
              required
            />
          </div>
          <div>
            <Label htmlFor="serial">Número Serial</Label>
            <Input
              id="serial"
              name="serial"
              value={formData.serial}
              onChange={handleInputChange}
              placeholder="SN-001234"
              required
            />
          </div>
          <div>
            <Label htmlFor="tipo">Tipo de Dispositivo</Label>
            <Select value={formData.tipo} onValueChange={(value) => handleSelectChange("tipo", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Laptop">Laptop</SelectItem>
                <SelectItem value="Teléfono">Teléfono</SelectItem>
                <SelectItem value="Tablet">Tablet</SelectItem>
                <SelectItem value="SIM Card">SIM Card</SelectItem>
              </SelectContent>
            </Select>
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
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Crear Dispositivo</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
