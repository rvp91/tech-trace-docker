"""
Serializers para el módulo de usuarios.
"""
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo User.
    Incluye todos los campos necesarios para la autenticación y gestión de usuarios.
    """
    # Campo read-only para mostrar el nombre completo
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'role',
            'is_active',
            'is_staff',
            'is_superuser',
            'date_joined',
            'last_login',
        ]
        read_only_fields = [
            'id',
            'date_joined',
            'last_login',
            'is_superuser',
        ]

    def get_full_name(self, obj):
        """Retorna el nombre completo del usuario."""
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Serializer personalizado para obtener tokens JWT.
    Extiende TokenObtainPairSerializer para incluir datos del usuario en la respuesta.
    """

    @classmethod
    def get_token(cls, user):
        """
        Agrega claims personalizados al token.
        """
        token = super().get_token(user)

        # Agregar claims personalizados
        token['username'] = user.username
        token['email'] = user.email
        token['role'] = user.role
        token['is_staff'] = user.is_staff

        return token

    def validate(self, attrs):
        """
        Valida las credenciales y retorna los tokens junto con los datos del usuario.
        """
        data = super().validate(attrs)

        # Agregar datos del usuario a la respuesta
        user_serializer = UserSerializer(self.user)
        data['user'] = user_serializer.data

        return data
