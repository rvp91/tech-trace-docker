# Guía de Deployment: Static Export de Next.js en Django

**Proyecto:** TechTrace - Sistema de Gestión de Inventario
**Estrategia:** Static Export (SSG - Static Site Generation)
**Objetivo:** Servir frontend y backend desde un único servidor Django
**Fecha:** Noviembre 2025

---

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Arquitectura Resultante](#arquitectura-resultante)
3. [Requisitos Previos](#requisitos-previos)
4. [Paso 1: Configurar Next.js](#paso-1-configurar-nextjs)
5. [Paso 2: Instalar WhiteNoise](#paso-2-instalar-whitenoise)
6. [Paso 3: Configurar Django Settings](#paso-3-configurar-django-settings)
7. [Paso 4: Configurar URLs de Django](#paso-4-configurar-urls-de-django)
8. [Paso 5: Auditar Componentes](#paso-5-auditar-componentes)
9. [Paso 6: Variables de Entorno](#paso-6-variables-de-entorno)
10. [Paso 7: Build del Frontend](#paso-7-build-del-frontend)
11. [Paso 8: Collectstatic de Django](#paso-8-collectstatic-de-django)
12. [Paso 9: Deployment en Producción](#paso-9-deployment-en-producción)
13. [Paso 10: Verificación](#paso-10-verificación)
14. [Troubleshooting](#troubleshooting)
15. [Scripts de Automatización](#scripts-de-automatización)
16. [Comparación con Standalone](#comparación-con-standalone)
17. [Referencias](#referencias)

---

## Introducción

### ¿Qué es Static Export?

Static Export es una feature de Next.js que permite exportar tu aplicación como archivos HTML, CSS y JavaScript estáticos. Esto significa que:

- No necesitas un servidor Node.js en producción
- Django puede servir los archivos estáticos directamente
- Solo tienes un proceso corriendo (Django)
- Menor consumo de recursos

### ¿Cuándo usar Static Export?

✅ **Usar Static Export si:**
- Tu app usa principalmente Client Components
- No necesitas Server-Side Rendering (SSR)
- Quieres simplicidad en deployment
- Tienes recursos limitados (RAM, CPU)
- Tu contenido no cambia frecuentemente

❌ **NO usar Static Export si:**
- Necesitas SSR para SEO
- Usas Server Components de App Router
- Necesitas API Routes de Next.js
- Requieres Incremental Static Regeneration (ISR)

### TechTrace: ¿Es viable?

**Estado actual del proyecto:**
- ✅ Usa Client Components extensivamente (`"use client"`)
- ✅ API separada en Django (no usa API Routes de Next.js)
- ✅ SPA con client-side routing
- ⚠️ Necesita verificación de layouts (podrían ser Server Components)

**Conclusión:** Probablemente viable, pero requiere auditoría de componentes.

---

## Arquitectura Resultante

### Antes (Desarrollo)

```
┌─────────────────────────────────────────────┐
│ Desarrollo Local                            │
│                                             │
│  ┌──────────────┐         ┌──────────────┐ │
│  │   Next.js    │         │    Django    │ │
│  │  (puerto     │ ◄─────► │  (puerto     │ │
│  │   3000)      │   API   │   8000)      │ │
│  └──────────────┘         └──────────────┘ │
│         ▲                        ▲          │
│         │                        │          │
│         └────────────┬───────────┘          │
│                      │                      │
└──────────────────────┼──────────────────────┘
                       │
                   Navegador
```

### Después (Producción con Static Export)

```
┌───────────────────────────────────────────────┐
│ Producción                                    │
│                                               │
│  ┌─────────────────────────────────────────┐ │
│  │         Django + WhiteNoise             │ │
│  │         (puerto 80/443)                 │ │
│  │                                         │ │
│  │  ┌──────────────┐  ┌────────────────┐ │ │
│  │  │ Archivos     │  │  Django REST   │ │ │
│  │  │ Estáticos    │  │  API           │ │ │
│  │  │ (Next.js)    │  │  (/api/*)      │ │ │
│  │  └──────────────┘  └────────────────┘ │ │
│  │         ▲                  ▲          │ │
│  │         │                  │          │ │
│  │         └──────────┬───────┘          │ │
│  │                    │                  │ │
│  └────────────────────┼──────────────────┘ │
│                       │                    │
└───────────────────────┼────────────────────┘
                        │
                    Navegador
```

**Flujo de peticiones:**
1. `GET /` → Django sirve `index.html` de Next.js
2. `GET /dashboard` → Django sirve `index.html` (SPA routing)
3. `GET /static/...` → WhiteNoise sirve CSS/JS/imágenes
4. `POST /api/login` → Django REST Framework procesa
5. `GET /admin/` → Django Admin

**Ventajas:**
- Un solo servidor
- Un solo puerto
- Un solo proceso
- Deployment simplificado

---

## Requisitos Previos

### Software Necesario

**Desarrollo:**
- Python 3.10+ con pip
- Node.js 18+ con pnpm
- Git

**Producción:**
- Python 3.10+
- Servidor web (Gunicorn + Nginx opcional)
- No requiere Node.js

### Conocimientos Recomendados

- Conceptos básicos de Django
- Archivos estáticos en Django
- Proceso de build de Next.js
- Variables de entorno

### Estado del Proyecto

Antes de comenzar, verifica:

```bash
# Backend funcionando
cd backend
python3 manage.py runserver
# Debe responder en http://localhost:8000

# Frontend funcionando
cd frontend
pnpm dev
# Debe responder en http://localhost:3000

# Tests pasando
cd backend
python3 manage.py test
# Debe mostrar: Ran 10 tests in 5.91s OK
```

---

## Paso 1: Configurar Next.js

### 1.1 Modificar `next.config.mjs`

**Archivo:** `/frontend/next.config.mjs`

**Cambio a realizar:**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // NUEVO: Habilitar static export
  output: 'export',

  // NUEVO: Trailing slash para mejor compatibilidad
  trailingSlash: true,

  // Configuración existente (mantener)
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
```

**Explicación de opciones:**

- **`output: 'export'`**: Activa el modo de exportación estática
- **`trailingSlash: true`**: Genera `/dashboard/` en lugar de `/dashboard` (mejor para servidores)
- **`typescript.ignoreBuildErrors`**: Ya configurado (mantener)
- **`images.unoptimized`**: Ya configurado (mantener para static export)

### 1.2 Verificar package.json

**Archivo:** `/frontend/package.json`

Asegúrate que existe el script de build:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

**El script `build` es el que usaremos.**

### 1.3 Limitaciones de Static Export

**Features que NO funcionarán:**

❌ Server Components (componentes sin `"use client"`)
❌ Server Actions
❌ API Routes (`/api` en Next.js)
❌ `headers()`, `cookies()` en Server Components
❌ Incremental Static Regeneration (ISR)
❌ On-Demand Revalidation
❌ Image Optimization (requiere servidor)
❌ Middleware de Next.js

**Features que SÍ funcionan:**

✅ Client Components (`"use client"`)
✅ Client-side routing (Link, useRouter)
✅ Client-side data fetching (fetch, SWR)
✅ useState, useEffect, y todos los hooks
✅ CSS Modules, Tailwind
✅ Layouts como Client Components
✅ Dynamic imports (`next/dynamic`)

### 1.4 Test de Build (Opcional)

Antes de continuar, prueba que el build funcione:

```bash
cd frontend
pnpm build
```

**Output esperado:**

```
Route (app)                              Size     First Load JS
┌ ○ /                                    XXX kB        XXX kB
├ ○ /dashboard                           XXX kB        XXX kB
├ ○ /dashboard/devices                   XXX kB        XXX kB
└ ○ /login                               XXX kB        XXX kB

○  (Static)  prerendered as static content

✓ Compiled successfully
```

**Verificar directorio generado:**

```bash
ls -la frontend/out/
# Debe contener: index.html, _next/, dashboard/, etc.
```

**Si el build falla aquí, ve a [Troubleshooting](#troubleshooting).**

---

## Paso 2: Instalar WhiteNoise

WhiteNoise permite a Django servir archivos estáticos de manera eficiente en producción.

### 2.1 Agregar a requirements.txt

**Archivo:** `/backend/requirements.txt`

Agregar al final:

```txt
# Servidor de archivos estáticos
whitenoise==6.7.0
```

**Versión 6.7.0 es la última estable (Nov 2024).**

### 2.2 Instalar en entorno virtual

```bash
cd backend
source ../venv/bin/activate  # O tu ruta al venv
pip install whitenoise==6.7.0
```

**Output esperado:**

```
Collecting whitenoise==6.7.0
  Downloading whitenoise-6.7.0-py3-none-any.whl
Installing collected packages: whitenoise
Successfully installed whitenoise-6.7.0
```

### 2.3 Verificar instalación

```bash
python -c "import whitenoise; print(whitenoise.__version__)"
# Debe mostrar: 6.7.0
```

---

## Paso 3: Configurar Django Settings

### 3.1 Agregar WhiteNoise al Middleware

**Archivo:** `/backend/config/settings.py`

**Buscar la sección `MIDDLEWARE` y modificar:**

```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    # NUEVO: WhiteNoise debe ir aquí (después de SecurityMiddleware)
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
```

**IMPORTANTE:** WhiteNoise **debe** ir después de `SecurityMiddleware` y antes de todo lo demás.

### 3.2 Configurar Archivos Estáticos

**Archivo:** `/backend/config/settings.py`

**Buscar la sección de archivos estáticos (al final) y reemplazar/agregar:**

```python
# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = 'static/'

# NUEVO: Directorio donde collectstatic guardará archivos
STATIC_ROOT = BASE_DIR / 'staticfiles'

# NUEVO: Directorios adicionales de archivos estáticos
STATICFILES_DIRS = [
    # Archivos estáticos de Django (si existen)
    BASE_DIR / 'static',
    # Build de Next.js
    BASE_DIR.parent / 'frontend' / 'out',
]

# NUEVO: Configuración de WhiteNoise
WHITENOISE_USE_FINDERS = True
WHITENOISE_AUTOREFRESH = True  # Solo para desarrollo
WHITENOISE_INDEX_FILE = True  # Sirve index.html automáticamente

# NUEVO: Root para archivos que no están en STATIC_URL
# (Para servir Next.js desde la raíz)
WHITENOISE_ROOT = BASE_DIR.parent / 'frontend' / 'out'
```

**Explicación de configuraciones:**

- **`STATIC_ROOT`**: Donde `collectstatic` copiará archivos
- **`STATICFILES_DIRS`**: Lista de directorios con archivos estáticos
  - `BASE_DIR / 'static'`: Estáticos propios de Django (si existen)
  - `BASE_DIR.parent / 'frontend' / 'out'`: Build de Next.js
- **`WHITENOISE_USE_FINDERS`**: Permite usar `STATICFILES_DIRS`
- **`WHITENOISE_AUTOREFRESH`**: Auto-reload en desarrollo (quitar en producción)
- **`WHITENOISE_INDEX_FILE`**: Sirve `index.html` para directorios
- **`WHITENOISE_ROOT`**: Sirve archivos desde la raíz (para SPA)

### 3.3 Configuración de CORS (Actualizar)

**Archivo:** `/backend/config/settings.py`

**Modificar `CORS_ALLOWED_ORIGINS` para producción:**

```python
# Para desarrollo (mantener)
if DEBUG:
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
else:
    # Para producción: mismo dominio, CORS no es necesario
    # (Frontend y backend en el mismo origen)
    CORS_ALLOWED_ORIGINS = []
    # O si usas un dominio específico:
    # CORS_ALLOWED_ORIGINS = ["https://tudominio.com"]
```

**En producción con Static Export, frontend y backend están en el mismo dominio, por lo que CORS podría no ser necesario.**

### 3.4 Deshabilitar WHITENOISE_AUTOREFRESH en Producción

**Crear archivo de configuración de producción (opcional):**

**Archivo:** `/backend/config/settings_production.py`

```python
from .settings import *

# Deshabilitar autorefresh en producción
WHITENOISE_AUTOREFRESH = False

# Habilitar compresión
WHITENOISE_COMPRESSION = True

# Otras configuraciones de producción
DEBUG = False
ALLOWED_HOSTS = ['tudominio.com', 'www.tudominio.com']

# Security settings
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
```

**Uso:**

```bash
# Producción
export DJANGO_SETTINGS_MODULE=config.settings_production
python manage.py runserver
```

---

## Paso 4: Configurar URLs de Django

Django necesita saber cómo manejar las rutas del frontend (SPA routing).

### 4.1 Crear vista para servir Next.js

**Archivo:** `/backend/config/views.py` (crear si no existe)

```python
from django.views.generic import TemplateView
from django.views.decorators.cache import never_cache

class NextJSAppView(TemplateView):
    """
    Vista para servir la aplicación Next.js.
    Sirve index.html para todas las rutas que no son /api o /admin.
    Esto permite el client-side routing de Next.js.
    """
    template_name = 'index.html'

    @classmethod
    def as_view(cls, **kwargs):
        view = super().as_view(**kwargs)
        # No cachear en desarrollo para ver cambios
        return never_cache(view)
```

**Alternativa simple (sin clase):**

```python
from django.shortcuts import render

def nextjs_app(request, path=''):
    """
    Sirve index.html de Next.js para todas las rutas del frontend.
    """
    return render(request, 'index.html')
```

### 4.2 Configurar urls.py

**Archivo:** `/backend/config/urls.py`

**Modificar para incluir la ruta catch-all:**

```python
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.views.decorators.cache import never_cache

# Si creaste views.py, importar:
# from .views import NextJSAppView

urlpatterns = [
    # Admin de Django
    path('admin/', admin.site.urls),

    # API REST
    path('api/', include('apps.users.urls')),
    path('api/', include('apps.branches.urls')),
    path('api/', include('apps.employees.urls')),
    path('api/', include('apps.devices.urls')),
    path('api/', include('apps.assignments.urls')),
    # ... otras URLs de API

    # NUEVO: Catch-all para Next.js (DEBE IR AL FINAL)
    # Esta ruta captura todo lo que no matcheó arriba
    re_path(
        r'^(?!api|admin|static).*$',  # Negativo lookbehind: no capturar api/admin/static
        never_cache(TemplateView.as_view(template_name='index.html')),
        name='nextjs_app'
    ),
]
```

**Explicación del regex:**

- `^` - Inicio de string
- `(?!api|admin|static)` - Negative lookahead: NO matchear si empieza con api, admin o static
- `.*` - Cualquier carácter, cualquier cantidad
- `$` - Fin de string

**Rutas que matchean:**
- `/` → `index.html`
- `/dashboard` → `index.html`
- `/dashboard/devices` → `index.html`
- `/login` → `index.html`

**Rutas que NO matchean:**
- `/api/devices` → Va a Django REST API
- `/admin/` → Va a Django Admin
- `/static/...` → Va a WhiteNoise

### 4.3 Configurar Templates

Django busca templates en `TEMPLATES[0]['DIRS']`. Necesitamos decirle dónde está `index.html`.

**Archivo:** `/backend/config/settings.py`

**Buscar la sección `TEMPLATES` y modificar:**

```python
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            # NUEVO: Agregar directorio del build de Next.js
            BASE_DIR.parent / 'frontend' / 'out',
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]
```

**Ahora Django podrá encontrar `/frontend/out/index.html`.**

---

## Paso 5: Auditar Componentes

Este paso es **CRÍTICO**. Necesitas verificar que todos tus componentes sean compatibles con static export.

### 5.1 Verificar Layouts

**Archivos a revisar:**

```bash
frontend/app/layout.tsx
frontend/app/dashboard/layout.tsx
frontend/app/login/layout.tsx
```

**Para cada layout, verificar:**

✅ **Debe tener `"use client"` al inicio**, O
✅ **No usar ninguna feature de Server Component**

**Ejemplo de layout compatible:**

```typescript
// ✅ CORRECTO: Client Component
"use client"

import { ReactNode } from 'react'

export default function DashboardLayout({
  children
}: {
  children: ReactNode
}) {
  return (
    <div className="flex">
      <Sidebar />
      <main>{children}</main>
    </div>
  )
}
```

**Ejemplo de layout NO compatible:**

```typescript
// ❌ INCORRECTO: Server Component con metadata
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard',
}

export default function DashboardLayout({ children }) {
  return <div>{children}</div>
}
```

**Solución si encuentras layouts sin `"use client"`:**

Agregar `"use client"` al inicio del archivo:

```typescript
"use client"  // ← Agregar esta línea

import { ReactNode } from 'react'
// ... resto del código
```

### 5.2 Verificar Páginas

**Archivos a revisar:**

```bash
frontend/app/page.tsx
frontend/app/login/page.tsx
frontend/app/dashboard/page.tsx
frontend/app/dashboard/devices/page.tsx
frontend/app/dashboard/employees/page.tsx
# ... todas las páginas
```

**Verificación:**

```bash
# Buscar páginas sin "use client"
cd frontend
grep -L "use client" app/**/page.tsx
```

**Si encuentra archivos:** Revisar cada uno y agregar `"use client"` si es necesario.

### 5.3 Verificar uso de Server-only features

**Buscar usos prohibidos:**

```bash
cd frontend

# Buscar cookies()
grep -r "cookies()" app/

# Buscar headers()
grep -r "headers()" app/

# Buscar Server Actions
grep -r "'use server'" app/

# Buscar generateMetadata
grep -r "generateMetadata" app/
```

**Si encuentras alguno:**

- **`cookies()` / `headers()`**: Mover lógica al cliente o a la API de Django
- **`'use server'`**: Convertir a API endpoint en Django
- **`generateMetadata`**: Usar metadata estática o eliminar

### 5.4 Test de compatibilidad

**Ejecutar build con las configuraciones nuevas:**

```bash
cd frontend
pnpm build
```

**Si el build falla:**

1. Leer el error cuidadosamente
2. Identificar el archivo problemático
3. Verificar si usa Server Components
4. Agregar `"use client"` o refactorizar

**Errores comunes:**

```
Error: Page "/dashboard" cannot use both "use client" and export metadata
```
→ **Solución:** Eliminar `export const metadata`

```
Error: You're importing a component that needs server-side features
```
→ **Solución:** Agregar `"use client"` al componente padre

---

## Paso 6: Variables de Entorno

Las variables de entorno necesitan configurarse correctamente para que el frontend encuentre el backend.

### 6.1 Desarrollo (actual)

**Archivo:** `/frontend/.env.local` (mantener)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### 6.2 Producción (mismo servidor)

**Archivo:** `/frontend/.env.production` (crear)

```bash
# Opción 1: URL relativa (recomendado si están en el mismo dominio)
NEXT_PUBLIC_API_URL=/api

# Opción 2: URL absoluta
# NEXT_PUBLIC_API_URL=https://tudominio.com/api
```

**¿Cuál usar?**

- **URL relativa (`/api`)**: Si frontend y backend están en el mismo dominio
  - Ventaja: Funciona en cualquier dominio (localhost, staging, producción)
  - Recomendado para TechTrace

- **URL absoluta (`https://...`)**: Si necesitas especificar el dominio
  - Ventaja: Explícito, útil para debugging
  - Desventaja: Hardcoded, requiere cambiar por ambiente

### 6.3 Build con variables de producción

**Next.js lee `.env.production` automáticamente durante `pnpm build`.**

Verificar que esté configurado:

```bash
cd frontend
cat .env.production
# Debe mostrar: NEXT_PUBLIC_API_URL=/api (o tu configuración)
```

**Las variables `NEXT_PUBLIC_*` se embeben en el build (no son secretas).**

---

## Paso 7: Build del Frontend

### 7.1 Ejecutar build de Next.js

```bash
cd frontend

# Limpiar builds anteriores
rm -rf .next out

# Build de producción
pnpm build
```

**Output esperado:**

```
Route (app)                              Size     First Load JS
┌ ○ /                                    5.2 kB         85.2 kB
├ ○ /dashboard                           12.3 kB        92.3 kB
├ ○ /dashboard/devices                   15.1 kB        95.1 kB
├ ○ /dashboard/employees                 14.8 kB        94.8 kB
├ ○ /dashboard/assignments               16.2 kB        96.2 kB
├ ○ /dashboard/users                     13.7 kB        93.7 kB
├ ○ /login                               8.5 kB         88.5 kB
└ ○ /404                                 3.1 kB         83.1 kB

○  (Static)  prerendered as static content

✓ Compiled successfully
```

**Tiempos aproximados:**
- Primera vez: 30-60 segundos
- Subsecuentes (con cache): 15-30 segundos

### 7.2 Verificar directorio `out/`

```bash
ls -lh frontend/out/

# Debe contener:
# - index.html (página principal)
# - 404.html (página de error)
# - _next/ (assets de Next.js: CSS, JS, imágenes)
# - dashboard/ (subdirectorios con index.html para cada ruta)
# - login/ (subdirectorio)
```

**Estructura esperada:**

```
frontend/out/
├── index.html                    # Página principal (/)
├── 404.html                      # Página de error
├── _next/
│   ├── static/
│   │   ├── chunks/               # JavaScript chunks
│   │   ├── css/                  # Estilos compilados
│   │   └── media/                # Fuentes, imágenes
│   └── [hash]/                   # Assets con hash para cache
├── dashboard/
│   ├── index.html                # /dashboard
│   ├── devices/
│   │   └── index.html            # /dashboard/devices
│   ├── employees/
│   │   └── index.html            # /dashboard/employees
│   ├── assignments/
│   │   └── index.html            # /dashboard/assignments
│   └── users/
│       └── index.html            # /dashboard/users
└── login/
    └── index.html                # /login
```

### 7.3 Tamaño del build

```bash
du -sh frontend/out/
# Esperado: 5-15 MB (depende de dependencias)
```

**Si es > 20 MB:** Considera optimizar dependencias.

### 7.4 Test local del build (opcional)

```bash
cd frontend/out

# Servidor HTTP simple
python3 -m http.server 8080

# Abrir navegador en http://localhost:8080
# NOTA: La API no funcionará (Django no está corriendo)
```

**Verificar que:**
- Las páginas cargan
- CSS se aplica correctamente
- JavaScript no tiene errores en consola

---

## Paso 8: Collectstatic de Django

Django necesita recopilar todos los archivos estáticos en `STATIC_ROOT`.

### 8.1 Ejecutar collectstatic

```bash
cd backend

# Activar entorno virtual
source ../venv/bin/activate

# Ejecutar collectstatic
python manage.py collectstatic --noinput
```

**Output esperado:**

```
125 static files copied to '/home/rvpadmin/tech-trace/backend/staticfiles'.
```

**Este comando:**
1. Crea el directorio `backend/staticfiles/`
2. Copia archivos de `STATICFILES_DIRS` a `STATIC_ROOT`
3. Incluye archivos de aplicaciones Django (admin, etc.)
4. Incluye el build de Next.js de `frontend/out/`

### 8.2 Verificar staticfiles

```bash
ls -lh backend/staticfiles/

# Debe contener:
# - admin/ (archivos del admin de Django)
# - index.html (copiado de frontend/out/)
# - _next/ (copiado de frontend/out/)
# - dashboard/ (copiado de frontend/out/)
# - login/ (copiado de frontend/out/)
```

### 8.3 Estructura de staticfiles

```
backend/staticfiles/
├── admin/                        # Django admin assets
│   ├── css/
│   ├── js/
│   └── img/
├── index.html                    # Next.js index (raíz)
├── 404.html
├── _next/                        # Next.js assets
│   └── static/
│       ├── chunks/
│       ├── css/
│       └── media/
├── dashboard/
│   └── ...
└── login/
    └── ...
```

**WhiteNoise servirá todo esto desde `/static/` y `/` (gracias a `WHITENOISE_ROOT`).**

---

## Paso 9: Deployment en Producción

### 9.1 Preparar base de datos

**Para SQLite (desarrollo/staging):**

```bash
cd backend

# Aplicar migraciones
python manage.py migrate

# Crear superusuario si no existe
python manage.py createsuperuser

# Cargar datos de prueba (opcional)
python3 scripts/generate_test_data.py
```

**Para PostgreSQL (producción recomendada):**

```bash
# Instalar psycopg2
pip install psycopg2-binary

# Configurar DATABASE en settings_production.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'techtrace_db',
        'USER': 'techtrace_user',
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

### 9.2 Configurar Gunicorn

**Instalar Gunicorn:**

```bash
pip install gunicorn==23.0.0
```

**Agregar a requirements.txt:**

```txt
gunicorn==23.0.0
```

**Crear archivo de configuración (opcional):**

**Archivo:** `/backend/gunicorn.conf.py`

```python
# Gunicorn configuration file
import multiprocessing

# Server socket
bind = "0.0.0.0:8000"
backlog = 2048

# Worker processes
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = 'sync'
worker_connections = 1000
timeout = 30
keepalive = 2

# Logging
accesslog = '-'  # stdout
errorlog = '-'   # stderr
loglevel = 'info'

# Process naming
proc_name = 'techtrace'

# Server mechanics
daemon = False
pidfile = None
umask = 0
user = None
group = None
tmp_upload_dir = None

# SSL (si usas HTTPS directo en Gunicorn)
# keyfile = '/path/to/ssl.key'
# certfile = '/path/to/ssl.cert'
```

**Ejecutar Gunicorn:**

```bash
cd backend
gunicorn config.wsgi:application
```

**O con archivo de configuración:**

```bash
gunicorn config.wsgi:application -c gunicorn.conf.py
```

### 9.3 Configurar Systemd Service

**Para servidores Linux con systemd:**

**Archivo:** `/etc/systemd/system/techtrace.service`

```ini
[Unit]
Description=TechTrace Django Application
After=network.target

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/home/rvpadmin/tech-trace/backend
Environment="DJANGO_SETTINGS_MODULE=config.settings_production"
Environment="PYTHONPATH=/home/rvpadmin/tech-trace/backend"
ExecStart=/home/rvpadmin/tech-trace/venv/bin/gunicorn \
          --workers 3 \
          --bind 0.0.0.0:8000 \
          config.wsgi:application

# Restart
Restart=always
RestartSec=10

# Security
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

**Activar y ejecutar:**

```bash
# Recargar systemd
sudo systemctl daemon-reload

# Habilitar inicio automático
sudo systemctl enable techtrace

# Iniciar servicio
sudo systemctl start techtrace

# Ver estado
sudo systemctl status techtrace

# Ver logs
sudo journalctl -u techtrace -f
```

### 9.4 Configurar Nginx (Opcional pero Recomendado)

**¿Por qué Nginx?**

- Maneja SSL/TLS (HTTPS)
- Sirve archivos estáticos más eficientemente
- Balancea carga
- Protección contra DDoS básica

**Archivo:** `/etc/nginx/sites-available/techtrace`

```nginx
# HTTP → HTTPS redirect
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    # Redirigir a HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name tudominio.com www.tudominio.com;

    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Logs
    access_log /var/log/nginx/techtrace_access.log;
    error_log /var/log/nginx/techtrace_error.log;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Client max body size
    client_max_body_size 20M;

    # Proxy a Django
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Servir archivos estáticos directamente (opcional)
    # WhiteNoise ya los sirve, pero Nginx es más eficiente
    location /static/ {
        alias /home/rvpadmin/tech-trace/backend/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Nginx sirve _next (assets con hash)
    location /_next/static/ {
        alias /home/rvpadmin/tech-trace/backend/staticfiles/_next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Activar configuración:**

```bash
# Crear symlink
sudo ln -s /etc/nginx/sites-available/techtrace /etc/nginx/sites-enabled/

# Test de configuración
sudo nginx -t

# Recargar Nginx
sudo systemctl reload nginx
```

**Obtener certificado SSL con Let's Encrypt:**

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d tudominio.com -d www.tudominio.com

# Renovación automática (ya configurado por certbot)
sudo certbot renew --dry-run
```

### 9.5 Variables de Entorno en Producción

**Crear archivo `.env` para producción:**

**Archivo:** `/backend/.env` (NO commitear a git)

```bash
# Django
SECRET_KEY=tu-secret-key-super-segura-de-50-caracteres
DEBUG=False
ALLOWED_HOSTS=tudominio.com,www.tudominio.com
DJANGO_SETTINGS_MODULE=config.settings_production

# Database (si usas PostgreSQL)
DB_NAME=techtrace_db
DB_USER=techtrace_user
DB_PASSWORD=password-super-seguro
DB_HOST=localhost
DB_PORT=5432

# Email (si lo usas)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=tu-email@gmail.com
EMAIL_HOST_PASSWORD=tu-app-password
```

**Cargar en settings_production.py:**

```python
import os
from pathlib import Path
from dotenv import load_dotenv

# Cargar .env
load_dotenv()

# Usar variables
SECRET_KEY = os.getenv('SECRET_KEY')
DEBUG = os.getenv('DEBUG', 'False') == 'True'
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',')

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
    }
}
```

**Instalar python-dotenv:**

```bash
pip install python-dotenv
```

---

## Paso 10: Verificación

### 10.1 Checklist de Verificación

**Backend:**

```bash
# Django responde
curl http://localhost:8000/api/
# Debe devolver respuesta de la API

# Admin accesible
curl http://localhost:8000/admin/
# Debe devolver HTML del admin

# Archivos estáticos se sirven
curl -I http://localhost:8000/static/admin/css/base.css
# Debe devolver 200 OK
```

**Frontend:**

```bash
# Index.html se sirve en raíz
curl http://localhost:8000/
# Debe devolver HTML con <div id="__next">

# Ruta de Next.js se sirve
curl http://localhost:8000/dashboard
# Debe devolver el mismo HTML (SPA)

# Assets de Next.js se sirven
curl -I http://localhost:8000/_next/static/chunks/[algún-chunk].js
# Debe devolver 200 OK con Content-Type: application/javascript
```

**Navegador:**

1. Abrir `http://localhost:8000/`
2. Verificar:
   - ✅ La página carga sin errores
   - ✅ CSS se aplica correctamente
   - ✅ No hay errores en consola (F12)
   - ✅ Navegación funciona (click en links)
   - ✅ Login funciona
   - ✅ API calls funcionan (Network tab)

### 10.2 Test de Navegación

**Rutas a probar:**

- `http://localhost:8000/` → Debe cargar index
- `http://localhost:8000/login` → Debe cargar login
- `http://localhost:8000/dashboard` → Debe cargar dashboard (si autenticado)
- `http://localhost:8000/dashboard/devices` → Debe cargar dispositivos
- `http://localhost:8000/ruta-inexistente` → Debe mostrar 404 de Next.js

**Client-side navigation:**

1. Estar en `/`
2. Click en link a `/dashboard`
3. **NO debe recargar la página** (verificar en Network tab)
4. URL debe cambiar a `/dashboard`

### 10.3 Test de API

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Debe devolver token
{"token":"eyJ0eXAiOiJKV1QiLCJhbGc...","user":{...}}

# Obtener dispositivos
curl http://localhost:8000/api/devices/ \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..."

# Debe devolver lista de dispositivos
```

### 10.4 Test de Performance

**Chrome DevTools:**

1. Abrir DevTools (F12)
2. Ir a tab "Network"
3. Recargar página (`Ctrl+Shift+R` para hard reload)
4. Verificar:
   - ✅ Total requests < 50
   - ✅ Total size < 2 MB
   - ✅ Load time < 3 segundos
   - ✅ No hay requests fallando (status 404/500)

**Lighthouse:**

1. Abrir DevTools (F12)
2. Ir a tab "Lighthouse"
3. Run audit (Desktop)
4. Métricas esperadas:
   - Performance: > 80
   - Accessibility: > 90
   - Best Practices: > 90
   - SEO: > 80

---

## Troubleshooting

### Problema 1: Build de Next.js falla

**Error:**
```
Error: Page "X" cannot use both "use client" and export metadata
```

**Solución:**
```typescript
// Eliminar esta línea:
export const metadata = { title: 'Title' }

// Mantener solo:
"use client"
```

---

### Problema 2: 404 en archivos estáticos

**Error:** `GET /_next/static/chunks/main.js` → 404

**Diagnóstico:**

```bash
# Verificar que existe en staticfiles
ls backend/staticfiles/_next/static/chunks/

# Verificar configuración de Django
cd backend
python manage.py findstatic _next/static/chunks/main.js
# Debe mostrar la ruta
```

**Soluciones:**

1. **Ejecutar collectstatic:**
   ```bash
   python manage.py collectstatic --noinput --clear
   ```

2. **Verificar STATICFILES_DIRS:**
   ```python
   # settings.py
   STATICFILES_DIRS = [
       BASE_DIR.parent / 'frontend' / 'out',  # Verificar ruta
   ]
   ```

3. **Verificar que el build existe:**
   ```bash
   ls frontend/out/_next/
   # Debe existir
   ```

---

### Problema 3: Página en blanco

**Error:** Página carga pero está en blanco (HTML vacío o solo `<div id="__next"></div>`)

**Diagnóstico:**

1. Abrir DevTools (F12) → Console
2. Buscar errores JavaScript

**Errores comunes:**

**Error: `Uncaught SyntaxError: Unexpected token '<'`**

- **Causa:** JavaScript request devolvió HTML (probablemente index.html)
- **Solución:** Verificar que `/_next/static/` se sirve correctamente
  ```bash
  curl -I http://localhost:8000/_next/static/chunks/main.js
  # Content-Type debe ser application/javascript, NO text/html
  ```

**Error: `Failed to fetch API`**

- **Causa:** Variable de entorno `NEXT_PUBLIC_API_URL` incorrecta
- **Solución:**
  ```bash
  # Verificar en el build
  grep -r "NEXT_PUBLIC_API_URL" frontend/out/_next/

  # Debe mostrar "/api" o la URL correcta
  # Si muestra "http://localhost:8000/api", rebuild con .env.production
  ```

---

### Problema 4: Routing no funciona

**Error:** Click en link recarga toda la página (no es SPA)

**Diagnóstico:**

```bash
# Verificar que usas Link de Next.js
grep -r "<a href" frontend/app/
# Debe mostrar pocos resultados (solo externos)

# Debe usar:
import Link from 'next/link'
<Link href="/dashboard">Dashboard</Link>
```

**Solución:** Reemplazar `<a>` por `<Link>`

---

### Problema 5: CORS errors

**Error:** `Access to fetch at 'http://localhost:8000/api/...' has been blocked by CORS`

**Causa:** En producción (Static Export), frontend y backend están en el mismo origen, pero Django aún tiene CORS restrictivo.

**Solución:**

```python
# settings.py
if DEBUG:
    CORS_ALLOWED_ORIGINS = ["http://localhost:3000"]
else:
    # Producción: mismo origen, no necesita CORS
    CORS_ALLOW_ALL_ORIGINS = False
    CORS_ALLOWED_ORIGINS = []

    # Si usas subdominio diferente:
    # CORS_ALLOWED_ORIGINS = ["https://tudominio.com"]
```

---

### Problema 6: CSS no se aplica

**Error:** Página carga pero sin estilos (texto plano)

**Diagnóstico:**

```bash
# Verificar que CSS existe
ls frontend/out/_next/static/css/

# Verificar que se sirve
curl -I http://localhost:8000/_next/static/css/[archivo].css
# Debe devolver 200 OK con Content-Type: text/css
```

**Soluciones:**

1. **Hard reload:** `Ctrl+Shift+R` (Chrome) para limpiar cache

2. **Verificar Content-Type:**
   ```python
   # settings.py - Agregar:
   import mimetypes
   mimetypes.add_type("text/css", ".css", True)
   mimetypes.add_type("application/javascript", ".js", True)
   ```

3. **Rebuild:**
   ```bash
   cd frontend
   rm -rf .next out
   pnpm build
   cd ../backend
   python manage.py collectstatic --clear --noinput
   ```

---

### Problema 7: Variables de entorno no se aplican

**Error:** `NEXT_PUBLIC_API_URL` sigue siendo `http://localhost:8000` en producción

**Causa:** Variables se embeben en build time, no runtime

**Solución:**

```bash
cd frontend

# Verificar que existe .env.production
cat .env.production
# Debe mostrar: NEXT_PUBLIC_API_URL=/api

# Rebuild con variables correctas
pnpm build

# Verificar en el build
grep -r "localhost:8000" out/
# NO debe mostrar resultados
```

**IMPORTANTE:** Cada vez que cambies variables `NEXT_PUBLIC_*`, debes rebuild.

---

### Problema 8: 500 Internal Server Error

**Error:** Django devuelve 500 en cualquier ruta

**Diagnóstico:**

```bash
# Ver logs de Django
python manage.py runserver
# O
sudo journalctl -u techtrace -f

# Buscar el error específico
```

**Errores comunes:**

**Error: `TemplateDoesNotExist: index.html`**

- **Solución:**
  ```python
  # settings.py - Verificar TEMPLATES
  TEMPLATES = [
      {
          'DIRS': [
              BASE_DIR.parent / 'frontend' / 'out',  # ← Debe estar
          ],
      }
  ]
  ```

**Error: `ImproperlyConfigured: WhiteNoise...`**

- **Solución:**
  ```python
  # settings.py - Verificar orden de middleware
  MIDDLEWARE = [
      'django.middleware.security.SecurityMiddleware',
      'whitenoise.middleware.WhiteNoiseMiddleware',  # ← Aquí
      # ... resto
  ]
  ```

---

### Problema 9: Gunicorn no inicia

**Error:** `gunicorn: command not found`

**Solución:**

```bash
# Verificar que está instalado
pip list | grep gunicorn

# Instalar si falta
pip install gunicorn==23.0.0

# Verificar ruta
which gunicorn
# Debe mostrar ruta en venv
```

**Error:** `ModuleNotFoundError: No module named 'config'`

**Solución:**

```bash
# Verificar que estás en directorio correcto
cd backend
pwd
# Debe mostrar: /home/rvpadmin/tech-trace/backend

# Verificar que existe config/
ls config/
# Debe mostrar: __init__.py wsgi.py ...

# Ejecutar desde backend/
gunicorn config.wsgi:application
```

---

### Problema 10: Nginx 502 Bad Gateway

**Error:** Nginx devuelve 502

**Causa:** Django (Gunicorn) no está corriendo

**Diagnóstico:**

```bash
# Verificar que Django está corriendo
sudo systemctl status techtrace
# Debe mostrar: active (running)

# Si no está activo:
sudo systemctl start techtrace

# Verificar logs
sudo journalctl -u techtrace -n 50
```

**Verificar puerto:**

```bash
# Django debe estar en 8000
sudo netstat -tulpn | grep 8000
# Debe mostrar: tcp ... LISTEN 12345/gunicorn

# Si no hay nada:
# Django no está corriendo o está en otro puerto
```

---

## Scripts de Automatización

### Script 1: Build Completo

**Archivo:** `/scripts/build.sh` (crear)

```bash
#!/bin/bash
set -e  # Exit on error

echo "🚀 TechTrace Build Script"
echo "========================="
echo ""

# 1. Build Frontend
echo "📦 Building Next.js frontend..."
cd frontend
rm -rf .next out
pnpm install
pnpm build
echo "✅ Frontend build complete"
echo ""

# 2. Collectstatic Backend
echo "📦 Collecting Django static files..."
cd ../backend
source ../venv/bin/activate
python manage.py collectstatic --noinput --clear
echo "✅ Static files collected"
echo ""

echo "🎉 Build complete!"
echo ""
echo "Next steps:"
echo "  1. cd backend"
echo "  2. python manage.py migrate"
echo "  3. gunicorn config.wsgi:application"
```

**Uso:**

```bash
chmod +x scripts/build.sh
./scripts/build.sh
```

---

### Script 2: Deploy

**Archivo:** `/scripts/deploy.sh` (crear)

```bash
#!/bin/bash
set -e

echo "🚀 TechTrace Deploy Script"
echo "==========================="
echo ""

# Variables
PROJECT_DIR="/home/rvpadmin/tech-trace"
VENV_DIR="$PROJECT_DIR/venv"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# 1. Pull latest code
echo "📥 Pulling latest code..."
cd "$PROJECT_DIR"
git pull origin main
echo "✅ Code updated"
echo ""

# 2. Install Python dependencies
echo "📦 Installing Python dependencies..."
source "$VENV_DIR/bin/activate"
pip install -r "$BACKEND_DIR/requirements.txt"
echo "✅ Python dependencies installed"
echo ""

# 3. Install Node dependencies
echo "📦 Installing Node dependencies..."
cd "$FRONTEND_DIR"
pnpm install
echo "✅ Node dependencies installed"
echo ""

# 4. Build frontend
echo "📦 Building frontend..."
cd "$FRONTEND_DIR"
rm -rf .next out
pnpm build
echo "✅ Frontend built"
echo ""

# 5. Migrate database
echo "🗄️  Running migrations..."
cd "$BACKEND_DIR"
python manage.py migrate --noinput
echo "✅ Migrations complete"
echo ""

# 6. Collect static files
echo "📦 Collecting static files..."
python manage.py collectstatic --noinput --clear
echo "✅ Static files collected"
echo ""

# 7. Restart service
echo "🔄 Restarting service..."
sudo systemctl restart techtrace
sleep 3
sudo systemctl status techtrace --no-pager
echo "✅ Service restarted"
echo ""

echo "🎉 Deployment complete!"
echo ""
echo "URLs:"
echo "  Frontend: https://tudominio.com"
echo "  Admin: https://tudominio.com/admin"
echo "  API: https://tudominio.com/api"
```

**Uso:**

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

---

### Script 3: Dev Server

**Archivo:** `/scripts/dev.sh` (crear)

```bash
#!/bin/bash

echo "🚀 TechTrace Development Server"
echo "================================"
echo ""

# Trap Ctrl+C to kill both processes
trap 'kill $BACKEND_PID $FRONTEND_PID; exit' INT

# Start backend
echo "Starting Django backend (port 8000)..."
cd backend
source ../venv/bin/activate
python manage.py runserver &
BACKEND_PID=$!

# Start frontend
echo "Starting Next.js frontend (port 3000)..."
cd ../frontend
pnpm dev &
FRONTEND_PID=$!

echo ""
echo "✅ Both servers running!"
echo ""
echo "URLs:"
echo "  Frontend: http://localhost:3000"
echo "  Backend: http://localhost:8000"
echo "  Admin: http://localhost:8000/admin"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user interrupt
wait
```

**Uso:**

```bash
chmod +x scripts/dev.sh
./scripts/dev.sh
```

---

### Script 4: Test

**Archivo:** `/scripts/test.sh` (crear)

```bash
#!/bin/bash
set -e

echo "🧪 TechTrace Test Suite"
echo "======================="
echo ""

# Backend tests
echo "Running Django tests..."
cd backend
source ../venv/bin/activate
python manage.py test --verbosity=2
echo "✅ Backend tests passed"
echo ""

# Frontend lint (no hay tests E2E aún)
echo "Running Frontend lint..."
cd ../frontend
pnpm lint
echo "✅ Frontend lint passed"
echo ""

echo "🎉 All tests passed!"
```

**Uso:**

```bash
chmod +x scripts/test.sh
./scripts/test.sh
```

---

## Comparación con Standalone

### Static Export vs Standalone

| Característica | Static Export | Standalone |
|----------------|---------------|------------|
| **Complejidad** | 🟢 Baja | 🟡 Media |
| **Procesos** | 1 (Django) | 2 (Django + Node) |
| **Memoria** | ~256 MB | ~512 MB |
| **Server Components** | ❌ No | ✅ Sí |
| **SSR** | ❌ No | ✅ Sí |
| **ISR** | ❌ No | ✅ Sí |
| **API Routes** | ❌ No | ✅ Sí |
| **Client Components** | ✅ Sí | ✅ Sí |
| **Client Routing** | ✅ Sí | ✅ Sí |
| **Deployment** | 🟢 Simple | 🟡 Medio |
| **Escalabilidad** | 🟡 Limitada | 🟢 Alta |
| **Costo** | 🟢 Bajo | 🟡 Medio |

### ¿Cuándo migrar a Standalone?

Considera migrar si:

- ✅ Necesitas SSR para SEO
- ✅ Quieres usar Server Components
- ✅ Necesitas ISR (Incremental Static Regeneration)
- ✅ Tu app crece y necesitas más flexibilidad
- ✅ Tienes recursos para ejecutar dos procesos

**Migración es fácil:**

1. Cambiar `output: 'export'` a `output: 'standalone'`
2. Configurar reverse proxy (Nginx)
3. Ejecutar ambos servidores

---

## Referencias

### Documentación Oficial

- **Next.js Static Exports:** https://nextjs.org/docs/app/building-your-application/deploying/static-exports
- **Django Static Files:** https://docs.djangoproject.com/en/5.2/howto/static-files/
- **WhiteNoise Documentation:** https://whitenoise.readthedocs.io/
- **Gunicorn Documentation:** https://docs.gunicorn.org/

### Archivos del Proyecto

- **Configuración Next.js:** `/frontend/next.config.mjs`
- **Settings Django:** `/backend/config/settings.py`
- **URLs Django:** `/backend/config/urls.py`
- **Requirements:** `/backend/requirements.txt`

### Otros Recursos

- **TechTrace Progress:** `/memory-bank/progress.md`
- **Architecture:** `/memory-bank/architecture.md`
- **Testing Guide:** `/docs/TESTING-FASE-17.md`

---

## Conclusión

Has completado la configuración de Static Export para TechTrace. Ahora tienes:

✅ Frontend Next.js servido como archivos estáticos
✅ Backend Django sirviendo API y estáticos
✅ Un solo servidor para toda la aplicación
✅ Deployment simplificado
✅ Scripts de automatización

### Próximos Pasos

1. **Testing completo** en ambiente de staging
2. **Optimización** de performance (Lighthouse)
3. **Monitoreo** de logs y errores
4. **Backup** de base de datos regular
5. **CI/CD** si corresponde (GitHub Actions)

### Soporte

Si encuentras problemas:

1. Revisa la sección [Troubleshooting](#troubleshooting)
2. Verifica logs: `sudo journalctl -u techtrace -f`
3. Consulta documentación oficial de Next.js/Django
4. Revisa la arquitectura en `/memory-bank/architecture.md`

---

**¡Éxito con tu deployment!** 🚀
