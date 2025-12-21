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
import { useToast } from "@/hooks/use-toast"
import { assignmentService } from "@/lib/services/assignment-service"
import type { Assignment, CompanyOption, CompanyKey } from "@/lib/types"

interface ResponsibilityLetterModalProps {
  open: boolean
  onClose: () => void
  assignment: Assignment | null
}

const COMPANY_OPTIONS: CompanyOption[] = [
  { value: 'pompeyo_carrasco', label: 'Pompeyo Carrasco SPA', rut: '81.318.700-0' },
  { value: 'pompeyo_automoviles', label: 'Pompeyo Carrasco Automóviles SPA', rut: '85.164.100-9' }
]

export function ResponsibilityLetterModal({
  open,
  onClose,
  assignment,
}: ResponsibilityLetterModalProps) {
  const [loading, setLoading] = useState(false)
  const [companyKey, setCompanyKey] = useState<CompanyKey>('pompeyo_carrasco')
  const { toast } = useToast()

  // Detectar tipo de dispositivo
  const tipoDispositivo = assignment?.dispositivo_detail?.tipo_equipo || ''

  // Estados para campos LAPTOP
  const [procesador, setProcesador] = useState('')
  const [discoDuro, setDiscoDuro] = useState('')
  const [memoriaRam, setMemoriaRam] = useState('')
  const [tieneDvd, setTieneDvd] = useState(false)
  const [tieneCargador, setTieneCargador] = useState(true)
  const [tieneBateria, setTieneBateria] = useState(true)
  const [tieneMouse, setTieneMouse] = useState(false)
  const [tieneCandado, setTieneCandado] = useState(false)

  // Estados para campos TELÉFONO
  const [planTelefono, setPlanTelefono] = useState('')
  const [minutosDisponibles, setMinutosDisponibles] = useState('')
  const [tieneAudifonos, setTieneAudifonos] = useState(false)

  // Campos comunes
  const [jefaturaNombre, setJefaturaNombre] = useState('')

  useEffect(() => {
    if (open) {
      // Resetear formulario al abrir
      setCompanyKey('pompeyo_carrasco')
      setProcesador('')
      setDiscoDuro('')
      setMemoriaRam('')
      setTieneDvd(false)
      setTieneCargador(true)
      setTieneBateria(true)
      setTieneMouse(false)
      setTieneCandado(false)
      setPlanTelefono('')
      setMinutosDisponibles('')
      setTieneAudifonos(false)
      setJefaturaNombre('')
    }
  }, [open])

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

    setLoading(true)

    try {
      const letterData: any = {
        company_key: companyKey,
        jefatura_nombre: jefaturaNombre,
      }

      if (tipoDispositivo === 'LAPTOP') {
        letterData.procesador = procesador
        letterData.disco_duro = discoDuro
        letterData.memoria_ram = memoriaRam
        letterData.tiene_dvd = tieneDvd
        letterData.tiene_cargador = tieneCargador
        letterData.tiene_bateria = tieneBateria
        letterData.tiene_mouse = tieneMouse
        letterData.tiene_candado = tieneCandado
      } else if (tipoDispositivo === 'TELEFONO') {
        letterData.plan_telefono = planTelefono
        letterData.minutos_disponibles = minutosDisponibles
        letterData.tiene_audifonos = tieneAudifonos
      }

      await assignmentService.generateResponsibilityLetter(assignment.id, letterData)

      toast({
        title: "Carta generada",
        description: "La carta de responsabilidad se ha descargado correctamente",
      })

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

  const isLaptop = tipoDispositivo === 'LAPTOP'
  const isTelefono = tipoDispositivo === 'TELEFONO'

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-xl lg:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generar Carta de Responsabilidad</DialogTitle>
          <DialogDescription>
            Complete los datos necesarios para generar la carta de responsabilidad de{' '}
            {tipoDispositivo === 'LAPTOP' ? 'laptop' : 'teléfono'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          {/* Información del dispositivo (solo lectura) */}
          <div className="bg-muted p-4 rounded-md space-y-2">
            <p className="text-sm font-medium">Información del Dispositivo</p>
            <p className="text-sm">
              <span className="font-medium">Equipo:</span>{' '}
              {assignment.dispositivo_detail.marca} {assignment.dispositivo_detail.modelo}
            </p>
            <p className="text-sm">
              <span className="font-medium">N/S:</span>{' '}
              {assignment.dispositivo_detail.numero_serie || 'N/A'}
            </p>
            {isTelefono && assignment.dispositivo_detail.imei && (
              <p className="text-sm">
                <span className="font-medium">IMEI:</span> {assignment.dispositivo_detail.imei}
              </p>
            )}
          </div>

          {/* Campos comunes */}
          <div className="space-y-2">
            <Label htmlFor="jefatura">Jefatura (Opcional)</Label>
            <Input
              id="jefatura"
              value={jefaturaNombre}
              onChange={(e) => setJefaturaNombre(e.target.value)}
              placeholder="Nombre de la jefatura"
            />
          </div>

          {/* Campos específicos para LAPTOP */}
          {isLaptop && (
            <>
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium">Especificaciones del Laptop</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="procesador">Procesador</Label>
                    <Input
                      id="procesador"
                      value={procesador}
                      onChange={(e) => setProcesador(e.target.value)}
                      placeholder="Ej: Intel Core i5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="disco_duro">Disco Duro</Label>
                    <Input
                      id="disco_duro"
                      value={discoDuro}
                      onChange={(e) => setDiscoDuro(e.target.value)}
                      placeholder="Ej: 256GB SSD"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="memoria_ram">Memoria RAM</Label>
                    <Input
                      id="memoria_ram"
                      value={memoriaRam}
                      onChange={(e) => setMemoriaRam(e.target.value)}
                      placeholder="Ej: 8GB"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <h5 className="font-medium text-sm">Accesorios incluidos</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="dvd"
                        checked={tieneDvd}
                        onCheckedChange={(checked) => setTieneDvd(checked as boolean)}
                      />
                      <label
                        htmlFor="dvd"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Unidad DVD
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="cargador"
                        checked={tieneCargador}
                        onCheckedChange={(checked) => setTieneCargador(checked as boolean)}
                      />
                      <label htmlFor="cargador" className="text-sm font-medium">
                        Cargador
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="bateria"
                        checked={tieneBateria}
                        onCheckedChange={(checked) => setTieneBateria(checked as boolean)}
                      />
                      <label htmlFor="bateria" className="text-sm font-medium">
                        Batería
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="mouse"
                        checked={tieneMouse}
                        onCheckedChange={(checked) => setTieneMouse(checked as boolean)}
                      />
                      <label htmlFor="mouse" className="text-sm font-medium">
                        Mouse
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="candado"
                        checked={tieneCandado}
                        onCheckedChange={(checked) => setTieneCandado(checked as boolean)}
                      />
                      <label htmlFor="candado" className="text-sm font-medium">
                        Candado
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Campos específicos para TELÉFONO */}
          {isTelefono && (
            <>
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium">Detalles del Teléfono</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="plan">Plan</Label>
                    <Input
                      id="plan"
                      value={planTelefono}
                      onChange={(e) => setPlanTelefono(e.target.value)}
                      placeholder="Ej: Ilimitado"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minutos">Minutos Disponibles</Label>
                    <Input
                      id="minutos"
                      value={minutosDisponibles}
                      onChange={(e) => setMinutosDisponibles(e.target.value)}
                      placeholder="Ej: Ilimitados"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="audifonos"
                    checked={tieneAudifonos}
                    onCheckedChange={(checked) => setTieneAudifonos(checked as boolean)}
                  />
                  <label htmlFor="audifonos" className="text-sm font-medium">
                    Audífonos incluidos
                  </label>
                </div>
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Generando..." : "Generar Carta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
