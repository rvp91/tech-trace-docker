# TechTrace - Arquitectura del Sistema
## Sistema de Gestion de Inventario de Dispositivos Moviles

**Version:** 1.2
**Ultima actualizacion:** Noviembre 6, 2025
**Estado:** En Desarrollo - Fase 8 Completada (Módulo de Sucursales)

---

## 1. Vision General de la Arquitectura

TechTrace es una aplicacion web full-stack con arquitectura cliente-servidor, implementando un patron de separacion clara entre frontend (Next.js) y backend (Django REST API).

```

              Cliente (Navegador)

    Next.js 16 + React 19 + TypeScript
    - Zustand (Estado Global)
    - shadcn/ui (Componentes UI)
    - Tailwind CSS (Estilos)
                  |
                  v
                     HTTP/REST + JWT
                  |
                  v
              Servidor Backend

    Django 5.2.7 + DRF
    - JWT Authentication
    - Django ORM
    - CORS Enabled
                  |
                  v
                  |
                  v
         SQLite Database (Desarrollo)

```

---

## 2. Esquema de Base de Datos

### 2.1 Diagrama Entidad-Relacion

```

    User                   Branch                  Employee
    +-------------+        +-------------+         +----------------+
    | id (PK)     |        | id (PK)     |         | id (PK)        |
    | username    |        | nombre      |         | rut (UNIQUE)   |
    | email       |        | codigo      |         | nombre         |
    | password    |        | direccion   |         | cargo          |
    | first_name  |        | ciudad      |         | correo_corp    |
    | last_name   |        | is_active   |    +--->| sucursal_id    |
    | role        |        | created_at  |    |    | unidad_neg     |
    | is_active   |        | updated_at  |----+    | estado         |
    | created_at  |        +-------------+         | created_at     |
    +-------------+                                | updated_at     |
                                                   | created_by     |
                                                   +----------------+
                                                          |
                                                          |
                                                          v
                            Device
                            +------------------+
                            | id (PK)          |
                            | tipo_equipo      |
                            | marca            |
                            | modelo           |
                            | serie_imei       | <----+
                            | num_telefono     |      |
                            | num_factura      |      |
                            | estado           |      |
                            | sucursal_id      |      |
                            | fecha_ing        |      |
                            | created_at       |      |
                            | updated_at       |      |
                            | created_by       |      |
                            +------------------+      |
                                  |                   |
                                  |                   |
                                  v                   |
                            Request                   |
                            +------------------+      |
                            | id (PK)          |      |
                            | empleado_id      |------+
                            | jefatura         |
                            | tipo_disp        |
                            | justificacion    |
                            | fecha_sol        |
                            | estado           |
                            | created_by       |
                            | created_at       |
                            | updated_at       |
                            +------------------+
                                  |
                                  |
                                  v
                           Assignment
                           +-------------------+
                           | id (PK)           |
                           | solicitud_id      |
                           | empleado_id       |------+
                           | dispositivo       |<-----+
                           | tipo_entrega      |
                           | fecha_entrega     |
                           | fecha_devol       |
                           | estado_carta      |
                           | estado_asig       |
                           | observaciones     |
                           | created_by        |
                           | created_at        |
                           | updated_at        |
                           +-------------------+
                                 |
                                 |
                                 v
                             Return
                             +------------------+
                             | id (PK)          |
                             | asignacion       |
                             | fecha_devol      |
                             | estado_disp      |
                             | observaciones    |
                             | created_by       |
                             | created_at       |
                             +------------------+


                            AuditLog
                            +------------------+
                            | id (PK)          |
                            | user_id          |
                            | action           |
                            | entity_type      |
                            | entity_id        |
                            | changes (JSON)   |
                            | timestamp        |
                            +------------------+
```

### 2.2 Definicion de Tablas

#### Tabla: auth_user (Django User extendido)
```sql
CREATE TABLE auth_user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(150) UNIQUE NOT NULL,
    email VARCHAR(254) NOT NULL,
    password VARCHAR(128) NOT NULL,
    first_name VARCHAR(150),
    last_name VARCHAR(150),
    is_active BOOLEAN DEFAULT TRUE,
    is_staff BOOLEAN DEFAULT FALSE,
    is_superuser BOOLEAN DEFAULT FALSE,
    date_joined DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,

    -- Campo personalizado
    role VARCHAR(20) DEFAULT 'OPERADOR',
    -- Opciones: 'ADMIN', 'OPERADOR'

    CONSTRAINT chk_role CHECK (role IN ('ADMIN', 'OPERADOR'))
);
```

#### Tabla: branches_branch
```sql
CREATE TABLE branches_branch (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    direccion TEXT,
    ciudad VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Tabla: employees_employee
```sql
CREATE TABLE employees_employee (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rut VARCHAR(12) UNIQUE NOT NULL,
    nombre_completo VARCHAR(200) NOT NULL,
    cargo VARCHAR(100) NOT NULL,
    correo_corporativo VARCHAR(254),
    gmail_personal VARCHAR(254),
    telefono VARCHAR(20),
    sucursal_id INTEGER NOT NULL,
    unidad_negocio VARCHAR(100),
    estado VARCHAR(20) DEFAULT 'ACTIVO',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by_id INTEGER NOT NULL,

    FOREIGN KEY (sucursal_id) REFERENCES branches_branch(id),
    FOREIGN KEY (created_by_id) REFERENCES auth_user(id),
    CONSTRAINT chk_estado CHECK (estado IN ('ACTIVO', 'INACTIVO'))
);
```

#### Tabla: devices_device
```sql
CREATE TABLE devices_device (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo_equipo VARCHAR(20) NOT NULL,
    marca VARCHAR(50) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    serie_imei VARCHAR(100) UNIQUE NOT NULL,
    numero_telefono VARCHAR(20),
    numero_factura VARCHAR(50),
    estado VARCHAR(20) DEFAULT 'DISPONIBLE',
    sucursal_id INTEGER NOT NULL,
    fecha_ingreso DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by_id INTEGER NOT NULL,

    FOREIGN KEY (sucursal_id) REFERENCES branches_branch(id),
    FOREIGN KEY (created_by_id) REFERENCES auth_user(id),
    CONSTRAINT chk_tipo CHECK (tipo_equipo IN ('LAPTOP', 'TELEFONO', 'TABLET', 'SIM', 'ACCESORIO')),
    CONSTRAINT chk_estado CHECK (estado IN ('DISPONIBLE', 'ASIGNADO', 'MANTENIMIENTO', 'BAJA', 'ROBO'))
);
```

#### Tabla: assignments_request
```sql
CREATE TABLE assignments_request (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empleado_id INTEGER NOT NULL,
    jefatura_solicitante VARCHAR(200) NOT NULL,
    tipo_dispositivo VARCHAR(20) NOT NULL,
    justificacion TEXT,
    fecha_solicitud DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) DEFAULT 'PENDIENTE',
    created_by_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (empleado_id) REFERENCES employees_employee(id),
    FOREIGN KEY (created_by_id) REFERENCES auth_user(id),
    CONSTRAINT chk_estado CHECK (estado IN ('PENDIENTE', 'APROBADA', 'RECHAZADA', 'COMPLETADA'))
);
```

#### Tabla: assignments_assignment
```sql
CREATE TABLE assignments_assignment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    solicitud_id INTEGER,
    empleado_id INTEGER NOT NULL,
    dispositivo_id INTEGER NOT NULL,
    tipo_entrega VARCHAR(20) NOT NULL,
    fecha_entrega DATE NOT NULL,
    fecha_devolucion DATE,
    estado_carta VARCHAR(20) DEFAULT 'PENDIENTE',
    estado_asignacion VARCHAR(20) DEFAULT 'ACTIVA',
    observaciones TEXT,
    created_by_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (solicitud_id) REFERENCES assignments_request(id),
    FOREIGN KEY (empleado_id) REFERENCES employees_employee(id),
    FOREIGN KEY (dispositivo_id) REFERENCES devices_device(id),
    FOREIGN KEY (created_by_id) REFERENCES auth_user(id),
    CONSTRAINT chk_tipo_entrega CHECK (tipo_entrega IN ('PERMANENTE', 'TEMPORAL')),
    CONSTRAINT chk_estado_carta CHECK (estado_carta IN ('FIRMADA', 'PENDIENTE', 'NO_APLICA')),
    CONSTRAINT chk_estado_asig CHECK (estado_asignacion IN ('ACTIVA', 'FINALIZADA'))
);
```

#### Tabla: assignments_return
```sql
CREATE TABLE assignments_return (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asignacion_id INTEGER NOT NULL,
    fecha_devolucion DATE NOT NULL,
    estado_dispositivo VARCHAR(20) NOT NULL,
    observaciones TEXT,
    created_by_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (asignacion_id) REFERENCES assignments_assignment(id),
    FOREIGN KEY (created_by_id) REFERENCES auth_user(id),
    CONSTRAINT chk_estado_disp CHECK (estado_dispositivo IN ('OPTIMO', 'CON_DANOS', 'NO_FUNCIONAL'))
);
```

#### Tabla: users_auditlog
```sql
CREATE TABLE users_auditlog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action VARCHAR(10) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER NOT NULL,
    changes TEXT, -- JSON
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES auth_user(id),
    CONSTRAINT chk_action CHECK (action IN ('CREATE', 'UPDATE', 'DELETE'))
);
```

### 2.3 Indices Recomendados

```sql
-- Busquedas frecuentes
CREATE INDEX idx_employee_rut ON employees_employee(rut);
CREATE INDEX idx_device_serie ON devices_device(serie_imei);
CREATE INDEX idx_device_estado ON devices_device(estado);
CREATE INDEX idx_assignment_estado ON assignments_assignment(estado_asignacion);
CREATE INDEX idx_employee_estado ON employees_employee(estado);

-- Relaciones y joins
CREATE INDEX idx_employee_sucursal ON employees_employee(sucursal_id);
CREATE INDEX idx_device_sucursal ON devices_device(sucursal_id);
CREATE INDEX idx_assignment_empleado ON assignments_assignment(empleado_id);
CREATE INDEX idx_assignment_dispositivo ON assignments_assignment(dispositivo_id);

-- Auditoria
CREATE INDEX idx_audit_timestamp ON users_auditlog(timestamp);
CREATE INDEX idx_audit_entity ON users_auditlog(entity_type, entity_id);
```

---

## 3. Estructura del Backend (Django)

### 3.1 Directorio del Proyecto

```
backend/
├── config/                      # Configuracion de Django
│   ├── __init__.py
│   ├── settings.py             # Settings con dotenv, CORS, DRF, JWT
│   ├── urls.py                 # URLs principales + api/
│   ├── wsgi.py
│   └── asgi.py
│
├── apps/                        # Django apps del proyecto
│   ├── users/                   # Autenticacion y usuarios
│   │   ├── __init__.py
│   │   ├── models.py           # User extendido
│   │   ├── serializers.py      # UserSerializer
│   │   ├── views.py            # Login, Logout, CurrentUser
│   │   ├── permissions.py      # IsAdmin, IsAdminOrReadOnly
│   │   ├── urls.py             # /api/auth/
│   │   ├── admin.py
│   │   ├── apps.py
│   │   └── audit.py            # Modelo AuditLog
│   │
│   ├── branches/                # Gestion de sucursales
│   │   ├── __init__.py
│   │   ├── models.py           # Branch
│   │   ├── serializers.py      # BranchSerializer
│   │   ├── views.py            # BranchViewSet
│   │   ├── urls.py             # /api/branches/
│   │   ├── admin.py
│   │   └── apps.py
│   │
│   ├── employees/               # Gestion de empleados
│   │   ├── __init__.py
│   │   ├── models.py           # Employee
│   │   ├── serializers.py      # EmployeeSerializer
│   │   ├── views.py            # EmployeeViewSet + history
│   │   ├── validators.py       # validate_rut
│   │   ├── urls.py             # /api/employees/
│   │   ├── admin.py
│   │   └── apps.py
│   │
│   ├── devices/                 # Gestion de dispositivos
│   │   ├── __init__.py
│   │   ├── models.py           # Device
│   │   ├── serializers.py      # DeviceSerializer
│   │   ├── views.py            # DeviceViewSet + history + StatsViewSet
│   │   ├── urls.py             # /api/devices/ + /api/stats/
│   │   ├── admin.py
│   │   └── apps.py
│   │
│   └── assignments/             # Gestion de asignaciones
│       ├── __init__.py
│       ├── models.py           # Request, Assignment, Return
│       ├── serializers.py      # RequestSerializer, AssignmentSerializer, ReturnSerializer
│       ├── views.py            # RequestViewSet, AssignmentViewSet, ReturnViewSet
│       ├── signals.py          # Senales para cambio de estado automatico
│       ├── urls.py             # /api/assignments/
│       ├── admin.py
│       └── apps.py
│
├── manage.py
├── requirements.txt            # Dependencias Python
├── .env                        # Variables de entorno (no versionado)
├── .env.example                # Template de variables
├── .gitignore
└── db.sqlite3                  # Base de datos SQLite
```

### 3.2 Configuracion de Settings

**Variables de entorno requeridas:**
- `SECRET_KEY`: Clave secreta de Django
- `DEBUG`: True/False
- `ALLOWED_HOSTS`: localhost,127.0.0.1
- `CORS_ALLOWED_ORIGINS`: http://localhost:3000,http://127.0.0.1:3000
- `LANGUAGE_CODE`: es-cl
- `TIME_ZONE`: America/Santiago

**INSTALLED_APPS incluye:**
- Apps de Django estandar
- `rest_framework`
- `rest_framework_simplejwt`
- `corsheaders`
- `apps.users`
- `apps.branches`
- `apps.employees`
- `apps.devices`
- `apps.assignments`

**REST_FRAMEWORK settings:**
```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}
```

**SIMPLE_JWT settings:**
```python
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=2),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}
```

---

## 4. Estructura del Frontend (Next.js)

### 4.1 Directorio del Proyecto

```
frontend/
├── app/                         # Next.js App Router
│   ├── layout.tsx              # Layout raiz (importa Providers)
│   ├── page.tsx                # Landing page (redirige a /dashboard o /login)
│   ├── providers.tsx           # Global providers (AuthProvider + Toaster)
│   ├── globals.css             # Estilos globales + Tailwind
│   │
│   ├── login/                  # Pagina de login (publica)
│   │   └── page.tsx            # Formulario de autenticacion con manejo de errores
│   │
│   └── dashboard/              # Aplicacion principal (protegida por middleware)
│       ├── layout.tsx          # Layout con Sidebar + Header
│       ├── page.tsx            # Dashboard home con estadisticas
│       │
│       ├── devices/            # Modulo de dispositivos
│       │   ├── page.tsx        # Listado de dispositivos
│       │   └── [id]/
│       │       └── page.tsx    # Detalle de dispositivo
│       │
│       ├── employees/          # Modulo de empleados
│       │   ├── page.tsx        # Listado de empleados
│       │   └── [id]/
│       │       └── page.tsx    # Detalle de empleado
│       │
│       ├── branches/           # Modulo de sucursales
│       │   └── page.tsx        # Listado de sucursales
│       │
│       ├── assignments/        # Modulo de asignaciones
│       │   ├── page.tsx        # Listado de asignaciones
│       │   ├── requests/
│       │   │   └── page.tsx    # Listado de solicitudes
│       │   └── [id]/
│       │       └── page.tsx    # Detalle de asignacion
│       │
│       ├── reports/            # Modulo de reportes
│       │   └── page.tsx        # Inventarios y reportes
│       │
│       └── users/              # Modulo de usuarios (solo Admin)
│           └── page.tsx        # Gestion de usuarios
│
├── components/
│   ├── ui/                     # Componentes shadcn/ui
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   ├── toast.tsx
│   │   ├── alert.tsx
│   │   ├── label.tsx
│   │   ├── card.tsx
│   │   └── ...
│   │
│   ├── providers/              # React Context Providers
│   │   └── auth-provider.tsx  # Inicializa sincronizacion de auth al cargar
│   │
│   ├── layout/                 # Componentes de layout
│   │   ├── sidebar.tsx         # Navegacion lateral con logout
│   │   ├── header.tsx          # Barra superior con perfil y logout
│   │   └── theme-toggle.tsx
│   │
│   └── modals/                 # Modales de creacion/edicion
│       ├── device-modal.tsx
│       ├── employee-modal.tsx
│       ├── branch-modal.tsx
│       ├── assignment-modal.tsx
│       ├── request-modal.tsx
│       ├── return-modal.tsx
│       └── user-modal.tsx
│
├── lib/
│   ├── api-client.ts           # Cliente HTTP centralizado con Bearer token
│   │                           # - Metodos: get, post, put, delete
│   │                           # - Sincronizacion automatica con auth-store
│   │                           # - Manejo de errores HTTP
│   │
│   ├── store/                  # Zustand stores
│   │   └── auth-store.ts       # Estado global de autenticacion
│   │                           # - Persist en localStorage (key: techtrace-auth)
│   │                           # - Sincroniza tokens con api-client
│   │                           # - Gestiona cookies para middleware
│   │                           # - Actions: setAuth, clearAuth, updateUser, initializeAuth
│   │
│   ├── services/               # Servicios API (capa de abstraccion)
│   │   ├── auth-service.ts     # Autenticacion: login, logout, getCurrentUser, refreshToken
│   │   ├── branch-service.ts   # CRUD sucursales
│   │   ├── employee-service.ts # CRUD empleados + history
│   │   ├── device-service.ts   # CRUD dispositivos + history
│   │   ├── assignment-service.ts # CRUD asignaciones/solicitudes/devoluciones
│   │   ├── user-service.ts     # CRUD usuarios
│   │   └── dashboard-service.ts # Estadisticas del dashboard
│   │
│   ├── utils/                  # Utilidades
│   │   └── export-csv.ts       # Funcion para exportar CSV
│   │
│   ├── types.ts                # Tipos TypeScript globales
│   │                           # - User, UserRole ("ADMIN" | "OPERADOR")
│   │                           # - AuthState, LoginResponse
│   │                           # - Employee, Device, Branch, Assignment, etc.
│   │
│   ├── constants.ts            # Constantes de la app
│   ├── validations.ts          # Schemas de validacion (Zod)
│   ├── utils.ts                # Utilidades generales (cn, formatters)
│   └── mock-data.ts            # Datos mock para desarrollo
│
├── public/                     # Archivos estaticos
├── styles/                     # Estilos adicionales
├── hooks/                      # Custom hooks
│
├── middleware.ts               # Middleware de Next.js para proteccion de rutas
│                               # - Verifica cookie "techtrace-auth"
│                               # - Redirige /dashboard → /login si no autenticado
│                               # - Redirige /login → /dashboard si autenticado
│                               # - Redirige / → /dashboard o /login segun estado
├── package.json
├── tsconfig.json               # Path alias @/*
├── tailwind.config.ts
├── components.json             # Config shadcn/ui
├── next.config.mjs
└── .env.local                  # Variables de entorno
```

### 4.2 Flujo de Autenticacion

#### 4.2.1 Login Flow

```
┌─────────────────┐
│   /login        │
│   page.tsx      │
└────────┬────────┘
         │
         │ 1. Usuario ingresa credenciales (username, password)
         │    y hace submit del formulario
         v
┌────────────────────────────┐
│  auth-service.ts           │
│  login(credentials)        │
└────────┬───────────────────┘
         │
         │ 2. POST /api/auth/login/
         │    { username, password }
         v
┌────────────────────────────┐
│  ApiClient                 │
│  post(endpoint, data)      │
└────────┬───────────────────┘
         │
         │ 3. fetch() al backend
         │    Content-Type: application/json
         v
┌────────────────────────────┐
│  Backend Django            │
│  CustomTokenObtainPairView │
│  (simplejwt)               │
└────────┬───────────────────┘
         │
         │ 4. Valida credenciales y retorna:
         │    {
         │      access: "jwt_access_token",
         │      refresh: "jwt_refresh_token",
         │      user: { id, username, email, role, ... }
         │    }
         v
┌────────────────────────────┐
│  /login page.tsx           │
│  handleSubmit()            │
└────────┬───────────────────┘
         │
         │ 5. Llama a auth-store.setAuth()
         v
┌────────────────────────────┐
│  auth-store.ts             │
│  setAuth(user, access,     │
│          refresh)          │
└────────┬───────────────────┘
         │
         │ 6. Sincroniza estado:
         │    - Guarda en localStorage (persist)
         │      key: 'techtrace-auth'
         │    - Llama apiClient.setToken(access)
         │    - Crea cookie: techtrace-auth=true
         │      (para middleware)
         │    - Actualiza: isAuthenticated = true
         v
┌────────────────────────────┐
│  Next.js Router            │
│  router.push('/dashboard') │
└────────────────────────────┘
```

#### 4.2.2 Logout Flow

```
┌─────────────────┐
│  Header.tsx o   │
│  Sidebar.tsx    │
│  (botón logout) │
└────────┬────────┘
         │
         │ 1. Usuario hace clic en "Cerrar Sesión"
         v
┌────────────────────────────┐
│  handleLogout()            │
│  - Lee refreshToken del    │
│    auth-store              │
└────────┬───────────────────┘
         │
         │ 2. Llama auth-service.logout(refreshToken)
         v
┌────────────────────────────┐
│  auth-service.ts           │
│  logout(refreshToken)      │
└────────┬───────────────────┘
         │
         │ 3. POST /api/auth/logout/
         │    { refresh_token: "..." }
         │    (Bearer token en header)
         v
┌────────────────────────────┐
│  Backend Django            │
│  LogoutView                │
└────────┬───────────────────┘
         │
         │ 4. Agrega refresh token a blacklist
         │    (invalida el token en servidor)
         v
┌────────────────────────────┐
│  auth-store.ts             │
│  clearAuth()               │
└────────┬───────────────────┘
         │
         │ 5. Limpia estado:
         │    - localStorage.removeItem()
         │    - apiClient.setToken(null)
         │    - Elimina cookie techtrace-auth
         │    - Actualiza: isAuthenticated = false
         v
┌────────────────────────────┐
│  Next.js Router            │
│  router.push('/login')     │
└────────────────────────────┘
```

#### 4.2.3 Proteccion de Rutas (Middleware)

```
┌─────────────────┐
│  Usuario accede │
│  a cualquier    │
│  ruta           │
└────────┬────────┘
         │
         v
┌────────────────────────────┐
│  middleware.ts             │
│  (Next.js middleware)      │
└────────┬───────────────────┘
         │
         │ Lee cookie: techtrace-auth
         │
         ├─> Cookie existe?
         │
    NO   │   SI
         v   v
    ┌────┴───┴────┐
    │             │
    │   Ruta:     │   Ruta:
    │   /dashboard│   /login
    │             │
    v             v
  Redirect      Redirect
  to /login     to /dashboard
    │             │
    │   Ruta:     │   Ruta:
    │   /login    │   /dashboard
    │             │
    v             v
  Permitir      Permitir
  acceso        acceso
```

#### 4.2.4 Inicializacion de Auth al Cargar App

```
┌─────────────────┐
│  App carga      │
│  layout.tsx     │
└────────┬────────┘
         │
         v
┌────────────────────────────┐
│  Providers                 │
│  (app/providers.tsx)       │
└────────┬───────────────────┘
         │
         v
┌────────────────────────────┐
│  AuthProvider              │
│  (components/providers/    │
│   auth-provider.tsx)       │
└────────┬───────────────────┘
         │
         │ useEffect en mount
         v
┌────────────────────────────┐
│  auth-store.initializeAuth()│
└────────┬───────────────────┘
         │
         │ 1. Lee estado de localStorage
         │    (persist de Zustand)
         │
         │ 2. Si existe token:
         │    - Sincroniza con apiClient
         │      apiClient.setToken(token)
         │
         v
