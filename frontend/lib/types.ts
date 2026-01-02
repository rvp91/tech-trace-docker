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

export interface BusinessUnit {
  id: number
  nombre: string
  codigo: string
  descripcion?: string
  is_active: boolean
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
  unidad_negocio?: number
  unidad_negocio_detail?: BusinessUnit
  estado: "ACTIVO" | "INACTIVO"
  dispositivos_asignados: number
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

export type TipoEquipo = "LAPTOP" | "DESKTOP" | "TELEFONO" | "TABLET" | "TV" | "SIM" | "ACCESORIO"
export type EstadoDispositivo = "DISPONIBLE" | "ASIGNADO" | "MANTENIMIENTO" | "BAJA" | "ROBO"

export interface Device {
  id: number
  tipo_equipo: TipoEquipo
  marca: string
  modelo: string | null
  numero_serie?: string | null
  imei?: string | null
  numero_telefono?: string | null
  numero_factura?: string | null
  estado: EstadoDispositivo
  sucursal: number
  sucursal_detail?: Branch
  fecha_ingreso: string

  // Campos de edad
  edad_dispositivo?: number
  edad_dispositivo_display?: string | number
  puede_tener_edad?: boolean

  // Campos de valor
  valor_inicial?: number
  valor_depreciado?: number
  valor_depreciado_calculado?: number
  es_valor_manual?: boolean
  puede_tener_valor?: boolean

  // Campo para validar asignaciones activas
  asignacion_activa?: boolean

  // Soft delete fields
  activo: boolean
  fecha_inactivacion?: string | null

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
    numero_serie?: string
    imei?: string
  }
  total_assignments: number
  active_assignments: number
  assignments: Assignment[]
}

// Request (Solicitud) types
export type EstadoSolicitud = "PENDIENTE" | "COMPLETADA"
export type MotivoSolicitud = "CAMBIO" | "NUEVA_ENTREGA" | "ROBO" | "PRACTICA"

export interface Request {
  id: number
  empleado: number
  empleado_detail?: Employee
  sucursal: number
  sucursal_detail?: Branch
  motivo: MotivoSolicitud
  motivo_display?: string
  jefatura_solicitante: string
  tipo_dispositivo: string
  justificacion?: string
  fecha_solicitud: string
  estado: EstadoSolicitud
  created_by: number
  created_by_username?: string
  created_at: string
  updated_at: string
}

// Assignment (Asignación) types
export type TipoEntrega = "PERMANENTE" | "TEMPORAL"
export type EstadoCarta = "FIRMADA" | "PENDIENTE" | "NO_APLICA"
export type EstadoAsignacion = "ACTIVA" | "FINALIZADA"

export interface Assignment {
  id: number
  solicitud?: number
  solicitud_detail?: Request
  empleado: number
  dispositivo: number
  empleado_detail?: Employee
  dispositivo_detail?: Device
  tipo_entrega: TipoEntrega
  fecha_entrega: string
  fecha_devolucion?: string
  estado_carta: EstadoCarta
  estado_carta_display?: string
  fecha_firma?: string
  firmado_por?: number
  firmado_por_username?: string
  estado_asignacion: EstadoAsignacion
  estado_asignacion_display?: string
  observaciones?: string
  discount_data?: DiscountData
  created_at: string
  updated_at: string
  created_by?: number
  created_by_username?: string
}

// Tipos para descuentos
export interface DiscountData {
  monto_total: string
  numero_cuotas: number
  mes_primera_cuota: string
  fecha_generacion: string
}

export interface DiscountReportFilters {
  fecha_inicio?: string
  fecha_fin?: string
  empleado?: number
  sucursal?: number
  tipo_dispositivo?: TipoEquipo | ''
}

export interface ActiveAssignmentReportFilters {
  fecha_inicio: string  // OBLIGATORIO
  fecha_fin: string     // OBLIGATORIO
  sucursal?: number
  tipo_dispositivo?: TipoEquipo | ''
}

// Return (Devolución) types
export type EstadoDevolucion = "OPTIMO" | "CON_DANOS" | "NO_FUNCIONAL"

export interface Return {
  id: number
  asignacion: number
  asignacion_detail?: Assignment
  fecha_devolucion: string
  estado_dispositivo: EstadoDevolucion
  observaciones?: string
  created_by: number
  created_by_username?: string
  created_at: string
}

export interface Branch {
  id: number
  nombre: string
  codigo: string
  is_active: boolean
  created_at: string
  updated_at: string
  total_dispositivos?: number
  total_empleados?: number
  dispositivos_por_tipo?: {
    LAPTOP: number
    DESKTOP: number
    TELEFONO: number
    TABLET: number
    TV: number
    SIM: number
    ACCESORIO: number
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

// Tipos para sistema de cartas PDF

export type CompanyKey = 'pompeyo_carrasco' | 'pompeyo_automoviles'

export interface CompanyOption {
  value: CompanyKey
  label: string
  rut: string
}

export interface ResponsibilityLetterData {
  // Selección de empresa
  company_key: CompanyKey

  // Campos comunes
  jefatura_nombre?: string

  // Campos para LAPTOP
  procesador?: string
  disco_duro?: string
  memoria_ram?: string
  tiene_dvd?: boolean
  tiene_cargador?: boolean
  tiene_bateria?: boolean
  tiene_mouse?: boolean
  tiene_candado?: boolean

  // Campos para TELÉFONO
  plan_telefono?: string
  minutos_disponibles?: string
  tiene_audifonos?: boolean
}

export interface DiscountLetterData {
  // Selección de empresa
  company_key: CompanyKey

  monto_total: number
  numero_cuotas: number
  mes_primera_cuota: string
}
