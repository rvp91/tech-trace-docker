"""
Views para autenticación y gestión de usuarios.
"""
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .serializers import CustomTokenObtainPairSerializer, UserSerializer
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
