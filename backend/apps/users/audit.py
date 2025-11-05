from django.db import models
from django.conf import settings


class AuditLog(models.Model):
    """
    Modelo para registrar todas las operaciones realizadas en el sistema.
    Proporciona una auditoría completa de CREATE, UPDATE y DELETE.
    """
    ACTION_CHOICES = [
        ('CREATE', 'Creación'),
        ('UPDATE', 'Actualización'),
        ('DELETE', 'Eliminación'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, verbose_name='Usuario')
    action = models.CharField(max_length=10, choices=ACTION_CHOICES, verbose_name='Acción')
    entity_type = models.CharField(max_length=50, verbose_name='Tipo de entidad')
    entity_id = models.IntegerField(verbose_name='ID de entidad')
    changes = models.JSONField(blank=True, null=True, verbose_name='Cambios realizados')
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name='Fecha y hora')

    class Meta:
        verbose_name = 'Registro de auditoría'
        verbose_name_plural = 'Registros de auditoría'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['entity_type', 'entity_id']),
        ]

    def __str__(self):
        return f"{self.get_action_display()} - {self.entity_type} #{self.entity_id} por {self.user.username}"
