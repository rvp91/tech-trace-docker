# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Descripción del Proyecto

TechTrace es un sistema de gestión de inventario de dispositivos móviles construido como una aplicación full-stack con:
- **Frontend**: Next.js 16 (App Router) con React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Django 5.2.7 con Django REST Framework
- **Base de datos**: SQLite (desarrollo local), PostgreSQL (Docker/producción)
- **Deployment**: Docker Compose con Nginx como reverse proxy

## Modos de Desarrollo

### Opción 1: Docker Compose (Recomendado para desarrollo rápido)

```bash
# Inicio rápido con script automático
./start.sh  # Genera .env, construye imágenes, levanta servicios

# O con Makefile
make build  # Construir imágenes
make up     # Levantar servicios
make down   # Detener servicios
make help   # Ver todos los comandos

# Servicios disponibles:
# - Frontend: http://localhost
# - Backend API: http://localhost/api
# - Django Admin: http://localhost/admin
# Credenciales por defecto:
#   Username: admin (Email: admin@techtrace.com)
#   Password: admin123

# Comandos útiles
make logs           # Ver logs de todos los servicios
make logs-backend   # Ver logs del backend
make logs-frontend  # Ver logs del frontend
make migrate        # Ejecutar migraciones
make shell-backend  # Shell del backend
make shell-db       # Shell de PostgreSQL
make test           # Ejecutar tests
make backup-db      # Backup de la base de datos
```

**Arquitectura Docker**:
- `db`: PostgreSQL 15 con healthcheck
- `backend`: Django con Gunicorn, espera a que DB esté lista
- `frontend`: Next.js production build
- `nginx`: Reverse proxy que sirve frontend, proxy a backend API, y archivos estáticos/media

**Variables de entorno Docker** (`.env` en raíz):
- `POSTGRES_PASSWORD`: Contraseña de PostgreSQL
- `SECRET_KEY`: Clave secreta de Django (generar nueva)
- `DEBUG`: False para Docker (producción)
- `ALLOWED_HOSTS`: localhost,backend,nginx por defecto
- `CORS_ALLOWED_ORIGINS`: http://localhost por defecto
- `CREATE_SUPERUSER`: True para crear admin automáticamente

### Opción 2: Desarrollo Local (Sin Docker)

## Comandos de Desarrollo

#### Backend (Django)

```bash
# IMPORTANTE: Todos los comandos se ejecutan desde /backend con el venv activado
cd backend
source ../venv/bin/activate  # Activar desde la raíz del proyecto

# Instalación inicial
pip install -r requirements.txt
cp .env.example .env  # Configurar variables de entorno

# Base de datos
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser  # Los superusuarios se crean automáticamente con rol ADMIN

# Desarrollo
python manage.py runserver  # http://localhost:8000

# Testing
python manage.py test  # Todos los tests
python manage.py test apps.devices  # Tests de una app específica
python manage.py test apps.devices.tests.TestDeviceModel  # Test específico

# Utilidades
python manage.py shell  # Django shell interactiva
```

#### Frontend (Next.js)

```bash
# IMPORTANTE: Todos los comandos se ejecutan desde /frontend
cd frontend

# Instalación inicial (usa pnpm, NO npm/yarn)
pnpm install
cp env.local .env.local  # Configurar NEXT_PUBLIC_API_URL si es necesario

# Desarrollo
pnpm dev  # http://localhost:3000

# Build y producción
pnpm build
pnpm start

# Linting
pnpm lint
```

## Arquitectura del Sistema

### Backend (Django)

**Configuración del proyecto**:
- Nombre del proyecto Django: `config` (NO `backend`)
- Settings module: `config.settings`
- URLs principales en `config/urls.py`
- WSGI/ASGI applications en `config/wsgi.py` y `config/asgi.py`

