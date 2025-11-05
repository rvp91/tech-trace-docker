# Plan de Implementación - TechTrace MVP
## Sistema de Gestión de Inventario de Dispositivos Móviles

**Versión:** 1.0
**Fecha:** Noviembre 2025
**Objetivo:** Guía paso a paso para implementar la aplicación base (MVP)

---

## Introducción

Este documento proporciona instrucciones detalladas para implementar TechTrace desde cero. Cada paso es pequeño, específico y verificable. Los pasos deben ejecutarse en orden secuencial.

**Principios:**
- Un paso a la vez
- Cada paso incluye su test de validación
- No avanzar sin validar el paso anterior
- Enfoque en funcionalidad base antes que características avanzadas

---

## FASE 0: PREPARACIÓN DEL ENTORNO

### Paso 0.1: Verificar estructura de directorios base
**Instrucción:**
Verificar que existan los directorios principales: `/backend`, `/frontend`, `/memory-bank`, `/docs`, y `/venv`.

**Test de validación:**
```bash
ls -la
# Debe mostrar: backend/, frontend/, memory-bank/, venv/
```

### Paso 0.2: Verificar Python y Node.js
**Instrucción:**
Confirmar que Python 3.13+ y Node.js 18+ están instalados en el sistema.

**Test de validación:**
```bash
python --version  # Debe mostrar Python 3.13.x
node --version    # Debe mostrar v18.x.x o superior
pnpm --version    # Debe mostrar versión de pnpm
```

### Paso 0.3: Activar entorno virtual de Python
**Instrucción:**
Navegar a la raíz del proyecto y activar el entorno virtual.

**Test de validación:**
```bash
source venv/bin/activate
which python  # Debe apuntar a /tech-trace/venv/bin/python
```

---

## FASE 1: CONFIGURACIÓN DEL BACKEND

### Paso 1.1: Verificar estructura del proyecto Django
**Instrucción:**
Confirmar que existe el directorio `backend/config/` con los archivos: `settings.py`, `urls.py`, `wsgi.py`, `asgi.py`, y `__init__.py`.

**Test de validación:**
```bash
cd backend
ls config/
# Debe mostrar: __init__.py, settings.py, urls.py, wsgi.py, asgi.py
```

### Paso 1.2: Verificar archivo .env en backend
**Instrucción:**
Confirmar que existe el archivo `backend/.env` con las variables: `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `LANGUAGE_CODE`, `TIME_ZONE`.

**Test de validación:**
```bash
cd backend
cat .env | grep -E "SECRET_KEY|DEBUG|ALLOWED_HOSTS|CORS_ALLOWED_ORIGINS"
# Debe mostrar las 4 variables definidas
```

### Paso 1.3: Instalar dependencias de Python
**Instrucción:**
Desde el directorio `backend/`, ejecutar `pip install -r requirements.txt` para instalar todas las dependencias.

**Test de validación:**
```bash
pip list | grep -E "Django|djangorestframework|django-cors-headers|python-dotenv"
# Debe mostrar las 4 librerías instaladas
```

### Paso 1.4: Verificar configuración de Django settings
**Instrucción:**
Abrir `backend/config/settings.py` y verificar que:
- `python-dotenv` esté importado y configurado
- `LANGUAGE_CODE = 'es-es'`
- `django-cors-headers` esté en `INSTALLED_APPS`
- `CORS_ALLOW_CREDENTIALS = True`

**Test de validación:**
```bash
python manage.py check
# Debe mostrar: System check identified no issues (0 silenced).
```

### Paso 1.5: Crear base de datos inicial
**Instrucción:**
Ejecutar las migraciones iniciales de Django para crear `db.sqlite3`.

**Test de validación:**
```bash
python manage.py migrate
ls -la | grep db.sqlite3
# Debe mostrar el archivo db.sqlite3 creado
```

### Paso 1.6: Crear superusuario inicial
**Instrucción:**
Crear un superusuario de Django con username "admin" para acceso al panel de administración.

**Test de validación:**
```bash
python manage.py createsuperuser --username admin --email admin@techtrace.com
python manage.py shell -c "from django.contrib.auth.models import User; print(User.objects.filter(username='admin').exists())"
# Debe mostrar: True
```

### Paso 1.7: Iniciar servidor de desarrollo Django
**Instrucción:**
Ejecutar `python manage.py runserver` y verificar que el servidor inicie en `http://localhost:8000`.

**Test de validación:**
```bash
curl http://localhost:8000/admin/login/?next=/admin/
# Debe retornar HTML del login de Django admin (status 200)
```

---

## FASE 2: MODELOS DE BASE DE DATOS

### Paso 2.1: Crear app 'users'
**Instrucción:**
Crear una Django app llamada `users` en el directorio `backend/apps/users/` para gestionar usuarios y autenticación.

**Test de validación:**
```bash
cd backend
python manage.py startapp users apps/users
ls apps/users/
# Debe mostrar: __init__.py, models.py, views.py, admin.py, apps.py, migrations/
```

### Paso 2.2: Agregar app 'users' a INSTALLED_APPS
**Instrucción:**
En `config/settings.py`, agregar `'apps.users'` a la lista `INSTALLED_APPS`.

**Test de validación:**
```bash
python manage.py check
# No debe mostrar errores relacionados con apps.users
```

### Paso 2.3: Crear modelo User personalizado
**Instrucción:**
En `apps/users/models.py`, extender el modelo User de Django para incluir el campo `role` con opciones ('ADMIN', 'OPERADOR').

**Test de validación:**
```bash
python manage.py makemigrations users
# Debe crear un archivo de migración en apps/users/migrations/
```

### Paso 2.4: Aplicar migraciones de User
**Instrucción:**
Ejecutar `python manage.py migrate` para aplicar los cambios del modelo User.

**Test de validación:**
```bash
python manage.py migrate
python manage.py shell -c "from apps.users.models import User; print(User._meta.get_field('role'))"
# Debe mostrar información del campo 'role'
```

### Paso 2.5: Crear app 'branches'
**Instrucción:**
Crear una Django app llamada `branches` en `backend/apps/branches/` para gestionar sucursales.

**Test de validación:**
```bash
python manage.py startapp branches apps/branches
ls apps/branches/
# Debe mostrar los archivos base de la app
```

### Paso 2.6: Agregar app 'branches' a INSTALLED_APPS
**Instrucción:**
En `config/settings.py`, agregar `'apps.branches'` a `INSTALLED_APPS`.

**Test de validación:**
```bash
python manage.py check
# No debe mostrar errores
```

### Paso 2.7: Crear modelo Branch
**Instrucción:**
En `apps/branches/models.py`, crear el modelo `Branch` con campos:
- `nombre` (CharField, max_length=100)
- `codigo` (CharField, max_length=20, unique=True)
- `direccion` (TextField, opcional)
- `ciudad` (CharField, max_length=100)
- `is_active` (BooleanField, default=True)
- `created_at` (DateTimeField, auto_now_add=True)
- `updated_at` (DateTimeField, auto_now=True)

**Test de validación:**
```bash
python manage.py makemigrations branches
python manage.py migrate
python manage.py shell -c "from apps.branches.models import Branch; print(Branch._meta.fields)"
# Debe mostrar todos los campos definidos
```

### Paso 2.8: Crear app 'employees'
**Instrucción:**
Crear una Django app llamada `employees` en `backend/apps/employees/`.

**Test de validación:**
```bash
python manage.py startapp employees apps/employees
# Agregar a INSTALLED_APPS
python manage.py check
# No debe mostrar errores
```

### Paso 2.9: Crear modelo Employee
**Instrucción:**
En `apps/employees/models.py`, crear el modelo `Employee` con campos:
- `rut` (CharField, max_length=12, unique=True)
- `nombre_completo` (CharField, max_length=200)
- `cargo` (CharField, max_length=100)
- `correo_corporativo` (EmailField, opcional)
- `gmail_personal` (EmailField, opcional)
- `telefono` (CharField, max_length=20, opcional)
- `sucursal` (ForeignKey a Branch)
- `unidad_negocio` (CharField, max_length=100, opcional)
- `estado` (CharField con choices: 'ACTIVO', 'INACTIVO')
- `created_at`, `updated_at`
- `created_by` (ForeignKey a User)

**Test de validación:**
```bash
python manage.py makemigrations employees
python manage.py migrate
python manage.py shell -c "from apps.employees.models import Employee; print(Employee._meta.get_field('rut').unique)"
# Debe mostrar: True
```

### Paso 2.10: Crear app 'devices'
**Instrucción:**
Crear una Django app llamada `devices` en `backend/apps/devices/`.

