from django.db import models


class Branch(models.Model):
    """
    Modelo para gestionar las sucursales de la empresa.
    Las sucursales son entidades lógicas/ficticias para organizar dispositivos y empleados,
    no representan ubicaciones físicas.
    """
    nombre = models.CharField(max_length=100, verbose_name='Nombre')
    codigo = models.CharField(max_length=20, unique=True, verbose_name='Código')
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Última actualización')

    class Meta:
        verbose_name = 'Sucursal'
        verbose_name_plural = 'Sucursales'
        ordering = ['nombre']

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"