**Estructura de apps** (`backend/apps/`):
- `users`: Autenticación JWT, modelo de usuario personalizado con `UserManager` que asigna rol ADMIN a superusuarios
- `branches`: Gestión de sucursales
- `employees`: Empleados y unidades de negocio (business units)
- `devices`: Dispositivos móviles (laptops, teléfonos, tablets, etc.)
- `assignments`: Solicitudes (requests) y asignaciones de dispositivos

**Patrón de arquitectura**:
- Cada app Django sigue estructura estándar: `models.py`, `serializers.py`, `views.py`, `urls.py`, `tests.py`
- ViewSets de DRF para operaciones CRUD
- Autenticación via `rest_framework_simplejwt`
- Filtrado con `django_filters`

**API Endpoints** (prefijo `/api/`):
- `/api/auth/` - Login, refresh token, logout
- `/api/devices/` - CRUD de dispositivos + acciones especiales (marcar_disponible, marcar_mantenimiento, etc.)
- `/api/employees/` - CRUD de empleados
- `/api/business-units/` - Unidades de negocio
- `/api/branches/` - Sucursales
- `/api/assignments/` - Solicitudes y asignaciones
- `/api/stats/` - Estadísticas del sistema

**Modelos clave**:
- `Device`: Estados (DISPONIBLE, ASIGNADO, MANTENIMIENTO, BAJA, ROBO), tipos de equipo, depreciación
- `Assignment`: Relación entre dispositivo y empleado, fechas de entrega/devolución
- `Request`: Solicitudes de dispositivos con motivos (CAMBIO, NUEVA_ENTREGA, ROBO, PRACTICA)
- Estados finales en Device (`BAJA`, `ROBO`) no pueden cambiar una vez establecidos

**Variables de entorno** (`.env`):
- `SECRET_KEY`: Clave secreta de Django
- `DEBUG`: Modo debug (True/False)
- `ALLOWED_HOSTS`: Hosts permitidos (separados por coma)
- `CORS_ALLOWED_ORIGINS`: Orígenes CORS permitidos (separados por coma)
- `LANGUAGE_CODE`: Código de idioma (default: es-es)
- `TIME_ZONE`: Zona horaria (ejemplo: America/Lima)

### Frontend (Next.js)

**Estructura de rutas** (`frontend/app/`):
- App Router de Next.js con rutas anidadas bajo `/dashboard`
- Módulos principales: `devices`, `employees`, `branches`, `assignments`, `users`, `reports`
- Layout compartido en `/dashboard/layout.tsx` con sidebar y header
- Path alias `@/*` apunta a la raíz de `/frontend`

**Gestión de estado**:
- Zustand para autenticación global (`lib/store/auth-store.ts`)
- Persistencia en localStorage como `techtrace-auth`
- Token JWT sincronizado entre ApiClient y store
- Preferir estado local (React state) cuando sea posible

