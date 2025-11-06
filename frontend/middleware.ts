// Middleware for authentication protection

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const publicPaths = ["/login"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Permitir rutas públicas
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Verificar autenticación en localStorage
  // Nota: El middleware de Next.js no puede acceder a localStorage directamente,
  // por lo que verificamos la existencia de la cookie o verificamos en el cliente
  const authCookie = request.cookies.get("techtrace-auth")

  // Si no hay cookie de auth y está intentando acceder a rutas protegidas
  if (!authCookie && pathname.startsWith("/dashboard")) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Si está autenticado y intenta acceder a /login, redirigir al dashboard
  if (authCookie && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Redirigir la raíz al dashboard si está autenticado, si no al login
  if (pathname === "/") {
    if (authCookie) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    } else {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}