┌────────────────────────────┐
│  App lista con auth        │
│  sincronizado              │
└────────────────────────────┘
```

### 4.3 Arquitectura de Autenticacion Frontend

#### Componentes Clave

1. **auth-store.ts** (Zustand Store)
   - Estado global de autenticacion
   - Persistencia automatica en localStorage (key: `techtrace-auth`)
   - Sincronizacion bidireccional con api-client
   - Gestion de cookies para middleware
   - **Actions:**
     - `setAuth(user, accessToken, refreshToken)`: Guarda tokens y usuario
     - `clearAuth()`: Limpia todo el estado de autenticacion
     - `updateUser(user)`: Actualiza datos del usuario
     - `initializeAuth()`: Sincroniza tokens al cargar la app

2. **api-client.ts** (Cliente HTTP)
   - Singleton que maneja todas las peticiones HTTP
   - Agrega automaticamente Bearer token a los headers
   - Se sincroniza con auth-store para tener siempre el token actualizado
   - **Metodos:** `get()`, `post()`, `put()`, `delete()`
   - Manejo centralizado de errores HTTP

3. **auth-service.ts** (Capa de Servicio)
   - Abstraccion para operaciones de autenticacion
   - **Funciones:**
     - `login(credentials)`: Autentica usuario y retorna tokens + user
     - `logout(refreshToken)`: Invalida refresh token en servidor
     - `getCurrentUser()`: Obtiene datos del usuario actual
     - `refreshToken(refreshToken)`: Renueva access token

4. **middleware.ts** (Next.js Middleware)
   - Se ejecuta en el servidor antes de renderizar cualquier ruta
   - Verifica cookie `techtrace-auth` (no puede leer localStorage)
   - Redirige rutas protegidas si no hay autenticacion
   - Redirige /login a /dashboard si ya esta autenticado

5. **auth-provider.tsx** (React Context)
   - Wrapper que inicializa la autenticacion al cargar la app
   - Llama a `initializeAuth()` en useEffect
   - Asegura que el token este sincronizado entre store y api-client

#### Sincronizacion de Estado

**Tokens JWT:**
- **Access Token**: Vida corta (2 horas), usado en cada peticion API
- **Refresh Token**: Vida larga (7 dias), usado para renovar access token

**Almacenamiento:**
- **localStorage** (`techtrace-auth`): Estado completo del store (user + tokens)
  - Usado por: Zustand persist, api-client
  - Ventaja: Persistencia entre recargas
  - Desventaja: No accesible desde middleware (server-side)

- **Cookie** (`techtrace-auth`): Flag simple booleano
  - Usado por: middleware.ts
  - Ventaja: Accesible desde server-side (middleware)
  - Desventaja: No contiene el token JWT completo (solo indica autenticado)

**Flujo de Sincronizacion:**
```
setAuth() se ejecuta:
  1. Guarda en localStorage (Zustand persist automatico)
  2. Llama apiClient.setToken(accessToken)
  3. Crea cookie document.cookie = "techtrace-auth=true"
  4. Actualiza estado isAuthenticated = true

clearAuth() se ejecuta:
  1. Limpia localStorage
  2. Llama apiClient.setToken(null)
  3. Elimina cookie
  4. Actualiza estado isAuthenticated = false
```

### 4.4 Flujo de Peticiones API

```

 Componente React
 (ej: DeviceList)
      |
      |
      | 1. Llama a service
      |
      v

 device-service.ts
 getDevices()
      |
      |
      | 2. apiClient.get('/devices/')
      |
      v

 ApiClient
 - Lee token que fue
   seteado al login
 - Agrega header
   Authorization:
   Bearer {token}
      |
      |
      | 3. fetch() al backend
      |
      v

 Backend Django
 - JWT verifica token
 - Permisos check
 - Retorna JSON
      |
      |
      | 4. Respuesta
      |
      v

 Componente actualiza
 estado y UI

```

---

## 5. Seguridad

### 5.1 Autenticacion

**JWT (JSON Web Tokens):**
- Access token: 2 horas de duracion
- Refresh token: 7 dias de duracion
- Refresh token rotation: Habilitado
- Blacklist despues de rotacion: Habilitado (para mayor seguridad)
- Almacenamiento: localStorage (key: `techtrace-auth`)

**Recomendacion para produccion:**
- Migrar a cookies httpOnly para refresh tokens
- Implementar CSRF protection
- Rate limiting en endpoints de autenticacion

### 5.2 Autorizacion

**Roles del sistema:**
1. **ADMIN**: Acceso total
   - CRUD completo de todas las entidades
   - Gestion de usuarios
   - Acceso a auditoria
   - Eliminacion de registros

2. **OPERADOR**: Acceso limitado
   - Lectura de todas las entidades
   - Creacion y edicion de: dispositivos, empleados, asignaciones
   - NO puede eliminar registros
   - NO puede gestionar usuarios
   - NO puede modificar auditoria

**Implementacion:**
- Permisos a nivel de ViewSet (DRF)
- Clases personalizadas: `IsAdmin`, `IsAdminOrReadOnly`
- Validacion en cada endpoint

### 5.3 CORS

**Configuracion:**
```python
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]
CORS_ALLOW_CREDENTIALS = True
```

**Para produccion:**
- Agregar dominio de produccion a la lista
- Considerar CORS_ALLOWED_ORIGIN_REGEXES para subdominios

### 5.4 Validaciones

**Backend:**
- Validacion de RUT chileno (formato XX.XXX.XXX-X)
- Serie/IMEI unico
- Email valido
- Fechas coherentes (devolucion > entrega)
- Estados validos (mediante choices en modelos)

**Frontend:**
- Validacion con Zod schemas
- Validacion en tiempo real
- Mensajes de error especificos

### 5.5 Auditoria

**Registro automatico:**
- Todas las operaciones CREATE, UPDATE, DELETE
- Usuario que realizo la accion
- Timestamp
- Cambios realizados (JSON)
- Entidad afectada

**Implementacion:**
- Senales post_save y post_delete
- Modelo AuditLog inmutable
- Solo lectura para Admins

---

## 6. Flujos de Negocio Principales

### 6.1 Flujo de Asignacion de Dispositivo

```

 1. Solicitud
 (Opcional)
 - Empleado
 - Tipo disp
 - Justificacion
 Estado: PEND
       |
       |
       v

 2. Asignacion
 - Empleado
 - Dispositivo
   (DISPONIBLE)
 - Tipo entrega
 - Fecha
       |
       |
       | Automatico:
       | - Device.estado -> ASIGNADO
       | - Request.estado -> COMPLETADA (si existe)
       | - Assignment.estado -> ACTIVA
       |
       v

 3. Devolucion
 - Fecha devol
 - Estado disp
 - Observaciones
       |
       |
       | Automatico:
       | - Assignment.estado -> FINALIZADA
       | - Device.estado ->
       |   * OPTIMO -> DISPONIBLE
       |   * CON_DANOS/NO_FUNC -> MANTENIMIENTO
       |
       v

 Dispositivo
 disponible para
 nueva asignacion

```

### 6.2 Flujo de Busqueda y Filtrado

```
Usuario escribe en campo busqueda
        |
        v
Debounce 300ms
        |
        v
Peticion al backend con params:
- search=texto
- tipo_equipo=LAPTOP
- estado=DISPONIBLE
- sucursal=1
        |
        v
Backend filtra con QuerySet
        |
        v
Retorna resultados paginados
(20 items por pagina)
        |
        v
Frontend actualiza tabla
```

---

## 7. Performance y Optimizaciones

### 7.1 Backend

**Indices de base de datos:**
- Todos los campos de busqueda frecuente
- Foreign keys
- Campos de filtrado

**Paginacion:**
- 20 items por pagina por defecto
- Configurable en settings

**Query Optimization:**
- select_related() para ForeignKeys
- prefetch_related() para relaciones inversas
- Evitar N+1 queries

### 7.2 Frontend

**Caching:**
- SWR para peticiones GET
- Revalidacion automatica
- Cache en memoria del navegador

**Debouncing:**
- Busquedas en tiempo real: 300ms
- Evita peticiones innecesarias

**Code Splitting:**
- Lazy loading de componentes pesados
- Dynamic imports para modales
- Optimizacion automatica de Next.js

**Optimizacion de Assets:**
- Componente Image de Next.js
- Iconos optimizados (lucide-react)
- Tailwind CSS purgado en produccion

---

## 8. Monitoreo y Logs

### 8.1 Auditoria de Operaciones

**Modelo AuditLog registra:**
- Todas las operaciones CRUD
- Usuario responsable
- Timestamp
- Cambios (JSON diff)

**Acceso:**
- Django Admin para Admins
- Endpoint API (solo lectura, Admin)

### 8.2 Logs de Django

**Configuracion recomendada:**
```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs/django.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}
```

---

## 9. Módulos Funcionales Implementados

Esta sección documenta la arquitectura y funcionamiento de cada módulo funcional del sistema.

### 9.1 Módulo de Sucursales (Branches)

**Estado:** ✅ Completado (Fase 8)

#### 9.1.1 Backend - Estructura de Archivos

```
backend/apps/branches/
├── models.py          # Modelo Branch con campos base
├── serializers.py     # BranchSerializer con estadísticas calculadas
├── views.py           # BranchViewSet con CRUD completo
├── urls.py            # Router de DRF
├── admin.py           # Configuración de Django Admin
└── apps.py            # Configuración de la app
```

**Modelo Branch (`models.py`):**
```python
class Branch(models.Model):
    nombre = CharField(max_length=100)           # Nombre de la sucursal
    codigo = CharField(max_length=20, unique=True)  # Código único (ej: SCL-01)
    direccion = TextField(blank=True, null=True)    # Dirección física
    ciudad = CharField(max_length=100)              # Ciudad
    is_active = BooleanField(default=True)          # Estado activo/inactivo
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
```

**Serializer con Estadísticas (`serializers.py`):**

El `BranchSerializer` extiende el modelo base con campos calculados dinámicamente:

- **`total_dispositivos`** (SerializerMethodField): Cuenta el total de dispositivos asociados a la sucursal usando `obj.device_set.count()`

- **`total_empleados`** (SerializerMethodField): Cuenta el total de empleados asociados usando `obj.employee_set.count()`

- **`dispositivos_por_tipo`** (SerializerMethodField): Retorna un diccionario con el desglose de dispositivos por tipo:
  ```python
  {
    'LAPTOP': 30,
    'TELEFONO': 35,
    'TABLET': 15,
    'SIM': 5,
    'ACCESORIO': 0
  }
  ```

  Implementación optimizada usando anotaciones de Django:
  ```python
  def get_dispositivos_por_tipo(self, obj):
      from django.db.models import Count
      dispositivos = obj.device_set.values('tipo_equipo').annotate(
          cantidad=Count('id')
      )
      # Retorna diccionario con todos los tipos inicializados en 0
      # y actualiza con valores reales
  ```

**ViewSet (`views.py`):**
```python
class BranchViewSet(viewsets.ModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active', 'ciudad']
    search_fields = ['nombre', 'codigo', 'ciudad', 'direccion']
    ordering_fields = ['nombre', 'codigo', 'ciudad', 'created_at']
    ordering = ['nombre']
```

**Endpoints disponibles:**
- `GET /api/branches/` - Lista todas las sucursales con estadísticas
- `GET /api/branches/?is_active=true` - Filtra solo sucursales activas
- `GET /api/branches/?search=santiago` - Búsqueda por texto
- `GET /api/branches/{id}/` - Detalle de una sucursal
- `POST /api/branches/` - Crear sucursal
- `PUT/PATCH /api/branches/{id}/` - Actualizar sucursal
- `DELETE /api/branches/{id}/` - Eliminar sucursal

#### 9.1.2 Frontend - Estructura de Archivos

```
frontend/
├── lib/
│   ├── types.ts                          # Interface Branch con estadísticas
│   └── services/
│       └── branch-service.ts             # Servicio API para sucursales
├── app/dashboard/branches/
│   └── page.tsx                          # Página principal del módulo
└── components/modals/
    └── branch-modal.tsx                  # Modal crear/editar
```

**Tipos TypeScript (`lib/types.ts`):**
```typescript
export interface Branch {
  id: number
  nombre: string
  codigo: string                    // Código único
  direccion?: string
  ciudad: string
  is_active: boolean                // Estado activo/inactivo
  created_at: string
  updated_at: string
  // Campos calculados por el backend:
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
```

**Servicio API (`lib/services/branch-service.ts`):**

Maneja toda la comunicación con el backend:

```typescript
export const branchService = {
  // Obtiene lista de sucursales (maneja paginación del backend)
  async getBranches(): Promise<Branch[]> {
    const response = await apiClient.get<BranchListResponse>("/branches/")
    return response.results  // Extrae results de respuesta paginada
  },

  // CRUD completo con tipos TypeScript
  async getBranch(id: number): Promise<Branch>
  async createBranch(data: CreateBranchData): Promise<Branch>
  async updateBranch(id: number, data: UpdateBranchData): Promise<Branch>
  async deleteBranch(id: number): Promise<void>

  // Filtro helper
  async getActiveBranches(): Promise<Branch[]>
}
```

**Página Principal (`app/dashboard/branches/page.tsx`):**

Componente principal del módulo con las siguientes responsabilidades:

1. **Gestión de Estado:**
   - `branches`: Array de sucursales
   - `loading`: Estado de carga
   - `editingBranch`: Sucursal en edición
   - `deletingBranch`: Sucursal a eliminar
   - `modalOpen`: Control del modal

2. **Carga de Datos:**
   ```typescript
   const loadBranches = async () => {
     try {
       setLoading(true)
       const data = await branchService.getBranches()
       setBranches(data)
     } catch (error) {
       toast({ variant: "destructive", ... })
     } finally {
       setLoading(false)
     }
   }
   ```

3. **Vista de Tarjetas (Cards):**
   - Grid responsive: 1 columna (móvil), 2 (tablet), 4 (desktop)
   - Cada tarjeta muestra:
     - Nombre y ciudad de la sucursal
     - Badge de estado (Activo/Inactivo)
     - Código de sucursal
     - **Total de dispositivos** (número grande destacado)
     - Desglose por tipo con iconos:
       - 💻 Laptops
       - 📱 Teléfonos
       - 📱 Tablets
       - 📇 SIM Cards (icono personalizado)
     - 👥 Total de empleados
     - Botones de editar y eliminar

4. **Estados de UI:**
   - **Loading**: Skeleton loaders animados (4 tarjetas)
   - **Empty**: Mensaje y botón para crear primera sucursal
   - **Loaded**: Grid con todas las sucursales

5. **Operaciones CRUD:**
   - **Crear**: Abre modal sin sucursal
   - **Editar**: Abre modal con datos pre-cargados
   - **Eliminar**: Muestra AlertDialog de confirmación

**Modal Crear/Editar (`components/modals/branch-modal.tsx`):**

Modal reutilizable con doble modo de uso:

1. **Modo Controlado** (usado en la página):
   ```typescript
   <BranchModal
     open={modalOpen}
     onOpenChange={setModalOpen}
     branch={editingBranch}  // null para crear, objeto para editar
     onSuccess={handleSuccess}
   />
   ```

2. **Modo No Controlado** (con DialogTrigger propio):
   ```typescript
   <BranchModal />  // Incluye botón "Nueva Sucursal"
   ```

**Características del Modal:**

- **Formulario Completo:**
  - Nombre (requerido)
  - Código (requerido, formato validado, no editable en modo edición)
  - Ciudad (requerida)
  - Dirección (opcional, textarea)
  - Estado activo (Switch con descripción)

- **Validaciones:**
  ```typescript
  validateForm(): boolean {
    - Campos requeridos no vacíos
    - Código con formato: /^[A-Z0-9-]+$/
    - Muestra errores específicos por campo
  }
  ```

- **Estados de Carga:**
  - Botón deshabilitado durante guardado
  - Spinner de carga (Loader2 icon)
  - Campos deshabilitados durante operación

- **Manejo de Errores:**
  - Errores de validación in-line
  - Errores de API con toast notification
  - Limpieza automática de errores al escribir

#### 9.1.3 Flujo de Datos

```
┌─────────────────────────────────────────────────────────┐
│  1. Usuario accede a /dashboard/branches               │
└────────────────┬────────────────────────────────────────┘
                 │
                 v
┌─────────────────────────────────────────────────────────┐
│  2. BranchesPage.useEffect() ejecuta loadBranches()    │
└────────────────┬────────────────────────────────────────┘
                 │
                 v
┌─────────────────────────────────────────────────────────┐
│  3. branchService.getBranches()                         │
│     → GET /api/branches/                                │
└────────────────┬────────────────────────────────────────┘
                 │
                 v
┌─────────────────────────────────────────────────────────┐
│  4. Backend: BranchViewSet                              │
│     - Query: Branch.objects.all()                       │
│     - Serializer calcula estadísticas por cada Branch:  │
│       * obj.device_set.count()                          │
│       * obj.employee_set.count()                        │
│       * Agrupa dispositivos por tipo                    │
└────────────────┬────────────────────────────────────────┘
                 │
                 v
┌─────────────────────────────────────────────────────────┐
│  5. Response JSON con estadísticas:                     │
│     {                                                   │
│       count: 3,                                         │
│       results: [                                        │
│         {                                               │
│           id: 1,                                        │
│           nombre: "Centro",                             │
│           total_dispositivos: 85,                       │
│           dispositivos_por_tipo: {                      │
│             LAPTOP: 30,                                 │
│             TELEFONO: 35, ...                           │
│           },                                            │
│           total_empleados: 32                           │
│         }                                               │
│       ]                                                 │
│     }                                                   │
└────────────────┬────────────────────────────────────────┘
                 │
                 v
┌─────────────────────────────────────────────────────────┐
│  6. Frontend actualiza estado y renderiza tarjetas     │
│     con estadísticas en tiempo real                     │
└─────────────────────────────────────────────────────────┘
```

#### 9.1.4 Optimizaciones Implementadas

**Backend:**
- ✅ Uso de `Count` de Django ORM para agregaciones eficientes
- ✅ Queries agrupadas para evitar N+1 queries
- ✅ Campos calculados en serializer (no en modelo)
- ✅ Filtros e índices en campos de búsqueda

**Frontend:**
- ✅ Skeleton loaders para feedback inmediato
- ✅ Estado de carga granular (no bloquea toda la UI)
- ✅ Toast notifications no invasivas
- ✅ Validación optimista (frontend + backend)
- ✅ Grid responsive con breakpoints optimizados
- ✅ Reutilización de componentes (modal modo dual)

#### 9.1.5 Decisiones de Diseño

1. **Estadísticas en Tiempo Real:**
   - Calculadas en cada request (no cacheadas)
   - Justificación: Los datos cambian frecuentemente y el volumen es bajo
   - Alternativa futura: Cachear con invalidación por señales

2. **Código No Editable:**
   - El código de sucursal no puede modificarse después de creación
   - Justificación: El código se usa como referencia en otros registros
   - Implementado con `disabled={!!branch}` en el input

3. **Vista de Tarjetas vs Tabla:**
   - Se eligió vista de tarjetas sobre tabla tradicional
   - Justificación: Mejor visualización de estadísticas múltiples
   - Más amigable en dispositivos móviles

4. **Confirmación de Eliminación:**
   - AlertDialog bloqueante antes de eliminar
   - Justificación: Operación destructiva e irreversible
   - Muestra nombre de sucursal para confirmar

---

## 10. Deployment (Futuro)

### 9.1 Checklist de Produccion

**Backend:**
- [ ] DEBUG = False
- [ ] SECRET_KEY unico generado
- [ ] ALLOWED_HOSTS configurado con dominio real
- [ ] Base de datos PostgreSQL
- [ ] Migraciones aplicadas
- [ ] Gunicorn como WSGI server
- [ ] Nginx como reverse proxy
- [ ] HTTPS configurado
- [ ] Backups automaticos de BD
- [ ] Logs configurados

**Frontend:**
- [ ] Build optimizado (pnpm build)
- [ ] Variables de entorno de produccion
- [ ] NEXT_PUBLIC_API_URL apuntando a produccion
- [ ] Despliegue en Vercel/Netlify/servidor propio
- [ ] CDN para assets estaticos

### 9.2 Recomendaciones de Infraestructura

**Opcion 1: Servidor Unico**
- VPS con Ubuntu 22.04+
- Nginx + Gunicorn + Next.js SSR
- PostgreSQL en el mismo servidor
- Costos: ~$10-20/mes

**Opcion 2: Serverless + Managed DB**
- Backend: Railway/Render/Fly.io
- Frontend: Vercel/Netlify
- Base de datos: PostgreSQL gestionado
- Costos: ~$15-30/mes

**Opcion 3: Containers**
- Docker + Docker Compose
- Escalable horizontalmente
- CI/CD con GitHub Actions
- Deploy en cualquier cloud provider

---

## 10. Estado Actual de Implementacion

**Completado:**
- Estructura base de directorios (backend y frontend)
- Configuracion de Django con dotenv
- CORS configurado
- Migraciones iniciales aplicadas
- Base de datos SQLite creada
- Next.js con estructura App Router
- Configuracion de Tailwind CSS
- Path alias @/* configurado

**En Progreso:**
- Creacion de apps Django (users, branches, employees, devices, assignments)
- Modelos de base de datos
- Serializers y ViewSets DRF
- Autenticacion JWT
- Frontend: componentes y paginas

**Pendiente:**
- Todo el desarrollo funcional (segun implementation-plan.md)

---

**Ultima actualizacion:** Noviembre 2025
**Proxima revision:** Al completar cada fase del implementation-plan.md

---

## 11. Detalles de Implementacion - Fase 2 Completada

### 11.1 Estado Actual (Noviembre 5, 2025)

**Completado:**
- Fase 0: Preparacion del Entorno (100%)
- Fase 1: Configuracion del Backend (100%)
- Fase 2: Modelos de Base de Datos (100%)
- Fase 6: Configuracion del Frontend (100%)

**Progreso total:** 35/150+ pasos (~23%)

---

### 11.2 Apps Django Creadas

#### apps/users/
**Proposito:** Gestion de usuarios y autenticacion del sistema.

**Archivos principales:**
- `models.py`: Modelo User personalizado extendiendo AbstractUser
  - Campo adicional: `role` (ADMIN/OPERADOR)
  - Metodos: is_admin(), is_operador()

- `audit.py`: Modelo AuditLog para registro de operaciones
  - Registra: CREATE, UPDATE, DELETE
  - Campos: user, action, entity_type, entity_id, changes (JSON), timestamp
  - Inmutable (solo lectura en admin)

- `admin.py`: Django Admin personalizado
  - UserAdmin: Extiende UserAdmin base, agrega campo role
  - AuditLogAdmin: Solo lectura, sin permisos de add/delete

**Configuracion especial:**
```python
# En config/settings.py
AUTH_USER_MODEL = 'users.User'
```

**IMPORTANTE:** Debe configurarse ANTES de la primera migracion.

---

#### apps/branches/
**Proposito:** Gestion de sucursales de la empresa.

**Archivos principales:**
- `models.py`: Modelo Branch
  - Campos: codigo (unique), nombre, direccion, ciudad, is_active
  - Usado por Employee y Device como ForeignKey

- `admin.py`: BranchAdmin con busqueda por codigo/nombre/ciudad

- `management/commands/create_sample_branches.py`:
  - Management command para crear 3 sucursales de prueba
  - Uso: `python manage.py create_sample_branches`
  - Sucursales: SCL-01, VAL-01, CON-01

**Relaciones:**
- Employee.sucursal -> Branch
- Device.sucursal -> Branch

---

#### apps/employees/
**Proposito:** Gestion de empleados que reciben dispositivos.

**Archivos principales:**
- `models.py`: Modelo Employee
  - Campos principales: rut (unique), nombre_completo, cargo, sucursal
  - Estado: ACTIVO/INACTIVO
  - Metadata: created_at, updated_at, created_by

  Metodos importantes:
  ```python
  def has_active_assignments(self):
      # Verifica si tiene asignaciones activas
      return self.assignment_set.filter(estado_asignacion='ACTIVA').exists()

  def delete(self, *args, **kwargs):
      # Previene eliminacion si tiene asignaciones activas
      if self.has_active_assignments():
          raise models.ProtectedError(...)
  ```

- `admin.py`: EmployeeAdmin
  - Autocomplete para sucursal
  - Auto-asignacion de created_by
  - Filtros: estado, sucursal, unidad_negocio

**Validaciones futuras (Fase 5):**
- `validators.py`: validate_rut() para formato chileno

---

#### apps/devices/
**Proposito:** Gestion de dispositivos moviles del inventario.

**Archivos principales:**
- `models.py`: Modelo Device

  Tipos de equipo:
  - LAPTOP, TELEFONO, TABLET, SIM, ACCESORIO

  Estados:
  - DISPONIBLE: Listo para asignar
  - ASIGNADO: En uso
  - MANTENIMIENTO: En reparacion
  - BAJA: Dado de baja
  - ROBO: Reportado como robado

  Campos clave:
  - serie_imei (unique): Identificador unico
  - tipo_equipo, marca, modelo
  - estado (con choices)
  - sucursal (ForeignKey)
  - numero_telefono (opcional, para telefonos/SIM)

  Metodos:
  ```python
  def change_status(self, new_status, user=None):
      # Cambia estado y registra en auditoria
      old_status = self.estado
      self.estado = new_status
      self.save()
      # TODO: Registrar en auditoria (Fase 5)

  def has_active_assignment(self):
      # Verifica si esta asignado
      return self.assignment_set.filter(estado_asignacion='ACTIVA').exists()
  ```

- `admin.py`: DeviceAdmin
  - Filtros: tipo_equipo, estado, sucursal, marca
  - Busqueda: serie_imei, modelo, numero_telefono

---

#### apps/assignments/
**Proposito:** Gestion del ciclo de vida de asignaciones.

**Archivos principales:**
- `models.py`: 3 modelos relacionados

  **Request (Solicitud):**
  - Registro de solicitudes de dispositivos
  - Estados: PENDIENTE, APROBADA, RECHAZADA, COMPLETADA
  - Campos: empleado, jefatura_solicitante, tipo_dispositivo, justificacion

  **Assignment (Asignacion):**
  - Registro de asignacion dispositivo -> empleado
  - Campos clave:
    - solicitud (ForeignKey opcional)
    - empleado, dispositivo (ForeignKeys)
    - tipo_entrega: PERMANENTE/TEMPORAL
    - estado_carta: FIRMADA/PENDIENTE/NO_APLICA
    - estado_asignacion: ACTIVA/FINALIZADA
    - fecha_entrega, fecha_devolucion

  **Return (Devolucion):**
  - Registro de devolucion de dispositivo
  - OneToOneField con Assignment
  - estado_dispositivo: OPTIMO/CON_DANOS/NO_FUNCIONAL
  - Al crear devolucion:
    - Assignment -> FINALIZADA
    - Device.estado -> DISPONIBLE o MANTENIMIENTO

- `admin.py`: 3 ModelAdmins (RequestAdmin, AssignmentAdmin, ReturnAdmin)
  - Todos con autocomplete para ForeignKeys
  - Auto-asignacion de created_by

**Logica de negocio (implementar en Fase 5):**
- `signals.py`: Senales post_save para cambios automaticos
  - Al crear Assignment ACTIVA -> Device.estado = ASIGNADO
  - Al crear Return -> Assignment FINALIZADA + cambio estado Device

---

### 11.3 Configuracion de Settings

**Backend (config/settings.py):**
```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    # Apps del proyecto
    'apps.users',
    'apps.branches',
    'apps.employees',
    'apps.devices',
    'apps.assignments',
]

# Custom User Model
AUTH_USER_MODEL = 'users.User'

# CORS Configuration
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]
CORS_ALLOW_CREDENTIALS = True
```

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

### 11.4 Convenciones de Codigo Aplicadas

**Nomenclatura de apps:**
- Plural en ingles: users, branches, employees, devices, assignments
- En apps.py: `name = 'apps.nombre_app'`
- verbose_name en espanol

**Modelos:**
- Singular en ingles: User, Branch, Employee, Device
- verbose_name en espanol
- Orden de campos: principales -> opcionales -> metadata -> timestamps -> created_by

**Choices:**
```python
ESTADO_CHOICES = [
    ('ACTIVO', 'Activo'),      # Valor en MAYUSCULAS
    ('INACTIVO', 'Inactivo'),  # Label en Capitalize
]
```

**Campos comunes:**
```python
created_at = models.DateTimeField(auto_now_add=True)
updated_at = models.DateTimeField(auto_now=True)
created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
```

---

### 11.5 Relaciones entre Modelos

```
User (AUTH_USER_MODEL)
  |
  |-> Employee.created_by
  |-> Device.created_by
  |-> Request.created_by
  |-> Assignment.created_by
  |-> Return.created_by
  +-> AuditLog.user

