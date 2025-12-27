# Plan: Integración Frontend Next.js Estático + Backend Django

## Resumen Ejecutivo

Convertir el frontend Next.js en una exportación estática (HTML/CSS/JS) y servirlo directamente desde Django usando WhiteNoise. Esto elimina la necesidad de un servidor Node.js separado en producción.

**Estrategia elegida**: Export estático completo con Django sirviendo todo.

---

## Estado Actual

### Frontend
- Next.js 16 con App Router, 100% Client Components
- Middleware para autenticación (usa cookies, NO funcionará en estático)
- Rutas dinámicas: `/dashboard/devices/[id]`, `/dashboard/employees/[id]`, `/dashboard/assignments/[id]`
- Variables de entorno: `NEXT_PUBLIC_API_URL=http://localhost:8000/api`
- Configuración: `images: { unoptimized: true }` ✓ Compatible con estático

### Backend
- Django 5.2.7 con configuración MÍNIMA de archivos estáticos
- Solo tiene `STATIC_URL = 'static/'`
- Falta: `STATIC_ROOT`, `STATICFILES_DIRS`, WhiteNoise
- URLs: Solo `/api/` y `/admin/`

---

## Fase 1: Configurar Frontend para Export Estático

### 1.1 Modificar Next.js Config
**Archivo**: [frontend/next.config.mjs](../frontend/next.config.mjs)

```javascript
const nextConfig = {
  output: 'export',           // AGREGAR: Habilitar export estático
  trailingSlash: true,        // AGREGAR: URLs con / al final
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}
```

### 1.2 Deshabilitar Middleware de Next.js
**Archivo**: [frontend/middleware.ts](../frontend/middleware.ts)

**Acción**: Renombrar a `middleware.ts.disabled`

**Razón**: El middleware requiere servidor Node.js y no funciona en export estático.

### 1.3 Crear AuthGuard para Cliente
**Archivo NUEVO**: [frontend/components/providers/auth-guard.tsx](../frontend/components/providers/auth-guard.tsx)

Crear componente que:
- Verifica autenticación usando `useAuthStore`
- Redirige a `/login/` si no autenticado
- Redirige a `/dashboard/` si autenticado y en login
- Maneja parámetro `?redirect=` para volver después de login

### 1.4 Integrar AuthGuard
**Archivo**: [frontend/app/providers.tsx](../frontend/app/providers.tsx)

Envolver children con `<AuthGuard>`:
```typescript
<AuthProvider>
  <AuthGuard>
    {children}
  </AuthGuard>
  <Toaster />
</AuthProvider>
```

### 1.5 Configurar Variables de Entorno
**Archivo NUEVO**: [frontend/.env.production](../frontend/.env.production)

```bash
NEXT_PUBLIC_API_URL=/api
```

**Archivo**: [frontend/lib/api-client.ts](../frontend/lib/api-client.ts)

Cambiar default a ruta relativa:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api"
```

### 1.6 Configurar Rutas Dinámicas
**Archivos**:
- [frontend/app/dashboard/devices/[id]/page.tsx](../frontend/app/dashboard/devices/[id]/page.tsx)
- [frontend/app/dashboard/employees/[id]/page.tsx](../frontend/app/dashboard/employees/[id]/page.tsx)
- [frontend/app/dashboard/assignments/[id]/page.tsx](../frontend/app/dashboard/assignments/[id]/page.tsx)

Agregar al inicio de cada archivo:
```typescript
export const dynamicParams = true
```

### 1.7 Actualizar package.json
**Archivo**: [frontend/package.json](../frontend/package.json)

Agregar scripts:
```json
{
  "scripts": {
    "build": "next build",
    "build:production": "next build && npm run export:copy",
    "export:copy": "rm -rf ../backend/staticfiles/frontend && cp -r out ../backend/staticfiles/frontend",
    "dev": "next dev",
    "lint": "next lint",
    "start": "next start"
  }
}
```

---

## Fase 2: Configurar Backend Django

### 2.1 Instalar WhiteNoise
**Archivo**: [backend/requirements.txt](../backend/requirements.txt)

Agregar al final:
```
whitenoise>=6.6.0
gunicorn>=21.2.0
```

Luego ejecutar:
```bash
cd backend
source ../venv/bin/activate
pip install whitenoise gunicorn
```

### 2.2 Configurar Archivos Estáticos
**Archivo**: [backend/config/settings.py](../backend/config/settings.py)

Reemplazar sección de archivos estáticos con:
```python
# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = []

