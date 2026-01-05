from django.contrib.auth.models import AbstractUser, UserManager as DjangoUserManager
from django.db import models


class UserManager(DjangoUserManager):
    """
    Manager personalizado para el modelo User.
    Asegura que los superusuarios tengan rol ADMIN por defecto.
    """
    def create_superuser(self, username, email=None, password=None, **extra_fields):
        """
        Crea y guarda un superusuario con rol ADMIN.
        """
        # Establecer rol como ADMIN si no se especifica
        extra_fields.setdefault('role', 'ADMIN')

        return super().create_superuser(username, email, password, **extra_fields)


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

    # Usar el manager personalizado
    objects = UserManager()

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