**Test de validación:**
```bash
python manage.py startapp devices apps/devices
# Agregar a INSTALLED_APPS
python manage.py check
```

### Paso 2.11: Crear modelo Device
**Instrucción:**
En `apps/devices/models.py`, crear el modelo `Device` con campos:
- `tipo_equipo` (CharField con choices: 'LAPTOP', 'TELEFONO', 'TABLET', 'SIM', 'ACCESORIO')
- `marca` (CharField, max_length=50)
- `modelo` (CharField, max_length=100)
- `serie_imei` (CharField, max_length=100, unique=True)
- `numero_telefono` (CharField, max_length=20, opcional)
- `numero_factura` (CharField, max_length=50, opcional)
- `estado` (CharField con choices: 'DISPONIBLE', 'ASIGNADO', 'MANTENIMIENTO', 'BAJA', 'ROBO')
- `sucursal` (ForeignKey a Branch)
- `fecha_ingreso` (DateField)
- `created_at`, `updated_at`
- `created_by` (ForeignKey a User)

**Test de validación:**
```bash
python manage.py makemigrations devices
python manage.py migrate
python manage.py shell -c "from apps.devices.models import Device; print(Device._meta.get_field('serie_imei').unique)"
# Debe mostrar: True
```

### Paso 2.12: Crear app 'assignments'
**Instrucción:**
Crear una Django app llamada `assignments` en `backend/apps/assignments/`.

**Test de validación:**
```bash
python manage.py startapp assignments apps/assignments
# Agregar a INSTALLED_APPS
python manage.py check
```

### Paso 2.13: Crear modelo Request (Solicitud)
**Instrucción:**
En `apps/assignments/models.py`, crear el modelo `Request` con campos:
- `empleado` (ForeignKey a Employee)
- `jefatura_solicitante` (CharField, max_length=200)
- `tipo_dispositivo` (CharField con choices similares a Device)
- `justificacion` (TextField, opcional)
- `fecha_solicitud` (DateTimeField, auto_now_add=True)
- `estado` (CharField con choices: 'PENDIENTE', 'APROBADA', 'RECHAZADA', 'COMPLETADA')
- `created_by` (ForeignKey a User)
- `created_at`, `updated_at`

**Test de validación:**
```bash
python manage.py makemigrations assignments
python manage.py migrate
python manage.py shell -c "from apps.assignments.models import Request; print(Request._meta.get_field('estado').choices)"
# Debe mostrar las 4 opciones de estado
```

### Paso 2.14: Crear modelo Assignment (Asignación)
**Instrucción:**
En el mismo archivo `apps/assignments/models.py`, crear el modelo `Assignment` con campos:
- `solicitud` (ForeignKey a Request, null=True, blank=True)
- `empleado` (ForeignKey a Employee)
- `dispositivo` (ForeignKey a Device)
- `tipo_entrega` (CharField con choices: 'PERMANENTE', 'TEMPORAL')
- `fecha_entrega` (DateField)
- `fecha_devolucion` (DateField, null=True, blank=True)
- `estado_carta` (CharField con choices: 'FIRMADA', 'PENDIENTE', 'NO_APLICA')
- `estado_asignacion` (CharField con choices: 'ACTIVA', 'FINALIZADA')
- `observaciones` (TextField, opcional)
- `created_by` (ForeignKey a User)
- `created_at`, `updated_at`

**Test de validación:**
```bash
python manage.py makemigrations assignments
python manage.py migrate
python manage.py shell -c "from apps.assignments.models import Assignment; print(Assignment._meta.get_field('dispositivo'))"
# Debe mostrar información de la relación ForeignKey
```

### Paso 2.15: Crear modelo Return (Devolución)
**Instrucción:**
En el mismo archivo, crear el modelo `Return` con campos:
- `asignacion` (ForeignKey a Assignment)
- `fecha_devolucion` (DateField)
- `estado_dispositivo` (CharField con choices: 'OPTIMO', 'CON_DANOS', 'NO_FUNCIONAL')
- `observaciones` (TextField, opcional)
- `created_by` (ForeignKey a User)
- `created_at` (DateTimeField, auto_now_add=True)

**Test de validación:**
```bash
python manage.py makemigrations assignments
python manage.py migrate
python manage.py shell -c "from apps.assignments.models import Return; print(Return._meta.get_field('estado_dispositivo').choices)"
# Debe mostrar las 3 opciones
```

### Paso 2.16: Crear modelo AuditLog
**Instrucción:**
Crear un archivo nuevo `apps/users/audit.py` y definir el modelo `AuditLog` con campos:
- `user` (ForeignKey a User)
- `action` (CharField con choices: 'CREATE', 'UPDATE', 'DELETE')
- `entity_type` (CharField, max_length=50)
- `entity_id` (IntegerField)
- `changes` (JSONField)
- `timestamp` (DateTimeField, auto_now_add=True)

**Test de validación:**
```bash
python manage.py makemigrations users
python manage.py migrate
python manage.py shell -c "from apps.users.audit import AuditLog; print(AuditLog.objects.model)"
# Debe mostrar el modelo AuditLog
```

### Paso 2.17: Registrar modelos en Django Admin
**Instrucción:**
En cada archivo `admin.py` de las apps (branches, employees, devices, assignments), registrar los modelos creados usando `admin.site.register(ModelName)`.

**Test de validación:**
```bash
python manage.py runserver
# Acceder a http://localhost:8000/admin/
# Debe mostrar las secciones: Branches, Employees, Devices, Requests, Assignments, Returns
```

### Paso 2.18: Crear datos de prueba para sucursales
**Instrucción:**
Usando el Django shell o admin, crear al menos 3 sucursales de ejemplo: "Santiago Centro", "Valparaíso", "Concepción".

**Test de validación:**
```bash
python manage.py shell -c "from apps.branches.models import Branch; print(Branch.objects.count())"
# Debe mostrar: 3 (o más)
```

---

## FASE 3: API REST CON DJANGO REST FRAMEWORK

### Paso 3.1: Instalar Django REST Framework
**Instrucción:**
Verificar que `djangorestframework` esté en `requirements.txt` y ejecutar `pip install djangorestframework`.

**Test de validación:**
```bash
pip show djangorestframework
# Debe mostrar información del paquete instalado
```

### Paso 3.2: Agregar DRF a INSTALLED_APPS
**Instrucción:**
En `config/settings.py`, agregar `'rest_framework'` a `INSTALLED_APPS`.

**Test de validación:**
```bash
python manage.py check
# No debe mostrar errores relacionados con rest_framework
```

### Paso 3.3: Configurar DRF en settings
**Instrucción:**
En `config/settings.py`, agregar la configuración básica de REST_FRAMEWORK con:
- `DEFAULT_PAGINATION_CLASS`: 'rest_framework.pagination.PageNumberPagination'
- `PAGE_SIZE`: 20
- `DEFAULT_AUTHENTICATION_CLASSES`: incluir TokenAuthentication
- `DEFAULT_PERMISSION_CLASSES`: incluir IsAuthenticated

**Test de validación:**
```bash
python manage.py shell -c "from django.conf import settings; print(settings.REST_FRAMEWORK)"
# Debe mostrar la configuración definida
```

### Paso 3.4: Crear serializer para Branch
**Instrucción:**
Crear archivo `apps/branches/serializers.py` y definir `BranchSerializer` que serialice todos los campos del modelo Branch.

**Test de validación:**
```bash
python manage.py shell -c "from apps.branches.serializers import BranchSerializer; print(BranchSerializer.Meta.model)"
# Debe mostrar: <class 'apps.branches.models.Branch'>
```

### Paso 3.5: Crear ViewSet para Branch
**Instrucción:**
En `apps/branches/views.py`, crear `BranchViewSet` que herede de `ModelViewSet` y use `BranchSerializer`.

**Test de validación:**
```bash
python manage.py shell -c "from apps.branches.views import BranchViewSet; print(BranchViewSet.queryset.model)"
# Debe mostrar el modelo Branch
```

### Paso 3.6: Configurar rutas para Branch API
**Instrucción:**
Crear archivo `apps/branches/urls.py`, configurar un router de DRF y registrar `BranchViewSet`.

**Test de validación:**
```bash
python manage.py shell -c "from apps.branches.urls import router; print(router.registry)"
# Debe mostrar el registro del BranchViewSet
```

### Paso 3.7: Incluir rutas de branches en config/urls.py
**Instrucción:**
En `config/urls.py`, incluir las rutas de `apps.branches.urls` bajo el path `api/branches/`.