**Comunicación con API** (`lib/api-client.ts`):
- Clase `ApiClient` singleton (`apiClient`) para todas las peticiones HTTP
- URL base: `NEXT_PUBLIC_API_URL` (default: http://localhost:8000/api)
- Autenticación automática via Bearer token en headers
- Manejo centralizado de errores con tipos `ApiError`
- Métodos: `get()`, `post()`, `put()`, `patch()`, `delete()`, `downloadBlob()`
- Redirección automática a `/login` en caso de error 401

**Componentes**:
- UI components de shadcn/ui en `/components/ui/`
- Layout components (sidebar, header) en `/components/layout/`
- Modals para creación de entidades en `/components/modals/`
- Servicios API en `/lib/services/` que usan `apiClient`

**Validaciones**:
- Schemas con Zod en `lib/validations.ts`
- react-hook-form con @hookform/resolvers para formularios

**Estilos**:
- Tailwind CSS 4.1.16 con configuración personalizada
- Variables CSS para temas en `app/globals.css`
- Soporte para tema claro/oscuro via next-themes

**Dependencias clave**:
- `swr`: Data fetching y caché
- `zustand`: State management global
- `react-hook-form` + `zod`: Formularios y validación
- `date-fns`: Manipulación de fechas
- `recharts`: Gráficos y visualizaciones
- `xlsx`: Exportación a Excel

## Flujo de Desarrollo Típico

1. **Backend primero**:
   - Crear/modificar modelos en `apps/{app}/models.py`
   - Ejecutar `makemigrations` y `migrate`
   - Crear/actualizar serializers en `serializers.py`
   - Implementar views/viewsets en `views.py`
   - Configurar rutas en `urls.py`
   - Escribir tests en `tests.py`

2. **Frontend consume API**:
   - Definir tipos TypeScript en `lib/types.ts` o co-located
   - Crear servicios en `lib/services/` usando `apiClient`
   - Definir schemas de validación con Zod si es necesario
   - Implementar componentes UI usando shadcn/ui
   - Usar SWR para data fetching cuando tenga sentido

3. **Testing**:
   - Backend: `python manage.py test apps.{app_name}`
   - Frontend: Principalmente testing manual (no hay suite de tests configurada)

## Deployment

**Docker Compose** (ver detalles arriba):
- Stack completo con PostgreSQL, Django, Next.js, y Nginx
- Healthchecks en todos los servicios
- Volúmenes persistentes para DB, static files, y media
- Resource limits configurados
- Script de inicio automático: `./start.sh`

**Archivos clave**:
- `docker-compose.yml`: Configuración de servicios
- `Makefile`: Comandos helper para Docker
- `.env`: Variables de entorno (copiar de `.env.example`)
- `backend/Dockerfile` y `backend/docker-entrypoint.sh`: Build y startup del backend
- `frontend/Dockerfile`: Build multi-stage de Next.js
- `nginx/nginx.conf`: Configuración de reverse proxy

**Deployment en cloud**: Ver `DEPLOYMENT.md` para guías de Heroku, Railway, Render, DigitalOcean, AWS, GCP

## Configuración HTTPS para Producción

Cuando se despliega detrás de un proxy HTTPS (nginx/traefik/caddy externo), actualizar `.env`:

```env
# Dominio público
ALLOWED_HOSTS=localhost,backend,nginx,tudominio.com
CORS_ALLOWED_ORIGINS=https://tudominio.com,http://localhost
FRONTEND_URL=https://tudominio.com
NEXT_PUBLIC_API_URL=https://tudominio.com/api

# Opcional: Desactivar SSL redirect si el proxy lo maneja
SECURE_SSL_REDIRECT=False
```

**Configuración del proxy externo**: El proxy debe pasar headers correctos:
- `X-Forwarded-Proto`: Para que Django reconozca HTTPS
- `X-Forwarded-For`: IP del cliente
- `Host`: Host original

Django está configurado con `SECURE_PROXY_SSL_HEADER` para confiar en `X-Forwarded-Proto` y `CSRF_TRUSTED_ORIGINS` automáticamente usa los mismos orígenes que CORS.

## Consideraciones Importantes

- **Idioma**: Español (es-es/es-cl) en código, comentarios, mensajes y UI
- **Path alias**: Usar `@/` para imports en frontend (ej: `@/components/ui/button`)
- **Autenticación**: JWT token almacenado en localStorage, sincronizado con ApiClient
- **CORS y CSRF**: Configurados desde `.env` via `CORS_ALLOWED_ORIGINS` (se aplica a ambos)
- **Estados de dispositivos**: Los estados finales (BAJA, ROBO) son inmutables
- **Cambios de estado**: Los dispositivos tienen endpoints específicos para cambiar estado (ej: `/devices/{id}/marcar_disponible/`)
- **Depreciación**: Los dispositivos calculan valor depreciado automáticamente, pero puede ser manual
- **Soft delete**: El modelo Device tiene campo `activo` para soft deletes
- **Docker healthchecks**: Los servicios tienen healthchecks y depends_on con condition para startup ordenado
- **Security opts**: Los contenedores usan `apparmor=unconfined` para compatibilidad con servidores restrictivos
- **HTTPS Proxy**: Django confía en `X-Forwarded-Proto` para detectar conexiones HTTPS detrás de proxy
