"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/lib/store/auth-store"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initializeAuth = useAuthStore((state) => state.initializeAuth)

  useEffect(() => {
    // Inicializar sincronización de auth al montar
    initializeAuth()
  }, [initializeAuth])

  return <>{children}</>
}
