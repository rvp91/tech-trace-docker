"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn, getDeviceSerial } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { deviceService } from "@/lib/services/device-service"
import type { Device } from "@/lib/types"

interface DeviceSearchComboboxProps {
  value?: string | number
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  filter?: { estado?: string }
}

export function DeviceSearchCombobox({
  value,
  onChange,
  disabled = false,
  placeholder = "Selecciona un dispositivo...",
  filter = {},
}: DeviceSearchComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)

  // Memorizar filter para evitar re-renders innecesarios
  const memoizedFilter = useMemo(() => filter, [filter?.estado])

  // Cargar dispositivos con búsqueda
  const loadDevices = useCallback(async (searchTerm: string = "") => {
    try {
      setLoading(true)
      const params: any = {
        page_size: 20,
        ...memoizedFilter,
      }

      if (searchTerm) {
        params.search = searchTerm
      }

      const response = await deviceService.getDevices(params)
      setDevices(response.results)
    } catch (error) {
      console.error("Error cargando dispositivos:", error)
      setDevices([])
    } finally {
      setLoading(false)
    }
  }, [memoizedFilter])

  // Cargar dispositivo seleccionado por ID
  const loadSelectedDevice = useCallback(async (deviceId: number) => {
    try {
      const device = await deviceService.getDevice(deviceId)
      setSelectedDevice(device)
    } catch (error) {
      console.error("Error cargando dispositivo seleccionado:", error)
      setSelectedDevice(null)
    }
  }, [])

  // Debounce para búsqueda - solo cargar cuando el popover está abierto
  useEffect(() => {
    if (!open) return

    const timer = setTimeout(() => {
      loadDevices(search)
    }, 300)

    return () => clearTimeout(timer)
  }, [search, loadDevices, open])

  // Cargar dispositivo seleccionado cuando cambia el value
  useEffect(() => {
    if (value && typeof value === "number") {
      loadSelectedDevice(value)
    } else if (value && typeof value === "string") {
      const id = parseInt(value)
      if (!isNaN(id)) {
        loadSelectedDevice(id)
      }
    } else {
      setSelectedDevice(null)
    }
  }, [value, loadSelectedDevice])

  const handleSelect = (device: Device) => {
    onChange(String(device.id))
    setSelectedDevice(device)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedDevice ? (
            <span className="truncate">
              {selectedDevice.tipo_equipo} - {selectedDevice.marca} {selectedDevice.modelo || "N/A"} ({getDeviceSerial(selectedDevice)})
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar dispositivo..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? "Buscando..." : "No se encontraron dispositivos"}
            </CommandEmpty>
            <CommandGroup>
              {devices.map((device) => (
                <CommandItem
                  key={device.id}
                  value={String(device.id)}
                  onSelect={() => handleSelect(device)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === device.id || value === String(device.id)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>
                      {device.tipo_equipo} - {device.marca} {device.modelo || "N/A"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Serie/IMEI: {getDeviceSerial(device)}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