Branch
  |
  |-> Employee.sucursal
  +-> Device.sucursal

Employee
  |
  |-> Request.empleado
  +-> Assignment.empleado

Device
  |
  +-> Assignment.dispositivo

Request
  |
  +-> Assignment.solicitud (opcional)

Assignment
  |
  +-> Return.asignacion (OneToOne)
```

---

### 11.6 Django Admin - Caracteristicas Implementadas

**Todos los ModelAdmin incluyen:**
- list_display: Columnas visibles
- list_filter: Filtros laterales
- search_fields: Busqueda de texto
- readonly_fields: Campos no editables (timestamps)
- autocomplete_fields: ForeignKeys con busqueda

**Auto-asignacion de created_by:**
```python
def save_model(self, request, obj, form, change):
    if not change:  # Si es nuevo objeto
        obj.created_by = request.user
    super().save_model(request, obj, form, change)
```

**AuditLog especial:**
- Solo lectura (has_add_permission = False)
- No eliminable (has_delete_permission = False)
- Registro inmutable de auditoria

---

### 11.7 Management Commands Creados

#### create_sample_branches
**Archivo:** `apps/branches/management/commands/create_sample_branches.py`

**Uso:**
```bash
python manage.py create_sample_branches
```

**Resultado:**
- Crea 3 sucursales: SCL-01, VAL-01, CON-01
- Usa get_or_create() para evitar duplicados
- Ejecutable multiples veces sin error

---

### 11.8 Decisiones Tecnicas Documentadas

**SQLite en desarrollo:**
- Facil de resetear (rm db.sqlite3)
- No requiere servidor
- Migracion a PostgreSQL es directa

**Modelo User personalizado:**
- Extiende AbstractUser (no AbstractBaseUser)
- Agrega campo role para permisos
- DEBE configurarse antes de primera migracion

**on_delete=PROTECT:**
- Previene eliminacion en cascada
- Fuerza validacion manual
- Mejor para integridad de datos

**JSONField en AuditLog:**
- Flexible para diferentes entidades
- No requiere esquema fijo
- Soportado por SQLite 3.9+

---

### 11.9 Problemas Resueltos

**Error: InconsistentMigrationHistory**
- Causa: Cambiar AUTH_USER_MODEL despues de migraciones
- Solucion: Reiniciar BD y recrear migraciones

**Pasos aplicados:**
```bash
rm db.sqlite3
find apps/*/migrations -name "*.py" ! -name "__init__.py" -delete
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

---

### 11.10 Comandos Utiles

**Backend:**
```bash
# Activar entorno virtual
source venv/bin/activate

# Crear/aplicar migraciones
python manage.py makemigrations
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Servidor de desarrollo
python manage.py runserver

# Crear datos de prueba
python manage.py create_sample_branches

# Shell de Django
python manage.py shell
```

**Frontend:**
```bash
# Instalar dependencias
pnpm install

# Servidor de desarrollo
pnpm dev

# Build de produccion
pnpm build
```

---

### 11.11 Testing y Verificacion

**Verificar modelos en shell:**
```python
python manage.py shell

from apps.users.models import User
from apps.branches.models import Branch
from apps.employees.models import Employee
from apps.devices.models import Device
from apps.assignments.models import Request, Assignment, Return
from apps.users.audit import AuditLog

# Verificar User personalizado
User.objects.first().role  # Debe tener campo 'role'

# Verificar sucursales
Branch.objects.count()  # Debe retornar 3
```

**Verificar Django Admin:**
1. http://localhost:8000/admin/
2. Login con superusuario
3. Verificar apps visibles
4. Crear registros de prueba
5. Verificar autocomplete funciona

---

### 11.12 Proximos Pasos - Fase 3

**API REST con Django REST Framework:**

1. Instalar djangorestframework
2. Configurar DRF en settings
3. Crear 6 serializers:
   - UserSerializer
   - BranchSerializer
   - EmployeeSerializer
   - DeviceSerializer
   - RequestSerializer, AssignmentSerializer, ReturnSerializer

4. Crear ViewSets con filtros
5. Configurar URLs:
   - /api/branches/
   - /api/employees/
   - /api/devices/
   - /api/assignments/requests/
   - /api/assignments/assignments/
   - /api/assignments/returns/

6. Probar endpoints con curl o Postman

---

## 12. Arquitectura de la API REST (Fase 3 - Completada)

### 12.1 Estructura de Serializers

Los serializers actúan como capa de traducción entre los modelos Django y las representaciones JSON de la API.

#### Patrón de Serialización Anidada

**Problema resuelto:** Evitar que el frontend tenga que hacer múltiples requests para obtener datos relacionados.

**Implementación:**
```python
# apps/employees/serializers.py
class EmployeeSerializer(serializers.ModelSerializer):
    # Campo anidado: En lugar de solo retornar sucursal_id, retorna el objeto completo
    sucursal_detail = BranchSerializer(source='sucursal', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        fields = [
            'sucursal',           # ID para escritura (POST/PUT)
            'sucursal_detail',    # Objeto completo para lectura (GET)
        ]
```

**Resultado en JSON:**
```json
{
  "id": 1,
  "nombre_completo": "Juan Pérez",
  "sucursal": 1,                    // Para enviar en POST/PUT
  "sucursal_detail": {              // Para leer en GET
    "id": 1,
    "nombre": "Casa Matriz Santiago",
    "codigo": "SCL-01",
    "ciudad": "Santiago"
  }
}
```

**Beneficios:**
- Reducción de requests HTTP (de N+1 a 1)
- Mejor experiencia de desarrollo en el frontend
- Datos completos en una sola respuesta

#### Validaciones en Serializers

**apps/devices/serializers.py:**
```python
def validate_serie_imei(self, value):
    """Validar que la serie/IMEI sea única"""
    if self.instance:
        # Actualización: excluir el registro actual
        if Device.objects.exclude(pk=self.instance.pk).filter(serie_imei=value).exists():
            raise serializers.ValidationError("Ya existe un dispositivo con esta serie/IMEI")
    else:
        # Creación: verificar que no exista
        if Device.objects.filter(serie_imei=value).exists():
            raise serializers.ValidationError("Ya existe un dispositivo con esta serie/IMEI")
    return value
```

**Validaciones implementadas:**
1. **Campo único:** serie_imei, RUT
2. **Formato:** RUT chileno (básico, completo en Fase 5)
3. **Lógica de negocio:** Fechas coherentes, dispositivos disponibles
4. **Condicionales:** Número de teléfono requerido para tipo TELEFONO/SIM

---

### 12.2 Estructura de ViewSets

Los ViewSets proporcionan las operaciones CRUD automáticas con configuración mínima.

#### Optimización de Queries con select_related()

**Problema:** N+1 queries problem
- Sin optimización: 1 query + N queries adicionales por cada registro relacionado
- Con select_related(): 1 query con JOIN

**Implementación:**
```python
# apps/employees/views.py
class EmployeeViewSet(viewsets.ModelViewSet):
    # select_related() hace JOIN en SQL, evitando queries adicionales
    queryset = Employee.objects.select_related('sucursal', 'created_by').all()
```

**SQL generado:**
```sql
-- Con select_related() (1 query)
SELECT employee.*, branch.*, user.*
FROM employees_employee
LEFT JOIN branches_branch ON employee.sucursal_id = branch.id
LEFT JOIN auth_user ON employee.created_by_id = user.id;

-- Sin select_related() (N+1 queries)
SELECT * FROM employees_employee;           -- 1 query
SELECT * FROM branches_branch WHERE id=1;   -- N queries
SELECT * FROM auth_user WHERE id=1;         -- N queries
```

#### Sistema de Filtros y Búsqueda

**Tres tipos de filtros configurados:**

1. **DjangoFilterBackend:** Filtros exactos por campos
   ```
   GET /api/devices/?estado=DISPONIBLE&tipo_equipo=LAPTOP
   ```

2. **SearchFilter:** Búsqueda de texto en múltiples campos
   ```
   GET /api/devices/?search=Samsung
   ```

3. **OrderingFilter:** Ordenamiento por campos
   ```
   GET /api/devices/?ordering=-fecha_ingreso
   ```

**Ejemplo completo en DeviceViewSet:**
```python
class DeviceViewSet(viewsets.ModelViewSet):
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]

    # Filtros exactos
    filterset_fields = ['tipo_equipo', 'estado', 'sucursal', 'marca']

    # Búsqueda de texto (busca en cualquiera de estos campos)
    search_fields = ['serie_imei', 'marca', 'modelo', 'numero_telefono']

    # Campos disponibles para ordenar
    ordering_fields = ['marca', 'modelo', 'fecha_ingreso', 'created_at']

    # Ordenamiento por defecto
    ordering = ['-fecha_ingreso']
```

#### Auto-asignación de created_by

**Problema:** El usuario que crea un registro debe registrarse automáticamente.

**Solución:**
```python
def perform_create(self, serializer):
    """Django Rest Framework hook ejecutado antes de save()"""
    serializer.save(created_by=self.request.user)
```

**Flujo:**
1. Frontend envía POST sin campo `created_by`
2. ViewSet intercepta con `perform_create()`
3. Agrega `created_by` del usuario autenticado
4. Guarda el registro con auditoría completa

---

### 12.3 Sistema de Routing

#### Estructura de URLs en 3 Niveles

**Nivel 1: config/urls.py (URLs principales)**
```python
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/branches/', include('apps.branches.urls')),
    path('api/employees/', include('apps.employees.urls')),
    path('api/devices/', include('apps.devices.urls')),
    path('api/assignments/', include('apps.assignments.urls')),
]
```

**Nivel 2: apps/{app}/urls.py (Router de DRF)**
```python
# apps/branches/urls.py
router = DefaultRouter()
router.register(r'', BranchViewSet, basename='branch')

urlpatterns = [
    path('', include(router.urls)),
]
```

**Nivel 3: DefaultRouter (Endpoints generados automáticamente)**

El DefaultRouter de DRF genera automáticamente estas rutas:

| Método HTTP | URL | Acción | Nombre |
|-------------|-----|--------|--------|
| GET | `/api/branches/` | Listar todas | branch-list |
| POST | `/api/branches/` | Crear nueva | branch-list |
| GET | `/api/branches/{id}/` | Obtener una | branch-detail |
| PUT | `/api/branches/{id}/` | Actualizar completa | branch-detail |
| PATCH | `/api/branches/{id}/` | Actualizar parcial | branch-detail |
| DELETE | `/api/branches/{id}/` | Eliminar | branch-detail |

#### Endpoints de Assignments (Múltiples ViewSets)

**apps/assignments/urls.py:**
```python
router = DefaultRouter()
router.register(r'requests', RequestViewSet, basename='request')
router.register(r'assignments', AssignmentViewSet, basename='assignment')
router.register(r'returns', ReturnViewSet, basename='return')
```

**Resultado:**
- `/api/assignments/requests/` → Solicitudes de dispositivos
- `/api/assignments/assignments/` → Asignaciones de dispositivos
- `/api/assignments/returns/` → Devoluciones de dispositivos

Cada uno con sus propios endpoints CRUD completos.

---

### 12.4 Paginación y Performance

#### Configuración de Paginación

**config/settings.py:**
```python
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}
```

**Respuesta con paginación:**
```json
{
  "count": 150,           // Total de registros
  "next": "http://localhost:8000/api/devices/?page=2",
  "previous": null,
  "results": [            // 20 registros por página
    { "id": 1, ... },
    { "id": 2, ... },
    // ... 18 más
  ]
}
```

#### Estrategias de Optimización

1. **select_related():** Para ForeignKey (1-to-1, Many-to-1)
   ```python
   Employee.objects.select_related('sucursal', 'created_by')
   ```

2. **prefetch_related():** Para ManyToMany y relaciones inversas (Fase 5)
   ```python
   Branch.objects.prefetch_related('employee_set')
   ```

3. **Índices de base de datos:** Definidos en modelos
   ```python
   class Meta:
       indexes = [
           models.Index(fields=['serie_imei']),
           models.Index(fields=['estado']),
       ]
   ```

---

### 12.5 Flujo de Request/Response

#### Ejemplo: Crear un Empleado

**1. Frontend envía POST:**
```http
POST /api/employees/
Content-Type: application/json
Authorization: Bearer {token}

{
  "rut": "12345678-9",
  "nombre_completo": "María González",
  "cargo": "Desarrolladora",
  "sucursal": 1,
  "estado": "ACTIVO"
}
```

**2. Django procesa:**
```
config/urls.py
  ↓ include('apps.employees.urls')
apps/employees/urls.py
  ↓ router → EmployeeViewSet
apps/employees/views.py
  ↓ EmployeeViewSet.create()
    ↓ perform_create(serializer)
    ↓ serializer.save(created_by=request.user)
apps/employees/serializers.py
  ↓ EmployeeSerializer.validate_rut()
  ↓ EmployeeSerializer.save()
apps/employees/models.py
  ↓ Employee.objects.create(...)
  ↓ Database INSERT
```

**3. Respuesta al frontend:**
```http
HTTP 201 CREATED
Content-Type: application/json

{
  "id": 15,
  "rut": "12345678-9",
  "nombre_completo": "María González",
  "cargo": "Desarrolladora",
  "sucursal": 1,
  "sucursal_detail": {
    "id": 1,
    "nombre": "Casa Matriz Santiago",
    "codigo": "SCL-01"
  },
  "estado": "ACTIVO",
  "created_by": 1,
  "created_by_username": "admin",
  "created_at": "2025-11-05T14:30:00Z",
  "updated_at": "2025-11-05T14:30:00Z"
}
```

---

### 12.6 Decisiones Arquitectónicas de la API

#### Por qué DefaultRouter

**Ventajas:**
- Genera automáticamente todas las rutas CRUD
- Incluye browsable API de DRF
- Nombres consistentes para reverse URLs
- Menos código, menos errores

**Alternativa rechazada:** SimpleRouter
- No incluye la vista raíz de la API
- Menos conveniente para desarrollo

#### Por qué Serialización Anidada

**Ventaja:** Reducir requests del frontend
```python
# Sin anidación: Frontend necesita 2 requests
GET /api/employees/1/      → { "sucursal": 1 }
GET /api/branches/1/       → { "nombre": "Santiago" }

# Con anidación: Frontend necesita 1 request
GET /api/employees/1/      → { "sucursal": 1, "sucursal_detail": {...} }
```

**Trade-off aceptado:**
- Respuestas JSON más grandes
- Pero menos latencia total (menos round-trips)

#### Por qué AllowAny Temporal

**Configuración actual:**
```python
'DEFAULT_PERMISSION_CLASSES': [
    'rest_framework.permissions.AllowAny',
]
```

**Razón:** Facilitar testing de endpoints en Fase 3
**Cambio en Fase 4:** Reemplazar con `IsAuthenticated` + JWT

---

### 12.7 Archivos de la API y sus Responsabilidades

#### apps/branches/

**serializers.py:**
- `BranchSerializer`: Serializa el modelo Branch
- Campos: Todos los del modelo
- Validaciones: Ninguna especial (campos estándar)

**views.py:**
- `BranchViewSet`: CRUD de sucursales
- Filtros: `is_active`, `ciudad`
- Búsqueda: `nombre`, `codigo`, `ciudad`, `direccion`
- Sin `perform_create` (no tiene campo created_by)

**urls.py:**
- DefaultRouter registrando BranchViewSet
- Base path: `/api/branches/`

---

#### apps/employees/

**serializers.py:**
- `EmployeeSerializer`: Serializa Employee con datos anidados
- Campos anidados: `sucursal_detail`, `created_by_username`
- Validaciones: `validate_rut()` - formato básico de RUT

**views.py:**
- `EmployeeViewSet`: CRUD de empleados
- Optimización: `select_related('sucursal', 'created_by')`
- Filtros: `estado`, `sucursal`, `unidad_negocio`
- Búsqueda: `nombre_completo`, `rut`, `cargo`, `correo_corporativo`
- `perform_create()`: Asigna `created_by`

**urls.py:**
- DefaultRouter registrando EmployeeViewSet
- Base path: `/api/employees/`

---

#### apps/devices/

**serializers.py:**
- `DeviceSerializer`: Serializa Device con validaciones complejas
- Campos anidados: `sucursal_detail`, `created_by_username`, displays
- Validaciones:
  - `validate_serie_imei()`: Unicidad (considera update vs create)
  - `validate()`: Número de teléfono requerido para TELEFONO/SIM

**views.py:**
- `DeviceViewSet`: CRUD de dispositivos
- Optimización: `select_related('sucursal', 'created_by')`
- Filtros: `tipo_equipo`, `estado`, `sucursal`, `marca`
- Búsqueda: `serie_imei`, `marca`, `modelo`, `numero_telefono`, `numero_factura`
- `perform_create()`: Asigna `created_by`

**urls.py:**
- DefaultRouter registrando DeviceViewSet
- Base path: `/api/devices/`

---

#### apps/assignments/

**serializers.py:**
- `RequestSerializer`: Solicitudes de dispositivos
  - Anidado: `empleado_detail`
  - Validaciones: Ninguna especial

- `AssignmentSerializer`: Asignaciones de dispositivos
  - Anidado: `empleado_detail`, `dispositivo_detail`, `solicitud_detail`
  - Validaciones:
    - `validate_dispositivo()`: Verifica que esté DISPONIBLE
    - `validate()`: Fecha devolución > fecha entrega

- `ReturnSerializer`: Devoluciones de dispositivos
  - Anidado: `asignacion_detail`
  - Validaciones:
    - `validate_asignacion()`: Verifica que esté ACTIVA y sin devolución previa
    - `validate()`: Fecha devolución >= fecha entrega de la asignación

**views.py:**
- `RequestViewSet`: CRUD de solicitudes
  - Optimización: `select_related('empleado', 'created_by')`
  - Filtros: `estado`, `empleado`, `tipo_dispositivo`

- `AssignmentViewSet`: CRUD de asignaciones
  - Optimización: `select_related('empleado', 'dispositivo', 'solicitud', 'created_by')`
  - Filtros: `estado_asignacion`, `empleado`, `dispositivo`, `tipo_entrega`

- `ReturnViewSet`: CRUD de devoluciones
  - Optimización: `select_related('asignacion', 'created_by')`
  - Filtros: `estado_dispositivo`, `asignacion`

**urls.py:**
- DefaultRouter registrando 3 ViewSets
- Base paths:
  - `/api/assignments/requests/`
  - `/api/assignments/assignments/`
  - `/api/assignments/returns/`

---

### 12.8 Próximas Mejoras (Fase 4 y 5)

**Fase 4 - Autenticación JWT:**
- Cambiar `AllowAny` a `IsAuthenticated`
- Agregar permisos personalizados: `IsAdmin`, `IsAdminOrReadOnly`
- Endpoints: `/api/auth/login/`, `/api/auth/refresh/`

**Fase 5 - Lógica de Negocio:**
- Signals para cambios automáticos de estado:
  - Crear Assignment → Device.estado = ASIGNADO
  - Crear Return → Assignment.estado = FINALIZADA, Device.estado según condición
- Registro en AuditLog automático
- Validación completa de RUT chileno

---

## 13. Arquitectura de Autenticación JWT (Fase 4 - Completada)

### 13.1 Visión General de la Autenticación

TechTrace implementa autenticación basada en JSON Web Tokens (JWT) con las siguientes características:

- **Tokens de acceso (Access Tokens)**: Duración de 2 horas
- **Tokens de refresco (Refresh Tokens)**: Duración de 7 días
- **Rotación de tokens**: Habilitada para mayor seguridad
- **Blacklist de tokens**: Los tokens refrescados se invalidan automáticamente
- **Algoritmo**: HS256 (HMAC con SHA-256)

### 13.2 Flujo de Autenticación Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DE AUTENTICACIÓN JWT                   │
└─────────────────────────────────────────────────────────────────┘

1. LOGIN INICIAL
   ┌──────────┐                                    ┌──────────┐
   │ Frontend │  POST /api/auth/login/             │ Backend  │
   │          │  {username, password}              │          │
   │          │ ───────────────────────────────────>│          │
   │          │                                     │          │
   │          │  {access, refresh, user}            │          │
   │          │<────────────────────────────────────│          │
   └──────────┘                                    └──────────┘

   - Valida credenciales
   - Genera access token (2h) y refresh token (7d)
   - Retorna datos del usuario completos
   - Incluye claims personalizados: username, email, role, is_staff


2. REQUESTS AUTENTICADOS
   ┌──────────┐                                    ┌──────────┐
   │ Frontend │  GET /api/branches/                │ Backend  │
   │          │  Authorization: Bearer {access}    │          │
   │          │ ───────────────────────────────────>│          │
   │          │                                     │          │
   │          │  Verifica JWT                       │          │
   │          │  Extrae user_id del token           │          │
   │          │  Valida permisos                    │          │
   │          │                                     │          │
   │          │  {data}                             │          │
   │          │<────────────────────────────────────│          │
   └──────────┘                                    └──────────┘


3. REFRESH TOKEN (cuando access expira)
   ┌──────────┐                                    ┌──────────┐
   │ Frontend │  POST /api/auth/refresh/           │ Backend  │
   │          │  {refresh}                         │          │
   │          │ ───────────────────────────────────>│          │
   │          │                                     │          │
   │          │  Valida refresh token               │          │
   │          │  Blacklist token viejo              │          │
   │          │  Genera nuevo access + refresh      │          │
   │          │                                     │          │
   │          │  {access, refresh}                  │          │
   │          │<────────────────────────────────────│          │
   └──────────┘                                    └──────────┘


4. LOGOUT
   ┌──────────┐                                    ┌──────────┐
   │ Frontend │  POST /api/auth/logout/            │ Backend  │
   │          │  {refresh_token}                   │          │
   │          │  Authorization: Bearer {access}    │          │
   │          │ ───────────────────────────────────>│          │
   │          │                                     │          │
   │          │  Agrega refresh a blacklist         │          │
   │          │                                     │          │
   │          │  {message: "Sesión cerrada"}        │          │
   │          │<────────────────────────────────────│          │
   └──────────┘                                    └──────────┘
```

### 13.3 Estructura de Archivos de Autenticación

```
backend/apps/users/
├── models.py              # Modelo User personalizado (Fase 2)
├── audit.py              # Modelo AuditLog (Fase 2)
├── admin.py              # Django Admin (Fase 2)
│
├── serializers.py        # ← NUEVO (Fase 4)
│   ├── UserSerializer                    # Serialización completa del usuario
│   └── CustomTokenObtainPairSerializer   # Login personalizado con datos de usuario
│
├── views.py              # ← NUEVO (Fase 4)
│   ├── CustomTokenObtainPairView         # Vista de login
│   ├── LogoutView                        # Vista de logout con blacklist
│   └── CurrentUserView                   # Vista de usuario actual (/me)
│
├── permissions.py        # ← NUEVO (Fase 4)
│   ├── IsAdmin                           # Solo usuarios ADMIN
│   ├── IsAdminOrReadOnly                 # ADMIN: full, OPERADOR: read-only
│   └── IsAdminOrOwner                    # ADMIN o dueño del recurso
│
└── urls.py              # ← NUEVO (Fase 4)
    └── Rutas de autenticación
```

### 13.4 Detalle de Archivos Implementados

#### apps/users/serializers.py

**Responsabilidades:**
- Serialización de datos de usuario para la API
- Personalización del proceso de login con datos adicionales

**UserSerializer:**
```python
class UserSerializer(serializers.ModelSerializer):
    """
    Serializa el modelo User para la API.
    Incluye campo calculado 'full_name'.
    """
    Campos expuestos:
    - id, username, email
    - first_name, last_name, full_name (calculado)
    - role (ADMIN/OPERADOR)
    - is_active, is_staff, is_superuser
    - date_joined, last_login

    Campos read-only:
    - id, date_joined, last_login, is_superuser
```

**CustomTokenObtainPairSerializer:**
```python
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Extiende el serializer de SimpleJWT para:
    1. Agregar claims personalizados al token
    2. Incluir datos del usuario en la respuesta de login
    """

    Claims personalizados en el token:
    - username: Nombre de usuario
    - email: Email del usuario
    - role: Rol (ADMIN/OPERADOR)
    - is_staff: Si es staff

    Respuesta de login incluye:
    - access: Access token JWT
    - refresh: Refresh token JWT
    - user: Objeto completo del usuario (UserSerializer)
```

**Ventaja:** El frontend recibe todos los datos del usuario en el login, evitando un request adicional a /api/auth/me/.

---

#### apps/users/views.py

**Responsabilidades:**
- Implementar endpoints de autenticación
- Manejar login, logout y consulta de usuario actual

**CustomTokenObtainPairView:**
```python
class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Endpoint: POST /api/auth/login/
    Permisos: AllowAny (público)

    Input:
    {
        "username": "admin",
        "password": "password123"
    }

    Output:
    {
        "access": "eyJhbGc...",
        "refresh": "eyJhbGc...",
        "user": {
            "id": 1,
            "username": "admin",
            "role": "ADMIN",
            ...
        }
    }
    """
```

**LogoutView:**
```python
class LogoutView(APIView):
    """
    Endpoint: POST /api/auth/logout/
    Permisos: IsAuthenticated

    Input:
    {
        "refresh_token": "eyJhbGc..."
    }

    Proceso:
    1. Recibe el refresh token
    2. Lo agrega a la blacklist (tabla token_blacklist_outstandingtoken)
    3. El token ya no puede ser usado para refrescar

    Output:
    {
        "message": "Sesión cerrada exitosamente."
    }

    Manejo de errores:
    - Token faltante → 400 Bad Request
    - Token inválido → 400 Bad Request
    - Token ya invalidado → 400 Bad Request
    """
```

**CurrentUserView:**
```python
class CurrentUserView(APIView):
    """
    Endpoint: GET /api/auth/me/
    Permisos: IsAuthenticated

    Retorna los datos del usuario autenticado actual.
    El usuario se obtiene automáticamente de request.user
    (extraído del JWT por JWTAuthentication).

    Output:
    {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "role": "ADMIN",
        ...
    }

    También soporta PATCH para actualizar el perfil:
    - No permite cambiar el rol (excepto ADMIN)
    - Actualización parcial (partial=True)
    """
```

---

#### apps/users/permissions.py

**Responsabilidades:**
- Definir clases de permisos personalizadas basadas en roles
- Controlar acceso a recursos según el rol del usuario

**IsAdmin:**
```python
class IsAdmin(permissions.BasePermission):
    """
    Permiso más restrictivo.
    Solo permite acceso a usuarios con role='ADMIN'.

    Uso típico:
    - Gestión de usuarios
    - Acceso a logs de auditoría
    - Eliminación de registros críticos

    Verificaciones:
    1. Usuario autenticado
    2. user.role == 'ADMIN'
    """
```

**IsAdminOrReadOnly:**
```python
class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Permiso más usado en el sistema.

    Acceso según método HTTP:
    - GET, HEAD, OPTIONS → Todos los usuarios autenticados
    - POST, PUT, PATCH, DELETE → Solo ADMIN

    Uso típico:
    - ViewSets de branches, employees, devices, assignments
    - Permite a OPERADOR consultar datos
    - Solo ADMIN puede crear/modificar/eliminar

    Verificaciones:
    1. Usuario autenticado
    2. Si método seguro → permitir
    3. Si método de escritura → verificar role='ADMIN'
    """
```

**IsAdminOrOwner:**
```python
class IsAdminOrOwner(permissions.BasePermission):
    """
    Permiso a nivel de objeto.

    Permite acceso si:
    - Usuario es ADMIN (acceso completo), O
    - Usuario es el dueño del recurso (obj.created_by == request.user)

    Uso futuro:
    - Endpoints donde usuarios pueden ver solo sus registros
    - Edición de perfil propio

    Tiene dos métodos:
    - has_permission(): Verifica autenticación
    - has_object_permission(): Verifica ownership
    """
```

---

#### apps/users/urls.py

**Responsabilidades:**
- Definir rutas de autenticación
- Mapear URLs a vistas

```python
urlpatterns = [
    # Login: Obtener access + refresh tokens
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),

    # Refresh: Renovar access token con refresh token
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Logout: Invalidar refresh token
    path('logout/', LogoutView.as_view(), name='logout'),

    # Me: Obtener/actualizar usuario actual
    path('me/', CurrentUserView.as_view(), name='current_user'),
]
```

**URLs finales (incluidas en config/urls.py bajo 'api/auth/'):**
- `POST /api/auth/login/`
- `POST /api/auth/refresh/`
- `POST /api/auth/logout/`
- `GET /api/auth/me/`
- `PATCH /api/auth/me/`

---

### 13.5 Configuración en settings.py

#### Configuración de Django REST Framework

```python
REST_FRAMEWORK = {
    # Autenticación JWT como método por defecto
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],

    # Todos los endpoints requieren autenticación por defecto
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],

    # Configuración existente de Fase 3
    'DEFAULT_PAGINATION_CLASS': '...',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [...],
}
```

**Impacto:**
- Todos los ViewSets heredan automáticamente `IsAuthenticated`
- No es necesario especificar `permission_classes` en cada ViewSet
- Solo los endpoints que necesitan ser públicos deben especificar `AllowAny` explícitamente

#### Configuración de SimpleJWT

```python
from datetime import timedelta

SIMPLE_JWT = {
    # Duración de tokens
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=2),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),

    # Seguridad: Rotación y blacklist
    'ROTATE_REFRESH_TOKENS': True,        # Cada refresh genera nuevo token
    'BLACKLIST_AFTER_ROTATION': True,      # Token viejo va a blacklist

    # Algoritmo de firma
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,

    # Configuración de headers
    'AUTH_HEADER_TYPES': ('Bearer',),     # Authorization: Bearer <token>
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',

    # Claims del token
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}
```

**¿Por qué 2 horas para access token?**
- Balance entre seguridad y experiencia de usuario
- Lo suficientemente corto para minimizar riesgo si es robado
- Lo suficientemente largo para no molestar al usuario

**¿Por qué 7 días para refresh token?**
- Permite "remember me" durante una semana
- Después de 7 días, el usuario debe volver a ingresar credenciales
- En producción, considerar reducir a 1-3 días

---

### 13.6 Tabla de Token Blacklist

**Modelo automático de SimpleJWT:**
```
token_blacklist_outstandingtoken
├── id
├── user_id (FK a User)
├── jti (JWT ID único del token)
├── token (texto completo del refresh token)
├── created_at
├── expires_at

token_blacklist_blacklistedtoken
├── id
├── token_id (FK a OutstandingToken)
├── blacklisted_at
```

**Funcionamiento:**
1. Al hacer login → se crea OutstandingToken
2. Al hacer logout → se crea BlacklistedToken apuntando al OutstandingToken
3. Al intentar refresh → SimpleJWT verifica si está en blacklist
4. Tokens expirados se pueden limpiar periódicamente con:
   ```bash
   python manage.py flushexpiredtokens
   ```

---

### 13.7 Anatomía de un JWT

**Ejemplo de token generado:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzYyMzg1Nzg5LCJpYXQiOjE3NjIzNzg1ODksImp0aSI6IjExY2ViMmI5NzZhZTRlOTc5OGIzMWIyMjAyYzZkMjg1IiwidXNlcl9pZCI6IjEiLCJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiIiLCJyb2xlIjoiT1BFUkFET1IiLCJpc19zdGFmZiI6dHJ1ZX0.xVgleh5zqi0N-6v0KpgbROaOUL1AoRx9fz-vZdzXFak

│                  Header                  │                           Payload                            │       Signature       │
```

**Decodificado (payload):**
```json
{
  "token_type": "access",
  "exp": 1762385789,           // Timestamp de expiración
  "iat": 1762378589,           // Timestamp de emisión
  "jti": "11ceb2b9...",        // JWT ID único
  "user_id": "1",              // ID del usuario
  "username": "admin",         // ← Claim personalizado
  "email": "",                 // ← Claim personalizado
  "role": "OPERADOR",          // ← Claim personalizado
  "is_staff": true             // ← Claim personalizado
}
```

**Ventaja de claims personalizados:**
- El backend puede obtener role del token sin consultar la BD
- Útil para decisiones de permisos rápidas
- El token es autocontenido

---

### 13.8 Flujo de Verificación de Permisos

```
Request entrante con JWT
        ↓
┌───────────────────────────────────────────────────────────┐
│ 1. JWTAuthentication Middleware                          │
│    - Extrae token del header Authorization               │
│    - Verifica firma del token                            │
│    - Verifica que no esté expirado                       │
│    - Verifica que no esté en blacklist                   │
│    - Extrae user_id del payload                          │
│    - Carga User desde BD → asigna a request.user         │
└───────────────────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────────────────┐
│ 2. Permission Classes                                     │
│    - IsAuthenticated: Verifica request.user existe       │
│    - IsAdminOrReadOnly: Verifica role según método HTTP  │
└───────────────────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────────────────┐
│ 3. ViewSet/View                                          │
│    - Ejecuta lógica de negocio                           │
│    - Puede acceder a request.user para auditoría         │
│    - perform_create() usa request.user para created_by   │
└───────────────────────────────────────────────────────────┘
        ↓
Response enviada al cliente
```

---

### 13.9 Ejemplos de Uso en Código

#### Ejemplo 1: ViewSet con permisos personalizados

```python
# apps/devices/views.py
from apps.users.permissions import IsAdminOrReadOnly

class DeviceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminOrReadOnly]  # Sobrescribe default

    # ADMIN puede: GET, POST, PUT, PATCH, DELETE
    # OPERADOR puede: GET
```

#### Ejemplo 2: Endpoint solo para ADMIN

```python
# apps/users/views.py (ejemplo futuro)
from apps.users.permissions import IsAdmin

class UserManagementViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdmin]  # Solo ADMIN

    # Solo usuarios con role='ADMIN' pueden acceder
```

#### Ejemplo 3: Usar request.user en vistas

```python
# apps/employees/views.py
class EmployeeViewSet(viewsets.ModelViewSet):
    def perform_create(self, serializer):
        # request.user está disponible gracias a JWTAuthentication
        serializer.save(created_by=self.request.user)

    def list(self, request):
        # Ejemplo: filtrar por sucursal del usuario
        if request.user.role == 'OPERADOR':
            # Operadores solo ven su sucursal
            queryset = Employee.objects.filter(
                sucursal=request.user.sucursal
            )
        else:
            # Admin ve todo
            queryset = Employee.objects.all()
```

---

### 13.10 Seguridad Implementada

**Protecciones actuales:**
1. ✅ Tokens firmados (no pueden ser modificados)
2. ✅ Tokens con expiración
3. ✅ Refresh token rotation (nuevo token cada vez)
4. ✅ Blacklist de tokens revocados
5. ✅ HTTPS recomendado en producción (headers)
6. ✅ Autenticación requerida por defecto
7. ✅ Permisos basados en roles

**Consideraciones para producción:**
1. ⚠️ Migrar refresh tokens a httpOnly cookies (actualmente localStorage)
2. ⚠️ Implementar CSRF protection para cookies
3. ⚠️ Rate limiting en endpoints de auth (prevenir brute force)
4. ⚠️ Logging de intentos de login fallidos
5. ⚠️ Considerar 2FA para usuarios ADMIN
6. ⚠️ Política de contraseñas robustas
7. ⚠️ Limpieza periódica de tokens expirados (flushexpiredtokens)

---

### 13.11 Testing Manual Realizado

**1. Test de Login:**
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Respuesta esperada:
{
  "refresh": "eyJhbGc...",
  "access": "eyJhbGc...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "OPERADOR",
    ...
  }
}
```

**2. Test de Endpoint Protegido (sin auth):**
```bash
curl http://localhost:8000/api/branches/

# Respuesta esperada:
{
  "detail": "Las credenciales de autenticación no se proveyeron."
}
```

**3. Test de Endpoint Protegido (con auth):**
```bash
curl -H "Authorization: Bearer eyJhbGc..." \
  http://localhost:8000/api/branches/

# Respuesta esperada:
{
  "count": 3,
  "results": [...]
}
```

**4. Test de /api/auth/me/:**
```bash
curl -H "Authorization: Bearer eyJhbGc..." \
  http://localhost:8000/api/auth/me/

# Respuesta esperada:
{
  "id": 1,
  "username": "admin",
  ...
}
```

---

### 13.12 Integración con Frontend (Fase 7)

**Preparación completada:**
- Backend retorna user + tokens en login
- Endpoints /api/auth/ listos para consumir
- CORS configurado para localhost:3000

**Próximos pasos en Fase 7:**
1. Crear auth-service.ts en frontend
2. Implementar almacenamiento de tokens (localStorage)
3. Interceptor en ApiClient para agregar Bearer token
4. Middleware de Next.js para proteger rutas
5. Componente LoginPage
6. Auto-refresh de tokens antes de expiración
7. Manejo de logout

---

## 14. Arquitectura de Lógica de Negocio (Fase 5 - Completada)

### 14.1 Visión General

La Fase 5 implementa toda la lógica de negocio del backend, incluyendo:
- Cambios automáticos de estado de dispositivos
- Validaciones avanzadas (RUT chileno)
- Sistema de auditoría completo
- Endpoints de historial y estadísticas
- Protección de datos contra eliminación accidental

### 14.2 Sistema de Señales (Signals)

Django Signals permite desacoplar la lógica de negocio ejecutando código automáticamente en respuesta a eventos del modelo.

#### apps/assignments/signals.py

**Propósito:** Gestionar cambios automáticos de estado cuando se crean o modifican asignaciones.

**Señales implementadas:**

1. **assignment_post_save**
```python
@receiver(post_save, sender=Assignment)
def assignment_post_save(sender, instance, created, **kwargs):
    """
    Ejecuta después de guardar una Assignment.

    Flujo:
    1. Verifica si la asignación está ACTIVA
    2. Si el dispositivo no está ASIGNADO, lo cambia automáticamente
    3. Registra el cambio en auditoría usando change_status()
    """
```

**Ejemplo de flujo:**
```
Usuario crea Assignment → Django guarda → Señal se activa →
Dispositivo cambia a ASIGNADO → AuditLog registra cambio
```

2. **return_post_save**
```python
@receiver(post_save, sender=Return)
def return_post_save(sender, instance, created, **kwargs):
    """
    Ejecuta después de registrar una Return (devolución).

    Flujo:
    1. Marca Assignment como FINALIZADA
    2. Decide nuevo estado del dispositivo:
       - OPTIMO → DISPONIBLE (listo para reasignar)
       - CON_DANOS → MANTENIMIENTO (requiere reparación)
       - NO_FUNCIONAL → MANTENIMIENTO (fuera de servicio)
    3. Registra cambios en auditoría
    """
```

**Diagrama de flujo de devolución:**
```
Return creada (OPTIMO)
    ↓
Assignment.estado_asignacion = FINALIZADA
    ↓
Device.estado = DISPONIBLE
    ↓
AuditLog registra: Device #123 ASIGNADO → DISPONIBLE
```

**Registro en apps.py:**
```python
# apps/assignments/apps.py
class AssignmentsConfig(AppConfig):
    def ready(self):
        import apps.assignments.signals  # Carga señales al iniciar Django
```

---

#### apps/users/signals.py

**Propósito:** Sistema de auditoría automático para todos los modelos principales.

**Arquitectura del sistema de auditoría:**

```
Modelo (Employee/Device/Assignment)
    ↓
Django ORM (save/delete)
    ↓
Signal activado (post_save/post_delete)
    ↓
create_audit_log()
    ↓
AuditLog.objects.create()
    ↓
Registro inmutable en BD
```

**Señales implementadas:**

1. **employee_post_save / employee_post_delete**
   - Registra creación, actualización y eliminación de empleados
   - Captura: RUT, nombre completo, estado

2. **device_post_save / device_post_delete**
   - Registra operaciones sobre dispositivos
   - Captura: serie_imei, tipo_equipo, marca, modelo, estado

3. **assignment_post_save / assignment_post_delete**
   - Registra asignaciones creadas/modificadas/eliminadas
   - Captura: empleado, dispositivo, estado_asignacion, fecha_entrega

4. **return_post_save**
   - Registra devoluciones (solo CREATE, no UPDATE)
   - Captura: asignacion, estado_dispositivo, fecha_devolucion

**Función auxiliar: create_audit_log()**
```python
def create_audit_log(user, action, entity_type, entity_id, changes=None):
    """
    Centraliza la creación de registros de auditoría.

    Args:
        user: Usuario autenticado (de request.user o instance.created_by)
        action: 'CREATE', 'UPDATE', 'DELETE'
        entity_type: 'Employee', 'Device', 'Assignment', 'Return'
        entity_id: ID del registro afectado
        changes: dict con campos modificados

    Prevención de errores:
    - Solo crea log si user existe y está autenticado
    - Evita recursión infinita con flag _skip_audit
    """
```

**Ejemplo de registro en AuditLog:**
```json
{
  "user_id": 1,
  "action": "UPDATE",
  "entity_type": "Device",
  "entity_id": 42,
  "changes": {
    "action_type": "UPDATE",
    "model": "Device",
    "str_representation": "Laptop - Apple MacBook Pro (ABC123)",
    "estado": "ASIGNADO",
    "serie_imei": "ABC123"
  },
  "timestamp": "2025-11-05T16:30:00Z"
}
```

**Prevención de problemas:**

1. **Recursión infinita:**
   - Flag `_skip_audit` evita que señales se activen en cascada
   - Importante porque guardar un AuditLog también dispara post_save

2. **Usuario no disponible en DELETE:**
   - Intenta obtener de `instance._deleting_user`
   - Fallback a `instance.created_by`
   - Si no hay usuario, no crea log (mejor que fallar)

**Registro en apps.py:**
```python
# apps/users/apps.py
class UsersConfig(AppConfig):
    def ready(self):
        import apps.users.signals
```

---

### 14.3 Validación de RUT Chileno

#### apps/employees/validators.py

**Propósito:** Validar que los RUTs chilenos sean correctos antes de guardar empleados.

**Función: validate_rut()**

**Algoritmo del dígito verificador:**
```python
Ejemplo: RUT 12.345.678-5

Paso 1: Tomar solo números → 12345678
Paso 2: Invertir dígitos → 87654321
Paso 3: Multiplicar por serie 2,3,4,5,6,7 (cíclica):
    8×2 + 7×3 + 6×4 + 5×5 + 4×6 + 3×7 + 2×2 + 1×3 = 139
Paso 4: Calcular 11 - (139 % 11) = 11 - 7 = 4
Paso 5: Ajustar casos especiales:
    - Si resultado = 11 → DV = 0
    - Si resultado = 10 → DV = K
    - Caso contrario → DV = resultado
Paso 6: Comparar con DV proporcionado
```

**Flujo de validación:**
```
Usuario ingresa RUT → Django valida formato básico →
validate_rut() llamado → Calcula DV →
¿Coincide? → SÍ: Guarda | NO: ValidationError
```

**Formatos aceptados:**
- `12345678-9` (sin puntos)
- `12.345.678-9` (con puntos)
- Normaliza automáticamente antes de validar

**Integración con modelo:**
```python
# apps/employees/models.py
class Employee(models.Model):
    rut = models.CharField(
        max_length=12,
        unique=True,
        validators=[validate_rut],  # ← Validación automática
        help_text='Formato: XX.XXX.XXX-X o XXXXXXXX-X'
    )
```

**Función auxiliar: format_rut()**
- Convierte RUT a formato estándar: `12.345.678-9`
- Útil para normalizar datos antes de guardar o mostrar

---

### 14.4 Método change_status() Mejorado

#### apps/devices/models.py

**Método: Device.change_status()**

**Propósito:** Cambiar el estado de un dispositivo con registro automático en auditoría.

**Implementación:**
```python
def change_status(self, new_status, user=None):
    """
    Cambia el estado del dispositivo y registra en auditoría.

    Args:
        new_status: Nuevo estado ('DISPONIBLE', 'ASIGNADO', etc.)
        user: Usuario que realiza el cambio (para auditoría)

    Returns:
        bool: True si hubo cambio, False si era el mismo estado

    Side effects:
        - Actualiza self.estado
        - Guarda en BD (self.save())
        - Crea registro en AuditLog si user != None
    """
```

**Flujo:**
```
change_status('ASIGNADO', user=request.user)
    ↓
¿estado actual == nuevo estado? → SÍ: return False (sin cambios)
    ↓ NO
self.estado = new_status
    ↓
self.save()
    ↓
¿user proporcionado? → SÍ: Crear AuditLog
    ↓
return True
```

**Uso desde señales:**
```python
# En assignment_post_save
dispositivo.change_status('ASIGNADO', user=instance.created_by)
```

**Registro en AuditLog:**
```json
{
  "user": 1,
  "action": "UPDATE",
  "entity_type": "Device",
  "entity_id": 42,
  "changes": {
    "field": "estado",
    "old_value": "DISPONIBLE",
    "new_value": "ASIGNADO",
    "device": "Laptop - Apple MacBook Pro (ABC123)"
  }
}
```

---

### 14.5 Endpoints de Historial

Estos endpoints proporcionan vistas completas del historial de asignaciones.

#### GET /api/employees/{id}/history/

**Archivo:** apps/employees/views.py (líneas 26-58)

**Propósito:** Consultar todas las asignaciones (activas e históricas) de un empleado.

**ViewSet action:**
```python
@action(detail=True, methods=['get'], url_path='history')
def history(self, request, pk=None):
    """
    Custom action en EmployeeViewSet.

    URL generada automáticamente por @action decorator:
    /api/employees/{id}/history/

    detail=True → Requiere PK (empleado específico)
    methods=['get'] → Solo GET permitido
    url_path='history' → Parte final de la URL
    """
```

**Optimización de queries:**
```python
assignments = employee.assignment_set.select_related(
    'dispositivo',              # JOIN con tabla devices
    'dispositivo__sucursal',    # JOIN con tabla branches
    'solicitud',                # JOIN con tabla requests
    'created_by'                # JOIN con tabla users
).order_by('-fecha_entrega')
```

**Sin select_related (problema N+1):**
```sql
-- 1 query principal
SELECT * FROM assignments WHERE empleado_id = 5;

-- N queries adicionales (una por cada assignment)
SELECT * FROM devices WHERE id = 10;
SELECT * FROM branches WHERE id = 1;
SELECT * FROM requests WHERE id = 3;
SELECT * FROM users WHERE id = 1;
-- ... repetido N veces
```

**Con select_related (optimizado):**
```sql
-- 1 sola query con JOINs
SELECT
    assignments.*,
    devices.*,
    branches.*,
    requests.*,
    users.*
FROM assignments
LEFT JOIN devices ON assignments.dispositivo_id = devices.id
LEFT JOIN branches ON devices.sucursal_id = branches.id
LEFT JOIN requests ON assignments.solicitud_id = requests.id
LEFT JOIN users ON assignments.created_by_id = users.id
WHERE assignments.empleado_id = 5
ORDER BY assignments.fecha_entrega DESC;
```

**Respuesta JSON:**
```json
{
  "employee": {
    "id": 5,
    "rut": "12.345.678-9",
    "nombre_completo": "Juan Pérez",
    "cargo": "Desarrollador"
  },
  "total_assignments": 12,
  "active_assignments": 2,
  "assignments": [
    {
      "id": 45,
      "empleado": 5,
      "dispositivo_detail": {
        "id": 10,
        "tipo_equipo": "LAPTOP",
        "marca": "Apple",
        "modelo": "MacBook Pro",
        "serie_imei": "ABC123"
      },
      "fecha_entrega": "2025-01-15",
      "estado_asignacion": "ACTIVA"
    },
    // ... más asignaciones
  ]
}
```

---

#### GET /api/devices/{id}/history/

**Archivo:** apps/devices/views.py (líneas 26-60)

**Propósito:** Consultar todas las asignaciones de un dispositivo.

**Diferencia con employee history:**
```python
# Employee history
assignments = employee.assignment_set.select_related(
    'dispositivo',  # ← Necesario (datos del dispositivo asignado)
    ...
)

# Device history
assignments = device.assignment_set.select_related(
    'empleado',     # ← Necesario (datos del empleado asignado)
    ...
).prefetch_related('return')  # ← También carga devoluciones
```

**¿Por qué prefetch_related para return?**
- `Return` tiene relación OneToOne con `Assignment`
- `select_related` solo funciona con ForeignKey y OneToOne "hacia adelante"
- `prefetch_related` hace query separada y une en Python (más eficiente que N+1)

**Respuesta JSON:**
```json
{
  "device": {
    "id": 10,
    "tipo_equipo": "LAPTOP",
    "marca": "Apple",
    "modelo": "MacBook Pro",
    "serie_imei": "ABC123",
    "estado": "ASIGNADO"
  },
  "total_assignments": 8,
  "active_assignment": true,
  "assignments": [
    {
      "id": 45,
      "empleado_detail": {
        "id": 5,
        "rut": "12.345.678-9",
        "nombre_completo": "Juan Pérez",
        "cargo": "Desarrollador"
      },
      "fecha_entrega": "2025-01-15",
      "estado_asignacion": "ACTIVA"
    },
    // ... más asignaciones
  ]
}
```

---

### 14.6 Endpoint de Estadísticas

#### GET /api/stats/dashboard/

**Archivo:** apps/devices/views.py (líneas 66-146)

**Arquitectura:**

**StatsViewSet (viewsets.ViewSet)**
- No hereda de ModelViewSet (no tiene modelo asociado)
- Solo proporciona custom actions
- Más ligero que ModelViewSet cuando no se necesita CRUD

**Queries de agregación:**

1. **Dispositivos por estado:**
```python
devices_by_status = Device.objects.values('estado').annotate(
    total=Count('id')
).order_by('estado')

# SQL generado:
# SELECT estado, COUNT(id) as total
# FROM devices
# GROUP BY estado
# ORDER BY estado;

# Resultado:
# [
#   {'estado': 'ASIGNADO', 'total': 45},
#   {'estado': 'DISPONIBLE', 'total': 23},
#   {'estado': 'MANTENIMIENTO', 'total': 5}
# ]
```

2. **Dispositivos por tipo:**
```python
devices_by_type = Device.objects.values('tipo_equipo').annotate(
    total=Count('id')
)

# Resultado:
# [
#   {'tipo_equipo': 'LAPTOP', 'total': 50},
#   {'tipo_equipo': 'TELEFONO', 'total': 120},
#   {'tipo_equipo': 'TABLET', 'total': 15}
# ]
```

3. **Dispositivos por sucursal:**
```python
devices_by_branch = Device.objects.values(
    'sucursal__nombre',    # JOIN con Branch
    'sucursal__codigo'
).annotate(total=Count('id')).order_by('-total')

# SQL con JOIN:
# SELECT
#   branches.nombre,
#   branches.codigo,
#   COUNT(devices.id) as total
# FROM devices
# JOIN branches ON devices.sucursal_id = branches.id
# GROUP BY branches.nombre, branches.codigo
# ORDER BY total DESC;
```

**Conversión a diccionario:**
```python
# Lista de dicts → Dict simple (mejor para frontend)
devices_by_status_dict = {
    item['estado']: item['total']
    for item in devices_by_status
}

# Resultado:
# {
#   'ASIGNADO': 45,
#   'DISPONIBLE': 23,
#   'MANTENIMIENTO': 5
# }
```

**Últimas 5 asignaciones:**
```python
recent_assignments = Assignment.objects.select_related(
    'empleado',
    'dispositivo',
    'created_by'
).order_by('-created_at')[:5]  # LIMIT 5 en SQL
```

**Respuesta completa:**
```json
{
  "summary": {
    "total_devices": 150,
    "available_devices": 45,
    "active_employees": 78,
    "active_assignments": 105
  },
  "devices_by_status": {
    "DISPONIBLE": 45,
    "ASIGNADO": 90,
    "MANTENIMIENTO": 10,
    "BAJA": 5
  },
  "devices_by_type": {
    "LAPTOP": 60,
    "TELEFONO": 70,
    "TABLET": 15,
    "SIM": 5
  },
  "devices_by_branch": [
    {"sucursal__nombre": "Casa Matriz Santiago", "sucursal__codigo": "SCL-01", "total": 80},
    {"sucursal__nombre": "Valparaíso Centro", "sucursal__codigo": "VAL-01", "total": 50},
    {"sucursal__nombre": "Concepción Plaza", "sucursal__codigo": "CON-01", "total": 20}
  ],
  "recent_assignments": [
    // ... últimas 5 asignaciones con datos completos
  ]
}
```

**Routing:**
```python
# apps/devices/urls_stats.py
router = DefaultRouter()
router.register(r'', StatsViewSet, basename='stats')

# config/urls.py
path('api/stats/', include('apps.devices.urls_stats')),

# URL final:
# GET /api/stats/dashboard/
#     └── StatsViewSet.dashboard() action
```

---

### 14.7 Prevención de Eliminación

Ya implementado en Fase 2, pero crítico para la lógica de negocio.

**Implementación en Employee y Device:**
```python
def delete(self, *args, **kwargs):
    """
    Sobrescribe el método delete() de Django.

    Flujo:
    1. Verifica si hay asignaciones activas
    2. Si las hay, lanza ProtectedError
    3. Si no, permite eliminación normal
    """
    if self.has_active_assignments():
        raise models.ProtectedError(
            "No se puede eliminar porque tiene asignaciones activas",
            self
        )
    super().delete(*args, **kwargs)
```

**Ventaja sobre on_delete=PROTECT:**
- `on_delete=PROTECT` previene eliminación si hay FK apuntando
- Este método personalizado permite lógica condicional
- Solo protege si asignaciones están ACTIVAS (no todas las asignaciones)

**Ejemplo de flujo:**
```
Admin intenta eliminar Device #42
    ↓
Django llama device.delete()
    ↓
has_active_assignments() → Consulta Assignment.objects.filter(
    dispositivo=42,
    estado_asignacion='ACTIVA'
)
    ↓
¿Existen asignaciones activas?
    ↓ SÍ
ProtectedError lanzado
    ↓
HTTP 400 Bad Request
    ↓
Mensaje al usuario: "No se puede eliminar el dispositivo porque tiene una asignación activa"
```

---

### 14.8 Resumen de Archivos Creados/Modificados

#### Archivos Nuevos

1. **apps/assignments/signals.py**
   - Señales para cambio automático de estado de dispositivos
   - Lógica de devolución automática
   - 60 líneas de código

2. **apps/employees/validators.py**
   - Validación completa de RUT chileno
   - Función format_rut() auxiliar
   - Algoritmo de dígito verificador
   - 90 líneas de código

3. **apps/users/signals.py**
   - Sistema de auditoría automático
   - Señales para Employee, Device, Assignment, Return
   - Funciones auxiliares: create_audit_log(), get_model_changes()
   - 200 líneas de código

4. **apps/devices/urls_stats.py**
   - Router para StatsViewSet
   - 15 líneas de código

#### Archivos Modificados

1. **apps/devices/models.py**
   - Mejorado change_status() con auditoría
   - Import de json (línea 3)
   - Líneas 47-74 modificadas

2. **apps/employees/models.py**
   - Import de validate_rut (línea 3)
   - Campo rut con validador (líneas 15-21)

3. **apps/employees/views.py**
   - Imports: action, Response (líneas 2-3)
   - Endpoint history() (líneas 26-58)
   - 35 líneas agregadas

4. **apps/devices/views.py**
   - Imports: action, Response, Count, Q (líneas 2-5)
   - Endpoint history() (líneas 26-60)
   - StatsViewSet completo (líneas 66-146)
   - 85 líneas agregadas

5. **apps/assignments/apps.py**
   - Método ready() para registrar señales (líneas 9-13)

6. **apps/users/apps.py**
   - Método ready() para registrar señales (líneas 9-13)

7. **config/urls.py**
   - Ruta /api/stats/ (línea 28)

---

### 14.9 Flujos de Negocio Completos

#### Flujo: Crear Asignación

```
1. POST /api/assignments/assignments/
   Body: {
     "empleado": 5,
     "dispositivo": 10,
     "tipo_entrega": "PERMANENTE",
     "fecha_entrega": "2025-01-15",
     "estado_asignacion": "ACTIVA"
   }
   ↓
2. AssignmentSerializer.validate_dispositivo()
   - Verifica que dispositivo.estado == 'DISPONIBLE'
   - Si no, lanza ValidationError
   ↓
3. AssignmentViewSet.perform_create()
   - Agrega created_by = request.user
   ↓
4. Django guarda Assignment en BD
   ↓
5. Signal: assignment_post_save() activado
   - Detecta estado_asignacion == 'ACTIVA'
   - Llama dispositivo.change_status('ASIGNADO', user)
   ↓
6. Device.change_status()
   - Actualiza device.estado = 'ASIGNADO'
   - Guarda en BD
   - Crea AuditLog del cambio
   ↓
7. Signal: device_post_save() activado
   - Crea otro AuditLog para el UPDATE general
   ↓
8. Signal: assignment_post_save() activado (del paso 4)
   - Crea AuditLog de creación de Assignment
   ↓
9. Respuesta HTTP 201 Created
   - Retorna Assignment serializada con datos anidados
```

**Resultado final:**
- 1 Assignment creada (estado: ACTIVA)
- 1 Device actualizado (estado: DISPONIBLE → ASIGNADO)
- 3 registros en AuditLog:
  1. CREATE Assignment
  2. UPDATE Device (change_status específico)
  3. UPDATE Device (post_save general)

---

#### Flujo: Registrar Devolución

```
1. POST /api/assignments/returns/
   Body: {
     "asignacion": 45,
     "fecha_devolucion": "2025-02-01",
     "estado_dispositivo": "OPTIMO",
     "observaciones": "Sin daños"
   }
   ↓
2. ReturnSerializer.validate_asignacion()
   - Verifica que asignacion.estado_asignacion == 'ACTIVA'
   - Verifica que no tenga ya una devolución
   ↓
3. ReturnSerializer.validate()
   - Verifica fecha_devolucion >= fecha_entrega
   ↓
4. ReturnViewSet.perform_create()
   - Agrega created_by = request.user
   ↓
5. Django guarda Return en BD
   ↓
6. Signal: return_post_save() activado
   - Obtiene asignacion y dispositivo
   - Marca asignacion.estado_asignacion = 'FINALIZADA'
   - Guarda asignacion
   ↓
7. Signal: assignment_post_save() activado
   - Crea AuditLog del UPDATE de Assignment
   ↓
8. return_post_save() continúa:
   - Como estado_dispositivo == 'OPTIMO'
   - Llama dispositivo.change_status('DISPONIBLE', user)
   ↓
9. Device.change_status()
   - Actualiza device.estado = 'DISPONIBLE'
   - Guarda en BD
   - Crea AuditLog del cambio
   ↓
10. Signal: device_post_save() activado
    - Crea otro AuditLog para el UPDATE general
    ↓
11. Respuesta HTTP 201 Created
    - Retorna Return serializada
```

**Resultado final:**
- 1 Return creada
- 1 Assignment actualizada (estado: ACTIVA → FINALIZADA)
- 1 Device actualizado (estado: ASIGNADO → DISPONIBLE)
- 4 registros en AuditLog:
  1. CREATE Return
  2. UPDATE Assignment
  3. UPDATE Device (change_status)
  4. UPDATE Device (post_save general)

---

### 14.10 Consideraciones de Performance

#### Señales

**Ventajas:**
- Desacoplamiento: Lógica de negocio separada de ViewSets
- Reutilizable: Funciona desde Admin, API, shell, fixtures
- Mantenible: Cambios centralizados

**Desventajas:**
- Overhead: Cada save() ejecuta múltiples señales
- Debugging: Flujo menos obvio (código se ejecuta "mágicamente")
- Recursión: Riesgo de loops infinitos si no se controla

**Mitigación:**
```python
# Evitar señales en bulk operations
Device.objects.bulk_update(devices, ['estado'])  # NO activa signals

# Evitar recursión
if hasattr(instance, '_skip_audit'):
    return  # No ejecutar señal
```

#### Queries de Agregación

**Estadísticas:**
- Todas las queries usan índices (estado, tipo_equipo, etc.)
- Agregaciones en BD (COUNT) son más rápidas que len() en Python
- values() + annotate() genera queries optimizadas

**Cacheo futuro:**
```python
# Usar cache de Django para estadísticas
from django.core.cache import cache

def dashboard(self, request):
    stats = cache.get('dashboard_stats')
    if not stats:
        stats = calculate_stats()  # Queries pesadas
        cache.set('dashboard_stats', stats, 60*5)  # 5 minutos
    return Response(stats)
```

#### Historial

**select_related vs prefetch_related:**
- `select_related`: ForeignKey, OneToOne → SQL JOIN (1 query)
- `prefetch_related`: ManyToMany, reverse FK → 2+ queries, join en Python

**Paginación recomendada:**
```python
# Para empleados con muchas asignaciones
from rest_framework.pagination import PageNumberPagination

class HistoryPagination(PageNumberPagination):
    page_size = 20

# En el ViewSet
assignments = employee.assignment_set.all()
paginator = HistoryPagination()
page = paginator.paginate_queryset(assignments, request)
```

---

### 14.11 Testing y Validación

#### Tests Manuales Realizados

1. **Cambio de estado:**
```bash
# Shell de Django
python manage.py shell

from apps.devices.models import Device
from apps.users.models import User

device = Device.objects.first()
user = User.objects.first()
device.change_status('ASIGNADO', user=user)

# Verificar AuditLog
from apps.users.audit import AuditLog
AuditLog.objects.filter(entity_type='Device', entity_id=device.id).last()
```

2. **Validación de RUT:**
```bash
# Desde API
curl -X POST http://localhost:8000/api/employees/ \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "rut": "12345678-0",  # DV incorrecto
    "nombre_completo": "Test",
    "cargo": "Test",
    "sucursal": 1
  }'

# Esperado: HTTP 400 con mensaje de error del DV
```

3. **Historial:**
```bash
curl http://localhost:8000/api/employees/1/history/ \
  -H "Authorization: Bearer {token}"

# Verifica que retorne JSON con assignments
```

4. **Estadísticas:**
```bash
curl http://localhost:8000/api/stats/dashboard/ \
  -H "Authorization: Bearer {token}"

# Verifica que summary contenga números correctos
```

---

## 📂 Arquitectura de Archivos del Módulo de Empleados (Fase 9)

### Frontend - Estructura de Archivos

#### **1. Tipos y Definiciones (`frontend/lib/types.ts`)**

**Propósito:** Define todas las interfaces TypeScript para garantizar type safety en toda la aplicación.

**Interfaces clave:**
- `Employee`: Representa un empleado con todos sus atributos (RUT, nombre, cargo, sucursal, etc.)
- `EmployeeHistory`: Contiene historial de asignaciones de un empleado
- `Branch`: Define estructura de sucursales
- `Assignment`: Representa asignaciones de dispositivos a empleados

**Convención de nombres:** Usa snake_case para alinearse con el backend Django (nombre_completo, correo_corporativo, etc.)

**Ejemplo:**
```typescript
export interface Employee {
  id: number
  rut: string
  nombre_completo: string
  cargo: string
  sucursal: number
  sucursal_detail?: Branch
  estado: "ACTIVO" | "INACTIVO"
  // ... más campos
}
```

#### **2. Cliente API (`frontend/lib/api-client.ts`)**

**Propósito:** Clase centralizada para todas las peticiones HTTP al backend.

**Responsabilidades:**
- Configurar URL base desde `NEXT_PUBLIC_API_URL`
- Agregar token JWT automáticamente a headers
- Métodos HTTP: GET, POST, PUT, PATCH, DELETE
- Manejo centralizado de errores
- Sincronización de token con localStorage

**Características clave:**
```typescript
class ApiClient {
  setToken(token: string | null) // Sincroniza token
  async get<T>(endpoint: string) // Peticiones GET
  async post<T>(endpoint: string, data?: unknown) // Crear recursos
  async patch<T>(endpoint: string, data?: unknown) // Actualización parcial
  async delete<T>(endpoint: string) // Eliminar recursos
}
```

**Uso:** Todas las peticiones al backend deben pasar por esta clase para garantizar consistencia.

#### **3. Servicio de Empleados (`frontend/lib/services/employee-service.ts`)**

**Propósito:** Capa de abstracción para todas las operaciones relacionadas con empleados.

**Endpoints cubiertos:**
- `GET /api/employees/` - Lista paginada con filtros
- `GET /api/employees/{id}/` - Detalle de empleado
- `GET /api/employees/{id}/history/` - Historial de asignaciones
- `POST /api/employees/` - Crear empleado
- `PATCH /api/employees/{id}/` - Actualizar empleado
- `DELETE /api/employees/{id}/` - Eliminar empleado

**Filtros soportados:**
```typescript
interface EmployeeFilters {
  search?: string           // Buscar por nombre o RUT
  sucursal?: number        // Filtrar por sucursal
  estado?: "ACTIVO" | "INACTIVO"  // Filtrar por estado
  page?: number            // Paginación
  page_size?: number       // Tamaño de página
}
```

**Patrón de respuesta paginada:**
```typescript
interface EmployeePaginatedResponse {
  count: number
  next: string | null
  previous: string | null
  results: Employee[]
}
```

#### **4. Servicio de Sucursales (`frontend/lib/services/branch-service.ts`)**

**Propósito:** Gestionar operaciones con sucursales.

**Endpoints:**
- `GET /api/branches/` - Lista de sucursales con paginación
- `GET /api/branches/{id}/` - Detalle de sucursal
- `POST /api/branches/` - Crear sucursal
- `PUT /api/branches/{id}/` - Actualizar sucursal
- `DELETE /api/branches/{id}/` - Eliminar sucursal

**Uso en módulo de empleados:** Cargar lista de sucursales para selects en formularios de creación/edición.

#### **5. Store de Autenticación (`frontend/lib/store/auth-store.ts`)**

**Propósito:** Gestión global del estado de autenticación usando Zustand.

**Estado gestionado:**
```typescript
interface AuthStore {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setAuth: (user, accessToken, refreshToken) => void
  clearAuth: () => void
  updateUser: (user) => void
  initializeAuth: () => void
}
```

**Persistencia:** Datos guardados en localStorage como `techtrace-auth`

**Sincronización:**
- Sincroniza token con ApiClient automáticamente
- Actualiza cookie `techtrace-auth` para middleware
- Limpia todo el estado en logout

#### **6. Página de Lista de Empleados (`frontend/app/dashboard/employees/page.tsx`)**

**Propósito:** Vista principal de gestión de empleados.

**Características:**
- **Búsqueda en tiempo real:** Debounce de 300ms para optimizar peticiones
- **Filtros múltiples:** Por sucursal y estado (activo/inactivo)
- **Tabla interactiva:** Con acciones de ver, editar y eliminar
- **Skeleton loaders:** Estados de carga visual
- **Modal de confirmación:** AlertDialog para eliminar con validación
- **Estadísticas:** Contador de empleados en tiempo real

**Estado local:**
```typescript
const [employees, setEmployees] = useState<Employee[]>([])
const [branches, setBranches] = useState<Branch[]>([])
const [searchQuery, setSearchQuery] = useState("")
const [selectedBranch, setSelectedBranch] = useState("")
const [selectedStatus, setSelectedStatus] = useState("")
const [refreshTrigger, setRefreshTrigger] = useState(0)
```

**Patrón de actualización:** Incrementa `refreshTrigger` para forzar recarga después de crear/editar/eliminar

#### **7. Página de Detalle de Empleado (`frontend/app/dashboard/employees/[id]/page.tsx`)**

**Propósito:** Vista detallada de un empleado individual.

**Secciones:**
- **Información general:** RUT, cargo, sucursal, contactos
- **Estadísticas:** Total asignaciones, activas, finalizadas
- **Historial:** Tabla de asignaciones de dispositivos

**Patrón de carga:**
```typescript
useEffect(() => {
  const loadEmployeeData = async () => {
    const [employeeData, historyData] = await Promise.all([
      employeeService.getEmployee(employeeId),
      employeeService.getEmployeeHistory(employeeId),
    ])
    setEmployee(employeeData)
    setHistory(historyData)
  }
  loadEmployeeData()
}, [employeeId, refreshTrigger])
```

**Navegación:** Botón "Asignar Dispositivo" (preparado para implementación futura)

#### **8. Modal de Crear/Editar Empleado (`frontend/components/modals/create-employee-modal.tsx`)**

**Propósito:** Componente reutilizable para crear y editar empleados.

**Modos de operación:**
```typescript
const isEditMode = !!employee
```

**Campos del formulario:**
- RUT (disabled en modo edición)
- Nombre completo
- Cargo
- Sucursal (Select dinámico desde API)
- Correo corporativo
- Gmail personal
- Teléfono
- Unidad de negocio (Select con opciones predefinidas)
- Estado (Switch para ACTIVO/INACTIVO)

**Validaciones:**
- Campos requeridos: RUT, nombre, cargo, sucursal
- Campos opcionales: correos, teléfono, unidad
- RUT inmutable después de creación

**Flujo de guardado:**
```typescript
if (isEditMode) {
  const { rut, ...updateData } = formData
  await employeeService.updateEmployee(employee.id, updateData)
} else {
  await employeeService.createEmployee(formData)
  resetForm()
}
```

**Pre-población:** En modo edición, carga datos del empleado en `useEffect` cuando el modal se abre

### Backend - API de Empleados

#### **Endpoints disponibles:**

1. **Lista y Creación**
   - `GET /api/employees/` - Lista paginada con filtros
   - `POST /api/employees/` - Crear empleado

2. **Detalle, Actualización y Eliminación**
   - `GET /api/employees/{id}/` - Obtener empleado
   - `PATCH /api/employees/{id}/` - Actualización parcial
   - `PUT /api/employees/{id}/` - Actualización completa
   - `DELETE /api/employees/{id}/` - Eliminar empleado

3. **Historial**
   - `GET /api/employees/{id}/history/` - Historial de asignaciones

**Parámetros de filtrado:**
- `search`: Busca en nombre_completo y rut
- `sucursal`: Filtra por ID de sucursal
- `estado`: ACTIVO o INACTIVO
- `page`: Número de página
- `page_size`: Tamaño de página (default: 10)

### Patrones de Diseño Implementados

#### **1. Service Layer Pattern**
Toda la lógica de API está encapsulada en servicios (`employee-service.ts`, `branch-service.ts`), separando la lógica de negocio de los componentes UI.

#### **2. Repository Pattern**
`ApiClient` actúa como repositorio centralizado, proporcionando una interfaz consistente para todas las peticiones HTTP.

#### **3. State Management Pattern**
- **Global:** Zustand para autenticación
- **Local:** useState/useCallback para estado de componentes
- **Server State:** No usa React Query, pero implementa patrón similar con `refreshTrigger`

#### **4. Modal Composition Pattern**
Modal reutilizable que acepta `employee` prop opcional:
- Sin prop → Modo creación
- Con prop → Modo edición

#### **5. Optimistic UI Pattern**
Cierra modal y actualiza lista antes de mostrar toast de confirmación para mejor UX.

#### **6. Debounce Pattern**
Búsqueda con delay de 300ms para reducir peticiones al backend:
```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    loadEmployees()
  }, 300)
  return () => clearTimeout(timer)
}, [loadEmployees, refreshTrigger])
```

### Consideraciones de Seguridad

1. **Autenticación JWT:** Todos los endpoints requieren token válido
2. **Validación de RUT:** RUT no editable después de creación
3. **Eliminación protegida:** Backend valida que no existan asignaciones activas
4. **CORS:** Configurado para permitir solo orígenes específicos
5. **Sanitización:** DRF serializers validan todos los inputs

### Mejoras Futuras Planificadas

1. **Paginación completa:** Implementar controles de paginación en UI
2. **Export a CSV/Excel:** Botón para exportar lista de empleados
3. **Filtros avanzados:** Rango de fechas, unidad de negocio
4. **Bulk operations:** Selección múltiple para acciones en lote
5. **Real-time updates:** WebSockets para sincronización en tiempo real

---

## MÓDULO DE DISPOSITIVOS (Fase 10)

### Arquitectura del Módulo

El módulo de dispositivos sigue el mismo patrón arquitectónico que los módulos de Sucursales y Empleados, implementando un CRUD completo con funcionalidades adicionales específicas como cambio manual de estado y gestión de asignaciones.

### Frontend - Estructura de Archivos

```
frontend/
├── lib/
│   ├── types.ts                              # Tipos TypeScript actualizados
│   │   ├── Device interface                  # Interfaz principal del dispositivo
│   │   ├── DeviceHistory interface           # Historial de asignaciones
│   │   ├── TipoEquipo enum                   # LAPTOP | TELEFONO | TABLET | SIM | ACCESORIO
│   │   ├── EstadoDispositivo enum            # DISPONIBLE | ASIGNADO | MANTENIMIENTO | BAJA | ROBO
│   │   └── Assignment interface (actualizada) # Con campos del backend
│   │
│   └── services/
│       └── device-service.ts                 # Servicio de API de dispositivos
│           ├── getDevices()                  # Lista con filtros múltiples
│           ├── getDevice()                   # Detalle de dispositivo
│           ├── getDeviceHistory()            # Historial de asignaciones
│           ├── createDevice()                # Crear dispositivo
│           ├── updateDevice()                # Actualizar parcialmente
│           ├── deleteDevice()                # Eliminar dispositivo
│           ├── changeDeviceStatus()          # Cambio manual de estado
│           ├── getAvailableDevices()         # Solo dispositivos DISPONIBLE
│           └── Helper Functions:
│               ├── getDeviceStatusColor()    # Colores de badges por estado
│               ├── getDeviceStatusLabel()    # Etiquetas traducidas
│               ├── getDeviceTypeLabel()      # Nombres de tipos de equipo
│               └── getDeviceTypeIcon()       # Emojis por tipo de equipo
│
├── app/dashboard/devices/
│   ├── page.tsx                              # Listado principal de dispositivos
│   │   ├── Tabla con 7 columnas             # Tipo, Marca, Modelo, Serie/IMEI, Estado, Sucursal, Acciones
│   │   ├── Búsqueda en tiempo real          # Debounce 300ms
│   │   ├── Filtros combinados:
│   │   │   ├── Tipo de equipo               # Select con 5 tipos
│   │   │   ├── Estado                       # Select con 5 estados
│   │   │   └── Sucursal                     # Select dinámico desde API
│   │   ├── Badges de colores                # Verde, Azul, Amarillo, Gris, Rojo
│   │   ├── Skeleton loaders                 # Durante carga
│   │   └── CRUD Actions:
│   │       ├── Ver detalle (Eye icon)
│   │       ├── Editar (Edit2 icon)
│   │       └── Eliminar (Trash2 icon)
│   │
│   └── [id]/
│       └── page.tsx                          # Detalle del dispositivo
│           ├── Header con navegación        # Breadcrumb y botones de acción
│           ├── Información General          # Card con todos los datos del dispositivo
│           ├── Estadísticas (3 cards):
│           │   ├── Total Asignaciones       # Con || 0 para evitar NaN
│           │   ├── Asignaciones Activas     # Verde, con || 0
│           │   └── Asignaciones Finalizadas # Gris, cálculo seguro
│           ├── Historial de Asignaciones    # Tabla con empleado, fechas, tipo, estado
│           └── Acciones:
│               ├── Cambiar Estado           # Dialog modal
│               ├── Editar                   # Abre DeviceModal
│               └── Asignar                  # Solo si estado = DISPONIBLE
│
└── components/modals/
    └── device-modal.tsx                      # Modal crear/editar dispositivo
        ├── Modo detección automática        # isEditMode = !!device
        ├── Formulario completo:
        │   ├── Tipo de equipo (Select)      # 5 opciones
        │   ├── Marca y Modelo               # Text inputs
        │   ├── Serie/IMEI                   # No editable en modo edición
        │   ├── Número de teléfono           # Requerido solo para TELEFONO/SIM
        │   ├── Número de factura            # Opcional
        │   ├── Estado (Select)              # 5 estados
        │   ├── Sucursal (Select)            # Dinámico desde API
        │   └── Fecha de ingreso             # Date picker
        ├── Validaciones frontend:
        │   ├── Campos requeridos dinámicos
        │   ├── Número teléfono condicional
        │   └── Serie/IMEI única (backend)
        └── Pre-llenado en modo edición
```

### Tipos TypeScript - device-service.ts

#### **Interfaces principales:**

```typescript
export interface DeviceFilters {
  search?: string               // Busca en marca, modelo, serie_imei
  tipo_equipo?: TipoEquipo | ""
  estado?: EstadoDispositivo | ""
  sucursal?: number
  page?: number
  page_size?: number
  ordering?: string
}

export interface CreateDeviceData {
  tipo_equipo: TipoEquipo
  marca: string
  modelo: string
  serie_imei: string
  numero_telefono?: string
  numero_factura?: string
  estado: EstadoDispositivo
  sucursal: number
  fecha_ingreso: string
}

export interface DevicePaginatedResponse {
  count: number
  next: string | null
  previous: string | null
  results: Device[]
}
```

#### **Helper Functions:**

```typescript
// Retorna clases de Tailwind para badges de estado
getDeviceStatusColor(estado: EstadoDispositivo): string
// Ejemplo: "bg-green-100 text-green-800 border-green-200"

// Retorna etiqueta en español
getDeviceStatusLabel(estado: EstadoDispositivo): string
// Ejemplo: "Disponible"

// Retorna nombre del tipo de equipo
getDeviceTypeLabel(tipo: TipoEquipo): string
// Ejemplo: "Laptop"

// Retorna emoji representativo
getDeviceTypeIcon(tipo: TipoEquipo): string
// Ejemplo: "💻"
```

### Página de Listado - devices/page.tsx

#### **Estado del componente:**

```typescript
const [devices, setDevices] = useState<Device[]>([])
const [branches, setBranches] = useState<Branch[]>([])
const [loading, setLoading] = useState(true)
const [searchQuery, setSearchQuery] = useState("")
const [selectedType, setSelectedType] = useState<string>("")
const [selectedStatus, setSelectedStatus] = useState<string>("")
const [selectedBranch, setSelectedBranch] = useState<string>("")
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null)
const [refreshTrigger, setRefreshTrigger] = useState(0)
const [modalOpen, setModalOpen] = useState(false)
const [deviceToEdit, setDeviceToEdit] = useState<Device | null>(null)
```

#### **Carga de datos con filtros:**

```typescript
const loadDevices = useCallback(async () => {
  try {
    setLoading(true)
    const response = await deviceService.getDevices({
      search: searchQuery || undefined,
      tipo_equipo: selectedType ? (selectedType as TipoEquipo) : undefined,
      estado: selectedStatus ? (selectedStatus as EstadoDispositivo) : undefined,
      sucursal: selectedBranch ? Number(selectedBranch) : undefined,
      page_size: 100,
    })
    setDevices(response.results)
  } catch (error) {
    toast({ title: "Error", description: error.message, variant: "destructive" })
  } finally {
    setLoading(false)
  }
}, [searchQuery, selectedType, selectedStatus, selectedBranch, toast])
```

#### **Búsqueda con debounce:**

```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    loadDevices()
  }, 300) // Debounce de 300ms
  return () => clearTimeout(timer)
}, [loadDevices, refreshTrigger])
```

#### **Badges de colores por estado:**

Los badges utilizan clases de Tailwind dinámicas basadas en el estado:
- **DISPONIBLE:** `bg-green-100 text-green-800` (Verde)
- **ASIGNADO:** `bg-blue-100 text-blue-800` (Azul)
- **MANTENIMIENTO:** `bg-yellow-100 text-yellow-800` (Amarillo)
- **BAJA:** `bg-gray-100 text-gray-800` (Gris)
- **ROBO:** `bg-red-100 text-red-800` (Rojo)

### Modal de Dispositivo - device-modal.tsx

#### **Props del modal:**

```typescript
interface DeviceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  device?: Device | null          // null = crear, Device = editar
  onSuccess?: () => void
}
```

#### **Validación dinámica del número de teléfono:**

```typescript
const isTelefonoRequired = formData.tipo_equipo === "TELEFONO" || formData.tipo_equipo === "SIM"

// En el form:
<Input
  id="numero_telefono"
  name="numero_telefono"
  value={formData.numero_telefono}
  onChange={handleInputChange}
  placeholder="+56 9 1234 5678"
  required={isTelefonoRequired}  // ← Requerido condicionalmente
/>
```

#### **Protección del campo Serie/IMEI:**

```typescript
<Input
  id="serie_imei"
  name="serie_imei"
  value={formData.serie_imei}
  onChange={handleInputChange}
  required
  disabled={isEditMode}  // ← No editable en modo edición
  className={isEditMode ? "bg-muted cursor-not-allowed" : ""}
/>
```

#### **Manejo de creación vs edición:**

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  if (isEditMode && device) {
    // Excluir serie_imei en actualización
    const { serie_imei, ...updateData } = formData
    await deviceService.updateDevice(device.id, updateData)
  } else {
    // Incluir todos los campos en creación
    await deviceService.createDevice(formData)
  }
}
```

### Página de Detalle - devices/[id]/page.tsx

#### **Estado del componente:**

```typescript
const [device, setDevice] = useState<Device | null>(null)
const [history, setHistory] = useState<DeviceHistory | null>(null)
const [loading, setLoading] = useState(true)
const [editModalOpen, setEditModalOpen] = useState(false)
const [changeStatusDialogOpen, setChangeStatusDialogOpen] = useState(false)
const [newStatus, setNewStatus] = useState<EstadoDispositivo>("DISPONIBLE")
const [changingStatus, setChangingStatus] = useState(false)
```

#### **Carga paralela de datos:**

```typescript
useEffect(() => {
  const loadDeviceData = async () => {
    try {
      setLoading(true)
      // Carga paralela para optimizar performance
      const [deviceData, historyData] = await Promise.all([
        deviceService.getDevice(deviceId),
        deviceService.getDeviceHistory(deviceId),
      ])
      setDevice(deviceData)
      setHistory(historyData)
      setNewStatus(deviceData.estado)
    } catch (error) {
      toast({ title: "Error", description: error.message })
      router.push("/dashboard/devices")
    } finally {
      setLoading(false)
    }
  }
  loadDeviceData()
}, [deviceId, router, toast, refreshTrigger])
```

#### **Estadísticas con protección contra NaN:**

```typescript
<div className="text-3xl font-bold">{history.total_assignments || 0}</div>
<div className="text-3xl font-bold text-green-600">{history.active_assignments || 0}</div>
<div className="text-3xl font-bold text-muted-foreground">
  {(history.total_assignments || 0) - (history.active_assignments || 0)}
</div>
```

**Explicación:** El operador `|| 0` asegura que si el valor es `undefined`, `null`, o `0`, siempre se muestre "0" en lugar de vacío o "NaN".

#### **Cambio manual de estado:**

```typescript
const handleStatusChange = async () => {
  if (!device) return
  try {
    setChangingStatus(true)
    await deviceService.changeDeviceStatus(device.id, newStatus)
    toast({
      title: "Estado actualizado",
      description: `El estado del dispositivo ha sido cambiado a ${getDeviceStatusLabel(newStatus)}.`,
    })
    setRefreshTrigger(prev => prev + 1)
    setChangeStatusDialogOpen(false)
  } catch (error) {
    toast({ title: "Error", description: error.message, variant: "destructive" })
  } finally {
    setChangingStatus(false)
  }
}
```

#### **Botón "Asignar" condicional:**

```typescript
{device.estado === "DISPONIBLE" && (
  <Button>
    <Package className="h-4 w-4 mr-2" />
    Asignar
  </Button>
)}
```

Solo se muestra si el dispositivo está disponible para asignación.

#### **Dialog de cambio de estado:**

El dialog excluye el estado "ASIGNADO" de las opciones manuales:

```typescript
<Select value={newStatus} onValueChange={(value) => setNewStatus(value as EstadoDispositivo)}>
  <SelectContent>
    <SelectItem value="DISPONIBLE">Disponible</SelectItem>
    <SelectItem value="MANTENIMIENTO">Mantenimiento</SelectItem>
    <SelectItem value="BAJA">Baja</SelectItem>
    <SelectItem value="ROBO">Robo</SelectItem>
    {/* ASIGNADO excluido - solo mediante asignación formal */}
  </SelectContent>
