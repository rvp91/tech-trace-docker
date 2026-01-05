# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Descripción del Proyecto

TechTrace es un sistema de gestión de inventario de dispositivos móviles construido como una aplicación full-stack con:
- **Frontend**: Next.js 16 (App Router) con React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Django 5.2.7 con Django REST Framework
- **Base de datos**: SQLite (desarrollo)

## Comandos de Desarrollo

### Backend (Django)

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
python ../backend/scripts/generate_test_data.py  # Generar datos de prueba
```

### Frontend (Next.js)

```bash
# IMPORTANTE: Todos los comandos se ejecutan desde /frontend
cd frontend

# Instalación inicial (usa pnpm, NO npm/yarn)
pnpm install
cp .env.example .env.local  # Si existe

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

## Consideraciones Importantes

- **Idioma**: Español (es-es) en código, comentarios, mensajes y UI
- **Path alias**: Usar `@/` para imports en frontend (ej: `@/components/ui/button`)
- **Autenticación**: JWT token almacenado en localStorage, sincronizado con ApiClient
- **CORS**: Configurado entre localhost:3000 (frontend) y localhost:8000 (backend)
- **Estados de dispositivos**: Los estados finales (BAJA, ROBO) son inmutables
- **Cambios de estado**: Los dispositivos tienen endpoints específicos para cambiar estado (ej: `/devices/{id}/marcar_disponible/`)
- **Depreciación**: Los dispositivos calculan valor depreciado automáticamente, pero puede ser manual
- **Soft delete**: El modelo Device tiene campo `activo` para soft deletes
- **Scripts auxiliares**: `backend/scripts/generate_test_data.py` para generar datos de prueba (100 devices, 50 employees, 30 assignments)
