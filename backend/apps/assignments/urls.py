from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RequestViewSet, AssignmentViewSet, ReturnViewSet

# Crear router y registrar viewsets
router = DefaultRouter()
router.register(r'requests', RequestViewSet, basename='request')
router.register(r'assignments', AssignmentViewSet, basename='assignment')
router.register(r'returns', ReturnViewSet, basename='return')

urlpatterns = [
    path('', include(router.urls)),
]
