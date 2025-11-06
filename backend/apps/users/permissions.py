"""
Permisos personalizados para el sistema TechTrace.
Define clases de permisos basadas en roles de usuario.
"""
from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """
    Permiso que solo permite acceso a usuarios con rol ADMIN.
    """
    message = 'Solo los administradores pueden realizar esta acción.'

    def has_permission(self, request, view):
        """
        Verifica que el usuario esté autenticado y tenga rol ADMIN.
        """
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'ADMIN'
        )


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Permiso que permite:
    - Acceso completo (CRUD) a usuarios con rol ADMIN
    - Solo lectura (GET, HEAD, OPTIONS) a usuarios OPERADOR
    """
    message = 'Solo los administradores pueden crear, actualizar o eliminar registros.'

    def has_permission(self, request, view):
        """
        Verifica permisos basados en el método HTTP y el rol del usuario.
        """
        # El usuario debe estar autenticado
        if not request.user or not request.user.is_authenticated:
            return False

        # Métodos seguros (GET, HEAD, OPTIONS) permitidos para todos los usuarios autenticados
        if request.method in permissions.SAFE_METHODS:
            return True

        # Métodos de escritura (POST, PUT, PATCH, DELETE) solo para ADMIN
        return request.user.role == 'ADMIN'


class IsAdminOrOwner(permissions.BasePermission):
    """
    Permiso que permite:
    - Acceso completo a usuarios ADMIN
    - Acceso solo a sus propios recursos para OPERADOR
    """
    message = 'Solo puedes acceder a tus propios recursos.'

    def has_permission(self, request, view):
        """
        Permite acceso a usuarios autenticados.
        """
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        """
        Verifica que el usuario sea ADMIN o el dueño del recurso.
        """
        # ADMIN tiene acceso completo
        if request.user.role == 'ADMIN':
            return True

        # Para otros usuarios, verificar si el objeto tiene un campo 'created_by'
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user

        # Si el objeto es el propio usuario
        if obj == request.user:
            return True

        return False