**Test de validación:**
```bash
python manage.py runserver
curl http://localhost:8000/api/branches/
# Debe retornar JSON con lista de sucursales (puede requerir autenticación)
```

### Paso 3.8: Crear serializer para Employee
**Instrucción:**
Crear archivo `apps/employees/serializers.py` y definir `EmployeeSerializer` con todos los campos, incluyendo representación anidada de `sucursal` y `created_by`.

**Test de validación:**
```bash
python manage.py shell -c "from apps.employees.serializers import EmployeeSerializer; print(EmployeeSerializer().get_fields())"
# Debe listar todos los campos del modelo Employee
```

### Paso 3.9: Crear ViewSet para Employee con filtros
**Instrucción:**
En `apps/employees/views.py`, crear `EmployeeViewSet` con capacidad de filtrar por `estado`, `sucursal`, y búsqueda por `nombre_completo` y `rut`.

**Test de validación:**
```bash
python manage.py shell -c "from apps.employees.views import EmployeeViewSet; print(hasattr(EmployeeViewSet, 'filterset_fields'))"
# Debe mostrar: True
```

### Paso 3.10: Configurar rutas para Employee API
**Instrucción:**
Crear `apps/employees/urls.py`, configurar router y registrar `EmployeeViewSet`. Incluir en `config/urls.py` bajo `api/employees/`.

**Test de validación:**
```bash
curl http://localhost:8000/api/employees/
# Debe retornar JSON con lista de empleados
```

### Paso 3.11: Crear serializer para Device
**Instrucción:**
Crear archivo `apps/devices/serializers.py` y definir `DeviceSerializer` con todos los campos del modelo Device.

**Test de validación:**
```bash
python manage.py shell -c "from apps.devices.serializers import DeviceSerializer; print('serie_imei' in DeviceSerializer().get_fields())"
# Debe mostrar: True
```

### Paso 3.12: Crear ViewSet para Device con filtros
**Instrucción:**
En `apps/devices/views.py`, crear `DeviceViewSet` con filtros por `tipo_equipo`, `estado`, `sucursal`, y búsqueda por `serie_imei`, `marca`, `modelo`.

**Test de validación:**
```bash
python manage.py shell -c "from apps.devices.views import DeviceViewSet; print(DeviceViewSet.filterset_fields)"
# Debe mostrar los campos de filtro
```

### Paso 3.13: Configurar rutas para Device API
**Instrucción:**
Crear `apps/devices/urls.py`, configurar router y registrar `DeviceViewSet`. Incluir en `config/urls.py` bajo `api/devices/`.

**Test de validación:**
```bash
curl http://localhost:8000/api/devices/
# Debe retornar JSON con lista de dispositivos
```

### Paso 3.14: Crear serializers para Request, Assignment y Return
**Instrucción:**
Crear archivo `apps/assignments/serializers.py` con tres serializers: `RequestSerializer`, `AssignmentSerializer`, y `ReturnSerializer`.

**Test de validación:**
```bash
python manage.py shell -c "from apps.assignments.serializers import RequestSerializer, AssignmentSerializer, ReturnSerializer; print('OK')"
# Debe mostrar: OK
```

### Paso 3.15: Crear ViewSets para Request, Assignment y Return
**Instrucción:**
En `apps/assignments/views.py`, crear tres ViewSets con sus respectivos querysets y serializers.

**Test de validación:**
```bash
python manage.py shell -c "from apps.assignments.views import RequestViewSet, AssignmentViewSet, ReturnViewSet; print('OK')"
# Debe mostrar: OK
```

### Paso 3.16: Configurar rutas para Assignments API
**Instrucción:**
Crear `apps/assignments/urls.py`, registrar los tres ViewSets en el router. Incluir en `config/urls.py` bajo `api/assignments/`.

**Test de validación:**
```bash
curl http://localhost:8000/api/assignments/requests/
curl http://localhost:8000/api/assignments/assignments/
curl http://localhost:8000/api/assignments/returns/
# Las 3 URLs deben responder con JSON
```

---

## FASE 4: AUTENTICACIÓN JWT

### Paso 4.1: Instalar djangorestframework-simplejwt
**Instrucción:**
Agregar `djangorestframework-simplejwt` a `requirements.txt` y ejecutar `pip install djangorestframework-simplejwt`.

**Test de validación:**
```bash
pip show djangorestframework-simplejwt
# Debe mostrar información del paquete
```

### Paso 4.2: Configurar JWT en DRF settings
**Instrucción:**
En `config/settings.py`, en la configuración `REST_FRAMEWORK`, agregar `rest_framework_simplejwt.authentication.JWTAuthentication` a `DEFAULT_AUTHENTICATION_CLASSES`.

**Test de validación:**
```bash
python manage.py shell -c "from django.conf import settings; print('JWTAuthentication' in str(settings.REST_FRAMEWORK))"
# Debe mostrar: True
```

### Paso 4.3: Configurar tiempos de expiración JWT
**Instrucción:**
En `config/settings.py`, agregar configuración `SIMPLE_JWT` con:
- `ACCESS_TOKEN_LIFETIME`: 2 horas
- `REFRESH_TOKEN_LIFETIME`: 7 días

**Test de validación:**
```bash
python manage.py shell -c "from django.conf import settings; print(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'])"
# Debe mostrar: 2:00:00
```

### Paso 4.4: Crear endpoints de login y refresh
**Instrucción:**
En `config/urls.py`, agregar rutas para `TokenObtainPairView` y `TokenRefreshView` bajo el path `api/auth/`.

**Test de validación:**
```bash
curl -X POST http://localhost:8000/api/auth/login/ -d '{"username":"admin","password":"tu_password"}' -H "Content-Type: application/json"
# Debe retornar JSON con 'access' y 'refresh' tokens
```

### Paso 4.5: Crear endpoint de logout
**Instrucción:**
Crear una view personalizada en `apps/users/views.py` llamada `LogoutView` que invalide el refresh token.

**Test de validación:**
```bash
# Después de obtener un token
curl -X POST http://localhost:8000/api/auth/logout/ -H "Authorization: Bearer <token>"
# Debe retornar status 200 o 204
```

### Paso 4.6: Crear endpoint de "me" (usuario actual)
**Instrucción:**
En `apps/users/views.py`, crear una APIView llamada `CurrentUserView` que retorne la información del usuario autenticado.

**Test de validación:**
```bash
curl http://localhost:8000/api/auth/me/ -H "Authorization: Bearer <token>"
# Debe retornar JSON con información del usuario actual
```

### Paso 4.7: Implementar sistema de permisos por rol
**Instrucción:**
Crear archivo `apps/users/permissions.py` con clases de permisos personalizadas: `IsAdmin` y `IsAdminOrReadOnly`.

**Test de validación:**
```bash
python manage.py shell -c "from apps.users.permissions import IsAdmin, IsAdminOrReadOnly; print('OK')"
# Debe mostrar: OK
```

### Paso 4.8: Aplicar permisos a los ViewSets
**Instrucción:**
En cada ViewSet (Branch, Employee, Device, Request, Assignment, Return), agregar la clase de permiso apropiada según el rol (Operadores solo lectura para eliminaciones).

**Test de validación:**
```bash
# Con token de operador, intentar eliminar un registro
curl -X DELETE http://localhost:8000/api/devices/1/ -H "Authorization: Bearer <operador_token>"
# Debe retornar 403 Forbidden
```

---

## FASE 5: LÓGICA DE NEGOCIO BACKEND

### Paso 5.1: Crear método para cambiar estado de dispositivo
**Instrucción:**
En el modelo `Device`, agregar un método `change_status(new_status, user)` que actualice el estado y registre en auditoría.

**Test de validación:**
```bash
python manage.py shell
# >>> from apps.devices.models import Device
# >>> device = Device.objects.first()
# >>> device.change_status('ASIGNADO', user)
# >>> print(device.estado)  # Debe mostrar: ASIGNADO
```

### Paso 5.2: Validar asignación de dispositivo disponible
**Instrucción:**
En `AssignmentSerializer`, agregar validación en el método `validate()` para asegurar que solo se asignen dispositivos con estado "DISPONIBLE".

**Test de validación:**
```bash
# Intentar crear asignación con dispositivo ya asignado
curl -X POST http://localhost:8000/api/assignments/assignments/ -H "Authorization: Bearer <token>" -d '{"dispositivo": <id_asignado>, ...}'
# Debe retornar error 400 indicando que el dispositivo no está disponible
```