</Select>
<p className="text-sm text-muted-foreground mt-2">
  Nota: El estado "Asignado" solo se puede establecer mediante una asignación formal a un empleado.
</p>
```

### Backend - API de Dispositivos

#### **Endpoints disponibles:**

1. **Lista y Creación**
   - `GET /api/devices/` - Lista paginada con filtros
   - `POST /api/devices/` - Crear dispositivo

2. **Detalle, Actualización y Eliminación**
   - `GET /api/devices/{id}/` - Obtener dispositivo
   - `PATCH /api/devices/{id}/` - Actualización parcial
   - `PUT /api/devices/{id}/` - Actualización completa
   - `DELETE /api/devices/{id}/` - Eliminar dispositivo

3. **Historial**
   - `GET /api/devices/{id}/history/` - Historial de asignaciones

**Parámetros de filtrado:**
- `search`: Busca en marca, modelo y serie_imei
- `tipo_equipo`: LAPTOP, TELEFONO, TABLET, SIM, ACCESORIO
- `estado`: DISPONIBLE, ASIGNADO, MANTENIMIENTO, BAJA, ROBO
- `sucursal`: Filtra por ID de sucursal
- `page`: Número de página
- `page_size`: Tamaño de página (default: 20)

### Patrones de Diseño Implementados

#### **1. Service Layer Pattern**
Toda la lógica de API encapsulada en `device-service.ts`, separando la lógica de negocio de los componentes UI.

#### **2. Helper Functions Pattern**
Funciones auxiliares (`getDeviceStatusColor`, `getDeviceTypeLabel`, etc.) exportadas desde el servicio para reutilización consistente en toda la aplicación.

#### **3. Modal Composition Pattern**
Modal reutilizable que acepta prop `device` opcional:
- Sin prop → Modo creación
- Con prop → Modo edición

#### **4. Conditional Validation Pattern**
Validación dinámica del campo `numero_telefono` basada en `tipo_equipo`:
```typescript
const isTelefonoRequired = tipo_equipo === "TELEFONO" || tipo_equipo === "SIM"
```

#### **5. Optimistic UI Pattern**
Cierra modal y actualiza lista antes de mostrar toast de confirmación.

#### **6. Debounce Pattern**
Búsqueda con delay de 300ms para reducir peticiones al backend.

#### **7. Parallel Data Loading Pattern**
Uso de `Promise.all()` para cargar dispositivo e historial simultáneamente:
```typescript
const [deviceData, historyData] = await Promise.all([
  deviceService.getDevice(deviceId),
  deviceService.getDeviceHistory(deviceId),
])
```

#### **8. Safe Arithmetic Pattern**
Uso de `|| 0` para evitar NaN en operaciones aritméticas con valores potencialmente undefined:
```typescript
{(history.total_assignments || 0) - (history.active_assignments || 0)}
```

### Consideraciones de Seguridad

1. **Autenticación JWT:** Todos los endpoints requieren token válido
2. **Validación de Serie/IMEI:** Serie/IMEI no editable después de creación
3. **Eliminación protegida:** Backend valida que no existan asignaciones activas
4. **Estado ASIGNADO:** Solo se puede establecer mediante asignación formal, no manualmente
5. **Auditoría automática:** Todos los cambios de estado se registran en AuditLog
6. **CORS:** Configurado para permitir solo orígenes específicos
7. **Sanitización:** DRF serializers validan todos los inputs

### Mejoras Futuras Planificadas

1. **Paginación completa:** Implementar controles de paginación en UI
2. **Export a CSV/Excel:** Botón para exportar lista de dispositivos
3. **Filtros avanzados:** Rango de fechas de ingreso, múltiples estados
4. **Bulk operations:** Selección múltiple para cambio de estado en lote
5. **QR Code generation:** Generar QR codes para serie/IMEI
6. **Historial de mantenimiento:** Registro detallado de reparaciones
7. **Alertas de garantía:** Notificaciones cuando se acerca vencimiento
8. **Upload de facturas:** Adjuntar PDF de factura de compra

### Lecciones Aprendidas - Fase 10

1. **Operador || 0 para valores numéricos:** Esencial para evitar NaN en estadísticas cuando no hay datos
2. **Validación condicional de campos:** React permite validación dinámica del atributo `required`
3. **Exclusión de campos en edición:** Usar destructuring para excluir `serie_imei` en updates
4. **Helper functions en servicios:** Mantener funciones UI cerca de la lógica de datos mejora cohesión
5. **Badges con clases dinámicas:** Mejor usar helper functions que lógica inline en JSX
6. **Promise.all para performance:** Cargar datos relacionados en paralelo reduce tiempo de espera
7. **Consistencia en tipos:** snake_case en backend, snake_case en frontend (no camelCase) para evitar transformaciones

---

## 11. Módulo de Asignaciones (Frontend + Backend)

### Descripción General

El módulo de asignaciones maneja el ciclo de vida completo de la gestión de dispositivos:
1. **Solicitudes:** Empleados/jefaturas solicitan dispositivos
2. **Aprobación:** Las solicitudes son aprobadas/rechazadas
3. **Asignación:** Dispositivos son asignados a empleados
4. **Devolución:** Registro del retorno de dispositivos

Este módulo es el **core del negocio** ya que conecta Empleados, Dispositivos y gestiona el flujo operativo completo.

### Arquitectura del Módulo

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO DE ASIGNACIONES                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. SOLICITUD (Request)                                      │
│     ├─ Estado: PENDIENTE                                     │
│     ├─ Jefatura solicita dispositivo para empleado          │
│     └─ Tipo de dispositivo requerido                         │
│                    ↓                                         │
│  2. APROBACIÓN                                               │
│     ├─ Revisar solicitud                                     │
│     ├─ APROBAR → Estado: APROBADA                           │
│     └─ RECHAZAR → Estado: RECHAZADA (fin)                   │
│                    ↓                                         │
│  3. ASIGNACIÓN (Assignment)                                  │
│     ├─ Seleccionar dispositivo DISPONIBLE                    │
│     ├─ Crear asignación (vinculada a solicitud)             │
│     ├─ Solicitud → COMPLETADA                               │
│     ├─ Dispositivo → ASIGNADO (automático)                  │
│     └─ Asignación → ACTIVA                                  │
│                    ↓                                         │
│  4. DEVOLUCIÓN (Return)                                      │
│     ├─ Registrar fecha de devolución                        │
│     ├─ Estado del dispositivo (OPTIMO/CON_DANOS/NO_FUNC)   │
│     ├─ Asignación → FINALIZADA (automático)                │
│     └─ Dispositivo → DISPONIBLE o MANTENIMIENTO             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Estructura de Archivos

```
frontend/
├── lib/
│   ├── types.ts                           # Tipos Request, Assignment, Return
│   ├── api-client.ts                      # Extendido con query params
│   └── services/
│       ├── request-service.ts             # API de solicitudes
│       └── assignment-service.ts          # API de asignaciones y devoluciones
│
├── app/dashboard/assignments/
│   ├── page.tsx                          # Lista de asignaciones
│   ├── requests/
│   │   └── page.tsx                      # Lista de solicitudes
│   └── [id]/
│       └── page.tsx                      # Detalle de asignación
│
└── components/modals/
    ├── request-modal.tsx                 # Crear/ver solicitudes
    ├── assignment-modal.tsx              # Crear asignaciones
    └── return-modal.tsx                  # Registrar devoluciones

