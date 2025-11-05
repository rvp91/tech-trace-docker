// Core type definitions for TechTrace

export type UserRole = "admin" | "operator"

export interface User {
  id: string
  username: string
  email: string
  role: UserRole
  firstName?: string
  lastName?: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

export interface Employee {
  id: string
  nombreCompleto: string
  rut: string
  cargo: string
  sucursalId: string
  sucursal?: Branch
  correoCorpo: string
  gmailPersonal: string
  telefono: string
  sucursalCorregida: string
  estado: "activo" | "inactivo"
  createdAt: string
  updatedAt: string
}

export interface Device {
  id: string
  tipoEquipo: "laptop" | "telefono" | "tablet" | "sim_card" | "accesorio"
  marca: string
  modelo: string
  serieImei: string
  numeroTelefono?: string
  procedencia: "compra" | "arriendo" | "leasing" | "otro"
  sucursalId: string
  sucursal?: Branch
  fechaIngreso: string
  estado: "disponible" | "asignado" | "mantenimiento" | "baja"
  observaciones?: string
  createdAt: string
  updatedAt: string
}

export interface Assignment {
  id: string
  empleadoId: string
  empleado?: Employee
  dispositivoId: string
  dispositivo?: Device
  fechaEntrega: string
  fechaDevolucion?: string
  tipoEntrega: "permanente" | "temporal"
  estadoCarta: "firmada" | "pendiente" | "no_aplica"
  estadoDevolucion?: "optimo" | "con_danos" | "no_funcional"
  observaciones?: string
  observacionesDevolucion?: string
  estado: "activa" | "finalizada"
  createdAt: string
  updatedAt: string
}

export interface Branch {
  id: string
  nombre: string
  codigo: string
  direccion?: string
  ciudad: string
  estado: "activo" | "inactivo"
  createdAt: string
  updatedAt: string
}

export interface DashboardMetrics {
  totalDispositivos: number
  disponibles: number
  asignados: number
  enMantenimiento: number
  dispositivosPorTipo: {
    tipo: string
    cantidad: number
  }[]
  dispositivosPorEstado: {
    estado: string
    cantidad: number
  }[]
  ultimasAsignaciones: Assignment[]
  ultimasDevoluciones: Assignment[]
}

export interface InventoryReport {
  sucursalId?: string
  empleadoId?: string
  dispositivos: Device[]
  totales: {
    total: number
    porTipo: Record<string, number>
    porEstado: Record<string, number>
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiError {
  message: string
  code?: string
  details?: unknown
}
