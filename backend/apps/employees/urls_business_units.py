from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BusinessUnitViewSet

# Crear router y registrar viewset
router = DefaultRouter()
router.register(r'', BusinessUnitViewSet, basename='businessunit')

urlpatterns = [
    path('', include(router.urls)),
]
