from django.db import models
from django.conf import settings
import json


class Device(models.Model):
    """
    Modelo para gestionar los dispositivos móviles de la empresa.
    """
    TIPO_CHOICES = [
        ('LAPTOP', 'Laptop'),
        ('TELEFONO', 'Teléfono Móvil'),
        ('TABLET', 'Tablet'),
        ('SIM', 'SIM Card'),
        ('ACCESORIO', 'Accesorio'),
    ]

    ESTADO_CHOICES = [
        ('DISPONIBLE', 'Disponible'),
        ('ASIGNADO', 'Asignado'),
        ('MANTENIMIENTO', 'En Mantenimiento'),
        ('BAJA', 'Dado de Baja'),
        ('ROBO', 'Robo'),
    ]

    tipo_equipo = models.CharField(max_length=20, choices=TIPO_CHOICES, verbose_name='Tipo de equipo')
    marca = models.CharField(max_length=50, verbose_name='Marca')
    modelo = models.CharField(max_length=100, verbose_name='Modelo')
    serie_imei = models.CharField(max_length=100, unique=True, verbose_name='Serie/IMEI')
    numero_telefono = models.CharField(max_length=20, blank=True, null=True, verbose_name='Número de teléfono')
    numero_factura = models.CharField(max_length=50, blank=True, null=True, verbose_name='Número de factura')
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='DISPONIBLE', verbose_name='Estado')
    sucursal = models.ForeignKey('branches.Branch', on_delete=models.PROTECT, verbose_name='Sucursal')
    fecha_ingreso = models.DateField(verbose_name='Fecha de ingreso')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Última actualización')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, verbose_name='Creado por')

    class Meta:
        verbose_name = 'Dispositivo'
        verbose_name_plural = 'Dispositivos'
        ordering = ['-fecha_ingreso']

    def __str__(self):
        return f"{self.get_tipo_equipo_display()} - {self.marca} {self.modelo} ({self.serie_imei})"

    def change_status(self, new_status, user=None):
        """Cambia el estado del dispositivo y registra en auditoría"""
        from apps.users.audit import AuditLog

        old_status = self.estado

        if old_status == new_status:
            return False  # No hay cambio

        self.estado = new_status
        self.save()

        # Registrar en auditoría si se proporciona un usuario
        if user:
            AuditLog.objects.create(
                user=user,
                action='UPDATE',
                entity_type='Device',
                entity_id=self.id,
                changes={
                    'field': 'estado',
                    'old_value': old_status,
                    'new_value': new_status,
                    'device': str(self)
                }
            )

        return True

    def has_active_assignment(self):
        """Retorna True si el dispositivo tiene una asignación activa"""
        return self.assignment_set.filter(estado_asignacion='ACTIVA').exists()

    def delete(self, *args, **kwargs):
        """Previene la eliminación si tiene asignaciones activas"""
        if self.has_active_assignment():
            raise models.ProtectedError(
                "No se puede eliminar el dispositivo porque tiene una asignación activa",
                self
            )
        super().delete(*args, **kwargs)
