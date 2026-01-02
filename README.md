# TechTrace - Sistema de Gestión de Inventario

Sistema de gestión de inventario de dispositivos móviles construido como una aplicación full-stack con Next.js y Django.

## Tecnologías

### Frontend
- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS 4.1.16**
- **shadcn/ui** - Componentes de UI
- **Zustand** - Gestión de estado global

### Backend
- **Django 5.2.7**
- **Django REST Framework**
- **SQLite** (desarrollo)
- **JWT Authentication**

## Características

- Gestión de dispositivos móviles (teléfonos, tablets, laptops, etc.)
- Control de asignaciones de dispositivos a empleados
- Gestión de empleados y sucursales
- Sistema de autenticación y autorización
- Generación de reportes en PDF
- Interfaz responsiva y moderna
- API RESTful completa

## Requisitos Previos

- **Python 3.10+**
- **Node.js 18+**
- **pnpm** (gestor de paquetes para frontend)

## Instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd tech-trace
```

### 2. Configurar Backend (Django)

```bash
# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# En Linux/Mac:
source venv/bin/activate
# En Windows:
# venv\Scripts\activate

# Navegar al directorio backend
cd backend

# Instalar dependencias
pip install -r requirements.txt

# Copiar y configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Aplicar migraciones
python manage.py migrate

# Crear superusuario (admin)
python manage.py createsuperuser

# Ejecutar servidor de desarrollo
python manage.py runserver
```

El backend estará disponible en `http://localhost:8000`

### 3. Configurar Frontend (Next.js)

```bash
# Navegar al directorio frontend (desde la raíz del proyecto)
cd frontend

# Instalar dependencias
pnpm install

# Copiar y configurar variables de entorno
cp .env.example .env.local
# Editar .env.local si es necesario

# Ejecutar servidor de desarrollo
pnpm dev
```

El frontend estará disponible en `http://localhost:3000`

## Estructura del Proyecto

```
tech-trace/
├── backend/           # Aplicación Django
│   ├── apps/         # Apps de Django (devices, employees, etc.)
│   ├── config/       # Configuración del proyecto Django
│   ├── manage.py
│   └── requirements.txt
├── frontend/         # Aplicación Next.js
│   ├── app/         # App Router (rutas y páginas)
│   ├── components/  # Componentes React
│   ├── lib/        # Utilidades, servicios, tipos
│   └── public/     # Archivos estáticos
└── venv/           # Entorno virtual de Python (ignorado en git)
```

## Scripts Disponibles

### Backend

```bash
# Crear migraciones
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Ejecutar servidor
python manage.py runserver

# Ejecutar shell de Django
python manage.py shell

# Ejecutar tests
python manage.py test

# Crear superusuario
python manage.py createsuperuser
```

### Frontend

```bash
# Desarrollo
pnpm dev

# Build de producción
pnpm build

# Ejecutar en producción
pnpm start

# Linter
pnpm lint
```

## Configuración

### Variables de Entorno - Backend (.env)

```env
SECRET_KEY=tu-secret-key-segura
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
LANGUAGE_CODE=es-es
TIME_ZONE=UTC
```

### Variables de Entorno - Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## API Endpoints

La API REST está disponible en `http://localhost:8000/api/` con los siguientes endpoints principales:

- `/api/auth/login/` - Autenticación
- `/api/devices/` - Gestión de dispositivos
- `/api/employees/` - Gestión de empleados
- `/api/branches/` - Gestión de sucursales
- `/api/assignments/` - Gestión de asignaciones
- `/api/users/` - Gestión de usuarios

Documentación completa de la API disponible en `/api/docs/` (cuando el servidor está corriendo).

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -m 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request


