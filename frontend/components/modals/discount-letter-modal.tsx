"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { assignmentService } from "@/lib/services/assignment-service"
import type { Assignment, CompanyOption, CompanyKey } from "@/lib/types"

interface DiscountLetterModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  assignment: Assignment | null
}

const COMPANY_OPTIONS: CompanyOption[] = [
  { value: 'pompeyo_carrasco', label: 'Pompeyo Carrasco SPA', rut: '81.318.700-0' },
  { value: 'pompeyo_automoviles', label: 'Pompeyo Carrasco Automóviles SPA', rut: '85.164.100-9' }
]

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export function DiscountLetterModal({
  open,
  onClose,
  onSuccess,
  assignment,
}: DiscountLetterModalProps) {
  const [loading, setLoading] = useState(false)
  const [companyKey, setCompanyKey] = useState<CompanyKey>('pompeyo_carrasco')
  const [montoTotal, setMontoTotal] = useState('')
  const [numeroCuotas, setNumeroCuotas] = useState('4')
  const [mesPrimeraCuota, setMesPrimeraCuota] = useState('')
  const [montoCuota, setMontoCuota] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    if (open && assignment?.dispositivo_detail) {
      // Pre-llenar con valor depreciado del dispositivo
      const valorDepreciado = assignment.dispositivo_detail.valor_depreciado ||
                              assignment.dispositivo_detail.valor_depreciado_calculado ||
                              0
      setMontoTotal(String(Math.round(valorDepreciado)))
      setCompanyKey('pompeyo_carrasco')
      setNumeroCuotas('4')
      setMesPrimeraCuota('')
    }
  }, [open, assignment])

  // Calcular cuota automáticamente
  useEffect(() => {
    const monto = parseFloat(montoTotal) || 0
    const cuotas = parseInt(numeroCuotas) || 1
    setMontoCuota(Math.round(monto / cuotas))
  }, [montoTotal, numeroCuotas])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!assignment) {
      toast({
        title: "Error",
        description: "No hay asignación seleccionada",
        variant: "destructive",
      })
      return
    }

    if (!mesPrimeraCuota) {
      toast({
        title: "Campo requerido",
        description: "Debe seleccionar el mes de la primera cuota",
        variant: "destructive",
      })
      return
    }

    const monto = parseFloat(montoTotal)
    if (isNaN(monto) || monto <= 0) {
      toast({
        title: "Monto inválido",
        description: "El monto total debe ser mayor a 0",
        variant: "destructive",
      })
      return
    }

    const cuotas = parseInt(numeroCuotas)
    if (isNaN(cuotas) || cuotas < 1 || cuotas > 24) {
      toast({
        title: "Cuotas inválidas",
        description: "El número de cuotas debe estar entre 1 y 24",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const data = {
        company_key: companyKey,
        monto_total: Math.round(monto),
        numero_cuotas: cuotas,
        mes_primera_cuota: mesPrimeraCuota,
      }

      await assignmentService.generateDiscountLetter(assignment.id, data)

      toast({
        title: "Carta generada",
        description: "La carta de descuento se ha descargado. El dispositivo ha sido marcado como robado.",
      })

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error al generar carta:', error)
      toast({
        title: "Error",
        description: error.message || "No se pudo generar la carta",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!assignment || !assignment.dispositivo_detail) {
    return null
  }

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('es-CL')}`
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generar Carta de Descuento</DialogTitle>
          <DialogDescription>
            Complete los datos para generar la carta de autorización de descuento por pérdida/robo
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Advertencia */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Advertencia:</strong> Al generar esta carta, el dispositivo será marcado automáticamente como{' '}
              <strong>ROBADO</strong> en el sistema.
            </AlertDescription>
          </Alert>

          {/* Selección de empresa */}
          <div className="space-y-2">
            <Label htmlFor="company">Empresa</Label>
            <Select
              value={companyKey}
              onValueChange={(value) => setCompanyKey(value as CompanyKey)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPANY_OPTIONS.map((company) => (
                  <SelectItem key={company.value} value={company.value}>
                    {company.label} - RUT: {company.rut}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Información del dispositivo */}
          <div className="bg-muted p-4 rounded-md space-y-2">
            <p className="text-sm font-medium">Dispositivo</p>
            <p className="text-sm">
              <span className="font-medium">Tipo:</span> {assignment.dispositivo_detail.tipo_equipo}
            </p>
            <p className="text-sm">
              <span className="font-medium">Equipo:</span>{' '}
              {assignment.dispositivo_detail.marca} {assignment.dispositivo_detail.modelo}
            </p>
            <p className="text-sm">
              <span className="font-medium">N/S:</span>{' '}
              {assignment.dispositivo_detail.numero_serie || 'N/A'}
            </p>
          </div>

          {/* Monto total */}
          <div className="space-y-2">
            <Label htmlFor="monto">Monto Total</Label>
            <Input
              id="monto"
              type="number"
              value={montoTotal}
              onChange={(e) => setMontoTotal(e.target.value)}
              placeholder="Ingrese monto total"
              required
              min="1"
            />
            <p className="text-sm text-muted-foreground">
              Valor sugerido: {formatCurrency(assignment.dispositivo_detail.valor_depreciado || assignment.dispositivo_detail.valor_depreciado_calculado || 0)}
            </p>
          </div>

          {/* Número de cuotas */}
          <div className="space-y-2">
            <Label htmlFor="cuotas">Número de Cuotas</Label>
            <Input
              id="cuotas"
              type="number"
              value={numeroCuotas}
              onChange={(e) => setNumeroCuotas(e.target.value)}
              required
              min="1"
              max="24"
            />
            <p className="text-sm text-muted-foreground">
              Mínimo 1, máximo 24 cuotas
            </p>
          </div>

          {/* Mes primera cuota */}
          <div className="space-y-2">
            <Label htmlFor="mes">Mes de Primera Cuota</Label>
            <Select
              value={mesPrimeraCuota}
              onValueChange={setMesPrimeraCuota}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un mes" />
              </SelectTrigger>
              <SelectContent>
                {MESES.map((mes) => (
                  <SelectItem key={mes} value={mes}>
                    {mes}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Resumen */}
          <div className="bg-primary/10 p-4 rounded-md">
            <p className="text-sm font-medium mb-2">Resumen del Descuento</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Monto Total:</span>
                <span className="font-medium">{formatCurrency(parseFloat(montoTotal) || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Número de Cuotas:</span>
                <span className="font-medium">{numeroCuotas}</span>
              </div>
              <div className="flex justify-between border-t pt-1 mt-1">
                <span>Monto por Cuota:</span>
                <span className="font-medium">{formatCurrency(montoCuota)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} variant="destructive">
              {loading ? "Generando..." : "Generar Carta y Marcar como Robado"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