backend/apps/assignments/
├── models.py                             # Request, Assignment, Return
├── serializers.py                        # Serializers con validaciones
├── views.py                              # ViewSets REST
├── signals.py                            # Cambios automáticos de estado
└── urls.py                               # Rutas de API
```

### Modelos de Datos

#### **Request (Solicitud)**
```python
- empleado: ForeignKey(Employee)
- jefatura_solicitante: CharField(max_length=200)
- tipo_dispositivo: CharField(TIPOS_CHOICES)
- justificacion: TextField(blank=True)
- fecha_solicitud: DateTimeField(auto_now_add=True)
- estado: CharField(PENDIENTE/APROBADA/RECHAZADA/COMPLETADA)
- created_by: ForeignKey(User)
```

#### **Assignment (Asignación)**
```python
- solicitud: ForeignKey(Request, null=True)  # Opcional
- empleado: ForeignKey(Employee)
- dispositivo: ForeignKey(Device)
- tipo_entrega: CharField(PERMANENTE/TEMPORAL)
- fecha_entrega: DateField
- fecha_devolucion: DateField(blank=True)
- estado_carta: CharField(FIRMADA/PENDIENTE/NO_APLICA)
- estado_asignacion: CharField(ACTIVA/FINALIZADA)
- observaciones: TextField(blank=True)
- created_by: ForeignKey(User)
```

#### **Return (Devolución)**
```python
- asignacion: OneToOneField(Assignment)
- fecha_devolucion: DateField
- estado_dispositivo: CharField(OPTIMO/CON_DANOS/NO_FUNCIONAL)
- observaciones: TextField(blank=True)
- created_by: ForeignKey(User)
```

### Servicios Frontend

#### **request-service.ts**
```typescript
// Funciones principales
getRequests(params)         // Lista con filtros
getRequest(id)             // Detalle
createRequest(data)        // Crear solicitud
updateRequest(id, data)    // Actualizar
deleteRequest(id)          // Eliminar
approveRequest(id)         // Aprobar (helper)
rejectRequest(id)          // Rechazar (helper)

