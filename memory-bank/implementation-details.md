# TechTrace - Detalles de Implementacion
## Guia para Desarrolladores

**Fecha:** Noviembre 5, 2025
**Estado:** Fase 2 Completada

---

## 1. Modelos Implementados (Fase 2)

### 1.1 apps/users/models.py - User

**Proposito:** Modelo de usuario personalizado extendiendo AbstractUser de Django.

**Campos personalizados:**
- `role`: CharField con choices ('ADMIN', 'OPERADOR')
  - Default: 'OPERADOR'
  - Usado para control de permisos

**Metodos:**
- `is_admin()`: Retorna True si el usuario es Admin
- `is_operador()`: Retorna True si el usuario es Operador
- `__str__()`: Retorna "username (Rol)"

**Configuracion especial:**
```python
# En config/settings.py
AUTH_USER_MODEL = 'users.User'
```

**IMPORTANTE:** Este modelo DEBE configurarse ANTES de la primera migracion. Si ya hay migraciones aplicadas con el User por defecto, es necesario reiniciar la base de datos.

---

### 1.2 apps/users/audit.py - AuditLog

**Proposito:** Registro inmutable de auditoria de todas las operaciones CRUD del sistema.

**Campos:**
- `user`: ForeignKey al usuario que realizo la accion
- `action`: CharField con choices (CREATE, UPDATE, DELETE)
- `entity_type`: CharField (ej: 'Device', 'Employee')
- `entity_id`: IntegerField (ID de la entidad afectada)
- `changes`: JSONField con los cambios realizados
- `timestamp`: DateTimeField (auto_now_add=True)

**Indices:**
```python
indexes = [
    models.Index(fields=['-timestamp']),  # Para busquedas por fecha
    models.Index(fields=['entity_type', 'entity_id']),  # Para buscar por entidad
]
```

**Django Admin:**
- Solo lectura (no se puede crear/editar/eliminar)
- Filtros: action, entity_type, timestamp
- Busqueda: username

**Uso futuro:**
Sera poblado automaticamente mediante signals en Fase 5.

---

### 1.3 apps/branches/models.py - Branch

**Proposito:** Gestionar las sucursales de la empresa.

**Campos:**
- `nombre`: CharField(max_length=100) - Nombre de la sucursal
- `codigo`: CharField(max_length=20, unique=True) - Codigo unico (ej: 'SCL-01')
- `direccion`: TextField (opcional)
- `ciudad`: CharField(max_length=100)
- `is_active`: BooleanField (default=True)
- `created_at`: DateTimeField (auto_now_add=True)
- `updated_at`: DateTimeField (auto_now=True)

**Meta:**
```python
ordering = ['nombre']
verbose_name = 'Sucursal'
verbose_name_plural = 'Sucursales'
```

**Uso:**
- Referenciado por Employee.sucursal
- Referenciado por Device.sucursal
- Permite filtrar y agrupar por ubicacion

**Django Admin:**
- list_display: codigo, nombre, ciudad, is_active, created_at
- list_filter: is_active, ciudad
- search_fields: codigo, nombre, ciudad

---

### 1.4 apps/employees/models.py - Employee

**Proposito:** Gestionar empleados que reciben dispositivos.

**Campos principales:**
- `rut`: CharField(max_length=12, unique=True) - RUT chileno
- `nombre_completo`: CharField(max_length=200)
- `cargo`: CharField(max_length=100)
- `correo_corporativo`: EmailField (opcional)
- `gmail_personal`: EmailField (opcional)
- `telefono`: CharField(max_length=20, opcional)
- `sucursal`: ForeignKey(Branch, on_delete=PROTECT)
- `unidad_negocio`: CharField(max_length=100, opcional)
- `estado`: CharField con choices ('ACTIVO', 'INACTIVO')
- `created_at`: DateTimeField
- `updated_at`: DateTimeField
- `created_by`: ForeignKey(User, on_delete=PROTECT)