### Paso 5.3: Implementar señal post_save en Assignment
**Instrucción:**
En `apps/assignments/signals.py`, crear una señal que al guardar un `Assignment` con estado 'ACTIVA', cambie el dispositivo a estado 'ASIGNADO' automáticamente.

**Test de validación:**
```bash
python manage.py shell
# Crear asignación y verificar que el dispositivo cambie a ASIGNADO automáticamente
```

### Paso 5.4: Implementar lógica de devolución
**Instrucción:**
En el serializer de `Return`, agregar lógica que al crear una devolución:
1. Marque la asignación como 'FINALIZADA'
2. Cambie el estado del dispositivo según `estado_dispositivo` (OPTIMO → DISPONIBLE, CON_DANOS/NO_FUNCIONAL → MANTENIMIENTO)

**Test de validación:**
```bash
# Crear devolución con estado OPTIMO
# Verificar que el dispositivo cambie a DISPONIBLE y la asignación a FINALIZADA
```

### Paso 5.5: Implementar validación de RUT chileno
**Instrucción:**
Crear archivo `apps/employees/validators.py` con una función `validate_rut()` que verifique el formato y dígito verificador del RUT chileno. Aplicar al campo `rut` del modelo Employee.

**Test de validación:**
```bash
# Intentar crear empleado con RUT inválido (ej: "12345678-0")
curl -X POST http://localhost:8000/api/employees/ -H "Authorization: Bearer <token>" -d '{"rut": "12345678-0", ...}'
# Debe retornar error de validación
```

### Paso 5.6: Implementar prevención de eliminación con asignaciones activas
**Instrucción:**
En el modelo `Employee`, sobrescribir el método `delete()` para prevenir eliminación si tiene asignaciones activas. Lo mismo para `Device`.

**Test de validación:**
```bash
# Intentar eliminar empleado con asignación activa
curl -X DELETE http://localhost:8000/api/employees/<id>/ -H "Authorization: Bearer <token>"
# Debe retornar error indicando que tiene asignaciones activas
```

### Paso 5.7: Crear endpoint de historial de empleado
**Instrucción:**
En `EmployeeViewSet`, agregar una custom action `@action(detail=True)` llamada `history` que retorne todas las asignaciones (activas e históricas) de un empleado.

**Test de validación:**
```bash
curl http://localhost:8000/api/employees/<id>/history/ -H "Authorization: Bearer <token>"
# Debe retornar array con todas las asignaciones del empleado
```

### Paso 5.8: Crear endpoint de historial de dispositivo
**Instrucción:**
En `DeviceViewSet`, agregar custom action `history` que retorne todas las asignaciones históricas del dispositivo.

**Test de validación:**
```bash
curl http://localhost:8000/api/devices/<id>/history/ -H "Authorization: Bearer <token>"
# Debe retornar array con historial de asignaciones
```

### Paso 5.9: Implementar sistema de auditoría automático
**Instrucción:**
Crear señales `post_save` y `post_delete` para los modelos principales (Employee, Device, Assignment) que registren automáticamente en `AuditLog`.

**Test de validación:**
```bash
# Crear/editar/eliminar un empleado
# Verificar en AuditLog que se hayan creado los registros correspondientes
python manage.py shell -c "from apps.users.audit import AuditLog; print(AuditLog.objects.count())"
# Debe mostrar registros de auditoría
```

### Paso 5.10: Crear endpoint de estadísticas generales
**Instrucción:**
Crear un ViewSet nuevo `apps/devices/views.py::StatsViewSet` con custom action `dashboard` que retorne:
- Total de dispositivos por estado
- Total de dispositivos por tipo
- Total de empleados activos
- Últimas 5 asignaciones

**Test de validación:**
```bash
curl http://localhost:8000/api/stats/dashboard/ -H "Authorization: Bearer <token>"
# Debe retornar JSON con estadísticas
```

---

## FASE 6: CONFIGURACIÓN DEL FRONTEND

### Paso 6.1: Verificar estructura del proyecto Next.js
**Instrucción:**
Verificar que existe el directorio `frontend/app/` con los archivos: `layout.tsx`, `page.tsx`, `providers.tsx`, `globals.css`.

**Test de validación:**
```bash
cd frontend
ls app/
# Debe mostrar: layout.tsx, page.tsx, providers.tsx, globals.css
```

### Paso 6.2: Instalar dependencias del frontend
**Instrucción:**
Desde el directorio `frontend/`, ejecutar `pnpm install` para instalar todas las dependencias.

**Test de validación:**
```bash
pnpm list | grep -E "next|react|typescript|tailwindcss|zustand"
# Debe mostrar las librerías principales instaladas
```

### Paso 6.3: Verificar configuración de TypeScript
**Instrucción:**
Verificar que existe `frontend/tsconfig.json` con el path alias `@/*` configurado apuntando a `./`.

**Test de validación:**
```bash
cat tsconfig.json | grep '"@/\*"'
# Debe mostrar la configuración del path alias
```

### Paso 6.4: Verificar configuración de Tailwind CSS
**Instrucción:**
Verificar que existe `frontend/tailwind.config.ts` con el content configurado para `./app/**/*.{ts,tsx}` y `./components/**/*.{ts,tsx}`.

**Test de validación:**
```bash
cat tailwind.config.ts | grep "content"
# Debe mostrar los paths configurados
```

### Paso 6.5: Configurar variables de entorno del frontend
**Instrucción:**
Crear archivo `frontend/.env.local` con la variable `NEXT_PUBLIC_API_URL=http://localhost:8000/api`.

**Test de validación:**
```bash
cat .env.local | grep NEXT_PUBLIC_API_URL
# Debe mostrar: NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### Paso 6.6: Iniciar servidor de desarrollo de Next.js
**Instrucción:**
Ejecutar `pnpm dev` y verificar que el servidor inicie en `http://localhost:3000`.

**Test de validación:**
```bash
curl http://localhost:3000
# Debe retornar HTML de la página de inicio
```

### Paso 6.7: Verificar componentes UI de shadcn
**Instrucción:**
Verificar que existe el directorio `frontend/components/ui/` con componentes base de shadcn/ui (button, input, dialog, etc).

**Test de validación:**
```bash
ls components/ui/
# Debe mostrar: button.tsx, input.tsx, dialog.tsx, select.tsx, table.tsx, etc.
```

---

## FASE 7: AUTENTICACIÓN FRONTEND

### Paso 7.1: Crear tipos TypeScript para User
**Instrucción:**
En `frontend/lib/types.ts`, definir interfaces:
- `User` con campos: id, username, email, role
- `AuthState` con: user, token, isAuthenticated

**Test de validación:**
```bash
cat lib/types.ts | grep "interface User"
# Debe mostrar la definición de la interface User
```

### Paso 7.2: Crear store de autenticación con Zustand
**Instrucción:**
En `frontend/lib/store/auth-store.ts`, crear un store de Zustand con:
- Estado: user, token, isAuthenticated
- Acciones: login, logout, setUser
- Middleware de persistencia con key 'techtrace-auth'

**Test de validación:**
```bash
# Iniciar app, abrir DevTools → Application → Local Storage
# Debe aparecer la key 'techtrace-auth'
```

### Paso 7.3: Crear ApiClient class
**Instrucción:**
En `frontend/lib/api-client.ts`, crear una clase `ApiClient` con:
- Constructor que reciba baseURL
- Método privado `getHeaders()` que incluya Authorization con token del store
- Métodos públicos: get, post, put, patch, delete que usen fetch

**Test de validación:**
```bash
cat lib/api-client.ts | grep "class ApiClient"
# Debe mostrar la definición de la clase
```

### Paso 7.4: Instanciar ApiClient global
**Instrucción:**
Al final de `frontend/lib/api-client.ts`, exportar una instancia única de ApiClient usando `NEXT_PUBLIC_API_URL`.

**Test de validación:**
```bash
cat lib/api-client.ts | grep "export const apiClient"
# Debe mostrar: export const apiClient = new ApiClient(...)
```

### Paso 7.5: Crear servicio de autenticación
**Instrucción:**
Crear archivo `frontend/lib/services/auth-service.ts` con funciones:
- `login(username, password)`: POST a /auth/login/, retorna user y token
- `logout()`: POST a /auth/logout/
- `getCurrentUser()`: GET a /auth/me/

**Test de validación:**
```bash
cat lib/services/auth-service.ts | grep "export.*login"
# Debe mostrar la función login exportada
```

### Paso 7.6: Crear página de login
**Instrucción:**
Crear archivo `frontend/app/login/page.tsx` con un formulario de login que:
- Tenga campos username y password
- Al enviar, llame a `authService.login()`
- Guarde user y token en el store
- Redirija a /dashboard

