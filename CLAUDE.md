# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# IMPORTANT:
1- Always read memory-bank/@architecture.md before writing any code. Include entire database schema.
2-  Always read memory-bank/@game-design-document.md before writing any code.
3- After adding a major feature or completing a milestone, update memory-bank/@architecture.md.

## Descripción del Proyecto

TechTrace es un sistema de gestión de inventario de dispositivos móviles construido como una aplicación full-stack con:
- **Frontend**: Next.js 16 (App Router) con React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Django 5.2.7 con Django REST Framework
- **Base de datos**: SQLite (desarrollo)

## Arquitectura del Sistema

### Frontend (Next.js)

**Estructura de rutas** (`/frontend/app/`):
- App Router de Next.js con rutas anidadas bajo `/dashboard`
- Módulos principales: devices, employees, branches, assignments, users, reports
- Layout compartido con sidebar y header en `/dashboard/layout.tsx`

**Gestión de estado**:
- Zustand para autenticación global (`lib/store/auth-store.ts`)
- Persistencia con `zustand/middleware` en localStorage como `techtrace-auth`
- Estado del usuario y token JWT manejados centralmente

**Comunicación con API** (`lib/api-client.ts`):
- Clase `ApiClient` centralizada para todas las peticiones HTTP
- URL base configurada via `NEXT_PUBLIC_API_URL` (default: `http://localhost:8000/api`)
- Autenticación mediante Bearer token en headers
- Token sincronizado entre ApiClient y localStorage

**Componentes**:
- UI components de shadcn/ui en `/components/ui/`
- Layout components (sidebar, header) en `/components/layout/`
- Modals para creación de entidades en `/components/modals/`
- Path alias `@/*` apunta a la raíz del frontend

**Estilos**:
- Tailwind CSS 4.1.16 con configuración personalizada
- Variables CSS para temas en `app/globals.css`
- Soporte para tema claro/oscuro via `theme-provider.tsx`

### Backend (Django)

**Configuración del proyecto**:
- Nombre del proyecto Django: `config` (no `backend`)
- Settings module: `config.settings`
- WSGI/ASGI applications en `config/wsgi.py` y `config/asgi.py`

**Variables de entorno** (`.env`):
- `SECRET_KEY`: Clave secreta de Django
- `DEBUG`: Modo debug (True/False)
- `ALLOWED_HOSTS`: Hosts permitidos (separados por coma)
- `CORS_ALLOWED_ORIGINS`: Orígenes CORS permitidos (separados por coma)
- `LANGUAGE_CODE`: Código de idioma (default: es-es)
- `TIME_ZONE`: Zona horaria (ejemplo: America/Lima)

**Base de datos**:
- SQLite en `backend/db.sqlite3` para desarrollo
- Migraciones estándar de Django

**CORS**:
- `django-cors-headers` configurado en middleware
- Configurado para permitir credenciales (`CORS_ALLOW_CREDENTIALS = True`)

## Comandos de Desarrollo

### Backend (Django)

```bash
# Activar entorno virtual (desde la raíz del proyecto)
source venv/bin/activate

# Navegar al directorio backend
cd backend

# Instalar dependencias
pip install -r requirements.txt

# Crear/aplicar migraciones
python manage.py makemigrations
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Ejecutar servidor de desarrollo
python manage.py runserver

# Ejecutar shell de Django
python manage.py shell

# Ejecutar tests
python manage.py test
```

### Frontend (Next.js)

```bash
# Navegar al directorio frontend
cd frontend

# Instalar dependencias (usa pnpm)
pnpm install

# Ejecutar servidor de desarrollo
pnpm dev

# Build de producción
pnpm build

# Ejecutar en producción
pnpm start

# Linter
pnpm lint
```

## Flujo de Desarrollo Típico

1. **Backend primero**: Crear modelos, migraciones, serializers y vistas en Django
2. **Frontend consume API**: Crear servicios en `lib/services/` que usen `apiClient`
3. **UI Components**: Usar shadcn/ui para componentes de interfaz
4. **State Management**: Usar Zustand solo para estado global necesario
5. **Validaciones**: Definir schemas en `lib/validations.ts` (probablemente con Zod)

## Consideraciones Importantes

- El proyecto usa **path alias `@/`** que apunta a la raíz de `/frontend`
- Las referencias a archivos deben usar este alias: `@/components/...`, `@/lib/...`
- El idioma por defecto es **español** (es-es)
- El backend espera autenticación JWT (token Bearer)
- CORS debe estar configurado correctamente entre frontend (localhost:3000) y backend (localhost:8000)
- El proyecto incluye datos mock en `frontend/lib/mock-data.ts` para desarrollo del frontend sin backend
