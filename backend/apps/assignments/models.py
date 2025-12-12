from django.db import models
from django.conf import settings


class Request(models.Model):
    """
    Modelo para gestionar las solicitudes de dispositivos.
    """
    ESTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('APROBADA', 'Aprobada'),
        ('RECHAZADA', 'Rechazada'),
        ('COMPLETADA', 'Completada'),
    ]

    MOTIVO_CHOICES = [
        ('CAMBIO', 'Cambio'),
        ('NUEVA_ENTREGA', 'Nueva entrega'),
        ('ROBO', 'Robo'),
        ('PRACTICA', 'Práctica'),
    ]

    empleado = models.ForeignKey('employees.Employee', on_delete=models.PROTECT, verbose_name='Empleado')
    sucursal = models.ForeignKey('branches.Branch', on_delete=models.PROTECT, verbose_name='Sucursal', null=True, blank=True)
    motivo = models.CharField(max_length=20, choices=MOTIVO_CHOICES, verbose_name='Motivo de solicitud', default='NUEVA_ENTREGA')
    jefatura_solicitante = models.CharField(max_length=200, verbose_name='Jefatura solicitante')
    tipo_dispositivo = models.CharField(max_length=20, verbose_name='Tipo de dispositivo')
    justificacion = models.TextField(blank=True, null=True, verbose_name='Justificación')
    fecha_solicitud = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de solicitud')
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PENDIENTE', verbose_name='Estado')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, verbose_name='Creado por')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Última actualización')

    class Meta:
        verbose_name = 'Solicitud'
        verbose_name_plural = 'Solicitudes'
        ordering = ['-fecha_solicitud']

    def __str__(self):
        return f"Solicitud #{self.id} - {self.empleado.nombre_completo} - {self.get_estado_display()}"


class Assignment(models.Model):
    """
    Modelo para gestionar las asignaciones de dispositivos a empleados.
    """
    TIPO_ENTREGA_CHOICES = [
        ('PERMANENTE', 'Permanente'),
        ('TEMPORAL', 'Temporal'),
    ]

    ESTADO_CARTA_CHOICES = [
        ('FIRMADA', 'Firmada'),
        ('PENDIENTE', 'Pendiente'),
        ('NO_APLICA', 'No Aplica'),
    ]

    ESTADO_ASIGNACION_CHOICES = [
        ('ACTIVA', 'Activa'),
        ('FINALIZADA', 'Finalizada'),
    ]

    solicitud = models.ForeignKey(Request, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Solicitud')
    empleado = models.ForeignKey('employees.Employee', on_delete=models.PROTECT, verbose_name='Empleado')
    dispositivo = models.ForeignKey('devices.Device', on_delete=models.PROTECT, verbose_name='Dispositivo')
    tipo_entrega = models.CharField(max_length=20, choices=TIPO_ENTREGA_CHOICES, verbose_name='Tipo de entrega')
    fecha_entrega = models.DateField(verbose_name='Fecha de entrega')
    fecha_devolucion = models.DateField(blank=True, null=True, verbose_name='Fecha de devolución')
    estado_carta = models.CharField(max_length=20, choices=ESTADO_CARTA_CHOICES, default='PENDIENTE', verbose_name='Estado de carta')
    estado_asignacion = models.CharField(max_length=20, choices=ESTADO_ASIGNACION_CHOICES, default='ACTIVA', verbose_name='Estado de asignación')
    observaciones = models.TextField(blank=True, null=True, verbose_name='Observaciones')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, verbose_name='Creado por')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Última actualización')

    class Meta:
        verbose_name = 'Asignación'
        verbose_name_plural = 'Asignaciones'
        ordering = ['-fecha_entrega']

    def __str__(self):
        return f"Asignación #{self.id} - {self.empleado.nombre_completo} - {self.dispositivo.serie_imei}"


class Return(models.Model):
    """
    Modelo para gestionar las devoluciones de dispositivos.
    """
    ESTADO_DISPOSITIVO_CHOICES = [
        ('OPTIMO', 'Óptimo'),
        ('CON_DANOS', 'Con Daños'),
        ('NO_FUNCIONAL', 'No Funcional'),
    ]

    asignacion = models.OneToOneField(Assignment, on_delete=models.PROTECT, verbose_name='Asignación')
    fecha_devolucion = models.DateField(verbose_name='Fecha de devolución')
    estado_dispositivo = models.CharField(max_length=20, choices=ESTADO_DISPOSITIVO_CHOICES, verbose_name='Estado del dispositivo')
    observaciones = models.TextField(blank=True, null=True, verbose_name='Observaciones')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, verbose_name='Creado por')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')

    class Meta:
        verbose_name = 'Devolución'
        verbose_name_plural = 'Devoluciones'
        ordering = ['-fecha_devolucion']

    def __str__(self):
        return f"Devolución #{self.id} - Asignación #{self.asignacion.id}"
