from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Employee
from .serializers import EmployeeSerializer


class EmployeeViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar los empleados.
    Proporciona operaciones CRUD completas con filtros y búsqueda.
    """
    queryset = Employee.objects.select_related('sucursal', 'created_by').all()
    serializer_class = EmployeeSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['estado', 'sucursal', 'unidad_negocio']
    search_fields = ['nombre_completo', 'rut', 'cargo', 'correo_corporativo']
    ordering_fields = ['nombre_completo', 'rut', 'cargo', 'created_at']
    ordering = ['nombre_completo']

    def perform_create(self, serializer):
        """
        Asignar automáticamente el usuario actual como created_by al crear un empleado.
        """
        serializer.save(created_by=self.request.user)