**Metodos:**
```python
def has_active_assignments(self):
    """Retorna True si el empleado tiene asignaciones activas"""
    return self.assignment_set.filter(estado_asignacion='ACTIVA').exists()

def delete(self, *args, **kwargs):
    """Previene la eliminacion si tiene asignaciones activas"""
    if self.has_active_assignments():
        raise models.ProtectedError(
            "No se puede eliminar el empleado porque tiene asignaciones activas",
            self
        )
    super().delete(*args, **kwargs)
```

**Validaciones:**
- RUT debe ser unico
- No se puede eliminar si tiene asignaciones activas
- Sucursal es requerida (on_delete=PROTECT previene eliminar sucursales con empleados)

**Django Admin:**
- list_display: rut, nombre_completo, cargo, sucursal, estado
- list_filter: estado, sucursal, unidad_negocio
- search_fields: rut, nombre_completo, cargo, correo_corporativo
- autocomplete_fields: sucursal

---

### 1.5 apps/devices/models.py - Device

**Proposito:** Gestionar dispositivos moviles del inventario.

**Tipos de equipo (TIPO_CHOICES):**
- LAPTOP: Laptop
- TELEFONO: Telefono Movil
- TABLET: Tablet
- SIM: SIM Card
- ACCESORIO: Accesorio

**Estados posibles (ESTADO_CHOICES):**
- DISPONIBLE: Listo para asignar
- ASIGNADO: En uso por un empleado
- MANTENIMIENTO: En reparacion
- BAJA: Dado de baja permanentemente
- ROBO: Reportado como robado

**Campos principales:**
- `tipo_equipo`: CharField con TIPO_CHOICES
- `marca`: CharField(max_length=50)
- `modelo`: CharField(max_length=100)
- `serie_imei`: CharField(max_length=100, unique=True) - Identificador unico
- `numero_telefono`: CharField (opcional, para telefonos y SIM)
- `numero_factura`: CharField (opcional)
- `estado`: CharField con ESTADO_CHOICES (default='DISPONIBLE')
- `sucursal`: ForeignKey(Branch, on_delete=PROTECT)
- `fecha_ingreso`: DateField
- `created_at`, `updated_at`, `created_by`

**Metodos:**
```python
def change_status(self, new_status, user=None):
    """Cambia el estado del dispositivo y registra en auditoria"""
    old_status = self.estado
    self.estado = new_status
    self.save()
    # TODO: Registrar en auditoria cuando se implemente
    return True

def has_active_assignment(self):
    """Retorna True si el dispositivo tiene una asignacion activa"""
    return self.assignment_set.filter(estado_asignacion='ACTIVA').exists()

def delete(self, *args, **kwargs):
    """Previene la eliminacion si tiene asignaciones activas"""
    if self.has_active_assignment():
        raise models.ProtectedError(
            "No se puede eliminar el dispositivo porque tiene una asignacion activa",
            self
        )
    super().delete(*args, **kwargs)
```

**Django Admin:**
- list_display: serie_imei, tipo_equipo, marca, modelo, estado, sucursal, fecha_ingreso
- list_filter: tipo_equipo, estado, sucursal, marca
- search_fields: serie_imei, marca, modelo, numero_telefono, numero_factura

---

### 1.6 apps/assignments/models.py - Request, Assignment, Return

#### Request (Solicitud)

**Proposito:** Registrar solicitudes de dispositivos por parte de empleados.

**Campos:**
- `empleado`: ForeignKey(Employee, on_delete=PROTECT)
- `jefatura_solicitante`: CharField(max_length=200)
- `tipo_dispositivo`: CharField(max_length=20)
- `justificacion`: TextField (opcional)
- `fecha_solicitud`: DateTimeField (auto_now_add=True)
- `estado`: CharField con choices (PENDIENTE, APROBADA, RECHAZADA, COMPLETADA)
- `created_by`, `created_at`, `updated_at`

