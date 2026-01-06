# TechTrace Backend

API REST construida con Django 5.2.7 y Django REST Framework para la gestión de inventario de dispositivos móviles.

## 🚀 Inicio Rápido

### Configuración Automática (Recomendado)

```bash
# Desarrollo
./setup.sh desarrollo

# Producción
./setup.sh produccion
```

### Configuración Manual

```bash
# 1. Crear entorno virtual
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env según sea necesario

# 4. Ejecutar migraciones
python manage.py migrate

# 5. Crear superusuario
python manage.py createsuperuser

# 6. Ejecutar servidor
python manage.py runserver
```

## 📁 Estructura del Proyecto

```
backend/
├── apps/
│   ├── users/          # Autenticación y usuarios
│   ├── branches/       # Sucursales
│   ├── employees/      # Empleados
│   ├── devices/        # Dispositivos móviles
│   └── assignments/    # Asignaciones y solicitudes
├── config/             # Configuración de Django
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── .env.example        # Variables de entorno (desarrollo)
├── .env.production.example  # Variables de entorno (producción)
├── requirements.txt    # Dependencias Python
├── setup.sh           # Script de configuración automática
├── DEPLOYMENT.md      # Guía completa de deployment
└── README.md          # Este archivo
```

## 🔧 Configuración de Variables de Entorno

### Desarrollo (SQLite)

```env
DEBUG=True
SECRET_KEY=django-insecure-ejemplo
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

### Producción (PostgreSQL)

```env
DEBUG=False
SECRET_KEY=genera-una-clave-nueva
ALLOWED_HOSTS=tudominio.com,www.tudominio.com
DATABASE_ENGINE=django.db.backends.postgresql
DATABASE_NAME=techtrace_db
DATABASE_USER=techtrace_user
DATABASE_PASSWORD=password_seguro
DATABASE_HOST=localhost
DATABASE_PORT=5432
```

Ver [.env.example](.env.example) para desarrollo y [.env.production.example](.env.production.example) para producción.

## 🗄️ Base de Datos

### SQLite (Desarrollo)

Por defecto, usa SQLite. No requiere configuración adicional.

### PostgreSQL (Producción)

```bash
# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib  # Ubuntu/Debian
brew install postgresql@15  # macOS

# Crear base de datos
sudo -u postgres psql
CREATE DATABASE techtrace_db;
CREATE USER techtrace_user WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE techtrace_db TO techtrace_user;
\q

# Configurar .env con credenciales PostgreSQL
# Ejecutar migraciones
python manage.py migrate
```

## 📡 API Endpoints

Base URL: `http://localhost:8000/api/`

### Autenticación
- `POST /api/auth/login/` - Iniciar sesión
- `POST /api/auth/refresh/` - Refrescar token
- `POST /api/auth/logout/` - Cerrar sesión

### Dispositivos
- `GET /api/devices/` - Listar dispositivos
- `POST /api/devices/` - Crear dispositivo
- `GET /api/devices/{id}/` - Detalle de dispositivo
- `PUT /api/devices/{id}/` - Actualizar dispositivo
- `DELETE /api/devices/{id}/` - Eliminar dispositivo
- `POST /api/devices/{id}/marcar_disponible/` - Marcar como disponible
- `POST /api/devices/{id}/marcar_mantenimiento/` - Enviar a mantenimiento
- `POST /api/devices/{id}/marcar_baja/` - Dar de baja
- `POST /api/devices/{id}/marcar_robo/` - Reportar robo

### Empleados
- `GET /api/employees/` - Listar empleados
- `POST /api/employees/` - Crear empleado
- `GET /api/employees/{id}/` - Detalle de empleado
- `PUT /api/employees/{id}/` - Actualizar empleado
- `DELETE /api/employees/{id}/` - Eliminar empleado

