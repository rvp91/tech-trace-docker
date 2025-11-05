from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmployeeViewSet

# Crear router y registrar viewset
router = DefaultRouter()
router.register(r'', EmployeeViewSet, basename='employee')

urlpatterns = [
    path('', include(router.urls)),
]
