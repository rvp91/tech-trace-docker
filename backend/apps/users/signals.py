"""
Señales para el sistema de auditoría automático.

Registra automáticamente en AuditLog todas las operaciones CREATE, UPDATE y DELETE
sobre los modelos principales del sistema.
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .audit import AuditLog
import json


def create_audit_log(user, action, entity_type, entity_id, changes=None):
    """
    Función auxiliar para crear registros de auditoría.

    Args:
        user: Usuario que realiza la acción
        action: Tipo de acción (CREATE, UPDATE, DELETE)
        entity_type: Tipo de entidad afectada
        entity_id: ID de la entidad
        changes: Diccionario con los cambios realizados
    """
    if user and user.is_authenticated:
        AuditLog.objects.create(
            user=user,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            changes=changes or {}
        )


def get_model_changes(instance, created=False):
    """
    Obtiene un diccionario con los cambios realizados en un modelo.

    Args:
        instance: Instancia del modelo
        created: Indica si la instancia fue recién creada

    Returns:
        dict: Diccionario con la información relevante del modelo
    """
    changes = {
        'action_type': 'CREATE' if created else 'UPDATE',
        'model': instance.__class__.__name__,
        'str_representation': str(instance),
    }

    # Para modelos específicos, agregar información adicional
    if hasattr(instance, 'estado'):
        changes['estado'] = instance.estado

    if hasattr(instance, 'nombre_completo'):
        changes['nombre_completo'] = instance.nombre_completo

    if hasattr(instance, 'rut'):
        changes['rut'] = instance.rut

    if hasattr(instance, 'serie_imei'):
        changes['serie_imei'] = instance.serie_imei

    return changes


# ==================== SEÑALES PARA EMPLOYEE ====================

@receiver(post_save, sender='employees.Employee')
def employee_post_save(sender, instance, created, **kwargs):
    """Registra la creación o actualización de un empleado."""
    # Evitar recursión infinita
    if hasattr(instance, '_skip_audit'):
        return

    user = getattr(instance, 'created_by', None)
    action = 'CREATE' if created else 'UPDATE'
    changes = get_model_changes(instance, created)

    create_audit_log(user, action, 'Employee', instance.id, changes)


@receiver(post_delete, sender='employees.Employee')
def employee_post_delete(sender, instance, **kwargs):
    """Registra la eliminación de un empleado."""
    # Para delete, intentamos obtener el usuario del contexto si está disponible
    user = getattr(instance, '_deleting_user', None) or getattr(instance, 'created_by', None)

    changes = {
        'action_type': 'DELETE',
        'model': 'Employee',
        'str_representation': str(instance),
        'rut': instance.rut,
        'nombre_completo': instance.nombre_completo,
    }

    if user:
        create_audit_log(user, 'DELETE', 'Employee', instance.id, changes)


# ==================== SEÑALES PARA DEVICE ====================

@receiver(post_save, sender='devices.Device')
def device_post_save(sender, instance, created, **kwargs):
    """Registra la creación o actualización de un dispositivo."""
    # Evitar recursión infinita
    if hasattr(instance, '_skip_audit'):
        return

    user = getattr(instance, 'created_by', None)
    action = 'CREATE' if created else 'UPDATE'
    changes = get_model_changes(instance, created)

    create_audit_log(user, action, 'Device', instance.id, changes)


@receiver(post_delete, sender='devices.Device')
def device_post_delete(sender, instance, **kwargs):
    """Registra la eliminación de un dispositivo."""
    user = getattr(instance, '_deleting_user', None) or getattr(instance, 'created_by', None)

    changes = {
        'action_type': 'DELETE',
        'model': 'Device',
        'str_representation': str(instance),
        'serie_imei': instance.serie_imei,
        'tipo_equipo': instance.tipo_equipo,
        'marca': instance.marca,
        'modelo': instance.modelo,
    }

    if user:
        create_audit_log(user, 'DELETE', 'Device', instance.id, changes)


# ==================== SEÑALES PARA ASSIGNMENT ====================

@receiver(post_save, sender='assignments.Assignment')
def assignment_post_save(sender, instance, created, **kwargs):
    """Registra la creación o actualización de una asignación."""
    # Evitar recursión infinita
    if hasattr(instance, '_skip_audit'):
        return

    user = getattr(instance, 'created_by', None)
    action = 'CREATE' if created else 'UPDATE'
    changes = get_model_changes(instance, created)

    # Agregar información adicional específica de Assignment
    changes.update({
        'empleado': str(instance.empleado),
        'dispositivo': str(instance.dispositivo),
        'estado_asignacion': instance.estado_asignacion,
        'fecha_entrega': str(instance.fecha_entrega),
    })

    create_audit_log(user, action, 'Assignment', instance.id, changes)


@receiver(post_delete, sender='assignments.Assignment')
def assignment_post_delete(sender, instance, **kwargs):
    """Registra la eliminación de una asignación."""
    user = getattr(instance, '_deleting_user', None) or getattr(instance, 'created_by', None)

    changes = {
        'action_type': 'DELETE',
        'model': 'Assignment',
        'str_representation': str(instance),
        'empleado': str(instance.empleado),
        'dispositivo': str(instance.dispositivo),
    }

    if user:
        create_audit_log(user, 'DELETE', 'Assignment', instance.id, changes)


# ==================== SEÑALES PARA RETURN ====================

@receiver(post_save, sender='assignments.Return')
def return_post_save(sender, instance, created, **kwargs):
    """Registra la creación de una devolución."""
    # Evitar recursión infinita
    if hasattr(instance, '_skip_audit'):
        return

    # Solo registrar en creación (las devoluciones no se actualizan típicamente)
    if created:
        user = getattr(instance, 'created_by', None)
        changes = {
            'action_type': 'CREATE',
            'model': 'Return',
            'str_representation': str(instance),
            'asignacion': str(instance.asignacion),
            'estado_dispositivo': instance.estado_dispositivo,
            'fecha_devolucion': str(instance.fecha_devolucion),
        }

        create_audit_log(user, 'CREATE', 'Return', instance.id, changes)