**Estados:**
- PENDIENTE: Recien creada
- APROBADA: Aprobada por jefatura
- RECHAZADA: Rechazada
- COMPLETADA: Dispositivo asignado (vinculado a Assignment)

#### Assignment (Asignacion)

**Proposito:** Registrar la asignacion de un dispositivo a un empleado.

**Campos:**
- `solicitud`: ForeignKey(Request, null=True, blank=True) - Opcional
- `empleado`: ForeignKey(Employee, on_delete=PROTECT)
- `dispositivo`: ForeignKey(Device, on_delete=PROTECT)
- `tipo_entrega`: CharField con choices (PERMANENTE, TEMPORAL)
- `fecha_entrega`: DateField
- `fecha_devolucion`: DateField (opcional, se llena al devolver)
- `estado_carta`: CharField con choices (FIRMADA, PENDIENTE, NO_APLICA)
- `estado_asignacion`: CharField con choices (ACTIVA, FINALIZADA)
- `observaciones`: TextField (opcional)
- `created_by`, `created_at`, `updated_at`

**Logica de negocio (Fase 5):**
- Al crear Assignment con estado ACTIVA:
  - Device.estado cambia a ASIGNADO automaticamente
  - Si existe solicitud vinculada, Request.estado cambia a COMPLETADA

#### Return (Devolucion)

**Proposito:** Registrar la devolucion de un dispositivo.

**Campos:**
- `asignacion`: OneToOneField(Assignment, on_delete=PROTECT)
- `fecha_devolucion`: DateField
- `estado_dispositivo`: CharField con choices (OPTIMO, CON_DANOS, NO_FUNCIONAL)
- `observaciones`: TextField (opcional)
- `created_by`: ForeignKey(User)
- `created_at`: DateTimeField

**Logica de negocio (Fase 5):**
- Al crear Return:
  - Assignment.estado_asignacion cambia a FINALIZADA
  - Device.estado cambia segun estado_dispositivo:
    - OPTIMO → DISPONIBLE
    - CON_DANOS → MANTENIMIENTO
    - NO_FUNCIONAL → MANTENIMIENTO

---

## 2. Django Admin Configurado

Todos los modelos estan registrados en Django Admin con configuracion personalizada.

### Caracteristicas comunes:

**list_display:** Campos visibles en la lista principal
**list_filter:** Filtros laterales para busqueda rapida
**search_fields:** Campos en los que se puede buscar texto
**readonly_fields:** Campos no editables (timestamps, created_by)
**autocomplete_fields:** ForeignKeys con busqueda autocomplete

### Auto-asignacion de created_by:

Todos los ModelAdmin sobrescriben save_model():

```python
def save_model(self, request, obj, form, change):
    if not change:  # Si es un nuevo objeto
        obj.created_by = request.user
    super().save_model(request, obj, form, change)
```

### AuditLogAdmin especial:

```python
@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    # ... configuracion ...

    def has_add_permission(self, request):
        return False  # No se puede crear manualmente

    def has_delete_permission(self, request, obj=None):
        return False  # No se puede eliminar
```

---

## 3. Management Commands

### create_sample_branches

**Ubicacion:** `apps/branches/management/commands/create_sample_branches.py`

**Proposito:** Crear 3 sucursales de prueba para desarrollo y testing.

**Uso:**
```bash
python manage.py create_sample_branches
```

**Sucursales creadas:**
1. **SCL-01** - Casa Matriz Santiago
   - Ciudad: Santiago
   - Direccion: Av. Providencia 1234, Providencia

2. **VAL-01** - Sucursal Valparaiso
   - Ciudad: Valparaiso
   - Direccion: Av. Brasil 567, Valparaiso

3. **CON-01** - Sucursal Concepcion
   - Ciudad: Concepcion
   - Direccion: Calle O'Higgins 890, Concepcion

