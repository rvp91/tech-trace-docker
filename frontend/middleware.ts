// Middleware for authentication protection

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const publicPaths = ["/login"]
const protectedPaths = ["/dashboard", "/employees", "/devices", "/assignments", "/inventory", "/branches", "/users"]

export function middleware(request: NextRequest) {
  // Authentication middleware temporarily disabled
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}
