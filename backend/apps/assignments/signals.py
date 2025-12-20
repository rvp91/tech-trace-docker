"""
Señales para el módulo de asignaciones.

Gestiona el cambio automático de estado de dispositivos cuando se crean o modifican asignaciones.
"""
from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from .models import Assignment, Return


@receiver(post_save, sender=Assignment)
def assignment_post_save(sender, instance, created, **kwargs):
    """
    Señal que se ejecuta después de guardar una Asignación.

    Acciones:
    - Al crear una asignación ACTIVA: cambiar dispositivo a ASIGNADO
    - Si tiene solicitud vinculada: marcar solicitud como COMPLETADA
    - Al finalizar una asignación: no hace nada (se maneja en Return)
    """
    # Solo ejecutar si es una asignación ACTIVA
    if instance.estado_asignacion == 'ACTIVA':
        dispositivo = instance.dispositivo

        # NO cambiar estado si el dispositivo está en estado final
        FINAL_STATES = ['BAJA', 'ROBO']
        if dispositivo.estado in FINAL_STATES:
            # Log warning pero no cambiar estado
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(
                f'Asignación {instance.id} creada para dispositivo {dispositivo.id} '
                f'en estado final {dispositivo.estado}. No se cambió el estado.'
            )
        elif dispositivo.estado != 'ASIGNADO':
            # Obtener el usuario que creó la asignación para la auditoría
            user = instance.created_by if hasattr(instance, 'created_by') else None
            dispositivo.change_status('ASIGNADO', user=user)

        # Auto-completar solicitud vinculada (solo al crear la asignación)
        if created and instance.solicitud:
            solicitud = instance.solicitud
            if solicitud.estado == 'PENDIENTE':
                solicitud.estado = 'COMPLETADA'
                solicitud.save(update_fields=['estado', 'updated_at'])


@receiver(post_save, sender=Return)
def return_post_save(sender, instance, created, **kwargs):
    """
    Señal que se ejecuta después de guardar una Devolución.

    Acciones:
    - Marcar la asignación como FINALIZADA
    - Cambiar el estado del dispositivo según el estado de devolución:
      * OPTIMO → DISPONIBLE
      * CON_DANOS → MANTENIMIENTO
      * NO_FUNCIONAL → MANTENIMIENTO
    """
    # Solo ejecutar cuando se crea la devolución (no en updates)
    if created:
        asignacion = instance.asignacion
        dispositivo = asignacion.dispositivo

        # 1. Finalizar la asignación
        if asignacion.estado_asignacion != 'FINALIZADA':
            asignacion.estado_asignacion = 'FINALIZADA'
            asignacion.save()

        # 2. NO cambiar estado si el dispositivo está en estado final
        FINAL_STATES = ['BAJA', 'ROBO']
        if dispositivo.estado in FINAL_STATES:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(
                f'Devolución {instance.id} registrada para dispositivo {dispositivo.id} '
                f'en estado final {dispositivo.estado}. No se cambió el estado.'
            )
            return

        # 3. Cambiar el estado del dispositivo según el estado de devolución
        nuevo_estado = None

        if instance.estado_dispositivo == 'OPTIMO':
            nuevo_estado = 'DISPONIBLE'
        elif instance.estado_dispositivo in ['CON_DANOS', 'NO_FUNCIONAL']:
            nuevo_estado = 'MANTENIMIENTO'

        # Aplicar el cambio de estado con auditoría
        if nuevo_estado and dispositivo.estado != nuevo_estado:
            user = instance.created_by if hasattr(instance, 'created_by') else None
            dispositivo.change_status(nuevo_estado, user=user)
