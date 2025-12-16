"use client"

import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, Package, Tablet, Zap, Building2, Settings, LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/lib/store/auth-store"
import { authService } from "@/lib/services/auth-service"

interface SidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ICON_MAP = {
  LayoutDashboard,
  Users,
  Package,
  Tablet,
  Zap,
  Building2,
  Settings,
}

const NAVIGATION = [
  { name: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { name: "Empleados", href: "/dashboard/employees", icon: "Users" },
  { name: "Dispositivos", href: "/dashboard/devices", icon: "Tablet" },
  { name: "Asignaciones", href: "/dashboard/assignments", icon: "Zap" },
  { name: "Inventario", href: "/dashboard/inventory", icon: "Package" },
  { name: "Sucursales", href: "/dashboard/branches", icon: "Building2" },
  { name: "Usuarios", href: "/dashboard/users", icon: "Settings" },
]

export function Sidebar({ open, onOpenChange }: SidebarProps) {
  const pathname = usePathname()
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

  // Filtrar navegación según el rol del usuario
  const filteredNavigation = NAVIGATION.filter((item) => {
    // Si el usuario es operador, ocultar el módulo de usuarios
    if (user?.role === "OPERADOR" && item.href === "/dashboard/users") {
      return false
    }
    return true
  })

  return (
    <>
      {/* Mobile Overlay */}
      {open && <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => onOpenChange(false)} />}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-30 h-screen w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 lg:relative lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center justify-center px-6 border-b border-border">
            <div>
              <h1 className="text-xl font-bold text-sidebar-foreground">TechTrace</h1>
              <p className="text-xs text-sidebar-foreground/60 mt-1">Gestión de Inventario</p>
            </div>
          </div>

          <nav className="flex-1 overflow-auto p-4 space-y-1">
            {filteredNavigation.map((item: any) => {
              const Icon = ICON_MAP[item.icon as keyof typeof ICON_MAP]
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive && "bg-sidebar-primary text-sidebar-primary-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-sidebar-border">
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive"
              size="sm"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
