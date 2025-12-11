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
    unidadNegocio: "Operaciones",
    estado: "Activo",
  },
  {
    id: 2,
    nombre: "María García",
    email: "maria.garcia@empresa.com",
    sucursal: "Norte",
    puesto: "Analista",
    unidadNegocio: "Tecnología",
    estado: "Activo",
  },
  {
    id: 3,
    nombre: "Carlos López",
    email: "carlos.lopez@empresa.com",
    sucursal: "Sur",
    puesto: "Técnico",
    unidadNegocio: "Soporte Técnico",
    estado: "Activo",
  },
  {
    id: 4,
    nombre: "Ana Rodríguez",
    email: "ana.rodriguez@empresa.com",
    sucursal: "Este",
    puesto: "Operador",
    unidadNegocio: "Logística",
    estado: "Inactivo",
  },
  {
    id: 5,
    nombre: "Roberto Díaz",
    email: "roberto.diaz@empresa.com",
    sucursal: "Centro",
    puesto: "Administrador",
    unidadNegocio: "Administración",
    estado: "Activo",
  },
]

export const DEVICES = [
  { id: 1, modelo: 'MacBook Pro 15"', serial: "SN-001234", tipo: "Laptop", estado: "Asignado", sucursal: "Centro", empleadoAsignado: "Juan Pérez" },
  { id: 2, modelo: "iPhone 14 Pro", serial: "SN-005678", tipo: "Teléfono", estado: "En Stock", sucursal: "Centro", empleadoAsignado: null },
  { id: 3, modelo: "iPad Air 5", serial: "SN-009012", tipo: "Tablet", estado: "Asignado", sucursal: "Norte", empleadoAsignado: "María García" },
  { id: 4, modelo: "Dell XPS 13", serial: "SN-003456", tipo: "Laptop", estado: "Mantenimiento", sucursal: "Sur", empleadoAsignado: null },
  { id: 5, modelo: "Samsung Galaxy S23", serial: "SN-007890", tipo: "Teléfono", estado: "Asignado", sucursal: "Este", empleadoAsignado: "Carlos López" },
  { id: 6, modelo: 'MacBook Air 13"', serial: "SN-002345", tipo: "Laptop", estado: "En Stock", sucursal: "Centro", empleadoAsignado: null },
  { id: 7, modelo: "iPhone 13", serial: "SN-006789", tipo: "Teléfono", estado: "Asignado", sucursal: "Norte", empleadoAsignado: "Ana Rodríguez" },
  { id: 8, modelo: "Samsung Galaxy Tab S8", serial: "SN-010123", tipo: "Tablet", estado: "En Stock", sucursal: "Sur", empleadoAsignado: null },
  { id: 9, modelo: "Lenovo ThinkPad X1", serial: "SN-004567", tipo: "Laptop", estado: "Asignado", sucursal: "Este", empleadoAsignado: "Roberto Díaz" },
  { id: 10, modelo: "iPhone 12", serial: "SN-008901", tipo: "Teléfono", estado: "Mantenimiento", sucursal: "Centro", empleadoAsignado: null },
  { id: 11, modelo: "iPad Pro 11", serial: "SN-011234", tipo: "Tablet", estado: "Asignado", sucursal: "Norte", empleadoAsignado: "Juan Pérez" },
  { id: 12, modelo: 'HP Pavilion 15"', serial: "SN-005678", tipo: "Laptop", estado: "En Stock", sucursal: "Sur", empleadoAsignado: null },
  { id: 13, modelo: "Samsung Galaxy A54", serial: "SN-009012", tipo: "Teléfono", estado: "Asignado", sucursal: "Este", empleadoAsignado: "María García" },
  { id: 14, modelo: "SIM Movistar", serial: "SIM-001234", tipo: "SIM Card", estado: "Asignado", sucursal: "Centro", empleadoAsignado: "Juan Pérez" },
  { id: 15, modelo: "SIM Claro", serial: "SIM-005678", tipo: "SIM Card", estado: "En Stock", sucursal: "Norte", empleadoAsignado: null },
  { id: 16, modelo: "SIM Entel", serial: "SIM-009012", tipo: "SIM Card", estado: "Asignado", sucursal: "Sur", empleadoAsignado: "Carlos López" },
  { id: 17, modelo: "Dell Latitude 7420", serial: "SN-006789", tipo: "Laptop", estado: "Asignado", sucursal: "Centro", empleadoAsignado: "Ana Rodríguez" },
  { id: 18, modelo: "iPhone SE", serial: "SN-010123", tipo: "Teléfono", estado: "En Stock", sucursal: "Norte", empleadoAsignado: null },
  { id: 19, modelo: "iPad Mini 6", serial: "SN-012345", tipo: "Tablet", estado: "Mantenimiento", sucursal: "Este", empleadoAsignado: null },
  { id: 20, modelo: "Asus ZenBook", serial: "SN-007890", tipo: "Laptop", estado: "En Stock", sucursal: "Sur", empleadoAsignado: null },
]

export const ASSIGNMENTS = [
  { id: 1, empleado: "Juan Pérez", dispositivo: 'MacBook Pro 15"', fecha: "2024-01-15", estado: "Activa" },
  { id: 2, empleado: "María García", dispositivo: "iPhone 14 Pro", fecha: "2024-01-20", estado: "Activa" },
  { id: 3, empleado: "Carlos López", dispositivo: "iPad Air 5", fecha: "2024-02-01", estado: "Pendiente Devolución" },
  { id: 4, empleado: "Ana Rodríguez", dispositivo: "Dell XPS 13", fecha: "2023-12-10", estado: "Devuelto" },
  { id: 5, empleado: "Roberto Díaz", dispositivo: "Samsung Galaxy S23", fecha: "2024-02-05", estado: "Activa" },
]

export const BRANCHES = [
  {
    id: 1,
    nombre: "Centro",
    ubicacion: "Av. Principal 123",
    dispositivos: 85,
    empleados: 32,
    detalleDispositivos: {
      laptops: 30,
      telefonos: 35,
      tablets: 15,
      simCards: 5,
    },
  },
  {
    id: 2,
    nombre: "Norte",
    ubicacion: "Calle Norte 456",
    dispositivos: 68,
    empleados: 28,
    detalleDispositivos: {
      laptops: 25,
      telefonos: 28,
      tablets: 10,
      simCards: 5,
    },
  },
  {
    id: 3,
    nombre: "Sur",
    ubicacion: "Av. Sur 789",
    dispositivos: 92,
    empleados: 35,
    detalleDispositivos: {
      laptops: 35,
      telefonos: 38,
      tablets: 14,
      simCards: 5,
    },
  },
  {
    id: 4,
    nombre: "Este",
    ubicacion: "Calle Este 321",
    dispositivos: 97,
    empleados: 29,
    detalleDispositivos: {
      laptops: 30,
      telefonos: 39,
      tablets: 13,
      simCards: 15,
    },
  },
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
  { name: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { name: "Empleados", href: "/dashboard/employees", icon: "Users" },
  { name: "Dispositivos", href: "/dashboard/devices", icon: "Tablet" },
  { name: "Asignaciones", href: "/dashboard/assignments", icon: "Zap" },
  { name: "Inventario", href: "/dashboard/inventory", icon: "Package" },
  { name: "Sucursales", href: "/dashboard/branches", icon: "Building2" },
  { name: "Reportes", href: "/dashboard/reports", icon: "BarChart3" },
  { name: "Usuarios", href: "/dashboard/users", icon: "Settings" },
]
