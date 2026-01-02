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
import { branchService } from "@/lib/services/branch-service"
import type { Branch } from "@/lib/types"

interface BranchSearchComboboxProps {
  value?: string | number
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  filter?: { is_active?: boolean }
  allowAll?: boolean
  allLabel?: string
}

export function BranchSearchCombobox({
  value,
  onChange,
  disabled = false,
  placeholder = "Selecciona una sucursal...",
  filter = {},
  allowAll = false,
  allLabel = "Todas las sucursales",
}: BranchSearchComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)

  // Memorizar filter para evitar re-renders innecesarios
  const memoizedFilter = useMemo(() => filter, [filter?.is_active])

  // Cargar sucursales con búsqueda
  const loadBranches = useCallback(async (searchTerm: string = "") => {
    try {
      setLoading(true)
      const params: any = {
        page_size: 20,
        ...memoizedFilter,
      }

      if (searchTerm) {
        params.search = searchTerm
      }

      const response = await branchService.getBranches(params)
      setBranches(response.results)
    } catch (error) {
      console.error("Error cargando sucursales:", error)
      setBranches([])
    } finally {
      setLoading(false)
    }
  }, [memoizedFilter])

  // Cargar sucursal seleccionada por ID
  const loadSelectedBranch = useCallback(async (branchId: number) => {
    try {
      const branch = await branchService.getBranch(branchId)
      setSelectedBranch(branch)
    } catch (error) {
      console.error("Error cargando sucursal seleccionada:", error)
      setSelectedBranch(null)
    }
  }, [])

  // Debounce para búsqueda - solo cargar cuando el popover está abierto
  useEffect(() => {
    if (!open) return

    const timer = setTimeout(() => {
      loadBranches(search)
    }, 300)

    return () => clearTimeout(timer)
  }, [search, loadBranches, open])

  // Cargar sucursal seleccionada cuando cambia el value
  useEffect(() => {
    if (value === "all") {
      setSelectedBranch(null)
    } else if (value && typeof value === "number") {
      loadSelectedBranch(value)
    } else if (value && typeof value === "string" && value !== "all") {
      const id = parseInt(value)
      if (!isNaN(id)) {
        loadSelectedBranch(id)
      }
    } else {
      setSelectedBranch(null)
    }
  }, [value, loadSelectedBranch])

  const handleSelect = (branch: Branch) => {
    setSelectedBranch(branch)
    onChange(String(branch.id))
    setOpen(false)
  }

  const handleSelectAll = () => {
    setSelectedBranch(null)
    onChange("all")
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
          {value === "all" && allowAll ? (
            <span className="text-muted-foreground">{allLabel}</span>
          ) : selectedBranch ? (
            <span className="truncate">
              {selectedBranch.nombre} ({selectedBranch.codigo})
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
            placeholder="Buscar sucursal..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? "Buscando..." : "No se encontraron sucursales"}
            </CommandEmpty>
            <CommandGroup>
              {allowAll && (
                <CommandItem
                  value="all"
                  onSelect={handleSelectAll}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === "all" ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {allLabel}
                </CommandItem>
              )}
              {branches.map((branch) => (
                <CommandItem
                  key={branch.id}
                  value={String(branch.id)}
                  onSelect={() => handleSelect(branch)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === branch.id || value === String(branch.id)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{branch.nombre}</span>
                    <span className="text-xs text-muted-foreground">
                      {branch.codigo}
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