// Helpers UI
getRequestStatusColor(estado)
getRequestStatusLabel(estado)
```

#### **assignment-service.ts**
```typescript
// Asignaciones
getAssignments(params)      // Lista con filtros
getAssignment(id)          // Detalle
createAssignment(data)     // Crear asignación
updateAssignment(id, data) // Actualizar
deleteAssignment(id)       // Eliminar

// Devoluciones
getReturns(params)         // Lista de devoluciones
getReturn(id)              // Detalle de devolución
createReturn(data)         // Registrar devolución
getReturnByAssignment(id)  // Obtener devolución de una asignación

// Helpers UI
getAssignmentStatusColor(estado)
getAssignmentStatusLabel(estado)
getTipoEntregaLabel(tipo)
getEstadoCartaLabel(estado)
getReturnStatusColor(estado)
getReturnStatusLabel(estado)
```

### Componentes Principales

#### **1. Página de Solicitudes** (`/dashboard/assignments/requests`)

**Características:**
- Tabla con todas las solicitudes
- Filtros: estado (PENDIENTE/APROBADA/RECHAZADA/COMPLETADA)
- Búsqueda en tiempo real
- Acciones por estado:
  - PENDIENTE: Aprobar, Rechazar, Asignar
  - APROBADA: Asignar
  - COMPLETADA: Solo ver
  - RECHAZADA: Solo ver

**Flujo de trabajo:**
```typescript
1. Usuario crea solicitud → Estado: PENDIENTE
2. Admin/Operador aprueba → Estado: APROBADA
3. Hace clic en "Asignar" → Abre AssignmentModal
4. Crea asignación → Solicitud: COMPLETADA, Dispositivo: ASIGNADO
```

#### **2. Modal de Solicitud** (`RequestModal`)

**Props:**
- `open`: boolean - Control de visibilidad
- `onClose`: function - Cerrar modal
- `onSuccess`: function - Callback después de crear/actualizar
- `request?`: Request | null - Solicitud a editar (opcional)

**Validaciones:**
- Empleado requerido (solo activos)
- Jefatura solicitante requerida
- Tipo de dispositivo requerido
- Justificación opcional

**Estados:**
- Modo creación: Sin prop `request`
- Modo solo lectura: Con prop `request`

#### **3. Página de Asignaciones** (`/dashboard/assignments`)

**Características:**
- Tabla con todas las asignaciones
- Filtros: estado (ACTIVA/FINALIZADA)
- Búsqueda en tiempo real
- Vista de empleado y dispositivo con detalles completos
- Link "Ver Detalles" navega a página de detalle
- Botón "Nueva Asignación" (independiente de solicitudes)
- Link "Ver Solicitudes"

**Columnas mostradas:**
- ID de asignación
- Empleado (nombre completo)
- Dispositivo (tipo, marca, modelo, serie)
- Tipo de entrega (Permanente/Temporal)
- Fecha de entrega
- Estado (badge con color)

#### **4. Modal de Asignación** (`AssignmentModal`)

**Props:**
- `open`: boolean
- `onClose`: function
- `onSuccess`: function
- `assignment?`: Assignment | null - Para edición
- `preSelectedEmployee?`: number - Empleado preseleccionado
- `preSelectedRequest?`: Request | null - Solicitud origen

**Características especiales:**
- **Dispositivos disponibles:** Solo muestra dispositivos con estado DISPONIBLE
- **Empleado preseleccionado:** Viene desde solicitud, campo bloqueado
- **Vinculación automática:** Si viene de solicitud, se vincula automáticamente
- **Advertencia:** Muestra mensaje si no hay dispositivos disponibles
- **Validación:** Botón submit deshabilitado si no hay dispositivos

**Campos:**
- Empleado (Select, bloqueado si viene de solicitud)
- Dispositivo (Select, solo DISPONIBLES, bloqueado en edición)
- Tipo de entrega (PERMANENTE/TEMPORAL)
- Fecha de entrega
- Estado de carta (FIRMADA/PENDIENTE/NO_APLICA)
- Observaciones (opcional)

**Flujo de creación:**
```typescript
// Desde solicitud
1. Solicitud PENDIENTE/APROBADA → Click "Asignar"
2. Modal se abre con empleado preseleccionado
3. Seleccionar dispositivo DISPONIBLE
4. Llenar datos adicionales
5. Crear asignación:
   - solicitud.estado → COMPLETADA
   - dispositivo.estado → ASIGNADO (automático por señal)
   - asignacion.estado_asignacion → ACTIVA

