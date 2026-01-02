"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
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
import { employeeService } from "@/lib/services/employee-service"
import type { Employee } from "@/lib/types"

interface EmployeeSearchComboboxProps {
  value?: string | number
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  filter?: { estado?: string }
}

export function EmployeeSearchCombobox({
  value,
  onChange,
  disabled = false,
  placeholder = "Selecciona un empleado...",
  filter = {},
}: EmployeeSearchComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

  // Memorizar filter para evitar re-renders innecesarios
  const memoizedFilter = useMemo(() => filter, [filter?.estado])

  // Cargar empleados con búsqueda
  const loadEmployees = useCallback(async (searchTerm: string = "") => {
    try {
      setLoading(true)
      const params: any = {
        page_size: 20,
        ...memoizedFilter,
      }

      if (searchTerm) {
        params.search = searchTerm
      }

      const response = await employeeService.getEmployees(params)
      setEmployees(response.results)
    } catch (error) {
      console.error("Error cargando empleados:", error)
      setEmployees([])
    } finally {
      setLoading(false)
    }
  }, [memoizedFilter])

  // Cargar empleado seleccionado por ID
  const loadSelectedEmployee = useCallback(async (employeeId: number) => {
    try {
      const employee = await employeeService.getEmployee(employeeId)
      setSelectedEmployee(employee)
    } catch (error) {
      console.error("Error cargando empleado seleccionado:", error)
      setSelectedEmployee(null)
    }
  }, [])

  // Debounce para búsqueda - solo cargar cuando el popover está abierto
  useEffect(() => {
    if (!open) return

    const timer = setTimeout(() => {
      loadEmployees(search)
    }, 300)

    return () => clearTimeout(timer)
  }, [search, loadEmployees, open])

  // Cargar empleado seleccionado cuando cambia el value
  useEffect(() => {
    if (value && typeof value === "number") {
      loadSelectedEmployee(value)
    } else if (value && typeof value === "string") {
      const id = parseInt(value)
      if (!isNaN(id)) {
        loadSelectedEmployee(id)
      }
    } else {
      setSelectedEmployee(null)
    }
  }, [value, loadSelectedEmployee])

  const handleSelect = (employee: Employee) => {
    setSelectedEmployee(employee)
    onChange(String(employee.id))
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
          {selectedEmployee ? (
            <span className="truncate">
              {selectedEmployee.nombre_completo} - {selectedEmployee.rut}
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
            placeholder="Buscar empleado..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? "Buscando..." : "No se encontraron empleados"}
            </CommandEmpty>
            <CommandGroup>
              {employees.map((employee) => (
                <CommandItem
                  key={employee.id}
                  value={String(employee.id)}
                  onSelect={() => handleSelect(employee)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === employee.id || value === String(employee.id)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{employee.nombre_completo}</span>
                    <span className="text-xs text-muted-foreground">
                      {employee.rut}
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