**Test de validación:**
```bash
# Acceder a http://localhost:3000/login
# Debe mostrar formulario de login
```

### Paso 7.7: Crear middleware de protección de rutas
**Instrucción:**
Crear archivo `frontend/middleware.ts` que verifique la autenticación antes de acceder a rutas bajo `/dashboard`. Si no está autenticado, redirigir a `/login`.

**Test de validación:**
```bash
# Sin estar autenticado, intentar acceder a http://localhost:3000/dashboard
# Debe redirigir a /login
```

### Paso 7.8: Crear layout del dashboard
**Instrucción:**
Crear archivo `frontend/app/dashboard/layout.tsx` con:
- Sidebar con navegación a: Dispositivos, Empleados, Sucursales, Asignaciones, Reportes, Usuarios
- Header con nombre del usuario y botón de logout

**Test de validación:**
```bash
# Iniciar sesión y acceder a /dashboard
# Debe mostrar sidebar y header
```

### Paso 7.9: Crear página principal del dashboard
**Instrucción:**
Crear archivo `frontend/app/dashboard/page.tsx` que muestre un título "Dashboard" y placeholder para estadísticas.

**Test de validación:**
```bash
# Acceder a http://localhost:3000/dashboard (autenticado)
# Debe mostrar la página del dashboard
```

### Paso 7.10: Implementar logout en el header
**Instrucción:**
En el componente Header del dashboard, agregar botón de logout que:
- Llame a `authService.logout()`
- Llame a `authStore.logout()`
- Redirija a `/login`

**Test de validación:**
```bash
# Hacer clic en botón de logout
# Debe cerrar sesión y redirigir a login
```

---

## FASE 8: MÓDULO DE SUCURSALES

### Paso 8.1: Crear tipos TypeScript para Branch
**Instrucción:**
En `frontend/lib/types.ts`, agregar interface `Branch` con todos los campos del modelo backend.

**Test de validación:**
```bash
cat lib/types.ts | grep "interface Branch"
# Debe mostrar la definición
```

### Paso 8.2: Crear servicio de sucursales
**Instrucción:**
Crear archivo `frontend/lib/services/branch-service.ts` con funciones CRUD:
- `getBranches()`: GET /branches/
- `getBranch(id)`: GET /branches/{id}/
- `createBranch(data)`: POST /branches/
- `updateBranch(id, data)`: PUT /branches/{id}/
- `deleteBranch(id)`: DELETE /branches/{id}/

**Test de validación:**
```bash
cat lib/services/branch-service.ts | grep "export.*getBranches"
# Debe mostrar las funciones exportadas
```

### Paso 8.3: Crear página de listado de sucursales
**Instrucción:**
Crear archivo `frontend/app/dashboard/branches/page.tsx` que:
- Use `useState` para almacenar lista de sucursales
- Use `useEffect` para cargar sucursales al montar
- Muestre tabla con: nombre, código, ciudad, estado, acciones
- Incluya botón "Nueva Sucursal"

**Test de validación:**
```bash
# Acceder a http://localhost:3000/dashboard/branches
# Debe mostrar tabla con sucursales
```

### Paso 8.4: Crear modal de creación de sucursal
**Instrucción:**
Crear componente `frontend/components/modals/branch-modal.tsx` con formulario que incluya campos:
- nombre, codigo, direccion, ciudad, is_active
- Validación básica (campos requeridos)
- Al enviar, llamar a `branchService.createBranch()`

**Test de validación:**
```bash
# Hacer clic en "Nueva Sucursal"
# Debe abrir modal con formulario
# Crear sucursal y verificar que aparezca en la tabla
```

### Paso 8.5: Implementar edición de sucursal
**Instrucción:**
Reutilizar el modal de sucursal para edición, pasando prop `branch` opcional. Si existe, pre-llenar el formulario y usar `updateBranch()` al enviar.

**Test de validación:**
```bash
# Hacer clic en botón "Editar" de una sucursal
# Debe abrir modal con datos pre-llenados
# Modificar y guardar, verificar que se actualice en la tabla
```

### Paso 8.6: Implementar eliminación de sucursal
**Instrucción:**
Agregar botón "Eliminar" que muestre un diálogo de confirmación y llame a `branchService.deleteBranch()`.

**Test de validación:**
```bash
# Hacer clic en "Eliminar"
# Debe mostrar confirmación
# Confirmar y verificar que se elimine de la tabla
```

---

## FASE 9: MÓDULO DE EMPLEADOS

### Paso 9.1: Crear tipos TypeScript para Employee
**Instrucción:**
En `frontend/lib/types.ts`, agregar interface `Employee` con todos los campos, incluyendo relación con `Branch`.

**Test de validación:**
```bash
cat lib/types.ts | grep "interface Employee"
# Debe mostrar la definición
```

### Paso 9.2: Crear servicio de empleados
**Instrucción:**
Crear archivo `frontend/lib/services/employee-service.ts` con funciones CRUD completo y función adicional `getEmployeeHistory(id)`.

**Test de validación:**
```bash
cat lib/services/employee-service.ts | grep "export.*getEmployees"
# Debe mostrar las funciones
```

### Paso 9.3: Crear página de listado de empleados
**Instrucción:**
Crear archivo `frontend/app/dashboard/employees/page.tsx` con:
- Tabla mostrando: nombre, RUT, cargo, sucursal, estado
- Filtros: búsqueda por nombre/RUT, filtro por sucursal, filtro por estado
- Botón "Nuevo Empleado"

**Test de validación:**
```bash
# Acceder a http://localhost:3000/dashboard/employees
# Debe mostrar tabla con empleados y filtros
```

### Paso 9.4: Implementar búsqueda en tiempo real
**Instrucción:**
Agregar input de búsqueda que filtre la tabla mientras el usuario escribe, buscando en nombre y RUT.

**Test de validación:**
```bash
# Escribir en el campo de búsqueda
# La tabla debe filtrarse instantáneamente
```

### Paso 9.5: Crear modal de creación de empleado
**Instrucción:**
Crear componente `frontend/components/modals/employee-modal.tsx` con formulario completo:
- Campos: rut, nombre_completo, cargo, correo_corporativo, gmail_personal, telefono, sucursal (select), unidad_negocio, estado
- Validación de RUT (formato chileno)
- Select de sucursales cargado dinámicamente

**Test de validación:**
```bash
# Hacer clic en "Nuevo Empleado"
# Completar formulario y crear
# Verificar que aparezca en la tabla
```

### Paso 9.6: Crear página de detalle de empleado
**Instrucción:**
Crear archivo `frontend/app/dashboard/employees/[id]/page.tsx` que muestre:
- Información completa del empleado
- Historial de dispositivos asignados (tabla)
- Botones: Editar, Asignar Dispositivo

**Test de validación:**
```bash
# Hacer clic en un empleado de la tabla
# Debe navegar a /dashboard/employees/{id} y mostrar detalle
```

### Paso 9.7: Implementar edición de empleado
**Instrucción:**
Reutilizar el modal de empleado para edición. Bloquear el campo RUT (no editable).

**Test de validación:**
```bash
# En página de detalle, clic en "Editar"
# Debe abrir modal con datos, campo RUT deshabilitado
# Modificar y guardar
```

### Paso 9.8: Implementar validación de eliminación
**Instrucción:**
Al intentar eliminar un empleado, verificar si tiene asignaciones activas. Si las tiene, mostrar mensaje de error y prevenir eliminación.

**Test de validación:**
```bash
# Intentar eliminar empleado con asignaciones activas
# Debe mostrar error y no permitir eliminación
```

---

## FASE 10: MÓDULO DE DISPOSITIVOS

### Paso 10.1: Crear tipos TypeScript para Device
**Instrucción:**
En `frontend/lib/types.ts`, agregar interface `Device` con todos los campos y tipos enumerados para `tipo_equipo` y `estado`.

**Test de validación:**
```bash
cat lib/types.ts | grep "interface Device"
# Debe mostrar la definición
```

### Paso 10.2: Crear servicio de dispositivos
**Instrucción:**
Crear archivo `frontend/lib/services/device-service.ts` con funciones CRUD y `getDeviceHistory(id)`.

**Test de validación:**
```bash
cat lib/services/device-service.ts | grep "export"
# Debe mostrar todas las funciones exportadas
```