# WhiteNoise configuration
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
WHITENOISE_ROOT = BASE_DIR / 'staticfiles' / 'frontend'
WHITENOISE_INDEX_FILE = True
```

### 2.3 Agregar WhiteNoise al Middleware
**Archivo**: [backend/config/settings.py](../backend/config/settings.py)

Modificar MIDDLEWARE (agregar en línea 2):
```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # ← AGREGAR AQUÍ
    'corsheaders.middleware.CorsMiddleware',
    # ... resto del middleware
]
```

**CRÍTICO**: WhiteNoise DEBE ir después de `SecurityMiddleware` y antes de los demás.

### 2.4 Configurar Templates
**Archivo**: [backend/config/settings.py](../backend/config/settings.py)

Agregar directorio frontend en TEMPLATES:
```python
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            BASE_DIR / 'staticfiles' / 'frontend',  # ← AGREGAR
        ],
        'APP_DIRS': True,
        # ... resto de la configuración
    },
]
```

### 2.5 Configurar URLs
**Archivo**: [backend/config/urls.py](../backend/config/urls.py)

Reemplazar completamente con:
```python
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.conf import settings
import os

urlpatterns = [
    path('admin/', admin.site.urls),

    # API REST endpoints - DEBEN IR PRIMERO
    path('api/auth/', include('apps.users.urls')),
    path('api/branches/', include('apps.branches.urls')),
    path('api/business-units/', include('apps.employees.urls_business_units')),
    path('api/employees/', include('apps.employees.urls')),
    path('api/devices/', include('apps.devices.urls')),
    path('api/assignments/', include('apps.assignments.urls')),
    path('api/stats/', include('apps.devices.urls_stats')),
]

# Servir frontend Next.js exportado (solo si existe)
frontend_index = os.path.join(settings.BASE_DIR, 'staticfiles', 'frontend', 'index.html')
if os.path.exists(frontend_index):
    # Catch-all para SPA - DEBE IR AL FINAL
    urlpatterns += [
        re_path(r'^(?!api/|admin/).*$', TemplateView.as_view(
            template_name='frontend/index.html',
            content_type='text/html',
        ), name='frontend'),
    ]
```

**Importante**:
- Rutas `/api/` tienen prioridad
- El catch-all excluye `/api/` y `/admin/` usando negative lookahead regex
- Sirve `index.html` para todas las demás rutas (SPA routing)

### 2.6 Ajustar CORS (Opcional)
**Archivo**: [backend/.env](../backend/.env)

Mantener configuración actual para desarrollo:
```bash
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

En producción (mismo origin), CORS no será necesario, pero mantenerlo no afecta.

---

## Fase 3: Scripts de Build y Deployment

### 3.1 Script de Build para Producción
**Archivo NUEVO**: [scripts/build-production.sh](../scripts/build-production.sh)

```bash
#!/bin/bash
set -e

echo "Building TechTrace for Production"
echo "==================================="

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# 1. Build Frontend
echo "[1/4] Building Next.js Frontend..."
cd frontend
pnpm install
pnpm build

# 2. Copiar al backend
echo "[2/4] Copying frontend build to backend..."
rm -rf ../backend/staticfiles/frontend
mkdir -p ../backend/staticfiles/frontend
cp -r out/* ../backend/staticfiles/frontend/

# 3. Collectstatic de Django
echo "[3/4] Collecting Django static files..."
cd ../backend
source ../venv/bin/activate
python manage.py collectstatic --noinput

# 4. Verificar
echo "[4/4] Verifying build..."
if [ -f "staticfiles/frontend/index.html" ]; then
    echo "✓ Frontend index.html exists"
else
    echo "✗ ERROR: Frontend index.html not found!"
    exit 1
fi

echo "Build completed successfully!"
```

Hacer ejecutable:
```bash
chmod +x scripts/build-production.sh
```

### 3.2 Script de Desarrollo
**Archivo NUEVO**: [scripts/dev.sh](../scripts/dev.sh)

Script para iniciar frontend y backend en paralelo durante desarrollo.

### 3.3 Script de Test Local
**Archivo NUEVO**: [scripts/test-production.sh](../scripts/test-production.sh)

Script para probar el build de producción localmente con gunicorn.

---

## Fase 4: Testing y Validación

### Checklist de Build

1. **Compilar frontend**:
   ```bash
   cd frontend
   pnpm build
   ```
   Verificar: `out/` generado, `out/index.html` existe

2. **Copiar al backend**:
   ```bash
   rm -rf ../backend/staticfiles/frontend
   mkdir -p ../backend/staticfiles/frontend
   cp -r out/* ../backend/staticfiles/frontend/
   ```

