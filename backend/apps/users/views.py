"""
Views para autenticación y gestión de usuarios.
"""
from rest_framework import status, generics, viewsets, filters
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django_filters.rest_framework import DjangoFilterBackend

from .models import User
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserSerializer,
    CreateUserSerializer,
    ChangePasswordSerializer,
)
from .permissions import IsAdmin


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Vista personalizada para login.
    Retorna access token, refresh token y datos del usuario.
    """
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


class LogoutView(APIView):
    """
    Vista para cerrar sesión.
    Agrega el refresh token a la blacklist para invalidarlo.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Invalida el refresh token agregándolo a la blacklist.
        """
        try:
            refresh_token = request.data.get('refresh_token')

            if not refresh_token:
                return Response(
                    {'error': 'Se requiere el refresh token.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Agregar el token a la blacklist
            token = RefreshToken(refresh_token)
            token.blacklist()

            return Response(
                {'message': 'Sesión cerrada exitosamente.'},
                status=status.HTTP_200_OK
            )
        except TokenError as e:
            return Response(
                {'error': 'Token inválido o ya fue invalidado.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Error al cerrar sesión: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CurrentUserView(APIView):
    """
    Vista para obtener la información del usuario autenticado actual.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Retorna los datos del usuario autenticado.
        """
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        """
        Permite al usuario actualizar sus propios datos (parcialmente).
        """
        serializer = UserSerializer(
            request.user,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            # No permitir que el usuario cambie su propio rol
            if 'role' in request.data and request.user.role != 'ADMIN':
                return Response(
                    {'error': 'No puedes cambiar tu propio rol.'},
                    status=status.HTTP_403_FORBIDDEN
                )

            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CurrentUserChangePasswordView(APIView):
    """
    Vista para que el usuario autenticado cambie su propia contraseña.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Permite al usuario cambiar su propia contraseña.
        Requiere la contraseña actual para validar la identidad.
        """
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'user': request.user}
        )

        if serializer.is_valid():
            # Cambiar la contraseña
            request.user.set_password(serializer.validated_data['new_password'])
            request.user.save()

            return Response(
                {'message': 'Contraseña actualizada correctamente.'},
                status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de usuarios (solo Admin).
    Permite CRUD completo de usuarios y acciones adicionales.
    """
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['role', 'is_active']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['username', 'email', 'date_joined']
    ordering = ['-date_joined']

    def get_serializer_class(self):
        """Retorna el serializer apropiado según la acción."""
        if self.action == 'create':
            return CreateUserSerializer
        return UserSerializer

    def create(self, request, *args, **kwargs):
        """Crea un nuevo usuario."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Retornar el usuario creado con UserSerializer
        output_serializer = UserSerializer(user)
        return Response(
            output_serializer.data,
            status=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        """Actualiza un usuario (no permite cambiar password aquí)."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        # No permitir cambiar la contraseña con este endpoint
        if 'password' in request.data:
            return Response(
                {'error': 'Para cambiar la contraseña usa el endpoint /change_password/'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(
            instance,
            data=request.data,
            partial=partial
        )
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def change_password(self, request, pk=None):
        """
        Endpoint para cambiar la contraseña de un usuario.
        POST /api/users/{id}/change_password/
        """
        user = self.get_object()
        serializer = ChangePasswordSerializer(data=request.data)

        if serializer.is_valid():
            # Cambiar la contraseña
            user.set_password(serializer.validated_data['new_password'])
            user.save()

            return Response(
                {'message': 'Contraseña actualizada correctamente.'},
                status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
