"""
URLs para el módulo de autenticación y gestión de usuarios.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import CustomTokenObtainPairView, LogoutView, CurrentUserView, UserViewSet

# Router para el ViewSet de usuarios
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    # Autenticación JWT
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),

    # Usuario actual
    path('me/', CurrentUserView.as_view(), name='current_user'),

    # Gestión de usuarios (incluye el router)
    path('', include(router.urls)),
]