### Paso 10.3: Crear página de listado de dispositivos
**Instrucción:**
Crear archivo `frontend/app/dashboard/devices/page.tsx` con:
- Tabla: tipo, marca, modelo, serie/IMEI, estado, sucursal, acciones
- Filtros: tipo de equipo, estado, sucursal, búsqueda por serie/IMEI
- Botón "Nuevo Dispositivo"
- Badges de colores para estados (verde: disponible, amarillo: asignado, rojo: mantenimiento/baja)

**Test de validación:**
```bash
# Acceder a http://localhost:3000/dashboard/devices
# Debe mostrar tabla con dispositivos y filtros
```

### Paso 10.4: Implementar filtros combinados
**Instrucción:**
Permitir usar múltiples filtros simultáneamente (tipo + estado + sucursal + búsqueda).

**Test de validación:**
```bash
# Aplicar múltiples filtros
# La tabla debe mostrar solo registros que cumplan todos los filtros
```

### Paso 10.5: Crear modal de creación de dispositivo
**Instrucción:**
Crear componente `frontend/components/modals/device-modal.tsx` con:
- Campos: tipo_equipo (select), marca, modelo, serie_imei, numero_telefono, numero_factura, estado (select), sucursal (select), fecha_ingreso
- Validación: serie_imei único
- Campo numero_telefono solo requerido si tipo es TELEFONO o SIM

**Test de validación:**
```bash
# Crear nuevo dispositivo
# Verificar que aparezca en la tabla
# Intentar crear con serie_imei duplicado → debe mostrar error
```

### Paso 10.6: Crear página de detalle de dispositivo
**Instrucción:**
Crear archivo `frontend/app/dashboard/devices/[id]/page.tsx` que muestre:
- Información completa del dispositivo
- Estado actual con badge de color
- Historial de asignaciones (tabla con: empleado, fecha entrega, fecha devolución, estado)
- Botones: Editar, Asignar (solo si estado es DISPONIBLE)

**Test de validación:**
```bash
# Hacer clic en un dispositivo
# Debe mostrar página de detalle con toda la información
```

### Paso 10.7: Implementar edición de dispositivo
**Instrucción:**
Reutilizar modal de dispositivo para edición. Bloquear campo serie_imei (no editable).

**Test de validación:**
```bash
# Editar dispositivo
# Campo serie_imei debe estar deshabilitado
# Guardar cambios y verificar actualización
```

### Paso 10.8: Implementar cambio de estado manual
**Instrucción:**
Agregar botón "Cambiar Estado" en página de detalle que permita cambiar manualmente el estado del dispositivo (ej: DISPONIBLE → MANTENIMIENTO).

**Test de validación:**
```bash
# Cambiar estado de un dispositivo
# Verificar que se actualice en la lista y detalle
```

---

## FASE 11: MÓDULO DE ASIGNACIONES

### Paso 11.1: Crear tipos TypeScript para Assignment y Request
**Instrucción:**
En `frontend/lib/types.ts`, agregar interfaces:
- `Request` (solicitud)
- `Assignment` (asignación)
- `Return` (devolución)

**Test de validación:**
```bash
cat lib/types.ts | grep "interface Assignment"
# Debe mostrar las definiciones
```

### Paso 11.2: Crear servicio de asignaciones
**Instrucción:**
Crear archivo `frontend/lib/services/assignment-service.ts` con funciones para:
- Solicitudes: createRequest, getRequests, updateRequest
- Asignaciones: createAssignment, getAssignments, getAssignment
- Devoluciones: createReturn, getReturns

**Test de validación:**
```bash
cat lib/services/assignment-service.ts | grep "export"
# Debe mostrar todas las funciones
```

### Paso 11.3: Crear página de listado de solicitudes
**Instrucción:**
Crear archivo `frontend/app/dashboard/assignments/requests/page.tsx` con:
- Tabla: empleado, tipo dispositivo, fecha solicitud, estado
- Filtro por estado (Pendiente, Aprobada, Completada)
- Botón "Nueva Solicitud"

**Test de validación:**
```bash
# Acceder a http://localhost:3000/dashboard/assignments/requests
# Debe mostrar tabla de solicitudes
```

### Paso 11.4: Crear modal de nueva solicitud
**Instrucción:**
Crear componente `frontend/components/modals/request-modal.tsx` con:
- Select de empleado
- Select de tipo de dispositivo
- Campo de justificación
- Campo jefatura_solicitante

**Test de validación:**
```bash
# Crear nueva solicitud
# Verificar que aparezca en la tabla con estado "Pendiente"
```

### Paso 11.5: Crear página de listado de asignaciones
**Instrucción:**
Crear archivo `frontend/app/dashboard/assignments/page.tsx` con:
- Tabla: empleado, dispositivo, fecha entrega, tipo entrega, estado asignación
- Filtros: estado (Activa/Finalizada), empleado, dispositivo
- Botón "Nueva Asignación"
- Badge verde para asignaciones activas, gris para finalizadas

**Test de validación:**
```bash
# Acceder a http://localhost:3000/dashboard/assignments
# Debe mostrar tabla de asignaciones
```

### Paso 11.6: Crear modal de nueva asignación
**Instrucción:**
Crear componente `frontend/components/modals/assignment-modal.tsx` con:
- Select de empleado (filtrable por búsqueda)
- Select de dispositivo (solo mostrar dispositivos DISPONIBLES)
- Select de tipo de entrega (Permanente/Temporal)
- DatePicker para fecha de entrega
- Select de estado de carta
- Campo de observaciones

**Test de validación:**
```bash
# Crear nueva asignación
# Verificar que:
# 1. Solo se muestren dispositivos disponibles
# 2. Al guardar, el dispositivo cambie a estado ASIGNADO
# 3. La asignación aparezca en la tabla
```

### Paso 11.7: Crear modal de asignación desde solicitud
**Instrucción:**
En la página de solicitudes, agregar botón "Asignar" (solo visible para solicitudes Pendientes/Aprobadas) que abra el modal de asignación con el empleado pre-seleccionado.

**Test de validación:**
```bash
# Desde una solicitud pendiente, clic en "Asignar"
# Debe abrir modal con empleado pre-cargado
# Al completar asignación, la solicitud debe cambiar a "Completada"
```

### Paso 11.8: Crear página de detalle de asignación
**Instrucción:**
Crear archivo `frontend/app/dashboard/assignments/[id]/page.tsx` que muestre:
- Información completa de la asignación
- Datos del empleado (con link)
- Datos del dispositivo (con link)
- Botón "Registrar Devolución" (solo si asignación está Activa)

**Test de validación:**
```bash
# Acceder a detalle de asignación
# Debe mostrar toda la información
# Links deben navegar a detalle de empleado/dispositivo
```

### Paso 11.9: Crear modal de devolución
**Instrucción:**
Crear componente `frontend/components/modals/return-modal.tsx` con:
- DatePicker para fecha de devolución
- Select de estado del dispositivo (Óptimo, Con Daños, No Funcional)
- Campo de observaciones
- Al guardar, llamar a `createReturn()` y recargar la asignación

**Test de validación:**
```bash
# Desde asignación activa, clic en "Registrar Devolución"
# Completar formulario y guardar
# Verificar que:
# 1. La asignación cambie a "Finalizada"
# 2. El dispositivo cambie a estado correspondiente (DISPONIBLE o MANTENIMIENTO)
# 3. Se registre la fecha de devolución
```

### Paso 11.10: Implementar validación de fechas
**Instrucción:**
En el modal de devolución, validar que la fecha de devolución no sea anterior a la fecha de entrega.

**Test de validación:**
```bash
# Intentar registrar devolución con fecha anterior a la entrega
# Debe mostrar error de validación
```

---

## FASE 12: MÓDULO DE REPORTES E INVENTARIO

### Paso 12.1: Crear página de reportes
**Instrucción:**
Crear archivo `frontend/app/dashboard/reports/page.tsx` con 3 secciones:
- "Inventario General"
- "Inventario por Sucursal"
- "Inventario por Empleado"

**Test de validación:**
```bash
# Acceder a http://localhost:3000/dashboard/reports
# Debe mostrar página con 3 secciones
```

### Paso 12.2: Implementar Inventario General
**Instrucción:**
En la sección "Inventario General", mostrar:
- Resumen con totales: dispositivos por tipo, dispositivos por estado
- Tabla completa de todos los dispositivos con filtros
- Botón "Exportar a CSV"

**Test de validación:**
```bash
# Verificar que los totales coincidan con la cantidad en la tabla
# Aplicar filtros y verificar que los totales se actualicen
```

### Paso 12.3: Implementar exportación a CSV
**Instrucción:**
Crear función `exportToCSV(data, filename)` en `frontend/lib/utils.ts` que genere y descargue un archivo CSV.

