// Application constants

export const DEVICE_TYPES = {
  laptop: "Laptop",
  telefono: "Teléfono",
  tablet: "Tablet",
  sim_card: "SIM Card",
  accesorio: "Accesorio",
} as const

export const DEVICE_STATES = {
  disponible: "Disponible",
  asignado: "Asignado",
  mantenimiento: "En Mantenimiento",
  baja: "Dado de Baja",
} as const

export const EMPLOYEE_STATES = {
  activo: "Activo",
  inactivo: "Inactivo",
} as const

export const ASSIGNMENT_STATES = {
  activa: "Activa",
  finalizada: "Finalizada",
} as const

export const DELIVERY_TYPES = {
  permanente: "Permanente",
  temporal: "Temporal",
} as const

export const LETTER_STATES = {
  firmada: "Firmada",
  pendiente: "Pendiente",
  no_aplica: "No Aplica",
} as const

export const RETURN_STATES = {
  optimo: "Óptimo",
  con_danos: "Con Daños",
  no_funcional: "No Funcional",
} as const

export const PROCEDENCIA_TYPES = {
  compra: "Compra",
  arriendo: "Arriendo",
  leasing: "Leasing",
  otro: "Otro",
} as const

export const USER_ROLES = {
  admin: "Administrador",
  operator: "Operador",
} as const

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 25,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const
