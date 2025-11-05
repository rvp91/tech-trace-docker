from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Modelo de usuario personalizado extendiendo AbstractUser.
    Agrega el campo 'role' para diferenciar entre Admin y Operador.
    """
    ROLE_CHOICES = [
        ('ADMIN', 'Administrador'),
        ('OPERADOR', 'Operador'),
    ]

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='OPERADOR',
        verbose_name='Rol'
    )

    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['-date_joined']

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    def is_admin(self):
        """Retorna True si el usuario es Admin"""
        return self.role == 'ADMIN'

    def is_operador(self):
        """Retorna True si el usuario es Operador"""
        return self.role == 'OPERADOR'