// Independiente
1. Click "Nueva Asignación"
2. Seleccionar empleado
3. Seleccionar dispositivo DISPONIBLE
4. Llenar datos
5. Crear (sin vinculación a solicitud)
```

#### **5. Página de Detalle de Asignación** (`/assignments/[id]`)

**Secciones:**

**A. Header:**
- Título con ID de asignación
- Botón "Registrar Devolución" (solo si ACTIVA)
- Navegación: Link de regreso

**B. Card de Estado:**
- Badge con estado actual (ACTIVA/FINALIZADA)

**C. Card de Empleado:**
- Nombre completo (link a detalle de empleado)
- RUT
- Cargo
- Sucursal

**D. Card de Dispositivo:**
- Tipo de equipo
- Marca y modelo (link a detalle de dispositivo)
- Serie/IMEI
- Estado actual

**E. Card de Detalles de Asignación:**
- Tipo de entrega
- Fecha de entrega
- Estado de carta
- Fecha de devolución (si aplica)
- Creado por (usuario)
- Fecha de creación
- Observaciones (si hay)

**F. Card de Información de Devolución** (solo si FINALIZADA):
- Fecha de devolución
- Estado del dispositivo (OPTIMO/CON_DANOS/NO_FUNCIONAL)
- Observaciones de devolución

#### **6. Modal de Devolución** (`ReturnModal`)

**Props:**
- `open`: boolean
- `onClose`: function
- `onSuccess`: function
- `assignment`: Assignment - Asignación a devolver

**Campos:**
- Fecha de devolución (pre-llenada con hoy, validada)
- Estado del dispositivo (Select con descripciones):
  - OPTIMO: Perfecto estado
  - CON_DANOS: Daños menores
  - NO_FUNCIONAL: No funciona
- Observaciones (opcional pero recomendado)

**Validaciones de fechas:**
```typescript
// Fecha de devolución NO puede ser:
1. Anterior a fecha_entrega
2. Futura (mayor a hoy)

// Validación en modal
min={assignment.fecha_entrega}
max={new Date().toISOString().split("T")[0]}
```

**Información visual:**
- Banner informativo sobre cambios automáticos:
  - Asignación → FINALIZADA
  - Dispositivo → DISPONIBLE (si OPTIMO) o MANTENIMIENTO (si daños)

**Flujo de devolución:**
```typescript
1. Usuario en detalle de asignación ACTIVA
2. Click "Registrar Devolución"
3. Modal se abre
4. Seleccionar fecha (validada)
5. Seleccionar estado del dispositivo
6. Agregar observaciones detalladas
7. Submit:
   - Crear registro Return
   - asignacion.estado_asignacion → FINALIZADA (automático)
   - asignacion.fecha_devolucion → fecha seleccionada
   - dispositivo.estado → según estado_dispositivo (automático por señal)
```

### Backend - API de Asignaciones

#### **Endpoints de Solicitudes (Requests):**

```
GET    /api/assignments/requests/           # Lista paginada
POST   /api/assignments/requests/           # Crear solicitud
GET    /api/assignments/requests/{id}/      # Detalle
PATCH  /api/assignments/requests/{id}/      # Actualizar
DELETE /api/assignments/requests/{id}/      # Eliminar
```

**Filtros disponibles:**
- `search`: Busca en empleado y jefatura
- `estado`: PENDIENTE, APROBADA, RECHAZADA, COMPLETADA
- `empleado`: ID del empleado
- `page`, `page_size`

#### **Endpoints de Asignaciones (Assignments):**

```
GET    /api/assignments/assignments/        # Lista paginada
POST   /api/assignments/assignments/        # Crear asignación
GET    /api/assignments/assignments/{id}/   # Detalle
PATCH  /api/assignments/assignments/{id}/   # Actualizar
DELETE /api/assignments/assignments/{id}/   # Eliminar
```

**Filtros disponibles:**
- `search`: Busca en empleado y dispositivo
- `estado_asignacion`: ACTIVA, FINALIZADA
- `empleado`: ID del empleado
- `dispositivo`: ID del dispositivo
- `page`, `page_size`

#### **Endpoints de Devoluciones (Returns):**

```
GET    /api/assignments/returns/            # Lista paginada
POST   /api/assignments/returns/            # Registrar devolución
GET    /api/assignments/returns/{id}/       # Detalle
```

**Filtros disponibles:**
- `estado_dispositivo`: OPTIMO, CON_DANOS, NO_FUNCIONAL
- `page`, `page_size`

### Señales (Signals) - Automatización Backend

#### **Signal: post_save Assignment**
```python
@receiver(post_save, sender=Assignment)
def update_device_status_on_assignment(sender, instance, created, **kwargs):
    """
    Cuando se crea una asignación:
    1. Cambiar dispositivo a ASIGNADO
    2. Registrar en AuditLog
    """
    if created:
        device = instance.dispositivo
        device.estado = 'ASIGNADO'
        device.save()
```

#### **Signal: post_save Return**
```python
@receiver(post_save, sender=Return)
def update_assignment_and_device_on_return(sender, instance, created, **kwargs):
    """
    Cuando se registra una devolución:
    1. Cambiar asignación a FINALIZADA
    2. Actualizar fecha_devolucion en asignación
    3. Cambiar dispositivo según estado:
       - OPTIMO → DISPONIBLE
       - CON_DANOS/NO_FUNCIONAL → MANTENIMIENTO
    4. Registrar en AuditLog
    """
    if created:
        assignment = instance.asignacion
        assignment.estado_asignacion = 'FINALIZADA'
        assignment.fecha_devolucion = instance.fecha_devolucion
        assignment.save()

        device = assignment.dispositivo
        if instance.estado_dispositivo == 'OPTIMO':
            device.estado = 'DISPONIBLE'
        else:
            device.estado = 'MANTENIMIENTO'
        device.save()
```

### Validaciones de Negocio

#### **Backend (Serializers):**
```python
# AssignmentSerializer
def validate_dispositivo(self, value):
    """
    Solo se pueden asignar dispositivos DISPONIBLES
    """
    if value.estado != 'DISPONIBLE':
        raise ValidationError("Solo se pueden asignar dispositivos disponibles")
    return value

def validate(self, data):
    """
    Si tipo_entrega es TEMPORAL, fecha_devolucion es requerida
    """
    if data.get('tipo_entrega') == 'TEMPORAL':
        if not data.get('fecha_devolucion'):
            raise ValidationError("Fecha de devolución requerida para entregas temporales")
    return data

# ReturnSerializer
def validate(self, data):
    """
    Fecha de devolución debe ser >= fecha de entrega
    """
    if data['fecha_devolucion'] < data['asignacion'].fecha_entrega:
        raise ValidationError("Fecha de devolución no puede ser anterior a fecha de entrega")
    return data
```

#### **Frontend (ReturnModal):**
```typescript
const validateDates = (): boolean => {
  const fechaEntrega = new Date(assignment.fecha_entrega)
  const fechaDevolucion = new Date(formData.fecha_devolucion)

  if (fechaDevolucion < fechaEntrega) {
    toast({ title: "Error", description: "Fecha no puede ser anterior" })
    return false
  }

  const hoy = new Date()
  if (fechaDevolucion > hoy) {
    toast({ title: "Error", description: "Fecha no puede ser futura" })
    return false
  }

  return true
}
```

### Mejora Clave: ApiClient con Query Params

Para este módulo se extendió el `ApiClient` con soporte para query parameters:

```typescript
// Antes (Fase 0-10)
apiClient.get<T>(endpoint: string)

// Ahora (Fase 11+)
apiClient.get<T>(endpoint: string, params?: Record<string, any>)

// Ejemplo de uso
const response = await apiClient.get("/assignments/requests/", {
  estado: "PENDIENTE",
  page: 1,
  page_size: 20
})
// Genera: /assignments/requests/?estado=PENDIENTE&page=1&page_size=20
```

**Implementación:**
```typescript
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
```

### Patrones de Diseño Implementados

#### **1. Wizard/Multi-Step Pattern**
El flujo Solicitud → Aprobación → Asignación → Devolución implementa un wizard distribuido en múltiples páginas y modales.

#### **2. Preselection Pattern**
`AssignmentModal` acepta empleado y solicitud preseleccionados, reduciendo pasos para el usuario.

#### **3. State Machine Pattern**
Los estados de Request y Assignment siguen transiciones específicas:
```
Request: PENDIENTE → APROBADA → COMPLETADA
         PENDIENTE → RECHAZADA (terminal)

Assignment: ACTIVA → FINALIZADA (no reversible)
```

#### **4. Cascading Updates Pattern**
Las señales implementan actualizaciones en cascada:
```
Return creado → Assignment.FINALIZADA → Device.DISPONIBLE/MANTENIMIENTO
```

#### **5. Modal Composition with Context Pattern**
Los modales comparten estructura pero se comportan diferente según contexto (creación vs edición, con/sin preselección).

#### **6. Conditional Form Validation Pattern**
El modal de asignación valida dinámicamente:
- Dispositivos solo si hay disponibles
- Empleado bloqueado si viene de solicitud

#### **7. Safe Array Access Pattern**
Para evitar errores de `.map()` en arrays undefined:
```typescript
{employees && employees.length > 0 ? (
  employees.map(...)
) : (
  <SelectItem value="none" disabled>Cargando...</SelectItem>
)}
```

#### **8. Service Response Normalization Pattern**
Los servicios normalizan respuestas del backend:
```typescript
// Backend: { count, results }
// Servicio retorna: { data, total, page, pageSize, totalPages }
return {
  data: response.results,
  total: response.count,
  page: params?.page || 1,
  pageSize: params?.page_size || 20,
  totalPages: Math.ceil(response.count / (params?.page_size || 20)),
}
```

### Consideraciones de Seguridad

1. **Validación de estados:** Backend valida transiciones de estado válidas
2. **Dispositivos disponibles:** Solo se pueden asignar dispositivos DISPONIBLES
3. **Unicidad de devolución:** OneToOneField garantiza una sola devolución por asignación
4. **Fechas lógicas:** Fecha de devolución debe ser >= fecha de entrega
5. **Auditoría completa:** Todas las operaciones registradas en AuditLog
6. **Usuario autenticado:** Todos los endpoints requieren JWT válido
7. **created_by automático:** El backend asigna automáticamente el usuario actual
8. **Protección CSRF:** DRF protege contra CSRF en operaciones POST/PUT/PATCH/DELETE

### Mejoras Futuras Planificadas

1. **Notificaciones:** Notificar por email cuando se aprueba/rechaza solicitud
2. **Workflow approval:** Flujo de aprobación multi-nivel
3. **Calendario de entregas:** Vista de calendario con asignaciones programadas
4. **Alertas de devolución:** Notificar cuando se acerca fecha de devolución temporal
5. **Firma digital:** Captura de firma en carta de responsabilidad
6. **Export a PDF:** Generar PDF de carta de responsabilidad
7. **Historial completo:** Timeline visual del ciclo de vida de cada dispositivo
8. **Bulk assignments:** Asignar múltiples dispositivos a la vez
9. **Templates de solicitud:** Plantillas pre-definidas por tipo de cargo
10. **Analytics:** Dashboard con métricas de tiempo promedio por fase

### Lecciones Aprendidas - Fase 11

1. **Query params en ApiClient:** Centralizar construcción de URLs con params evita duplicación
2. **Safe array mapping:** Siempre validar `array && array.length > 0` antes de `.map()`
3. **Service normalization:** Normalizar respuestas del backend en servicios facilita consumo
4. **Response structure mismatch:** Cuidado con `data` vs `results` en diferentes endpoints
5. **Modal context awareness:** Props opcionales permiten modales reutilizables en múltiples contextos
6. **Signals for automation:** Señales de Django ideales para efectos secundarios (estado de dispositivo)
7. **Date validation client+server:** Validar fechas en ambos lados previene errores de negocio
8. **Preselection UX:** Pre-llenar campos reduce fricción en flujos multi-paso
9. **Visual feedback:** Banners informativos sobre cambios automáticos mejoran confianza del usuario
10. **OneToOne relationships:** Usar OneToOneField para relaciones 1:1 garantiza unicidad

### Testing Checklist

#### **Frontend:**
- [ ] Crear solicitud con todos los campos
- [ ] Aprobar solicitud pendiente
- [ ] Rechazar solicitud pendiente
- [ ] Asignar desde solicitud aprobada
- [ ] Crear asignación independiente
- [ ] Registrar devolución con dispositivo óptimo → DISPONIBLE
- [ ] Registrar devolución con daños → MANTENIMIENTO
- [ ] Validar fecha de devolución anterior a entrega (debe fallar)
- [ ] Validar fecha de devolución futura (debe fallar)
- [ ] Ver detalle de asignación activa
- [ ] Ver detalle de asignación finalizada con info de devolución
- [ ] Filtrar solicitudes por estado
- [ ] Filtrar asignaciones por estado
- [ ] Búsqueda en solicitudes
- [ ] Búsqueda en asignaciones

#### **Backend:**
- [ ] Dispositivo cambia a ASIGNADO al crear asignación
- [ ] Dispositivo cambia a DISPONIBLE al devolver en estado OPTIMO
- [ ] Dispositivo cambia a MANTENIMIENTO al devolver con daños
- [ ] Asignación cambia a FINALIZADA al registrar devolución
- [ ] No se puede asignar dispositivo que no está DISPONIBLE
- [ ] No se puede registrar devolución con fecha anterior a entrega
- [ ] Una asignación solo puede tener una devolución (OneToOne)
- [ ] Todas las operaciones registran en AuditLog

---

## FASE 12: MÓDULO DE REPORTES E INVENTARIO

### Objetivo
Implementar sistema completo de reportes e inventario con exportación CSV, permitiendo visualizar el estado del inventario de forma general, por sucursal y por empleado.

### Arquitectura de Componentes

```
Frontend
├── lib/
│   ├── utils.ts                           [ACTUALIZADO]
│   │   ├── exportToCSV()                  Exportación genérica a CSV
│   │   ├── formatDate()                   Formateo DD/MM/YYYY
│   │   └── formatDateTime()               Formateo DD/MM/YYYY HH:MM
│   └── services/
│       └── stats-service.ts               [NUEVO] Servicio de estadísticas
└── app/dashboard/
    ├── inventory/page.tsx                 [REESCRITO] Inventario con API real
    └── reports/page.tsx                   [REESCRITO] 3 secciones de reportes
```

### Componentes Principales

#### **1. Función exportToCSV (lib/utils.ts)**

**Propósito:** Exportación genérica y reutilizable de datos a formato CSV compatible con Excel.

**Signature:**
```typescript
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  columns: { key: keyof T; header: string }[],
  filename: string
): void
```

**Características técnicas:**
- **TypeScript Generics:** Función tipada para cualquier tipo de datos
- **UTF-8 BOM:** Byte Order Mark (\uFEFF) para compatibilidad con Excel
- **Escapado automático:** Valores con comas, comillas y saltos de línea se escapan correctamente
- **Fecha automática:** Agrega fecha YYYY-MM-DD al nombre del archivo
- **Client-side:** Generación en el navegador sin carga del servidor

**Ejemplo de uso:**
```typescript
const devices = [
  { tipo: "Laptop", marca: "Dell", modelo: "XPS 13" },
  { tipo: "Teléfono", marca: "Apple", modelo: "iPhone 12" }
]

exportToCSV(
  devices,
  [
    { key: "tipo", header: "Tipo" },
    { key: "marca", header: "Marca" },
    { key: "modelo", header: "Modelo" }
  ],
  "inventario_general"
)
// Genera: inventario_general_2025-11-06.csv
```

**Limitaciones conocidas:**
- Funciona bien hasta ~10,000 registros
- Para más registros, considerar generación server-side
- No soporta estilos o fórmulas (solo datos planos)

#### **2. Servicio de Estadísticas (stats-service.ts)**

**Propósito:** Centralizar llamadas al endpoint de estadísticas del dashboard.

**Interface:**
```typescript
interface DashboardStats {
  total_dispositivos: number
  disponibles: number
  asignados: number
  en_mantenimiento: number
  total_empleados: number
  total_sucursales: number
  dispositivos_por_tipo: { tipo: string, cantidad: number }[]
  dispositivos_por_estado: { estado: string, cantidad: number }[]
  ultimas_asignaciones: any[]
}
```

**Endpoint consumido:**
- `GET /api/stats/dashboard/` (ya existente del backend Fase 5)

**Uso:**
```typescript
import { statsService } from '@/lib/services/stats-service'

const stats = await statsService.getDashboardStats()
console.log(stats.total_dispositivos) // 150
```

#### **3. Página de Inventario (app/dashboard/inventory/page.tsx)**

**Cambio principal:** Migración de datos mock a API real.

**Antes:**
```typescript
import { DEVICES } from "@/lib/mock-data"
const devices = DEVICES // Array estático
```

**Después:**
```typescript
const [devices, setDevices] = useState<Device[]>([])
const [branches, setBranches] = useState<Branch[]>([])

useEffect(() => {
  const loadData = async () => {
    const [devicesResponse, branchesResponse] = await Promise.all([
      deviceService.getDevices({ page_size: 1000 }),
      branchService.getBranches({ page_size: 100 })
    ])
    setDevices(devicesResponse.results)
    setBranches(branchesResponse.results)
  }
  loadData()
}, [])
```

**Estructura de la página:**
```
Inventario General
├── Header con botón "Exportar a CSV"
├── 4 Cards de resumen (Laptops, Teléfonos, Tablets, SIM Cards)
│   └── Cada card muestra: Total, Asignados, Disponibles, Mantenimiento
├── Sección de filtros
│   ├── Búsqueda por texto (modelo, serie, marca)
│   ├── Filtro por tipo de equipo
│   ├── Filtro por estado
│   └── Filtro por sucursal (dinámico desde API)
└── Tabla con todos los dispositivos
    └── Modal de detalles al hacer clic
```

**Funcionalidades implementadas:**
- ✅ Carga paralela de devices y branches con `Promise.all()`
- ✅ Cálculo dinámico de totales con `useMemo`
- ✅ Filtros combinados (todos los filtros actúan juntos)
- ✅ Exportación CSV de dispositivos filtrados
- ✅ Estado de carga con spinner
- ✅ Manejo de error en console.error

**Formato CSV exportado:**
```csv
Tipo,Marca,Modelo,Serie/IMEI,Número Teléfono,Estado,Sucursal,Fecha Ingreso
Laptop,Dell,XPS 13,ABC123,N/A,Disponible,Santiago Centro,06/11/2025
Teléfono,Apple,iPhone 12,IMEI456,+56912345678,Asignado,Providencia,05/11/2025
```

#### **4. Página de Reportes (app/dashboard/reports/page.tsx)**

**Cambio principal:** Reescritura completa con arquitectura de tabs.

**Estructura:**
```
Reportes e Inventario
└── Tabs (shadcn/ui)
    ├── Tab 1: Inventario General
    ├── Tab 2: Inventario por Sucursal
    └── Tab 3: Inventario por Empleado