**Caracteristicas:**
- Usa `get_or_create()` para evitar duplicados
- Puede ejecutarse multiples veces sin error
- Retorna contadores: creadas vs existentes
- Output con colores: verde (creadas), amarillo (existentes)

**Implementacion:**
```python
branch, created = Branch.objects.get_or_create(
    codigo=branch_data['codigo'],
    defaults=branch_data
)
```

---

## 4. Estructura de Archivos Backend

```
backend/
├── config/
│   ├── settings.py        # AUTH_USER_MODEL, INSTALLED_APPS, CORS
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
│
├── apps/
│   ├── users/
│   │   ├── models.py      # User
│   │   ├── audit.py       # AuditLog
│   │   ├── admin.py       # UserAdmin, AuditLogAdmin
│   │   ├── apps.py        # name = 'apps.users'
│   │   └── migrations/
│   │
│   ├── branches/
│   │   ├── models.py      # Branch
│   │   ├── admin.py       # BranchAdmin
│   │   ├── apps.py        # name = 'apps.branches'
│   │   ├── migrations/
│   │   └── management/
│   │       └── commands/
│   │           └── create_sample_branches.py
│   │
│   ├── employees/
│   │   ├── models.py      # Employee
│   │   ├── admin.py       # EmployeeAdmin
│   │   ├── apps.py        # name = 'apps.employees'
│   │   ├── migrations/
│   │   └── validators.py  # (Futuro: validate_rut)
│   │
│   ├── devices/
│   │   ├── models.py      # Device
│   │   ├── admin.py       # DeviceAdmin
│   │   ├── apps.py        # name = 'apps.devices'
│   │   └── migrations/
│   │
│   └── assignments/
│       ├── models.py      # Request, Assignment, Return
│       ├── admin.py       # 3 ModelAdmins
│       ├── apps.py        # name = 'apps.assignments'
│       ├── migrations/
│       └── signals.py     # (Futuro: post_save signals)
│
├── manage.py
├── db.sqlite3
├── requirements.txt
└── .env
```

---

## 5. Convenciones de Codigo

### Nombres de apps:
- Usar plural en ingles: users, branches, employees, devices, assignments
- En apps.py: `name = 'apps.nombre_app'`
- verbose_name en espanol

### Modelos:
- Nombres en singular y en ingles: User, Branch, Employee, Device
- verbose_name y verbose_name_plural en espanol
- Incluir docstring explicando proposito
- Orden de campos:
  1. Campos principales
  2. Campos opcionales
  3. Metadata (estado, tipo, etc)
  4. Timestamps (created_at, updated_at)
  5. created_by

### Campos comunes:
```python
created_at = models.DateTimeField(auto_now_add=True)
updated_at = models.DateTimeField(auto_now=True)
created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
```

### Choices:
- Definir como constantes MAYUSCULAS dentro del modelo
- Valores en MAYUSCULAS, labels en Capitalize
```python
ESTADO_CHOICES = [
    ('ACTIVO', 'Activo'),
    ('INACTIVO', 'Inactivo'),
]
```

### Meta class:
```python
class Meta:
    verbose_name = 'Nombre Singular'
    verbose_name_plural = 'Nombre Plural'
    ordering = ['campo_principal']
    indexes = [...]  # Si es necesario
```

---

## 6. Decisiones Tecnicas

### Por que SQLite en desarrollo:
- Facil de configurar y resetear
- No requiere servidor adicional
- Archivo unico (db.sqlite3)
- Migracion a PostgreSQL en produccion es directa
- Soporta JSONField desde version 3.9+

### Por que modelo User personalizado:
- Flexibilidad para agregar campos (role)
- Mejor que usar Profile separado para este caso
- DEBE configurarse antes de primera migracion
- Permite control de permisos integrado

### Por que on_delete=PROTECT:
- Evita eliminacion accidental en cascada
- Fuerza validacion antes de eliminar
- Mejor que CASCADE para integridad de datos
- Permite manejar el error de forma controlada

