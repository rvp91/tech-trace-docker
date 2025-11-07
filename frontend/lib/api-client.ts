// API client configuration and utilities

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

// Tipos personalizados para errores
export interface ApiError {
  message: string
  status: number
  details?: Record<string, string[]>
}

export class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
    // Load token from localStorage if available
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token")
    }
  }

  setToken(token: string | null) {
    this.token = token
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("auth_token", token)
      } else {
        localStorage.removeItem("auth_token")
      }
    }
  }

  getToken(): string | null {
    return this.token
  }

  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const url = `${this.baseUrl}${endpoint}`
    if (!params) return url

    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value))
      }
    })

    const queryString = searchParams.toString()
    return queryString ? `${url}?${queryString}` : url
  }

  private handleError(status: number, errorData: any): never {
    let message = "Error en la solicitud"
    let details: Record<string, string[]> | undefined

    // Manejo específico por código de estado
    switch (status) {
      case 400:
        // Bad Request - Errores de validación
        message = "Datos inválidos"
        if (errorData && typeof errorData === "object") {
          // Extraer detalles de validación del backend
          details = {}
          Object.entries(errorData).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              details![key] = value
            } else if (typeof value === "string") {
              details![key] = [value]
            }
          })

          // Si hay un mensaje general, usarlo
          if (errorData.detail) {
            message = errorData.detail
          } else if (errorData.message) {
            message = errorData.message
          } else {
            // Construir mensaje a partir de los detalles
            const firstError = Object.values(details)[0]
            if (firstError && firstError.length > 0) {
              message = firstError[0]
            }
          }
        }
        break

      case 401:
        // No autorizado - Token inválido o expirado
        message = "Sesión expirada. Por favor, inicia sesión nuevamente."
        // Limpiar token y redirigir a login
        if (typeof window !== "undefined") {
          this.setToken(null)
          localStorage.removeItem("techtrace-auth")
          document.cookie = "techtrace-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;"

          // Solo redirigir si no estamos ya en login
          if (!window.location.pathname.includes("/login")) {
            window.location.href = "/login"
          }
        }
        break

      case 403:
        // Prohibido - Sin permisos
        message = "No tienes permisos para realizar esta acción"
        if (errorData?.detail) {
          message = errorData.detail
        }
        break

      case 404:
        // No encontrado
        message = "Recurso no encontrado"
        if (errorData?.detail) {
          message = errorData.detail
        }
        break

      case 500:
      case 502:
      case 503:
        // Errores del servidor
        message = "Error del servidor. Por favor, intenta nuevamente más tarde."
        break

      default:
        if (errorData?.detail) {
          message = errorData.detail
        } else if (errorData?.message) {
          message = errorData.message
        }
    }

    // Crear objeto de error personalizado
    const apiError: ApiError = {
      message,
      status,
      details,
    }

    // Lanzar error con la estructura personalizada
    const error = new Error(message) as Error & { apiError: ApiError }
    error.apiError = apiError
    throw error
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, params?: Record<string, any>): Promise<T> {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
      }

      if (this.token) {
        headers["Authorization"] = `Bearer ${this.token}`
      }

      const url = this.buildUrl(endpoint, params)

      const response = await fetch(url, {
        ...options,
        headers,
      })

      // Si la respuesta es exitosa
      if (response.ok) {
        // Manejar respuestas vacías (204 No Content, DELETE exitoso, etc)
        const contentType = response.headers.get("content-type")
        if (response.status === 204 || !contentType || !contentType.includes("application/json")) {
          return {} as T
        }
        return response.json()
      }

      // Si hay error, intentar parsear el cuerpo de la respuesta
      let errorData: any
      try {
        errorData = await response.json()
      } catch {
        errorData = { message: `Error HTTP ${response.status}` }
      }

      // Manejar el error según el código de estado
      this.handleError(response.status, errorData)

    } catch (error) {
      // Si es un error de red (sin conexión, timeout, etc)
      if (error instanceof TypeError && error.message.includes("fetch")) {
        const networkError: ApiError = {
          message: "Error de conexión. Verifica tu conexión a internet.",
          status: 0,
        }
        const err = new Error(networkError.message) as Error & { apiError: ApiError }
        err.apiError = networkError
        throw err
      }

      // Re-lanzar otros errores
      throw error
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" }, params)
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" })
  }
}

export const apiClient = new ApiClient()