3. **Collectstatic**:
   ```bash
   cd ../backend
   python manage.py collectstatic --noinput
   ```
   Verificar: `staticfiles/frontend/index.html` y `staticfiles/admin/` existen

4. **Iniciar servidor**:
   ```bash
   gunicorn config.wsgi:application --bind 0.0.0.0:8000
   ```

### Rutas a Probar

- `http://localhost:8000/` → Frontend (raíz)
- `http://localhost:8000/login/` → Página de login
- `http://localhost:8000/dashboard/` → Dashboard (o redirige a login)
- `http://localhost:8000/dashboard/devices/` → Lista de dispositivos
- `http://localhost:8000/dashboard/devices/1/` → Dispositivo específico (SPA routing)
- `http://localhost:8000/api/auth/login/` → API (debe devolver JSON, no HTML)
- `http://localhost:8000/admin/` → Admin de Django

### Validaciones Funcionales

- Login funciona
- Redirección a dashboard después de login
- Protección de rutas (AuthGuard funciona)
- Navegación entre rutas sin recargar página
- Rutas dinámicas cargan datos del API
- Assets (CSS/JS) cargan correctamente
- API devuelve JSON (no HTML)

---

## Fase 5: Documentación

### 5.1 Actualizar README
Agregar sección de deployment en [README.md](../README.md)

### 5.2 Crear Troubleshooting
**Archivo NUEVO**: [docs/TROUBLESHOOTING.md](TROUBLESHOOTING.md)

Documentar problemas comunes y soluciones.

---

## Archivos Críticos a Modificar

### Frontend (8 archivos)
1. `frontend/next.config.mjs`
2. `frontend/middleware.ts` → renombrar a `.disabled`
3. `frontend/app/providers.tsx`
4. `frontend/lib/api-client.ts`
5. `frontend/package.json`
6. `frontend/app/dashboard/devices/[id]/page.tsx`
7. `frontend/app/dashboard/employees/[id]/page.tsx`
8. `frontend/app/dashboard/assignments/[id]/page.tsx`

### Backend (3 archivos)
1. `backend/requirements.txt`
2. `backend/config/settings.py`
3. `backend/config/urls.py`

### Nuevos Archivos (6 archivos)
1. `frontend/.env.production`
2. `frontend/components/providers/auth-guard.tsx`
3. `scripts/build-production.sh`
4. `scripts/dev.sh`
5. `scripts/test-production.sh`
6. `docs/TROUBLESHOOTING.md`

---

## Orden de Implementación Recomendado

### Sesión 1: Frontend (30-45 min)
1. Modificar `next.config.mjs`
2. Crear `.env.production`
3. Modificar `api-client.ts`
4. Crear `auth-guard.tsx`
5. Modificar `providers.tsx`
6. Renombrar `middleware.ts`
7. Agregar `dynamicParams` a páginas dinámicas
8. Probar build: `pnpm build`

### Sesión 2: Backend (30-45 min)
1. Actualizar `requirements.txt`
2. Instalar dependencias: `pip install -r requirements.txt`
3. Modificar `settings.py` (estáticos, middleware, templates)
4. Modificar `urls.py`
5. Copiar build: `cp -r frontend/out/* backend/staticfiles/frontend/`
6. Ejecutar: `python manage.py collectstatic --noinput`
7. Probar: `gunicorn config.wsgi:application --bind 0.0.0.0:8000`

### Sesión 3: Scripts y Validación (20-30 min)
1. Crear scripts de build
2. Hacer ejecutables: `chmod +x`
3. Ejecutar `./scripts/test-production.sh`
4. Validar todas las rutas
5. Probar autenticación completa

### Sesión 4: Documentación (15-20 min)
1. Actualizar README
2. Crear troubleshooting
3. Documentar proceso

---

## Ventajas de Este Enfoque

- **Simplicidad**: Un solo servidor Django sirve todo
- **Sin CORS**: Frontend y backend en mismo origin
- **Performance**: WhiteNoise con compresión y caching
- **Deployment sencillo**: Un solo proceso (gunicorn)
- **Desarrollo flexible**: Modo dev con servidores separados sigue funcionando

## Consideraciones Importantes

- **No hay SSR**: Export estático = solo Client-Side Rendering
- **Middleware no funciona**: AuthGuard en cliente lo reemplaza
- **Rutas dinámicas**: Dependen de client-side routing (SPA)
- **Build necesario**: Cada cambio requiere recompilar frontend

---

## Comandos Rápidos

### Desarrollo
```bash
./scripts/dev.sh
```

### Build Producción
```bash
./scripts/build-production.sh
```

### Test Local
```bash
./scripts/test-production.sh
```

### Producción
```bash
cd backend
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3
```