### Asignaciones
- `GET /api/assignments/` - Listar asignaciones
- `POST /api/assignments/` - Crear asignación
- `GET /api/assignments/{id}/` - Detalle de asignación
- `PUT /api/assignments/{id}/` - Actualizar asignación
- `POST /api/assignments/{id}/devolver/` - Registrar devolución

### Otros
- `GET /api/branches/` - Sucursales
- `GET /api/business-units/` - Unidades de negocio
- `GET /api/stats/` - Estadísticas del sistema


## 🧪 Testing

```bash
# Ejecutar todos los tests
python manage.py test

# Tests de una app específica
python manage.py test apps.devices

# Test específico
python manage.py test apps.devices.tests.TestDeviceModel

# Con coverage
pip install coverage
coverage run --source='.' manage.py test
coverage report
coverage html  # Genera reporte HTML
```

## 📦 Comandos Útiles

```bash
# Crear migraciones
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Shell interactiva
python manage.py shell

# Recopilar archivos estáticos (producción)
python manage.py collectstatic

# Generar datos de prueba
python manage.py loaddata fixtures/initial_data.json
```

## 🚢 Deployment

### Desarrollo
```bash
python manage.py runserver
```

### Producción con Gunicorn
```bash
# Instalar Gunicorn
pip install gunicorn

# Ejecutar
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3
```

### Docker
```bash
# Construir imagen
docker build -t techtrace-backend .

# Ejecutar contenedor
docker run -p 8000:8000 --env-file .env techtrace-backend

# Con Docker Compose
docker-compose up -d
```

### Servicios Cloud

Ver guía completa en [DEPLOYMENT.md](DEPLOYMENT.md) para:
- Heroku
- Railway
- Render
- DigitalOcean
- AWS
- Google Cloud

## 🔒 Seguridad

### Checklist de Producción

- [ ] `DEBUG=False`
- [ ] SECRET_KEY única y segura
- [ ] ALLOWED_HOSTS configurado correctamente
- [ ] PostgreSQL en lugar de SQLite
- [ ] HTTPS habilitado (certificado SSL)
- [ ] Todas las variables de seguridad activadas
- [ ] Backups automáticos configurados
- [ ] Logging apropiado
- [ ] Monitoreo de errores (Sentry)
- [ ] Firewall configurado

## 🛠️ Tecnologías

- **Framework:** Django 5.2.7
- **API:** Django REST Framework 3.14+
- **Autenticación:** JWT (djangorestframework-simplejwt)
- **Base de datos:** SQLite (dev) / PostgreSQL (prod)
- **CORS:** django-cors-headers
- **Filtrado:** django-filter
- **PDFs:** ReportLab
- **Imágenes:** Pillow

## 📚 Documentación Adicional

- [DEPLOYMENT.md](DEPLOYMENT.md) - Guía completa de deployment
- [.env.example](.env.example) - Variables de entorno para desarrollo
- [.env.production.example](.env.production.example) - Variables de entorno para producción
- [../CLAUDE.md](../CLAUDE.md) - Guía del proyecto completo

## 🐛 Solución de Problemas

### Error: "ALLOWED_HOSTS validation failed"
```env
# Agregar tu dominio a ALLOWED_HOSTS en .env
ALLOWED_HOSTS=localhost,127.0.0.1,tudominio.com
```

### Error: "No module named 'apps'"
```bash
# Verificar que estás en el directorio correcto
cd backend
python manage.py runserver
```

### Error de conexión a PostgreSQL
```bash
# Verificar que PostgreSQL está corriendo
sudo systemctl status postgresql

# Verificar credenciales
psql -U techtrace_user -d techtrace_db -h localhost
```

### Error con SECRET_KEY
```bash
# Generar nueva SECRET_KEY
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

## 📞 Soporte

Para más información sobre el proyecto completo, consulta el [README principal](../README.md) y [CLAUDE.md](../CLAUDE.md).

## 📄 Licencia

Este proyecto es parte del sistema TechTrace de gestión de inventario de dispositivos móviles.