```

**Carga de datos inicial:**
```typescript
useEffect(() => {
  const loadData = async () => {
    try {
      setLoading(true)
      const [devicesResponse, branchesResponse, employeesResponse] = await Promise.all([
        deviceService.getDevices({ page_size: 1000 }),
        branchService.getBranches({ page_size: 100 }),
        employeeService.getEmployees({ page_size: 1000, estado: "ACTIVO" })
      ])
      setDevices(devicesResponse.results)
      setBranches(branchesResponse.results)
      setEmployees(employeesResponse.results)
    } catch (error) {
      console.error("Error cargando datos:", error)
    } finally {
      setLoading(false)
    }
  }
  loadData()
}, [])
```

**Decisión técnica:** Carga paralela de los 3 recursos desde el inicio para evitar múltiples estados de carga al cambiar de tab.

---

### Tab 1: Inventario General

**Propósito:** Vista consolidada de todo el inventario con exportación completa.

**Componentes:**
```
Tab 1: Inventario General
├── Header con botón "Exportar CSV"
├── 3 Cards de resumen
│   ├── Card 1: Resumen General (Total dispositivos)
│   ├── Card 2: Por Tipo (5 tipos de equipos)
│   └── Card 3: Por Estado (5 estados)
├── Tabla con primeros 50 dispositivos
└── Nota: "Exporta a CSV para ver el listado completo"
```

**Lógica de cálculo:**
```typescript
const generalInventory = useMemo(() => {
  const byType = {
    LAPTOP: devices.filter(d => d.tipo_equipo === "LAPTOP").length,
    TELEFONO: devices.filter(d => d.tipo_equipo === "TELEFONO").length,
    TABLET: devices.filter(d => d.tipo_equipo === "TABLET").length,
    SIM: devices.filter(d => d.tipo_equipo === "SIM").length,
    ACCESORIO: devices.filter(d => d.tipo_equipo === "ACCESORIO").length,
  }

  const byStatus = {
    DISPONIBLE: devices.filter(d => d.estado === "DISPONIBLE").length,
    ASIGNADO: devices.filter(d => d.estado === "ASIGNADO").length,
    MANTENIMIENTO: devices.filter(d => d.estado === "MANTENIMIENTO").length,
    BAJA: devices.filter(d => d.estado === "BAJA").length,
    ROBO: devices.filter(d => d.estado === "ROBO").length,
  }

  return { byType, byStatus, total: devices.length }
}, [devices])
```

**Exportación CSV:**
```typescript
const handleExportGeneralInventory = () => {
  const dataForExport = devices.map((device) => ({
    tipo: getDeviceTypeLabel(device.tipo_equipo),
    marca: device.marca,
    modelo: device.modelo,
    serie_imei: device.serie_imei,
    numero_telefono: device.numero_telefono || "N/A",
    estado: getDeviceStatusLabel(device.estado),
    sucursal: device.sucursal_detail?.nombre || `ID: ${device.sucursal}`,
    fecha_ingreso: formatDate(device.fecha_ingreso),
  }))

  exportToCSV(dataForExport, columns, "reporte_inventario_general")
}
// Genera: reporte_inventario_general_2025-11-06.csv
```

**Campos incluidos en CSV:**
- Tipo (traducido: "Laptop" en lugar de "LAPTOP")
- Marca
- Modelo
- Serie/IMEI
- Número Teléfono (N/A si no aplica)
- Estado (traducido: "Disponible" en lugar de "DISPONIBLE")
- Sucursal (nombre completo, no ID)
- Fecha Ingreso (formato DD/MM/YYYY)

---

### Tab 2: Inventario por Sucursal

**Propósito:** Filtrar y exportar inventario de una sucursal específica.

**Componentes:**
```
Tab 2: Inventario por Sucursal
├── Header con botón "Exportar CSV" (disabled si no hay selección)
├── Card: Select de sucursales (dinámico desde API)
├── [Si hay selección]
│   ├── 3 Cards de resumen
│   │   ├── Total en Sucursal
│   │   ├── Por Estado (Disponibles, Asignados, Mantenimiento)
│   │   └── Información Sucursal (Nombre, Ciudad)
│   └── Tabla con dispositivos de la sucursal
└── [Sin selección]: Mensaje "Selecciona una sucursal..."
```

**Lógica de filtrado:**
```typescript
const branchInventory = useMemo(() => {
  if (selectedBranch === "todos") {
    return { devices: [], total: 0, byStatus: {} }
  }

  const branchDevices = devices.filter(d => d.sucursal === selectedBranch)
  const byStatus = {
    DISPONIBLE: branchDevices.filter(d => d.estado === "DISPONIBLE").length,
    ASIGNADO: branchDevices.filter(d => d.estado === "ASIGNADO").length,
    MANTENIMIENTO: branchDevices.filter(d => d.estado === "MANTENIMIENTO").length,
    // ...
  }

  return { devices: branchDevices, total: branchDevices.length, byStatus }
}, [devices, selectedBranch])
```

**Select de sucursales:**
```typescript
<Select
  value={selectedBranch === "todos" ? "todos" : String(selectedBranch)}
  onValueChange={(value) => setSelectedBranch(value === "todos" ? "todos" : Number(value))}
>
  <SelectContent>
    <SelectItem value="todos">Selecciona una sucursal...</SelectItem>
    {branches.map((branch) => (
      <SelectItem key={branch.id} value={String(branch.id)}>
        {branch.nombre} - {branch.ciudad}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Exportación CSV:**
```typescript
const handleExportBranchInventory = () => {
  if (selectedBranch === "todos") {
    alert("Por favor selecciona una sucursal")
    return
  }

  const branch = branches.find(b => b.id === selectedBranch)
  // ... preparar datos ...
  exportToCSV(
    dataForExport,
    columns,
    `reporte_inventario_sucursal_${branch?.codigo || selectedBranch}`
  )
}
// Genera: reporte_inventario_sucursal_SCL-01_2025-11-06.csv
```

**Nombre de archivo:** Incluye código de sucursal para fácil identificación.

---

### Tab 3: Inventario por Empleado

**Propósito:** Ver dispositivos en la sucursal de un empleado específico.

**Componentes:**
```
Tab 3: Inventario por Empleado
├── Header con botón "Exportar CSV" (disabled si no hay selección)
├── Card: Select de empleados activos (dinámico desde API)
├── [Si hay selección]
│   ├── Card: Información del Empleado
│   │   ├── Nombre completo
│   │   ├── RUT
│   │   ├── Cargo
│   │   ├── Sucursal
│   │   ├── Correo corporativo
│   │   └── Teléfono
│   └── Card: Dispositivos Asignados en su Sucursal
│       ├── Badge con contador de dispositivos
│       ├── Tabla con dispositivos
│       └── Nota explicativa
└── [Sin selección]: Mensaje "Selecciona un empleado..."
```

**Lógica de filtrado:**
```typescript
const employeeInventory = useMemo(() => {
  if (selectedEmployee === "todos") {
    return { devices: [], employee: null }
  }

  const employee = employees.find(e => e.id === selectedEmployee)
  const employeeDevices = devices.filter(d =>
    d.estado === "ASIGNADO" &&
    d.sucursal === employee?.sucursal
  )

  return { devices: employeeDevices, employee }
}, [devices, employees, selectedEmployee])
```

**⚠️ Decisión de diseño importante:**

El reporte muestra **todos los dispositivos ASIGNADOS en la sucursal del empleado**, NO solo los asignados directamente a él.

**Razón:** El modelo `Device` no tiene un campo `asignado_a`. Para ver asignaciones específicas del empleado, se debe usar:
```
GET /api/employees/{id}/history/
```

**Nota en UI:**
```
"Este reporte muestra todos los dispositivos asignados en la sucursal del empleado.
Para ver el historial específico de asignaciones del empleado, visita la sección de Empleados."
```

**Select de empleados:**
```typescript
<Select
  value={selectedEmployee === "todos" ? "todos" : String(selectedEmployee)}
  onValueChange={(value) => setSelectedEmployee(value === "todos" ? "todos" : Number(value))}
>
  <SelectContent>
    <SelectItem value="todos">Selecciona un empleado...</SelectItem>
    {employees.map((employee) => (
      <SelectItem key={employee.id} value={String(employee.id)}>
        {employee.nombre_completo} - {employee.rut}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Exportación CSV:**
```typescript
const handleExportEmployeeInventory = () => {
  if (selectedEmployee === "todos") {
    alert("Por favor selecciona un empleado")
    return
  }

  // ... preparar datos ...
  exportToCSV(
    dataForExport,
    columns,
    `reporte_dispositivos_empleado_${employeeInventory.employee?.rut.replace(/\./g, "")}`
  )
}
// Genera: reporte_dispositivos_empleado_123456789_2025-11-06.csv
```

**Nombre de archivo:** Incluye RUT sin puntos para compatibilidad con sistemas de archivos.

---

### Patrones de Implementación

#### **1. Carga Paralela de Recursos**

**Patrón:**
```typescript
const [resource1Response, resource2Response, resource3Response] = await Promise.all([
  service1.getResource1(),
  service2.getResource2(),
  service3.getResource3()
])
```

**Ventajas:**
- Reduce tiempo de carga total (3 requests en paralelo vs 3 secuenciales)
- Evita múltiples estados de carga al cambiar de tab
- Mejor UX: datos disponibles inmediatamente al cambiar tab

**Desventajas:**
- Mayor consumo de memoria (carga todos los datos desde el inicio)
- Si hay error en uno, todos fallan

**Cuándo usar:**
- Cuando los datos son relativamente pequeños (<10,000 registros)
- Cuando el usuario probablemente visitará múltiples tabs
- Cuando la velocidad de carga es prioritaria

#### **2. Estado de Selección con Tipo Union**

**Patrón:**
```typescript
const [selectedBranch, setSelectedBranch] = useState<number | "todos">("todos")
```

**Ventajas:**
- TypeScript valida que solo se usen valores permitidos
- Fácil verificación: `if (selectedBranch === "todos")`
- Compatible con Select de shadcn/ui

**Alternativa evitada:**
```typescript
// ❌ No usar:
const [selectedBranch, setSelectedBranch] = useState<number | null>(null)
// Select no acepta null como valor
```

#### **3. Deshabilitación Condicional de Botones**

**Patrón:**
```typescript
<Button
  onClick={handleExportBranchInventory}
  disabled={selectedBranch === "todos"}
>
  Exportar CSV
</Button>
```

**Ventajas:**
- Previene errores del usuario
- Feedback visual claro (botón gris)
- Evita validaciones en el handler

**Validación adicional en handler:**
```typescript
const handleExport = () => {
  if (selectedBranch === "todos") {
    alert("Por favor selecciona una sucursal")
    return
  }
  // ... resto de la lógica
}
```

**Razón:** Defensa en profundidad (double check).

#### **4. Memoización de Cálculos Costosos**

**Patrón:**
```typescript
const generalInventory = useMemo(() => {
  // Cálculos costosos aquí
  return { byType, byStatus, total }
}, [devices])
```

**Ventajas:**
- Evita recalcular en cada render
- Mejora performance significativamente con muchos dispositivos
- Solo recalcula cuando cambia `devices`

**Ejemplo sin memoización:**
```typescript
// ❌ Se recalcula en cada render (malo)
const total = devices.length
const laptops = devices.filter(d => d.tipo_equipo === "LAPTOP").length
```

**Cuándo usar:**
- Filtrados de arrays grandes
- Cálculos agregados (sumas, promedios, conteos)
- Transformaciones de datos

#### **5. Transformación de Datos para Exportación**

**Patrón:**
```typescript
const dataForExport = devices.map((device) => ({
  tipo: getDeviceTypeLabel(device.tipo_equipo),    // Traducción
  marca: device.marca,                              // Directo
  numero_telefono: device.numero_telefono || "N/A", // Default
  sucursal: device.sucursal_detail?.nombre || `ID: ${device.sucursal}`, // Fallback
  fecha_ingreso: formatDate(device.fecha_ingreso),  // Formateo
}))
```

**Razones:**
- **Traducción:** CSV más legible para usuarios no técnicos
- **Defaults:** Evita campos vacíos en Excel
- **Fallbacks:** Maneja casos donde relaciones no están pobladas
- **Formateo:** Fechas en formato familiar (DD/MM/YYYY)

#### **6. Helpers de UI Centralizados**

**Patrón:**
```typescript
// En device-service.ts
export function getDeviceTypeLabel(tipo: TipoEquipo): string {
  const labels: Record<TipoEquipo, string> = {
    LAPTOP: "Laptop",
    TELEFONO: "Teléfono",
    TABLET: "Tablet",
    SIM: "SIM Card",
    ACCESORIO: "Accesorio",
  }
  return labels[tipo] || tipo
}
```

**Ventajas:**
- Reutilizable en múltiples componentes
- Consistencia en toda la aplicación
- Fácil de mantener (un solo lugar para cambiar)
- Exportado junto con el servicio relacionado

**Alternativa evitada:**
```typescript
// ❌ No duplicar en cada componente:
const typeLabels = { LAPTOP: "Laptop", ... }
```

---

### Decisiones Técnicas Importantes

#### **1. CSV Client-Side vs Server-Side**

**Decisión:** Generación client-side con JavaScript.

**Pros:**
- ✅ No sobrecarga el servidor
- ✅ Respuesta inmediata (sin esperar generación)
- ✅ Funciona bien para <10,000 registros
- ✅ Más simple de implementar

**Cons:**
- ❌ Limitado por memoria del navegador
- ❌ No escalable para millones de registros
- ❌ Consume ancho de banda (envía todos los datos)

**Cuándo migrar a server-side:**
- Más de 10,000 dispositivos
- Reportes con cálculos complejos
- Necesidad de formateo avanzado (estilos, gráficos)

**Implementación server-side (futuro):**
```python
# Backend Django
from django.http import HttpResponse
import csv

def export_devices_csv(request):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="devices.csv"'

    writer = csv.writer(response)
    writer.writerow(['Tipo', 'Marca', 'Modelo'])

    devices = Device.objects.all()
    for device in devices:
        writer.writerow([device.tipo_equipo, device.marca, device.modelo])

    return response
```

#### **2. Límite de 1000 Registros**

**Decisión:** Cargar hasta 1000 dispositivos/empleados con `page_size: 1000`.

**Razón:**
- Backend tiene paginación de 20 por defecto
- Necesitamos todos los datos para filtrar/calcular client-side
- 1000 es suficiente para MVP

**Cuándo cambiar:**
- Si el sistema crece >1000 dispositivos
- Implementar paginación infinita
- Agregar filtros de fecha para limitar resultados
- Crear endpoints específicos para reportes

**Ejemplo con paginación:**
```typescript
// Para grandes volúmenes (futuro)
let allDevices = []
let page = 1
let hasMore = true

while (hasMore) {
  const response = await deviceService.getDevices({ page, page_size: 100 })
  allDevices = [...allDevices, ...response.results]
  hasMore = response.next !== null
  page++
}
```

#### **3. UTF-8 BOM para Excel**

**Decisión:** Agregar Byte Order Mark (\uFEFF) al inicio del CSV.

**Código:**
```typescript
const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
```

**Razón:**
- Excel en Windows no detecta UTF-8 sin BOM
- Previene caracteres extraños en acentos (á, é, í, ó, ú, ñ)
- Compatible con LibreOffice y Google Sheets

**Sin BOM:**
```
Santiago → SÃ¡ntiago (mal)
```

**Con BOM:**
```
Santiago → Santiago (bien)
```

#### **4. Reporte por Empleado - Alcance**

**Decisión:** Mostrar todos los dispositivos ASIGNADOS en la sucursal del empleado, no solo los asignados a él.

**Razón técnica:**
El modelo `Device` no tiene campo `asignado_a`:
```python
class Device(models.Model):
    sucursal = models.ForeignKey(Branch, ...)
    # ❌ No existe: asignado_a = models.ForeignKey(Employee, ...)
```

La relación Device-Employee está en `Assignment`:
```python
class Assignment(models.Model):
    empleado = models.ForeignKey(Employee, ...)
    dispositivo = models.ForeignKey(Device, ...)
```

**Soluciones alternativas:**

**Opción A (actual):** Mostrar todos los dispositivos de la sucursal
```typescript
const employeeDevices = devices.filter(d =>
  d.estado === "ASIGNADO" &&
  d.sucursal === employee?.sucursal
)
```

**Opción B (mejorar en futuro):** Crear endpoint específico
```python
# Backend
@action(detail=True, methods=['get'])
def assigned_devices(self, request, pk=None):
    employee = self.get_object()
    assignments = Assignment.objects.filter(
        empleado=employee,
        estado_asignacion='ACTIVA'
    )
    devices = [a.dispositivo for a in assignments]
    serializer = DeviceSerializer(devices, many=True)
    return Response(serializer.data)
```

**Opción C:** Usar endpoint de historial existente
```typescript
const history = await employeeService.getEmployeeHistory(employeeId)
const activeDevices = history.assignments
  .filter(a => a.estado_asignacion === "ACTIVA")
  .map(a => a.dispositivo_detail)
```

**Decisión:** Documentar limitación actual y planificar Opción B para Fase 13.

#### **5. Nombres de Archivo CSV**

**Decisión:** Incluir identificador único + fecha en nombre de archivo.

**Formatos:**
- General: `reporte_inventario_general_2025-11-06.csv`
- Sucursal: `reporte_inventario_sucursal_SCL-01_2025-11-06.csv`
- Empleado: `reporte_dispositivos_empleado_123456789_2025-11-06.csv`

**Razón:**
- Fácil identificación sin abrir el archivo
- Evita sobrescribir archivos del mismo día
- Ordenamiento cronológico natural en carpetas
- Trazabilidad (saber de qué sucursal/empleado es)

**Alternativa evitada:**
```
❌ inventario.csv (genérico, se sobreescribe)
❌ reporte_1.csv (no descriptivo)
```

---

### Flujos de Usuario

#### **Flujo 1: Exportar Inventario General**

```
1. Usuario navega a /dashboard/inventory
2. Sistema carga dispositivos y sucursales (spinner)
3. Usuario ve resumen y tabla con dispositivos
4. Usuario hace clic en "Exportar a CSV"
5. Navegador descarga: inventario_general_2025-11-06.csv
6. Usuario abre en Excel → ve todos los dispositivos
```

#### **Flujo 2: Exportar Inventario por Sucursal**

```
1. Usuario navega a /dashboard/reports
2. Sistema carga devices, branches y employees (spinner)
3. Usuario hace clic en tab "Por Sucursal"
4. Usuario selecciona "Santiago Centro" en el select
5. Sistema filtra y muestra:
   - Total: 45 dispositivos
   - Por estado: 30 asignados, 10 disponibles, 5 mantenimiento
   - Tabla con 45 dispositivos
6. Usuario hace clic en "Exportar CSV"
7. Navegador descarga: reporte_inventario_sucursal_SCL-01_2025-11-06.csv
```

#### **Flujo 3: Exportar Inventario por Empleado**

```
1. Usuario navega a /dashboard/reports
2. Usuario hace clic en tab "Por Empleado"
3. Usuario busca y selecciona "Juan Pérez - 12.345.678-9"
4. Sistema muestra:
   - Información del empleado
   - 5 dispositivos asignados en su sucursal
5. Usuario hace clic en "Exportar CSV"
6. Navegador descarga: reporte_dispositivos_empleado_12345678-9_2025-11-06.csv
```

---

### Consideraciones de Performance

#### **1. Carga Inicial**

**Métricas esperadas:**
- Dispositivos (1000): ~500ms
- Sucursales (100): ~50ms
- Empleados (1000): ~500ms
- **Total en paralelo:** ~500ms (el más lento)

**Optimizaciones aplicadas:**
- ✅ Carga paralela con `Promise.all()`
- ✅ Memoización de cálculos con `useMemo`
- ✅ Backend con `select_related()` y `prefetch_related()`

#### **2. Exportación CSV**

**Métricas esperadas:**
- 100 dispositivos: ~50ms
- 1000 dispositivos: ~200ms
- 5000 dispositivos: ~1s

**Limitaciones:**
- Memoria del navegador (~100MB para 10,000 registros)
- Tiempo de procesamiento en navegador
- Generación del Blob

#### **3. Filtrado en Cliente**

**Ventajas:**
- Instantáneo (no espera servidor)
- Sin carga del servidor
- Experiencia fluida

**Desventajas:**
- Requiere cargar todos los datos
- No escalable para >10,000 registros

**Cuándo migrar a filtrado server-side:**
```typescript
// En lugar de:
const filtered = devices.filter(d => d.sucursal === selectedBranch)

// Hacer:
const filtered = await deviceService.getDevices({ sucursal: selectedBranch })
```

---

### Testing Manual Realizado

#### **Funcionalidades Verificadas:**

✅ **Inventario General:**
- Carga de datos desde API
- Cálculo correcto de totales
- Filtros combinados funcionan
- Exportación CSV descarga archivo
- Spinner durante carga

✅ **Reportes - Tab General:**
- Totales coinciden con base de datos
- Tabla muestra primeros 50
- CSV contiene todos los dispositivos

✅ **Reportes - Tab Sucursal:**
- Select poblado con sucursales de API
- Filtrado correcto por sucursal
- Estadísticas calculadas correctamente
- CSV incluye código de sucursal en nombre

✅ **Reportes - Tab Empleado:**
- Select poblado con empleados activos
- Información del empleado completa
- Dispositivos filtrados por sucursal
- Nota explicativa visible

✅ **Exportación CSV:**
- UTF-8 BOM funciona (acentos correctos en Excel)
- Fecha en nombre de archivo
- Columnas correctas
- Valores escapados (comas, comillas)

---

### Mejoras Futuras Planificadas

#### **Prioridad Alta:**

1. **Endpoint de dispositivos asignados por empleado**
   ```python
   GET /api/employees/{id}/assigned_devices/
   ```
   Retorna solo dispositivos con asignación activa del empleado.

2. **Filtros de fecha en reportes**
   ```typescript
   <DateRangePicker
     from={fromDate}
     to={toDate}
     onChange={handleDateChange}
   />
   ```

3. **Búsqueda en selects**
   Usar Combobox de shadcn/ui en lugar de Select para búsqueda en tiempo real.

#### **Prioridad Media:**

4. **Gráficos con recharts**
   ```typescript
   <BarChart data={dispositivosPorTipo}>
     <Bar dataKey="cantidad" fill="#3b82f6" />
   </BarChart>
   ```

5. **Exportación a Excel (.xlsx)**
   Usar biblioteca como `xlsx` para generar archivos con estilos:
   ```typescript
   import XLSX from 'xlsx'
   const worksheet = XLSX.utils.json_to_sheet(data)
   const workbook = XLSX.utils.book_new()
   XLSX.utils.book_append_sheet(workbook, worksheet, "Inventario")
   XLSX.writeFile(workbook, "inventario.xlsx")
   ```

6. **Comparativas mes a mes**
   Mostrar tendencias de dispositivos asignados/disponibles.

#### **Prioridad Baja:**

7. **Reportes programados**
   Envío automático de reportes por email cada semana/mes.

8. **Dashboard de reportes**
   Widgets configurables con métricas favoritas.

9. **Exportación a PDF**
   Generar PDFs con logo y formato corporativo.

10. **Historial de exportaciones**
    Registro de quién exportó qué y cuándo.

---

### Lecciones Aprendidas - Fase 12

1. **UTF-8 BOM es crucial:** Sin él, Excel muestra caracteres extraños en español
2. **Carga paralela mejora UX:** Usuarios prefieren esperar una vez que múltiples veces
3. **Memoización imprescindible:** Con 1000 dispositivos, filtrar en cada render es lento
4. **TypeScript generics:** `exportToCSV<T>` permite reutilizar para cualquier tipo de datos
5. **Documentar limitaciones:** Nota en UI sobre alcance del reporte por empleado evita confusiones
6. **Nombres descriptivos:** Incluir identificador único en CSV facilita organización
7. **Botones deshabilitados:** Previene errores mejor que alertas después del clic
8. **Helper functions centralizadas:** `getDeviceTypeLabel()` reutilizado en 3 lugares
9. **Default values en CSV:** "N/A" mejor que celdas vacías en Excel
10. **Client-side CSV suficiente:** Para <10,000 registros, no necesita backend

---

### Archivos Relacionados

**Frontend modificados:**
- `frontend/lib/utils.ts` - Agregadas 3 funciones (exportToCSV, formatDate, formatDateTime)
- `frontend/app/dashboard/inventory/page.tsx` - Reescrito ~90% para usar API real
- `frontend/app/dashboard/reports/page.tsx` - Reescrito 100% con arquitectura de tabs

**Frontend nuevos:**
- `frontend/lib/services/stats-service.ts` - Servicio para endpoint de estadísticas

**Backend (sin cambios):**
- Ya existente: `GET /api/stats/dashboard/` (Fase 5)
- Ya existente: `GET /api/devices/` con paginación y filtros (Fase 3)
- Ya existente: `GET /api/branches/` con estadísticas (Fase 8)
- Ya existente: `GET /api/employees/` con filtros (Fase 9)

---

**Última actualización:** Noviembre 6, 2025 - Fase 12 Completada
**Documentado por:** Claude (Asistente IA)
**Próxima actualización:** Al completar Fase 13 (Dashboard y Estadísticas)