**Test de validación:**
```bash
# Hacer clic en "Exportar a CSV"
# Debe descargar archivo con los datos de la tabla
```

### Paso 12.4: Implementar Inventario por Sucursal
**Instrucción:**
En la sección correspondiente, agregar:
- Select para elegir sucursal
- Al seleccionar, mostrar totales de dispositivos en esa sucursal por estado
- Tabla con dispositivos de la sucursal
- Indicador de quién tiene asignado cada dispositivo (si aplica)

**Test de validación:**
```bash
# Seleccionar una sucursal
# Debe mostrar solo dispositivos de esa sucursal
# Verificar que los totales sean correctos
```

### Paso 12.5: Implementar Inventario por Empleado
**Instrucción:**
Agregar:
- Select para elegir empleado (con búsqueda)
- Al seleccionar, mostrar información del empleado
- Tabla con todos los dispositivos asignados actualmente
- Lista de historial de asignaciones pasadas

**Test de validación:**
```bash
# Seleccionar un empleado
# Debe mostrar dispositivos actuales y historial
# Los dispositivos actuales deben tener asignaciones activas
```

---

## FASE 13: DASHBOARD Y ESTADÍSTICAS

### Paso 13.1: Crear servicio de estadísticas
**Instrucción:**
Crear archivo `frontend/lib/services/stats-service.ts` con función `getDashboardStats()` que llame al endpoint de estadísticas del backend.

**Test de validación:**
```bash
cat lib/services/stats-service.ts | grep "getDashboardStats"
# Debe mostrar la función
```

### Paso 13.2: Implementar tarjetas de resumen
**Instrucción:**
En `frontend/app/dashboard/page.tsx`, agregar 4 tarjetas superiores mostrando:
- Total de dispositivos
- Dispositivos disponibles (verde)
- Dispositivos asignados (azul)
- Dispositivos en mantenimiento (amarillo)

**Test de validación:**
```bash
# Acceder al dashboard principal
# Debe mostrar las 4 tarjetas con números actualizados
```

### Paso 13.3: Implementar gráfico de dispositivos por tipo
**Instrucción:**
Usar la librería `recharts` para crear un gráfico de barras mostrando cantidad de dispositivos por tipo (Laptop, Teléfono, Tablet, SIM, Accesorio).

**Test de validación:**
```bash
# El dashboard debe mostrar el gráfico de barras
# Los datos deben coincidir con el inventario real
```

### Paso 13.4: Implementar tabla de últimas asignaciones
**Instrucción:**
Mostrar una tabla con las últimas 5 asignaciones realizadas, incluyendo: empleado, dispositivo, fecha, usuario que asignó.

**Test de validación:**
```bash
# Crear una nueva asignación
# Debe aparecer en la tabla de últimas asignaciones del dashboard
```

### Paso 13.5: Implementar tabla de últimas devoluciones
**Instrucción:**
Mostrar una tabla con las últimas 5 devoluciones, incluyendo: empleado, dispositivo, fecha devolución, estado del dispositivo.

**Test de validación:**
```bash
# Registrar una devolución
# Debe aparecer en la tabla de últimas devoluciones
```

### Paso 13.6: Implementar actualización automática del dashboard
**Instrucción:**
Agregar un `useEffect` con intervalo que refresque las estadísticas cada 60 segundos.

**Test de validación:**
```bash
# Dejar el dashboard abierto
# Desde otra pestaña, crear una asignación
# Esperar 60 segundos
# El dashboard debe actualizarse automáticamente
```

---

## FASE 14: GESTIÓN DE USUARIOS

### Paso 14.1: Crear página de listado de usuarios
**Instrucción:**
Crear archivo `frontend/app/dashboard/users/page.tsx` (solo accesible para Administradores) con:
- Tabla: username, email, rol, estado, fecha creación
- Botón "Nuevo Usuario"

**Test de validación:**
```bash
# Acceder como Admin a http://localhost:3000/dashboard/users
# Debe mostrar tabla de usuarios
# Acceder como Operador → debe redirigir o mostrar error 403
```

### Paso 14.2: Crear servicio de usuarios
**Instrucción:**
Crear archivo `frontend/lib/services/user-service.ts` con funciones CRUD de usuarios.

**Test de validación:**
```bash
cat lib/services/user-service.ts | grep "export"
# Debe mostrar las funciones
```

### Paso 14.3: Crear modal de creación de usuario
**Instrucción:**
Crear componente `frontend/components/modals/user-modal.tsx` con:
- Campos: username, email, password, confirm_password, role (select: Admin/Operador)
- Validación: passwords coincidentes, email válido, username único

**Test de validación:**
```bash
# Crear nuevo usuario
# Debe aparecer en la tabla
# Intentar login con ese usuario → debe funcionar
```

### Paso 14.4: Implementar cambio de contraseña
**Instrucción:**
Agregar modal separado para cambiar contraseña de un usuario (solo Admin puede cambiar contraseñas de otros usuarios).

**Test de validación:**
```bash
# Cambiar contraseña de un usuario
# Intentar login con nueva contraseña → debe funcionar
```

### Paso 14.5: Implementar desactivación de usuarios
**Instrucción:**
Agregar toggle de activación/desactivación en lugar de eliminación completa.

**Test de validación:**
```bash
# Desactivar un usuario
# Intentar login con ese usuario → debe fallar con mensaje apropiado
```

---

## FASE 15: VALIDACIONES Y MANEJO DE ERRORES

### Paso 15.1: Implementar manejo global de errores API
**Instrucción:**
En `ApiClient`, agregar manejo de errores que:
- Capture errores 401 (no autorizado) y redirija a login
- Capture errores 403 (sin permisos) y muestre mensaje
- Capture errores 500 y muestre mensaje genérico
- Retorne mensajes de error específicos para errores 400

**Test de validación:**
```bash
# Dejar expirar el token
# Intentar cualquier operación → debe redirigir a login
# Sin ser Admin, intentar crear usuario → debe mostrar mensaje de permisos
```

### Paso 15.2: Crear componente Toast para notificaciones
**Instrucción:**
Usar componente Toast de shadcn/ui para mostrar notificaciones de éxito/error en todas las operaciones.

**Test de validación:**
```bash
# Crear cualquier registro → debe mostrar toast de éxito
# Causar un error → debe mostrar toast de error
```

### Paso 15.3: Implementar validación de formularios con Zod
**Instrucción:**
Crear archivo `frontend/lib/validations.ts` con schemas de Zod para:
- Employee, Device, Assignment, Branch, User

**Test de validación:**
```bash
# Intentar enviar formulario con datos inválidos
# Debe mostrar mensajes de error específicos por campo
```

### Paso 15.4: Agregar indicadores de carga
**Instrucción:**
En todos los formularios y tablas, agregar spinners o skeletons mientras se cargan datos.

**Test de validación:**
```bash
# Al abrir cualquier página con datos
# Debe mostrar indicador de carga antes de mostrar la tabla
```

### Paso 15.5: Implementar manejo de errores de red
**Instrucción:**
En `ApiClient`, agregar try-catch para errores de red (sin conexión) y mostrar mensaje apropiado.

**Test de validación:**
```bash
# Apagar el servidor backend
# Intentar cualquier operación → debe mostrar mensaje de error de conexión
```

---

## FASE 16: OPTIMIZACIONES Y MEJORAS

### Paso 16.1: Implementar paginación en tablas
**Instrucción:**
En todas las tablas principales (dispositivos, empleados, asignaciones), agregar paginación con controles para cambiar de página y seleccionar items por página.

**Test de validación:**
```bash
# Con más de 20 registros, verificar que solo se muestren 20
# Los controles de paginación deben funcionar correctamente
```

### Paso 16.2: Implementar debounce en búsquedas
**Instrucción:**
En los campos de búsqueda, implementar debounce de 300ms para evitar múltiples peticiones mientras se escribe.

**Test de validación:**
```bash
# Escribir rápidamente en un campo de búsqueda
# Abrir DevTools → Network
# Debe hacer solo 1 petición después de dejar de escribir
```

### Paso 16.3: Implementar cache con SWR
**Instrucción:**
Instalar `swr` y reemplazar algunos `useEffect` con `useSWR` para tener cache automático y revalidación.

**Test de validación:**
```bash
# Navegar entre páginas
# Al volver a una página ya visitada, debe mostrar datos cacheados instantáneamente
```

### Paso 16.4: Optimizar imágenes y assets
**Instrucción:**
Usar el componente `Image` de Next.js para cualquier imagen en la app. Optimizar tamaños de fuentes e iconos.

