from django.db import models
from django.conf import settings
from .validators import validate_rut


class BusinessUnit(models.Model):
    """
    Modelo para gestionar las unidades de negocio de la empresa.
    """
    nombre = models.CharField(max_length=100, unique=True, verbose_name='Nombre')
    codigo = models.CharField(max_length=20, unique=True, verbose_name='Código',
                            help_text='Código corto identificador (ej: TEC, OPS, VEN)')
    descripcion = models.TextField(blank=True, null=True, verbose_name='Descripción')
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Última actualización')

    class Meta:
        verbose_name = 'Unidad de Negocio'
        verbose_name_plural = 'Unidades de Negocio'
        ordering = ['nombre']

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class Employee(models.Model):
    """
    Modelo para gestionar los empleados de la empresa.
    """
    ESTADO_CHOICES = [
        ('ACTIVO', 'Activo'),
        ('INACTIVO', 'Inactivo'),
    ]

    rut = models.CharField(
        max_length=12,
        unique=True,
        verbose_name='RUT',
        validators=[validate_rut],
        help_text='Formato: XX.XXX.XXX-X o XXXXXXXX-X'
    )
    nombre_completo = models.CharField(max_length=200, verbose_name='Nombre completo')
    cargo = models.CharField(max_length=100, verbose_name='Cargo')
    correo_corporativo = models.EmailField(blank=True, null=True, verbose_name='Correo corporativo')
    gmail_personal = models.EmailField(blank=True, null=True, verbose_name='Gmail personal')
    telefono = models.CharField(max_length=20, blank=True, null=True, verbose_name='Teléfono')
    sucursal = models.ForeignKey('branches.Branch', on_delete=models.PROTECT, verbose_name='Sucursal')
    unidad_negocio = models.ForeignKey(
        'BusinessUnit',
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        verbose_name='Unidad de negocio',
        limit_choices_to={'is_active': True}
    )
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='ACTIVO', verbose_name='Estado')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Última actualización')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, verbose_name='Creado por')

    class Meta:
        verbose_name = 'Empleado'
        verbose_name_plural = 'Empleados'
        ordering = ['nombre_completo']

    def __str__(self):
        return f"{self.rut} - {self.nombre_completo}"

    def has_active_assignments(self):
        """Retorna True si el empleado tiene asignaciones activas"""
        return self.assignment_set.filter(estado_asignacion='ACTIVA').exists()

    def delete(self, *args, **kwargs):
        """Previene la eliminación si tiene asignaciones activas"""
        if self.has_active_assignments():
            raise models.ProtectedError(
                "No se puede eliminar el empleado porque tiene asignaciones activas",
                self
            )
        super().delete(*args, **kwargs)
