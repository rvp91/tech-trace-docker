# Guía de Deployment - TechTrace Backend

Esta guía explica cómo configurar y desplegar el backend de TechTrace en diferentes entornos.

## 📋 Tabla de Contenidos

- [Configuración Inicial](#configuración-inicial)
- [Desarrollo Local](#desarrollo-local)
- [Producción con PostgreSQL](#producción-con-postgresql)
- [Deployment en Servicios Cloud](#deployment-en-servicios-cloud)
- [Docker Deployment](#docker-deployment)
- [Variables de Entorno](#variables-de-entorno)

---

## 🚀 Configuración Inicial

### 1. Clonar el Repositorio

```bash
git clone <url-del-repo>
cd tech-trace/backend
```

### 2. Crear Entorno Virtual

```bash
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
```

### 3. Instalar Dependencias

```bash
pip install -r requirements.txt
```

### 4. Configurar Variables de Entorno

```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

---

## 💻 Desarrollo Local

### Configuración SQLite (Por Defecto)

El archivo `.env` viene preconfigurado para desarrollo local con SQLite:

```env
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
SECRET_KEY=django-insecure-ejemplo-cambiar-en-produccion
```

### Inicializar Base de Datos

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

### Ejecutar Servidor de Desarrollo

```bash
python manage.py runserver
```

La API estará disponible en: `http://localhost:8000`

---

## 🏭 Producción con PostgreSQL

### 1. Instalar PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Windows:**
Descargar desde [postgresql.org](https://www.postgresql.org/download/windows/)

### 2. Crear Base de Datos

```bash
sudo -u postgres psql

# En el shell de PostgreSQL:
CREATE DATABASE techtrace_db;
CREATE USER techtrace_user WITH PASSWORD 'tu_password_seguro';
ALTER ROLE techtrace_user SET client_encoding TO 'utf8';
ALTER ROLE techtrace_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE techtrace_user SET timezone TO 'America/Santiago';
GRANT ALL PRIVILEGES ON DATABASE techtrace_db TO techtrace_user;
\q
```

### 3. Configurar `.env` para PostgreSQL

```env
# Django
DEBUG=False
SECRET_KEY=genera-una-clave-nueva-aqui
ALLOWED_HOSTS=tudominio.com,www.tudominio.com

# Base de Datos PostgreSQL
DATABASE_ENGINE=django.db.backends.postgresql
DATABASE_NAME=techtrace_db
DATABASE_USER=techtrace_user
DATABASE_PASSWORD=tu_password_seguro
DATABASE_HOST=localhost
DATABASE_PORT=5432

# CORS
CORS_ALLOWED_ORIGINS=https://tudominio.com,https://www.tudominio.com

# Seguridad
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
SECURE_BROWSER_XSS_FILTER=True
SECURE_CONTENT_TYPE_NOSNIFF=True
X_FRAME_OPTIONS=DENY
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True

# Archivos estáticos
STATIC_ROOT=/var/www/techtrace/static/
MEDIA_ROOT=/var/www/techtrace/media/

# Frontend
FRONTEND_URL=https://tudominio.com
```

### 4. Generar SECRET_KEY Nueva

```bash
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

### 5. Migrar Base de Datos

```bash
python manage.py migrate
python manage.py createsuperuser
```

### 6. Recopilar Archivos Estáticos

```bash
python manage.py collectstatic --noinput
```

### 7. Ejecutar con Gunicorn

```bash
# Instalar gunicorn
pip install gunicorn

# Ejecutar
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3
```

---

## ☁️ Deployment en Servicios Cloud

### Heroku

```bash
# Instalar Heroku CLI
# Login
heroku login

# Crear app
heroku create tu-app-techtrace

# Agregar PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Configurar variables de entorno
heroku config:set DEBUG=False
heroku config:set SECRET_KEY=tu-secret-key-generada
heroku config:set ALLOWED_HOSTS=tu-app-techtrace.herokuapp.com

# Deploy
git push heroku main

# Migrar DB
heroku run python manage.py migrate
heroku run python manage.py createsuperuser
```

### Railway

1. Conectar repositorio en [railway.app](https://railway.app)
2. Agregar servicio PostgreSQL
3. Configurar variables de entorno en el dashboard
4. Railway usa `DATABASE_URL` automáticamente

### Render

1. Crear nuevo Web Service en [render.com](https://render.com)
2. Conectar repositorio
3. Configurar:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn config.wsgi:application`
4. Agregar PostgreSQL database
5. Configurar variables de entorno

### DigitalOcean App Platform

1. Crear nueva App en [DigitalOcean](https://cloud.digitalocean.com/apps)
2. Conectar repositorio
3. Agregar base de datos PostgreSQL
4. Configurar variables de entorno
5. Deploy automático

---

## 🐳 Docker Deployment

### Dockerfile

Crear `backend/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código
COPY . .

# Recopilar archivos estáticos
RUN python manage.py collectstatic --noinput

# Exponer puerto
EXPOSE 8000

# Comando de inicio
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]
```

### docker-compose.yml

Crear en la raíz del proyecto:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: techtrace_db
      POSTGRES_USER: techtrace_user
      POSTGRES_PASSWORD: techtrace_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    command: gunicorn config.wsgi:application --bind 0.0.0.0:8000
    volumes:
      - ./backend:/app
      - static_volume:/app/staticfiles
      - media_volume:/app/media
    ports:
      - "8000:8000"
    env_file:
      - ./backend/.env
    depends_on:
      - postgres

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - static_volume:/static
      - media_volume:/media
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
  static_volume:
  media_volume:
```

### Ejecutar con Docker

```bash
# Construir y ejecutar
docker-compose up -d

# Migrar base de datos
docker-compose exec backend python manage.py migrate

# Crear superusuario
docker-compose exec backend python manage.py createsuperuser
```

---

## 🔧 Variables de Entorno

### Variables Requeridas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `SECRET_KEY` | Clave secreta de Django | `django-insecure-xxx` |
| `DEBUG` | Modo debug (solo desarrollo) | `True` / `False` |
| `ALLOWED_HOSTS` | Hosts permitidos | `localhost,tudominio.com` |
| `CORS_ALLOWED_ORIGINS` | Orígenes CORS | `http://localhost:3000` |

### Variables de Base de Datos

#### Opción 1: Variables Individuales

| Variable | Descripción | Default |
|----------|-------------|---------|
| `DATABASE_ENGINE` | Motor de BD | `django.db.backends.sqlite3` |
| `DATABASE_NAME` | Nombre de la BD | `db.sqlite3` |
| `DATABASE_USER` | Usuario | - |
| `DATABASE_PASSWORD` | Contraseña | - |
| `DATABASE_HOST` | Host | `localhost` |
| `DATABASE_PORT` | Puerto | `5432` |

#### Opción 2: DATABASE_URL (Recomendado para Cloud)

```env
DATABASE_URL=postgresql://usuario:password@host:5432/nombre_db
```

### Variables Opcionales

| Variable | Descripción | Default |
|----------|-------------|---------|
| `JWT_ACCESS_TOKEN_LIFETIME` | Duración token (minutos) | `60` |
| `JWT_REFRESH_TOKEN_LIFETIME` | Duración refresh (días) | `7` |
| `LANGUAGE_CODE` | Idioma del sistema | `es-cl` |
| `TIME_ZONE` | Zona horaria | `America/Santiago` |
| `EMAIL_HOST` | Host SMTP | `smtp.gmail.com` |
| `EMAIL_PORT` | Puerto SMTP | `587` |
| `FRONTEND_URL` | URL del frontend | `http://localhost:3000` |
| `MAX_UPLOAD_SIZE` | Tamaño máx. upload (MB) | `10` |
| `DEVICE_DEPRECIATION_YEARS` | Años depreciación | `3` |
| `LOG_LEVEL` | Nivel de logging | `INFO` |

---

## 🔒 Checklist de Seguridad para Producción

- [ ] `DEBUG=False`
- [ ] Generar nueva `SECRET_KEY`
- [ ] Configurar `ALLOWED_HOSTS` correctamente
- [ ] Habilitar todas las opciones de seguridad SSL/HTTPS
- [ ] Usar PostgreSQL en lugar de SQLite
- [ ] Configurar backups automáticos de la base de datos
- [ ] Configurar HTTPS con certificado SSL válido
- [ ] Revisar permisos de archivos y directorios
- [ ] Configurar firewall para restringir accesos
- [ ] Habilitar logging apropiado
- [ ] Configurar monitoreo de errores (Sentry opcional)

---

## 📚 Recursos Adicionales

- [Django Deployment Checklist](https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/)
- [Django REST Framework Deployment](https://www.django-rest-framework.org/topics/rest-hypermedia-hateoas/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Gunicorn Documentation](https://docs.gunicorn.org/)

---

## 🆘 Solución de Problemas

### Error: "ALLOWED_HOSTS validation failed"

```env
# Agregar el dominio o IP a ALLOWED_HOSTS
ALLOWED_HOSTS=tudominio.com,tu-ip-publica
```

### Error de conexión a PostgreSQL

```bash
# Verificar que PostgreSQL esté corriendo
sudo systemctl status postgresql

# Verificar credenciales en .env
psql -U techtrace_user -d techtrace_db -h localhost
```

### Archivos estáticos no se cargan

```bash
# Recopilar archivos estáticos
python manage.py collectstatic --noinput

# Verificar STATIC_ROOT en .env
```

### Error con SECRET_KEY

```bash
# Generar nueva clave
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```