**Test de validación:**
```bash
pnpm build
# Verificar que no haya warnings de optimización de imágenes
```

### Paso 16.5: Implementar modo oscuro
**Instrucción:**
Usar el `theme-provider` ya configurado y agregar toggle en el header para cambiar entre tema claro y oscuro.

**Test de validación:**
```bash
# Hacer clic en toggle de tema
# Toda la interfaz debe cambiar de colores apropiadamente
# La preferencia debe persistir al recargar
```

---

## FASE 17: PRUEBAS Y VALIDACIÓN FINAL

### Paso 17.1: Probar flujo completo de asignación
**Instrucción:**
Ejecutar el flujo completo:
1. Crear empleado
2. Crear dispositivo
3. Crear solicitud
4. Crear asignación desde solicitud
5. Verificar cambio de estados
6. Registrar devolución
7. Verificar cambio de estados

**Test de validación:**
```bash
# Cada paso debe completarse sin errores
# Los estados deben cambiar automáticamente
# El historial debe registrarse correctamente
```

### Paso 17.2: Probar permisos de roles
**Instrucción:**
Con usuario Operador, intentar:
- Eliminar un registro → debe fallar
- Crear registros → debe funcionar
- Editar registros → debe funcionar
- Acceder a gestión de usuarios → debe fallar

**Test de validación:**
```bash
# Todas las restricciones de Operador deben aplicarse correctamente
```

### Paso 17.3: Probar validaciones de datos
**Instrucción:**
Intentar crear registros con datos inválidos:
- RUT inválido
- Serie/IMEI duplicado
- Fechas inconsistentes
- Campos requeridos vacíos

**Test de validación:**
```bash
# Todas las validaciones deben activarse y mostrar mensajes claros
```

### Paso 17.4: Probar responsividad
**Instrucción:**
Abrir la aplicación en:
- Desktop (1920x1080)
- Tablet (768x1024)
- Móvil (375x667)

**Test de validación:**
```bash
# La interfaz debe adaptarse correctamente a cada tamaño
# Todas las funcionalidades deben ser accesibles
# El sidebar debe colapsar en móvil
```

### Paso 17.5: Verificar rendimiento
**Instrucción:**
Con al menos 100 dispositivos y 50 empleados:
- Medir tiempo de carga del dashboard
- Medir tiempo de búsqueda en tablas
- Medir tiempo de generación de inventario

**Test de validación:**
```bash
# Dashboard debe cargar en < 2 segundos
# Búsquedas deben responder en < 1 segundo
# Inventario debe generarse en < 3 segundos
```

### Paso 17.6: Probar navegación completa
**Instrucción:**
Navegar por todas las rutas de la aplicación verificando:
- Links funcionales
- Breadcrumbs (si existen)
- Botones de "Volver"
- Navegación desde detalles

**Test de validación:**
```bash
# Toda la navegación debe funcionar sin errores 404
# Los links deben apuntar a las rutas correctas
```

### Paso 17.7: Verificar persistencia de sesión
**Instrucción:**
- Iniciar sesión
- Cerrar el navegador
- Abrir nuevamente

**Test de validación:**
```bash
# La sesión debe mantenerse
# El usuario debe seguir autenticado
```

### Paso 17.8: Probar sistema de auditoría
**Instrucción:**
Realizar varias operaciones (crear, editar, eliminar) con diferentes usuarios.

**Test de validación:**
```bash
# En Django admin, revisar AuditLog
# Todas las operaciones deben estar registradas con:
# - Usuario que las realizó
# - Timestamp
# - Tipo de acción
# - Cambios realizados
```

---

## FASE 18: DOCUMENTACIÓN Y PREPARACIÓN PARA PRODUCCIÓN

### Paso 18.1: Documentar endpoints de API
**Instrucción:**
Instalar `drf-spectacular` para generar documentación automática de la API en formato OpenAPI/Swagger.

**Test de validación:**
```bash
pip install drf-spectacular
# Agregar a INSTALLED_APPS
# Acceder a http://localhost:8000/api/docs/
# Debe mostrar documentación interactiva de la API
```

### Paso 18.2: Crear archivo README del backend
**Instrucción:**
Crear `backend/README.md` documentando:
- Requisitos previos
- Instalación
- Configuración de variables de entorno
- Comandos disponibles
- Estructura del proyecto

**Test de validación:**
```bash
# Un desarrollador nuevo debe poder seguir el README y levantar el backend
```

### Paso 18.3: Crear archivo README del frontend
**Instrucción:**
Crear `frontend/README.md` documentando:
- Requisitos previos
- Instalación
- Variables de entorno
- Scripts disponibles
- Estructura de componentes

**Test de validación:**
```bash
# Un desarrollador nuevo debe poder seguir el README y levantar el frontend
```

### Paso 18.4: Configurar variables de entorno para producción
**Instrucción:**
Crear archivos de ejemplo:
- `backend/.env.example` con todas las variables necesarias
- `frontend/.env.example` con variables del frontend

**Test de validación:**
```bash
# Los archivos .example deben contener todas las variables sin valores sensibles
```

### Paso 18.5: Crear script de inicialización de datos
**Instrucción:**
Crear Django management command `python manage.py init_demo_data` que cree:
- Usuario admin por defecto
- 3 sucursales de ejemplo
- 5 empleados de ejemplo
- 10 dispositivos de ejemplo

**Test de validación:**
```bash
python manage.py init_demo_data
# Debe crear todos los datos sin errores
# Debe poder ejecutarse múltiples veces sin duplicar datos
```

### Paso 18.6: Configurar ALLOWED_HOSTS para producción
**Instrucción:**
Modificar `backend/config/settings.py` para leer `ALLOWED_HOSTS` desde .env correctamente.

**Test de validación:**
```bash
# Con DEBUG=False, el servidor debe rechazar requests desde hosts no permitidos
```

### Paso 18.7: Configurar CORS para producción
**Instrucción:**
Modificar configuración de CORS para leer dominios permitidos desde variable de entorno.

**Test de validación:**
```bash
# Con dominio no permitido en CORS, las requests deben fallar
```

### Paso 18.8: Crear checklist de deployment
**Instrucción:**
Crear archivo `docs/DEPLOYMENT.md` con checklist de deployment:
- [ ] Variables de entorno configuradas
- [ ] Secret key generado
- [ ] DEBUG = False
- [ ] ALLOWED_HOSTS configurado
- [ ] Base de datos PostgreSQL configurada
- [ ] Migraciones aplicadas
- [ ] Static files colectados
- [ ] HTTPS configurado
- [ ] CORS configurado correctamente

**Test de validación:**
```bash
# El checklist debe ser completo y seguible
```

---

## CONCLUSIÓN DEL MVP

### Validación Final del MVP

**Test de validación completo:**
1. ✅ Sistema de autenticación funcional con roles
2. ✅ CRUD completo de empleados
3. ✅ CRUD completo de dispositivos
4. ✅ CRUD completo de sucursales
5. ✅ Flujo de solicitud → asignación → devolución funcional
6. ✅ Cambios automáticos de estado de dispositivos
7. ✅ Historial de asignaciones por empleado y dispositivo
8. ✅ Generación de inventarios (general, por sucursal, por empleado)
9. ✅ Dashboard con estadísticas en tiempo real
10. ✅ Sistema de búsqueda y filtros en todas las tablas
11. ✅ Sistema de permisos por rol funcionando
12. ✅ Auditoría de operaciones
13. ✅ Interfaz responsive (web y móvil)
14. ✅ Manejo de errores y validaciones
15. ✅ Exportación de datos a CSV

### Métricas de Éxito MVP

**El MVP se considera completo cuando:**
- Todos los tests de validación de las 18 fases pasan exitosamente
- Se pueden gestionar al menos 100 dispositivos sin problemas de rendimiento
- Los tiempos de respuesta cumplen con los requisitos (< 2 segundos carga, < 1 segundo búsqueda)
- La aplicación es usable en dispositivos móviles
- No hay errores críticos en consola del navegador
- La aplicación funciona en Chrome, Firefox, Safari y Edge

---

## Próximos Pasos (Post-MVP)

Después de completar y validar el MVP, las siguientes fases incluirían:
- PWA avanzada con funcionalidad offline
- Sistema de notificaciones
- Reportes avanzados con gráficos personalizables
- Firma digital de cartas de responsabilidad
- Control de garantías
- Integración con sistemas externos
- Testing automatizado (E2E)
- CI/CD pipeline

---

**Fin del Plan de Implementación MVP**
