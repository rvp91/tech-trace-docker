from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q
from .models import Employee, BusinessUnit
from .serializers import EmployeeSerializer, BusinessUnitSerializer


class BusinessUnitViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de solo lectura para unidades de negocio.
    Solo permite listar y ver detalles, la gestión se hace desde el admin.
    """
    queryset = BusinessUnit.objects.filter(is_active=True).order_by('nombre')
    serializer_class = BusinessUnitSerializer


class EmployeeViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar los empleados.
    Proporciona operaciones CRUD completas con filtros y búsqueda.
    """
    queryset = Employee.objects.select_related('sucursal', 'unidad_negocio', 'created_by').annotate(
        dispositivos_asignados=Count(
            'assignment',
            filter=Q(assignment__estado_asignacion='ACTIVA'),
            distinct=True
        )
    ).all()
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

    @action(detail=True, methods=['get'], url_path='history')
    def history(self, request, pk=None):
        """
        Endpoint personalizado para obtener el historial de asignaciones de un empleado.

        URL: /api/employees/{id}/history/

        Retorna todas las asignaciones (activas e históricas) del empleado,
        ordenadas de más reciente a más antigua.
        """
        from apps.assignments.serializers import AssignmentSerializer

        employee = self.get_object()
        assignments = employee.assignment_set.select_related(
            'dispositivo',
            'dispositivo__sucursal',
            'solicitud',
            'created_by'
        ).order_by('-fecha_entrega')

        serializer = AssignmentSerializer(assignments, many=True)

        return Response({
            'employee': {
                'id': employee.id,
                'rut': employee.rut,
                'nombre_completo': employee.nombre_completo,
                'cargo': employee.cargo,
            },
            'total_assignments': assignments.count(),
            'active_assignments': assignments.filter(estado_asignacion='ACTIVA').count(),
            'assignments': serializer.data
        })