### Por que JSONField para AuditLog.changes:
- Permite guardar cambios complejos
- Flexible para diferentes tipos de entidades
- No requiere esquema fijo
- Soportado nativamente por SQLite moderno

### Por que OneToOneField para Return.asignacion:
- Una asignacion solo puede tener una devolucion
- Previene multiples devoluciones de la misma asignacion
- Permite acceso inverso: assignment.return

---

## 7. Problemas Comunes y Soluciones

### Error: InconsistentMigrationHistory

**Mensaje:**
```
Migration admin.0001_initial is applied before its dependency
users.0001_initial on database 'default'.
```

**Causa:**
Cambiar AUTH_USER_MODEL despues de aplicar migraciones.

**Solucion:**
```bash
# 1. Eliminar BD
rm db.sqlite3

# 2. Eliminar migraciones (mantener __init__.py)
find apps/*/migrations -name "*.py" ! -name "__init__.py" -delete

# 3. Crear migraciones nuevas
python manage.py makemigrations

# 4. Aplicar migraciones
python manage.py migrate

# 5. Recrear superusuario
python manage.py createsuperuser
```

### Error: apps.AppRegistryNotReady

**Causa:**
Importar modelos antes de que Django este listo.

**Solucion:**
- Usar import dentro de funciones
- O importar en ready() de apps.py para signals

### Error: No such table

**Causa:**
Migraciones no aplicadas.

**Solucion:**
```bash
python manage.py migrate
```

### Error: UNIQUE constraint failed

**Causa:**
Intentar crear registro con campo unico duplicado.

**Solucion:**
- Verificar que serie_imei, rut, codigo sean unicos
- Usar get_or_create() para evitar duplicados

---

## 8. Testing y Verificacion

### Verificar modelos en shell:
```python
python manage.py shell

# Importar modelos
from apps.users.models import User
from apps.branches.models import Branch
from apps.employees.models import Employee
from apps.devices.models import Device
from apps.assignments.models import Request, Assignment, Return
from apps.users.audit import AuditLog

# Verificar User personalizado
User.objects.first().role  # Debe tener el campo 'role'

# Verificar sucursales
Branch.objects.all()  # Debe mostrar 3 sucursales

# Verificar relaciones
employee = Employee.objects.first()
employee.sucursal  # Debe retornar Branch
employee.created_by  # Debe retornar User
```

### Verificar Django Admin:
1. Ir a http://localhost:8000/admin/
2. Login con superusuario
3. Verificar apps visibles:
   - Usuarios y Autenticacion
   - Sucursales
   - Empleados
   - Dispositivos
   - Asignaciones y Solicitudes
4. Probar crear registros en cada modelo
5. Verificar que autocomplete funcione en ForeignKeys
6. Verificar que created_by se asigne automaticamente

### Verificar proteccion de eliminacion:
```python
# Crear empleado con asignacion activa
employee = Employee.objects.first()
assignment = Assignment.objects.create(
    empleado=employee,
    dispositivo=device,
    estado_asignacion='ACTIVA',
    ...
)

# Intentar eliminar
employee.delete()  # Debe lanzar ProtectedError
```

---

## 9. Proximos Pasos (Fase 3)

La siguiente fase implementara:

1. **Django REST Framework**
   - Instalar djangorestframework
   - Configurar DRF settings
   - Configurar paginacion

2. **Serializers**
   - BranchSerializer
   - EmployeeSerializer
   - DeviceSerializer
   - RequestSerializer
   - AssignmentSerializer
   - ReturnSerializer

3. **ViewSets**
   - Con filtros (django-filter)
   - Con busqueda
   - Con paginacion

4. **URLs**
   - /api/branches/
   - /api/employees/
   - /api/devices/
   - /api/assignments/requests/
   - /api/assignments/assignments/
   - /api/assignments/returns/

---

**Ultima actualizacion:** Noviembre 5, 2025
**Autor:** Claude (Asistente IA)
**Version:** 1.0
