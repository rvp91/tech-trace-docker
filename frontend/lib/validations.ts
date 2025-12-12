// Form validation utilities

export const validateRUT = (rut: string): boolean => {
  // Remove dots and hyphens
  const cleanRut = rut.replace(/\./g, "").replace(/-/g, "")

  if (cleanRut.length < 2) return false

  const body = cleanRut.slice(0, -1)
  const dv = cleanRut.slice(-1).toUpperCase()

  // Calculate verification digit
  let sum = 0
  let multiplier = 2

  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number.parseInt(body[i]) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }

  const expectedDv = 11 - (sum % 11)
  const calculatedDv = expectedDv === 11 ? "0" : expectedDv === 10 ? "K" : String(expectedDv)

  return dv === calculatedDv
}

export const formatRUT = (rut: string): string => {
  const cleanRut = rut.replace(/\./g, "").replace(/-/g, "")
  if (cleanRut.length < 2) return rut

  const body = cleanRut.slice(0, -1)
  const dv = cleanRut.slice(-1)

  // Add dots every 3 digits from right to left
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".")

  return `${formattedBody}-${dv}`
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePhone = (phone: string): boolean => {
  // Chilean phone format: +56 9 XXXX XXXX or 9 XXXX XXXX
  const phoneRegex = /^(\+?56)?9\d{8}$/
  return phoneRegex.test(phone.replace(/\s/g, ""))
}

// ============================================
// ZOD SCHEMAS PARA VALIDACIÓN DE FORMULARIOS
// ============================================

import { z } from "zod"

/**
 * Valida formato de código de sucursal (ej: SCL-01, VAL-02)
 */
const branchCodeRegex = /^[A-Z]{3}-\d{2}$/
export const validateBranchCode = (code: string): boolean => {
  return branchCodeRegex.test(code)
}

// ============================================
// SCHEMA: BRANCH (SUCURSAL)
// ============================================

export const branchSchema = z.object({
  nombre: z.string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),

  codigo: z.string()
    .regex(branchCodeRegex, "El código debe tener el formato XXX-## (ej: SCL-01)")
    .toUpperCase(),

  direccion: z.string()
    .optional()
    .or(z.literal("")),

  ciudad: z.string()
    .min(2, "La ciudad debe tener al menos 2 caracteres")
    .max(100, "La ciudad no puede exceder 100 caracteres"),

  is_active: z.boolean().default(true),
})

export type BranchFormData = z.infer<typeof branchSchema>

// ============================================
// SCHEMA: EMPLOYEE (EMPLEADO)
// ============================================

export const employeeSchema = z.object({
  rut: z.string()
    .min(9, "El RUT debe tener al menos 9 caracteres")
    .max(12, "El RUT no puede exceder 12 caracteres")
    .refine((val) => validateRUT(val), {
      message: "El RUT ingresado no es válido",
    }),

  nombre_completo: z.string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(200, "El nombre no puede exceder 200 caracteres"),

  cargo: z.string()
    .min(2, "El cargo debe tener al menos 2 caracteres")
    .max(100, "El cargo no puede exceder 100 caracteres"),

  correo_corporativo: z.string()
    .email("Debe ser un correo válido")
    .optional()
    .or(z.literal("")),

  gmail_personal: z.string()
    .email("Debe ser un correo válido")
    .optional()
    .or(z.literal("")),

  telefono: z.string()
    .optional()
    .or(z.literal("")),

  sucursal: z.number().positive("Debes seleccionar una sucursal válida"),

  unidad_negocio: z.string()
    .optional()
    .or(z.literal("")),

  estado: z.enum(["ACTIVO", "INACTIVO"]),
})

export type EmployeeFormData = z.infer<typeof employeeSchema>

// ============================================
// SCHEMA: DEVICE (DISPOSITIVO)
// ============================================

export const deviceSchema = z.object({
  tipo_equipo: z.enum(["LAPTOP", "TELEFONO", "TABLET", "TV", "SIM", "ACCESORIO"]),

  marca: z.string()
    .min(2, "La marca debe tener al menos 2 caracteres")
    .max(50, "La marca no puede exceder 50 caracteres"),

  modelo: z.string()
    .optional()
    .or(z.literal("")),

  numero_serie: z.string()
    .optional()
    .or(z.literal("")),

  imei: z.string()
    .optional()
    .or(z.literal("")),

  numero_telefono: z.string()
    .optional()
    .or(z.literal("")),

  numero_factura: z.string()
    .optional()
    .or(z.literal("")),

  estado: z.enum(["DISPONIBLE", "ASIGNADO", "MANTENIMIENTO", "BAJA", "ROBO"]),

  sucursal: z.number().positive("Debes seleccionar una sucursal válida"),

  fecha_ingreso: z.string()
    .min(1, "La fecha de ingreso es requerida"),

  // Nuevos campos de valor
  valor_inicial: z.union([z.number(), z.string()])
    .optional()
    .transform(val => {
      if (val === "" || val === null || val === undefined) return undefined
      return typeof val === 'string' ? parseFloat(val) : val
    }),

  valor_depreciado: z.union([z.number(), z.string()])
    .optional()
    .transform(val => {
      if (val === "" || val === null || val === undefined) return undefined
      return typeof val === 'string' ? parseFloat(val) : val
    }),

  es_valor_manual: z.boolean().optional(),

}).superRefine((data, ctx) => {
  // VALIDACIÓN 1: numero_serie obligatorio para LAPTOP, TELEFONO, TABLET, TV
  if (['LAPTOP', 'TELEFONO', 'TABLET', 'TV'].includes(data.tipo_equipo)) {
    if (!data.numero_serie || data.numero_serie.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `El número de serie es obligatorio para ${data.tipo_equipo}`,
        path: ['numero_serie'],
      })
    }
  }

  // VALIDACIÓN 2: modelo obligatorio para LAPTOP, TELEFONO, TABLET
  if (['LAPTOP', 'TELEFONO', 'TABLET'].includes(data.tipo_equipo)) {
    if (!data.modelo || data.modelo.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `El modelo es obligatorio para ${data.tipo_equipo}`,
        path: ['modelo'],
      })
    }
  }

  // VALIDACIÓN 3: numero_telefono obligatorio solo para SIM
  if (data.tipo_equipo === 'SIM') {
    if (!data.numero_telefono || data.numero_telefono.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El número de teléfono es obligatorio para SIM cards',
        path: ['numero_telefono'],
      })
    }
  }
})

