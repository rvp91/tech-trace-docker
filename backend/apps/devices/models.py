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
        ('TV', 'TV'),
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
    modelo = models.CharField(max_length=100, blank=True, null=True, verbose_name='Modelo')
    numero_serie = models.CharField(max_length=100, unique=True, blank=True, null=True, verbose_name='Número de Serie')
    imei = models.CharField(max_length=100, unique=True, blank=True, null=True, verbose_name='IMEI')
    numero_telefono = models.CharField(max_length=20, blank=True, null=True, verbose_name='Número de teléfono')
    numero_factura = models.CharField(max_length=50, blank=True, null=True, verbose_name='Número de factura')
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='DISPONIBLE', verbose_name='Estado')
    sucursal = models.ForeignKey('branches.Branch', on_delete=models.PROTECT, verbose_name='Sucursal')
    fecha_ingreso = models.DateField(verbose_name='Fecha de ingreso')
    edad_dispositivo = models.IntegerField(blank=True, null=True, verbose_name='Edad del dispositivo (años)', help_text='Calculado automáticamente desde fecha_ingreso')
    valor_inicial = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, verbose_name='Valor inicial (CLP)', help_text='Valor de compra o tasación inicial')
    valor_depreciado = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, verbose_name='Valor depreciado (CLP)', help_text='Calculado automáticamente o ingresado manualmente')
    es_valor_manual = models.BooleanField(default=False, verbose_name='Valor manual', help_text='Indica si el valor depreciado fue ingresado manualmente')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Última actualización')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, verbose_name='Creado por')

    class Meta:
        verbose_name = 'Dispositivo'
        verbose_name_plural = 'Dispositivos'
        ordering = ['-fecha_ingreso']

    def __str__(self):
        identificador = self.numero_serie or self.imei or 'S/N'
        return f"{self.get_tipo_equipo_display()} - {self.marca} {self.modelo} ({identificador})"

    @property
    def serial_identifier(self):
        """Retorna numero_serie o imei como identificador del dispositivo"""
        return self.numero_serie or self.imei or 'S/N'

    @property
    def edad_calculada(self):
        """Calcula la edad del dispositivo en años desde fecha_ingreso"""
        if not self.fecha_ingreso:
            return None

        from datetime import date
        today = date.today()
        delta = today - self.fecha_ingreso
        years = delta.days // 365

        # Si es mayor a 5 años, retornar "5+"
        if years > 5:
            return "5+"
        return years

    def calcular_depreciacion(self):
        """
        Calcula el valor depreciado según la fórmula:
        - Primeros 6 meses: 0% depreciación
        - Cada 6 meses adicionales: -10% del valor original
        - Máximo: 100% de depreciación (valor = 0) a los 60 meses
        """
        if not self.valor_inicial or not self.fecha_ingreso:
            return None

        from datetime import date
        today = date.today()
        delta = today - self.fecha_ingreso

        # Calcular meses transcurridos (usando 30.44 días promedio por mes)
        meses_transcurridos = delta.days / 30.44

        # Calcular períodos de 6 meses
        periodos_6_meses = int(meses_transcurridos / 6)

        # Si han pasado 10 o más períodos (60+ meses), valor = 0
        if periodos_6_meses >= 10:
            return 0

        # Calcular porcentaje de depreciación (10% por cada período)
        porcentaje_depreciacion = min(periodos_6_meses * 10, 100)

        # Calcular valor depreciado
        from decimal import Decimal
        valor_depreciado = self.valor_inicial * (Decimal('1') - Decimal(str(porcentaje_depreciacion)) / Decimal('100'))

        return round(valor_depreciado, 2)

    def get_valor_depreciado(self):
        """
        Retorna el valor depreciado actual:
        - Si es_valor_manual = True: retorna valor_depreciado almacenado
        - Si es_valor_manual = False: calcula automáticamente
        """
        if self.es_valor_manual and self.valor_depreciado is not None:
            return self.valor_depreciado

        return self.calcular_depreciacion()

    def debe_calcular_edad(self):
        """Retorna True si el tipo de dispositivo debe tener edad"""
        return self.tipo_equipo in ['LAPTOP', 'TELEFONO', 'TABLET']

    def debe_calcular_valor(self):
        """Retorna True si el tipo de dispositivo debe tener valor"""
        return self.tipo_equipo in ['LAPTOP', 'TELEFONO', 'TABLET']

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
