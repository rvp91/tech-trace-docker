import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TablePaginationProps {
  currentPage: number
  totalPages: number
  pageSize?: number
  totalCount: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  pageSizeOptions?: number[]
}

export function TablePagination({
  currentPage,
  totalPages,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}: TablePaginationProps) {
  // Calcular rango de elementos mostrados
  const from = pageSize ? (currentPage - 1) * pageSize + 1 : 0
  const to = pageSize ? Math.min(currentPage * pageSize, totalCount) : totalCount

  // Generar números de página a mostrar
  const generatePageNumbers = () => {
    const pages: (number | string)[] = []
    const maxPagesToShow = 5

    if (totalPages <= maxPagesToShow) {
      // Mostrar todas las páginas si son pocas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Lógica para mostrar páginas con ellipsis
      if (currentPage <= 3) {
        // Cerca del inicio
        pages.push(1, 2, 3, 4, "ellipsis", totalPages)
      } else if (currentPage >= totalPages - 2) {
        // Cerca del final
        pages.push(1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        // En el medio
        pages.push(1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages)
      }
    }

    return pages
  }

  const pages = generatePageNumbers()

  if (totalCount === 0) {
    return null
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      {/* Info de resultados y selector de tamaño de página */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        {pageSize ? (
          <span>
            Mostrando {from} a {to} de {totalCount} resultados
          </span>
        ) : (
          <span>
            {totalCount} {totalCount === 1 ? "resultado" : "resultados"}
          </span>
        )}
        {/* Solo mostrar selector si hay pageSize, onPageSizeChange y más de una opción */}
        {pageSize !== undefined && onPageSizeChange && pageSizeOptions.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-sm">Filas por página:</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => onPageSizeChange!(Number(value))}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Controles de paginación */}
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(currentPage - 1)}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>

          {pages.map((page, index) => {
            if (page === "ellipsis") {
              return (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              )
            }

            return (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => onPageChange(page as number)}
                  isActive={currentPage === page}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            )
          })}

          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(currentPage + 1)}
              className={
                currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
