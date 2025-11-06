# TechTrace - Arquitectura del Sistema
## Sistema de Gestion de Inventario de Dispositivos Moviles

**Version:** 1.1
**Ultima actualizacion:** Noviembre 5, 2025
**Estado:** En Desarrollo - Fase 7 Completada (Autenticacion Frontend)

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

## 9. Deployment (Futuro)

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

**Última actualización:** Noviembre 5, 2025 - Fase 5 Completada
**Documentado por:** Claude (Asistente IA)
**Próxima actualización:** Al completar Fase 7 (Autenticación Frontend)