export type DeviceFormData = z.infer<typeof deviceSchema>

// ============================================
// SCHEMA: REQUEST (SOLICITUD)
// ============================================

export const requestSchema = z.object({
  empleado: z.number().positive("Debes seleccionar un empleado válido"),

  sucursal: z.number().positive("Debes seleccionar una sucursal válida"),

  motivo: z.enum(["CAMBIO", "NUEVA_ENTREGA", "ROBO", "PRACTICA"]),

  jefatura_solicitante: z.string()
    .min(3, "El nombre de la jefatura debe tener al menos 3 caracteres")
    .max(200, "El nombre de la jefatura no puede exceder 200 caracteres"),

  tipo_dispositivo: z.enum(["LAPTOP", "TELEFONO", "TABLET", "SIM", "ACCESORIO"]),

  justificacion: z.string()
    .optional()
    .or(z.literal("")),
})

export type RequestFormData = z.infer<typeof requestSchema>

// ============================================
// SCHEMA: ASSIGNMENT (ASIGNACIÓN)
// ============================================

export const assignmentSchema = z.object({
  empleado: z.number().positive("Debes seleccionar un empleado válido"),

  dispositivo: z.number().positive("Debes seleccionar un dispositivo válido"),

  tipo_entrega: z.enum(["PERMANENTE", "TEMPORAL"]),

  fecha_entrega: z.string()
    .min(1, "La fecha de entrega es requerida"),

  estado_carta: z.enum(["FIRMADA", "PENDIENTE", "NO_APLICA"]),

  observaciones: z.string()
    .optional()
    .or(z.literal("")),

  solicitud: z.number()
    .optional()
    .nullable(),
})

export type AssignmentFormData = z.infer<typeof assignmentSchema>

// ============================================
// SCHEMA: RETURN (DEVOLUCIÓN)
// ============================================

export const returnSchema = z.object({
  fecha_devolucion: z.string()
    .min(1, "La fecha de devolución es requerida"),

  estado_dispositivo: z.enum(["OPTIMO", "CON_DANOS", "NO_FUNCIONAL"]),

  observaciones: z.string()
    .optional()
    .or(z.literal("")),
})

export type ReturnFormData = z.infer<typeof returnSchema>

// ============================================
// SCHEMA: USER (USUARIO)
// ============================================

export const userCreateSchema = z.object({
  username: z.string()
    .min(3, "El nombre de usuario debe tener al menos 3 caracteres")
    .max(150, "El nombre de usuario no puede exceder 150 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "Solo se permiten letras, números y guiones bajos"),

  email: z.string()
    .email("Debe ser un correo válido")
    .optional()
    .or(z.literal("")),

  first_name: z.string()
    .optional()
    .or(z.literal("")),

  last_name: z.string()
    .optional()
    .or(z.literal("")),

  password: z.string()
    .min(6, "La contraseña debe tener al menos 6 caracteres"),

  password_confirm: z.string()
    .min(6, "La contraseña debe tener al menos 6 caracteres"),

  role: z.enum(["ADMIN", "OPERADOR"]),
}).refine(
  (data) => data.password === data.password_confirm,
  {
    message: "Las contraseñas no coinciden",
    path: ["password_confirm"],
  }
)

export type UserCreateFormData = z.infer<typeof userCreateSchema>

export const userUpdateSchema = z.object({
  email: z.string()
    .email("Debe ser un correo válido")
    .optional()
    .or(z.literal("")),

  first_name: z.string()
    .optional()
    .or(z.literal("")),

  last_name: z.string()
    .optional()
    .or(z.literal("")),

  role: z.enum(["ADMIN", "OPERADOR"]),
})

export type UserUpdateFormData = z.infer<typeof userUpdateSchema>

export const changePasswordSchema = z.object({
  new_password: z.string()
    .min(6, "La contraseña debe tener al menos 6 caracteres"),

  confirm_password: z.string()
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
}).refine(
  (data) => data.new_password === data.confirm_password,
  {
    message: "Las contraseñas no coinciden",
    path: ["confirm_password"],
  }
)

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

// ============================================
// SCHEMA: LOGIN
// ============================================

export const loginSchema = z.object({
  username: z.string()
    .min(1, "El nombre de usuario es requerido"),

  password: z.string()
    .min(1, "La contraseña es requerida"),
})

export type LoginFormData = z.infer<typeof loginSchema>
