"use client"

import { Button } from "@/components/ui/button"
import { Menu, Search, Bell, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuthStore } from "@/lib/store/auth-store"
import { authService } from "@/lib/services/auth-service"
import { useRouter } from "next/navigation"

interface HeaderProps {
  onSidebarToggle: () => void
}

export function Header({ onSidebarToggle }: HeaderProps) {
  const router = useRouter()
  const { user, refreshToken, clearAuth } = useAuthStore()

  const handleLogout = async () => {
    try {
      // Intentar hacer logout en el servidor
      await authService.logout(refreshToken || undefined)
    } finally {
      // Limpiar estado local siempre
      clearAuth()
      // Redirigir al login
      router.push("/login")
    }
  }

  return (
    <header className="border-b border-border bg-card">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onSidebarToggle} className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>

          <div className="hidden sm:flex items-center gap-2 bg-input rounded-lg px-3 py-2 w-64">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar..."
              className="border-0 bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{user?.username || "Usuario"}</span>
                  <span className="text-xs text-muted-foreground">{user?.email || ""}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Perfil</DropdownMenuItem>
              <DropdownMenuItem>Configuración</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
