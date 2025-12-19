"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { deviceService, type CreateDeviceData } from "@/lib/services/device-service"
import { branchService } from "@/lib/services/branch-service"
import type { Branch, Device, TipoEquipo, EstadoDispositivo } from "@/lib/types"
import { Info, DollarSign } from "lucide-react"
import { z } from "zod"
import { deviceSchema } from "@/lib/validations"
import { formatCurrency, formatCurrencyInput, parseCurrency } from "@/lib/utils"
import { getTodayLocal } from "@/lib/utils/date-helpers"

interface DeviceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  device?: Device | null
  onSuccess?: () => void
}

export function DeviceModal({ open, onOpenChange, device, onSuccess }: DeviceModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [branches, setBranches] = useState<Branch[]>([])
  const [valorCalculadoSugerido, setValorCalculadoSugerido] = useState<number | null>(null)
  const [mostrarInfoDepreciacion, setMostrarInfoDepreciacion] = useState(false)
  const [formData, setFormData] = useState<CreateDeviceData>({
    tipo_equipo: "LAPTOP",
    marca: "",
    modelo: "",
    numero_serie: "",
    imei: "",
    numero_telefono: "",
    numero_factura: "",
    estado: "DISPONIBLE",
    sucursal: 0,
    fecha_ingreso: getTodayLocal(),
    valor_inicial: undefined,
    valor_depreciado: undefined,
    es_valor_manual: false,
  })

  const isEditMode = !!device

  // Función para calcular depreciación (igual que en backend)
  const calcularDepreciacion = (valorInicial: number, fechaIngreso: string): number => {
    const fecha = new Date(fechaIngreso)
    const hoy = new Date()
    const diferenciaDias = (hoy.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24)
    const mesesTranscurridos = diferenciaDias / 30.44
    const periodos6Meses = Math.floor(mesesTranscurridos / 6)

    if (periodos6Meses >= 10) return 0

    const porcentajeDepreciacion = Math.min(periodos6Meses * 10, 100)
    const valorDepreciado = valorInicial * (1 - porcentajeDepreciacion / 100)

    return Math.round(valorDepreciado)
  }

  // Calcular valor depreciado sugerido cuando cambien valor_inicial o fecha_ingreso
  useEffect(() => {
    if (formData.valor_inicial && formData.fecha_ingreso) {
      const valorCalculado = calcularDepreciacion(formData.valor_inicial, formData.fecha_ingreso)
      setValorCalculadoSugerido(valorCalculado)

      // Si no es manual, actualizar automáticamente
      if (!formData.es_valor_manual) {
        setFormData(prev => ({ ...prev, valor_depreciado: valorCalculado }))
      }
    } else {
      setValorCalculadoSugerido(null)
    }
  }, [formData.valor_inicial, formData.fecha_ingreso, formData.es_valor_manual])

  // Cargar sucursales
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const response = await branchService.getBranches({ page_size: 100 })
        setBranches(response.results)
      } catch (error) {
        console.error("Error al cargar sucursales:", error)
      }
    }
    if (open) {
      loadBranches()
    }
  }, [open])

  // Pre-llenar formulario en modo edición
  useEffect(() => {
    if (device && open) {
      setFormData({
        tipo_equipo: device.tipo_equipo,
        marca: device.marca,
        modelo: device.modelo || "",
        numero_serie: device.numero_serie || "",
        imei: device.imei || "",
        numero_telefono: device.numero_telefono || "",
        numero_factura: device.numero_factura || "",
        estado: device.estado,
        sucursal: device.sucursal,
        fecha_ingreso: device.fecha_ingreso,
        valor_inicial: device.valor_inicial,
        valor_depreciado: device.valor_depreciado,
        es_valor_manual: device.es_valor_manual || false,
      })
    } else if (!device && open) {
      // Reset form cuando se abre en modo creación
      setFormData({
        tipo_equipo: "LAPTOP",
        marca: "",
        modelo: "",
        numero_serie: "",
        imei: "",
        numero_telefono: "",
        numero_factura: "",
        estado: "DISPONIBLE",
        sucursal: 0,
        fecha_ingreso: getTodayLocal(),
        valor_inicial: undefined,
        valor_depreciado: undefined,
        es_valor_manual: false,
      })
    }
  }, [device, open])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: keyof CreateDeviceData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setFormData({
      tipo_equipo: "LAPTOP",
      marca: "",
      modelo: "",
      numero_serie: "",
      imei: "",
      numero_telefono: "",
      numero_factura: "",
      estado: "DISPONIBLE",
      sucursal: 0,
      fecha_ingreso: getTodayLocal(),
      valor_inicial: undefined,
      valor_depreciado: undefined,
      es_valor_manual: false,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar con Zod
    try {
      deviceSchema.parse(formData)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0]
        toast({
          title: "Error de validación",
          description: firstError.message,
          variant: "destructive",
        })
        return
      }
    }

    try {
      setLoading(true)

      if (isEditMode && device) {
        // Modo edición - excluir numero_serie e imei ya que no son editables
        const { numero_serie, imei, ...updateData } = formData
        await deviceService.updateDevice(device.id, updateData)
        toast({
          title: "Dispositivo actualizado",
          description: `${formData.marca} ${formData.modelo || formData.tipo_equipo} ha sido actualizado exitosamente.`,
        })
      } else {
        // Modo creación
        await deviceService.createDevice(formData)
        toast({
          title: "Dispositivo creado",
          description: `${formData.marca} ${formData.modelo} ha sido creado exitosamente.`,
        })
        resetForm()
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Error al ${isEditMode ? "actualizar" : "crear"} el dispositivo`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Determinar si campos son requeridos u opcionales según tipo
  const isNumeroSerieRequired = ['LAPTOP', 'DESKTOP', 'TELEFONO', 'TABLET', 'TV'].includes(formData.tipo_equipo)
  const isModeloRequired = ['LAPTOP', 'DESKTOP', 'TELEFONO', 'TABLET'].includes(formData.tipo_equipo)
  const isTelefonoRequired = formData.tipo_equipo === 'SIM'
  const showEdadFields = ['LAPTOP', 'DESKTOP', 'TELEFONO', 'TABLET'].includes(formData.tipo_equipo)
  const showValorFields = ['LAPTOP', 'DESKTOP', 'TELEFONO', 'TABLET'].includes(formData.tipo_equipo)
  const showImeiField = ['TELEFONO', 'TABLET'].includes(formData.tipo_equipo)
  const showTelefonoField = ['TELEFONO', 'SIM'].includes(formData.tipo_equipo)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar Dispositivo" : "Crear Nuevo Dispositivo"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Tipo de Equipo */}
            <div>
              <Label htmlFor="tipo_equipo">Tipo de Equipo *</Label>
              <Select
                value={formData.tipo_equipo}
                onValueChange={(value) => handleSelectChange("tipo_equipo", value as TipoEquipo)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LAPTOP">Laptop</SelectItem>
                  <SelectItem value="DESKTOP">Computadora de Escritorio</SelectItem>
                  <SelectItem value="TELEFONO">Teléfono</SelectItem>
                  <SelectItem value="TABLET">Tablet</SelectItem>
                  <SelectItem value="TV">TV</SelectItem>
                  <SelectItem value="SIM">SIM Card</SelectItem>
                  <SelectItem value="ACCESORIO">Accesorio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Marca */}
            <div>
              <Label htmlFor="marca">Marca *</Label>
              <Input
                id="marca"
                name="marca"
                value={formData.marca}
                onChange={handleInputChange}
                placeholder="Apple, Samsung, HP, etc."
                required
              />
            </div>

            {/* Modelo */}
            <div>
              <Label htmlFor="modelo">
                Modelo {isModeloRequired ? "*" : ""}
              </Label>
              <Input
                id="modelo"
                name="modelo"
                value={formData.modelo}
                onChange={handleInputChange}
                placeholder="MacBook Pro, Galaxy S23, etc."
                required={isModeloRequired}
              />
            </div>

            {/* Número de Serie */}
            <div>
              <Label htmlFor="numero_serie">
                Número de Serie {isNumeroSerieRequired ? "*" : ""}
              </Label>
              <Input
                id="numero_serie"
                name="numero_serie"
                value={formData.numero_serie}
                onChange={handleInputChange}
                placeholder="C02XYZ123ABC"
                required={isNumeroSerieRequired}
                disabled={isEditMode}
                className={isEditMode ? "bg-muted cursor-not-allowed" : ""}
              />
              {isEditMode && (
                <p className="text-xs text-muted-foreground mt-1">
                  El número de serie no puede ser modificado
                </p>
              )}
            </div>

            {/* IMEI (solo para TELEFONO y TABLET) */}
            {showImeiField && (
              <div>
                <Label htmlFor="imei">IMEI</Label>
                <Input
                  id="imei"
                  name="imei"
                  value={formData.imei}
                  onChange={handleInputChange}
                  placeholder="123456789012345"
                  disabled={isEditMode}
                  className={isEditMode ? "bg-muted cursor-not-allowed" : ""}
                />
                {isEditMode && (
                  <p className="text-xs text-muted-foreground mt-1">
                    El IMEI no puede ser modificado
                  </p>
                )}
              </div>
            )}

            {/* Número de Teléfono (solo para TELEFONO y SIM) */}
            {showTelefonoField && (
              <div>
                <Label htmlFor="numero_telefono">
                  Número de Teléfono {isTelefonoRequired ? "*" : ""}
                </Label>
                <Input
                  id="numero_telefono"
                  name="numero_telefono"
                  value={formData.numero_telefono}
                  onChange={handleInputChange}
                  placeholder="+56 9 1234 5678"
                  required={isTelefonoRequired}
                />
                {isTelefonoRequired && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Obligatorio para SIM cards
                  </p>
                )}
              </div>
            )}

            {/* Número de Factura */}
            <div>
              <Label htmlFor="numero_factura">Número de Factura</Label>
              <Input
                id="numero_factura"
                name="numero_factura"
                value={formData.numero_factura}
                onChange={handleInputChange}
                placeholder="FAC-2024-001234"
              />
            </div>

            {/* Estado */}
            <div>
              <Label htmlFor="estado">Estado *</Label>
              <Select
                value={formData.estado}
                onValueChange={(value) => handleSelectChange("estado", value as EstadoDispositivo)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DISPONIBLE">Disponible</SelectItem>
                  <SelectItem value="ASIGNADO">Asignado</SelectItem>
                  <SelectItem value="MANTENIMIENTO">Mantenimiento</SelectItem>
                  <SelectItem value="BAJA">Baja</SelectItem>
                  <SelectItem value="ROBO">Robo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sucursal */}
            <div>
              <Label htmlFor="sucursal">Sucursal *</Label>
              <Select
                value={formData.sucursal ? String(formData.sucursal) : ""}
                onValueChange={(value) => handleSelectChange("sucursal", Number(value))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar sucursal" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={String(branch.id)}>
                      {branch.nombre} ({branch.codigo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fecha de Ingreso */}
            <div>
              <Label htmlFor="fecha_ingreso">Fecha de Ingreso *</Label>
              <Input
                id="fecha_ingreso"
                name="fecha_ingreso"
                type="date"
                value={formData.fecha_ingreso}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          {/* SECCIÓN DE VALOR (solo para LAPTOP, TELEFONO, TABLET) */}
          {showValorFields && (
            <div className="border rounded-lg p-4 space-y-4 bg-muted/50 mt-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                <h3 className="text-sm font-semibold">Información de Valor (Opcional)</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Valor Inicial */}
                <div>
                  <Label htmlFor="valor_inicial">Valor Inicial (CLP)</Label>
                  <Input
                    id="valor_inicial"
                    name="valor_inicial"
                    type="text"
                    value={formData.valor_inicial ? formatCurrency(formData.valor_inicial) : ""}
                    onChange={(e) => {
                      const formatted = formatCurrencyInput(e.target.value)
                      const numericValue = parseCurrency(formatted)
                      setFormData(prev => ({
                        ...prev,
                        valor_inicial: numericValue || undefined
                      }))
                    }}
                    placeholder="800.000"
                  />
                </div>

                {/* Valor Depreciado */}
                <div>
                  <Label htmlFor="valor_depreciado">Valor Depreciado (CLP)</Label>
                  <div className="relative">
                    <Input
                      id="valor_depreciado"
                      name="valor_depreciado"
                      type="text"
                      value={formData.valor_depreciado ? formatCurrency(formData.valor_depreciado) : ""}
                      onChange={(e) => {
                        const formatted = formatCurrencyInput(e.target.value)
                        const numericValue = parseCurrency(formatted)
                        setFormData(prev => ({
                          ...prev,
                          valor_depreciado: numericValue || undefined,
                          es_valor_manual: numericValue !== valorCalculadoSugerido
                        }))
                      }}
                      placeholder={valorCalculadoSugerido ? formatCurrency(valorCalculadoSugerido) : "Calculado automáticamente"}
                      disabled={!formData.valor_inicial}
                    />
                    {formData.es_valor_manual && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Manual
                      </span>
                    )}
                  </div>
                  {valorCalculadoSugerido && formData.valor_depreciado !== valorCalculadoSugerido && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Valor calculado: {formatCurrency(valorCalculadoSugerido)}
                    </p>
                  )}
                </div>
              </div>

              {/* Info de Depreciación */}
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p>La depreciación se calcula automáticamente: 0% los primeros 6 meses, luego -10% cada 6 meses del valor original.</p>
                  <button
                    type="button"
                    onClick={() => setMostrarInfoDepreciacion(!mostrarInfoDepreciacion)}
                    className="text-primary underline mt-1"
                  >
                    {mostrarInfoDepreciacion ? "Ocultar" : "Ver"} tabla de depreciación
                  </button>
                </div>
              </div>

              {mostrarInfoDepreciacion && (
                <div className="text-xs bg-background p-3 rounded border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-1">Período</th>
                        <th className="text-right py-1">% Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td>0-6 meses</td><td className="text-right">100%</td></tr>
                      <tr><td>6-12 meses</td><td className="text-right">90%</td></tr>
                      <tr><td>12-18 meses</td><td className="text-right">80%</td></tr>
                      <tr><td>18-24 meses</td><td className="text-right">70%</td></tr>
                      <tr><td>24-30 meses</td><td className="text-right">60%</td></tr>
                      <tr><td>30-36 meses</td><td className="text-right">50%</td></tr>
                      <tr><td>36-42 meses</td><td className="text-right">40%</td></tr>
                      <tr><td>42-48 meses</td><td className="text-right">30%</td></tr>
                      <tr><td>48-54 meses</td><td className="text-right">20%</td></tr>
                      <tr><td>54-60 meses</td><td className="text-right">10%</td></tr>
                      <tr><td>60+ meses</td><td className="text-right">0%</td></tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : isEditMode ? "Actualizar" : "Crear Dispositivo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
