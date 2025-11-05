// Centralized mock data for the TechTrace application
// This file consolidates all sample data from dashboard pages
// Makes it easy to transition to real API calls later

export const DASHBOARD_METRICS = [
  { label: "Total Empleados", value: "124", icon: "Users", trend: "+5%" },
  { label: "Dispositivos", value: "342", icon: "Package", trend: "+12%" },
  { label: "Asignados", value: "298", icon: "Zap", trend: "+8%" },
  { label: "En Stock", value: "44", icon: "TrendingUp", trend: "-2%" },
]

export const EMPLOYEES = [
  {
    id: 1,
    nombre: "Juan Pérez",
    email: "juan.perez@empresa.com",
    sucursal: "Centro",
    puesto: "Gerente",
    estado: "Activo",
  },
  {
    id: 2,
    nombre: "María García",
    email: "maria.garcia@empresa.com",
    sucursal: "Norte",
    puesto: "Analista",
    estado: "Activo",
  },
  {
    id: 3,
    nombre: "Carlos López",
    email: "carlos.lopez@empresa.com",
    sucursal: "Sur",
    puesto: "Técnico",
    estado: "Activo",
  },
  {
    id: 4,
    nombre: "Ana Rodríguez",
    email: "ana.rodriguez@empresa.com",
    sucursal: "Este",
    puesto: "Operador",
    estado: "Inactivo",
  },
  {
    id: 5,
    nombre: "Roberto Díaz",
    email: "roberto.diaz@empresa.com",
    sucursal: "Centro",
    puesto: "Administrador",
    estado: "Activo",
  },
]

export const DEVICES = [
  { id: 1, modelo: 'MacBook Pro 15"', serial: "SN-001234", tipo: "Laptop", estado: "Asignado", sucursal: "Centro" },
  { id: 2, modelo: "iPhone 14 Pro", serial: "SN-005678", tipo: "Teléfono", estado: "En Stock", sucursal: "Centro" },
  { id: 3, modelo: "iPad Air 5", serial: "SN-009012", tipo: "Tablet", estado: "Asignado", sucursal: "Norte" },
  { id: 4, modelo: "Dell XPS 13", serial: "SN-003456", tipo: "Laptop", estado: "Mantenimiento", sucursal: "Sur" },
  { id: 5, modelo: "Samsung Galaxy S23", serial: "SN-007890", tipo: "Teléfono", estado: "Asignado", sucursal: "Este" },
]

export const ASSIGNMENTS = [
  { id: 1, empleado: "Juan Pérez", dispositivo: 'MacBook Pro 15"', fecha: "2024-01-15", estado: "Activa" },
  { id: 2, empleado: "María García", dispositivo: "iPhone 14 Pro", fecha: "2024-01-20", estado: "Activa" },
  { id: 3, empleado: "Carlos López", dispositivo: "iPad Air 5", fecha: "2024-02-01", estado: "Pendiente Devolución" },
  { id: 4, empleado: "Ana Rodríguez", dispositivo: "Dell XPS 13", fecha: "2023-12-10", estado: "Devuelto" },
  { id: 5, empleado: "Roberto Díaz", dispositivo: "Samsung Galaxy S23", fecha: "2024-02-05", estado: "Activa" },
]

export const BRANCHES = [
  { id: 1, nombre: "Centro", ubicacion: "Av. Principal 123", dispositivos: 85, empleados: 32 },
  { id: 2, nombre: "Norte", ubicacion: "Calle Norte 456", dispositivos: 68, empleados: 28 },
  { id: 3, nombre: "Sur", ubicacion: "Av. Sur 789", dispositivos: 92, empleados: 35 },
  { id: 4, nombre: "Este", ubicacion: "Calle Este 321", dispositivos: 97, empleados: 29 },
]

export const USERS = [
  { id: 1, nombre: "Admin System", email: "admin@empresa.com", rol: "Administrador", estado: "Activo" },
  { id: 2, nombre: "Gerente Centro", email: "gerente.centro@empresa.com", rol: "Gerente", estado: "Activo" },
  { id: 3, nombre: "Operador Norte", email: "operador.norte@empresa.com", rol: "Operador", estado: "Activo" },
  { id: 4, nombre: "Analista Sur", email: "analista.sur@empresa.com", rol: "Analista", estado: "Inactivo" },
  { id: 5, nombre: "Auditor Sistema", email: "auditor@empresa.com", rol: "Auditor", estado: "Activo" },
]

export const REPORTS_ASSIGNMENTS = [
  { mes: "Ene", asignaciones: 45 },
  { mes: "Feb", asignaciones: 52 },
  { mes: "Mar", asignaciones: 48 },
  { mes: "Abr", asignaciones: 61 },
  { mes: "May", asignaciones: 55 },
]

export const REPORTS_DEVICES = [
  { tipo: "Laptops", cantidad: 120 },
  { tipo: "Teléfonos", cantidad: 140 },
  { tipo: "Tablets", cantidad: 52 },
  { tipo: "SIM Cards", cantidad: 30 },
]

export const NAVIGATION = [
  { name: "Panel", href: "/dashboard", icon: "LayoutDashboard" },
  { name: "Empleados", href: "/dashboard/employees", icon: "Users" },
  { name: "Dispositivos", href: "/dashboard/devices", icon: "Package" },
  { name: "Asignaciones", href: "/dashboard/assignments", icon: "Zap" },
  { name: "Sucursales", href: "/dashboard/branches", icon: "Building2" },
  { name: "Reportes", href: "/dashboard/reports", icon: "BarChart3" },
  { name: "Usuarios", href: "/dashboard/users", icon: "Settings" },
]
