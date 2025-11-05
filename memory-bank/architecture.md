# TechTrace - Arquitectura del Sistema
## Sistema de Gestion de Inventario de Dispositivos Moviles

**Version:** 1.0
**Ultima actualizacion:** Noviembre 2025
**Estado:** En Desarrollo

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
│   ├── layout.tsx              # Layout raiz
│   ├── page.tsx                # Landing page (redirige a /dashboard o /login)
│   ├── providers.tsx           # Providers (Theme)
│   ├── globals.css             # Estilos globales + Tailwind
│   │
│   ├── login/                  # Pagina de login
│   │   └── page.tsx
│   │
│   └── dashboard/              # Aplicacion principal (protegida)
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
│   │   └── ...
│   │
│   ├── layout/                 # Componentes de layout
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
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
│   ├── api-client.ts           # Cliente HTTP centralizado
│   │
│   ├── store/                  # Zustand stores
│   │   └── auth-store.ts       # Estado de autenticacion
│   │
│   ├── services/               # Servicios API
│   │   ├── auth-service.ts     # Login, logout, getCurrentUser
│   │   ├── branch-service.ts   # CRUD sucursales
│   │   ├── employee-service.ts # CRUD empleados + history
│   │   ├── device-service.ts   # CRUD dispositivos + history
│   │   ├── assignment-service.ts # CRUD asignaciones/solicitudes/devoluciones
│   │   ├── user-service.ts     # CRUD usuarios
│   │   └── stats-service.ts    # Estadisticas del dashboard
│   │
│   ├── utils/                  # Utilidades
│   │   └── export-csv.ts       # Funcion para exportar CSV
│   │
│   ├── types.ts                # Tipos TypeScript
│   ├── constants.ts            # Constantes de la app
│   ├── validations.ts          # Schemas de validacion (Zod)
│   ├── utils.ts                # Utilidades generales
│   └── mock-data.ts            # Datos mock para desarrollo
│
├── public/                     # Archivos estaticos
├── styles/                     # Estilos adicionales
├── hooks/                      # Custom hooks
│
├── middleware.ts               # Middleware de proteccion de rutas
├── package.json
├── tsconfig.json               # Path alias @/*
├── tailwind.config.ts
├── components.json             # Config shadcn/ui
├── next.config.mjs
└── .env.local                  # Variables de entorno
```

### 4.2 Flujo de Autenticacion

```

 /login
 page.tsx
      |
      |
      | 1. Usuario ingresa credenciales
      |
      v

 auth-service.ts
 login(username,pwd)
      |
      |
      | 2. POST /api/auth/login/
      |
      v

 ApiClient
 post(endpoint,data)
      |
      |
      | 3. Fetch al backend
      |
      v

 Backend Django
 TokenObtainPairView
      |
      |
      | 4. Retorna {access, refresh, user}
      |
      v

 auth-store.ts
 login(user, token)
      |
      |
      | 5. Guarda en localStorage
      |    key: 'techtrace-auth'
      |
      v

 Router
 push('/dashboard')

```

### 4.3 Flujo de Peticiones API

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
 - Lee token del
   auth-store
 - Agrega header
   Authorization:
   Bearer {token}
      |
      |
      | 3. fetch() al backend
      |
      v

 Backend Django
 - JWT verifica
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

**Ultima actualizacion:** Noviembre 5, 2025 - 11:00 AM
**Documentado por:** Claude (Asistente IA)
**Proxima actualizacion:** Al completar Fase 3
