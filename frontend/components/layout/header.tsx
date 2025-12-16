"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, User } from "lucide-react"
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
import { ThemeToggle } from "@/components/theme-toggle"
import { EditProfileModal } from "@/components/modals/edit-profile-modal"
import { ChangePasswordModal } from "@/components/modals/change-password-modal"
import type { User as UserType } from "@/lib/types"

interface HeaderProps {
  onSidebarToggle: () => void
}

export function Header({ onSidebarToggle }: HeaderProps) {
  const router = useRouter()
  const { user, refreshToken, clearAuth, updateUser } = useAuthStore()
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)

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

  const handleProfileUpdate = (updatedUser: UserType) => {
    updateUser(updatedUser)
    setProfileModalOpen(false)
  }

  return (
    <header className="border-b border-border bg-card h-16">
      <div className="flex items-center justify-between h-full px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onSidebarToggle} className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {user?.full_name || user?.first_name || user?.username || "Usuario"}
                  </span>
                  <span className="text-xs text-muted-foreground">{user?.email || ""}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setProfileModalOpen(true)}>
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPasswordModalOpen(true)}>
                Cambiar Contraseña
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Modales */}
      <EditProfileModal
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
        user={user}
        onSuccess={handleProfileUpdate}
      />

      <ChangePasswordModal
        open={passwordModalOpen}
        onOpenChange={setPasswordModalOpen}
        userId={user?.id || null}
        onSuccess={() => setPasswordModalOpen(false)}
      />
    </header>
  )
}
