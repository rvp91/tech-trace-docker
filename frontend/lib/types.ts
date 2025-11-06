// Core type definitions for TechTrace

export type UserRole = "ADMIN" | "OPERADOR"

export interface User {
  id: number
  username: string
  email: string
  role: UserRole
  first_name?: string
  last_name?: string
  full_name?: string
  is_active?: boolean
  is_staff?: boolean
  is_superuser?: boolean
  date_joined?: string
  last_login?: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

export interface Employee {
  id: number
  rut: string
  nombre_completo: string
  cargo: string
  correo_corporativo?: string
  gmail_personal?: string
  telefono?: string
  sucursal: number
  sucursal_detail?: Branch
  unidad_negocio?: string
  estado: "ACTIVO" | "INACTIVO"
  created_at: string
  updated_at: string
  created_by?: number
  created_by_username?: string
}

export interface EmployeeHistory {
  employee: {
    id: number
    rut: string
    nombre_completo: string
    cargo: string
  }
  total_assignments: number
  active_assignments: number
  assignments: Assignment[]
}

export type TipoEquipo = "LAPTOP" | "TELEFONO" | "TABLET" | "SIM" | "ACCESORIO"
export type EstadoDispositivo = "DISPONIBLE" | "ASIGNADO" | "MANTENIMIENTO" | "BAJA" | "ROBO"

export interface Device {
  id: number
  tipo_equipo: TipoEquipo
  marca: string
  modelo: string
  serie_imei: string
  numero_telefono?: string
  numero_factura?: string
  estado: EstadoDispositivo
  sucursal: number
  sucursal_detail?: Branch
  fecha_ingreso: string
  created_at: string
  updated_at: string
  created_by?: number
  created_by_username?: string
}

export interface DeviceHistory {
  device: {
    id: number
    tipo_equipo: TipoEquipo
    marca: string
    modelo: string
    serie_imei: string
  }
  total_assignments: number
  active_assignments: number
  assignments: Assignment[]
}

export type TipoEntrega = "PERMANENTE" | "TEMPORAL"
export type EstadoCarta = "FIRMADA" | "PENDIENTE" | "NO_APLICA"
export type EstadoAsignacion = "ACTIVA" | "FINALIZADA"

export interface Assignment {
  id: number
  solicitud?: number
  empleado: number
  dispositivo: number
  empleado_detail?: Employee
  dispositivo_detail?: Device
  tipo_entrega: TipoEntrega
  fecha_entrega: string
  fecha_devolucion?: string
  estado_carta: EstadoCarta
  estado_asignacion: EstadoAsignacion
  observaciones?: string
  created_at: string
  updated_at: string
  created_by?: number
  created_by_username?: string
}

export interface Branch {
  id: number
  nombre: string
  codigo: string
  direccion?: string
  ciudad: string
  is_active: boolean
  created_at: string
  updated_at: string
  total_dispositivos?: number
  total_empleados?: number
  dispositivos_por_tipo?: {
    LAPTOP: number
    TELEFONO: number
    TABLET: number
    SIM: number
    ACCESORIO: number
  }
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
