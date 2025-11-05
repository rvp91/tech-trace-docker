from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Request, Assignment, Return
from .serializers import RequestSerializer, AssignmentSerializer, ReturnSerializer


class RequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar las solicitudes de dispositivos.
    Proporciona operaciones CRUD completas con filtros y búsqueda.
    """
    queryset = Request.objects.select_related('empleado', 'created_by').all()
    serializer_class = RequestSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['estado', 'empleado', 'tipo_dispositivo']
    search_fields = ['jefatura_solicitante', 'justificacion', 'empleado__nombre_completo', 'empleado__rut']
    ordering_fields = ['fecha_solicitud', 'estado', 'created_at']
    ordering = ['-fecha_solicitud']

    def perform_create(self, serializer):
        """
        Asignar automáticamente el usuario actual como created_by al crear una solicitud.
        """
        serializer.save(created_by=self.request.user)


class AssignmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar las asignaciones de dispositivos.
    Proporciona operaciones CRUD completas con filtros y búsqueda.
    """
    queryset = Assignment.objects.select_related(
        'empleado',
        'dispositivo',
        'solicitud',
        'created_by'
    ).all()
    serializer_class = AssignmentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['estado_asignacion', 'empleado', 'dispositivo', 'tipo_entrega', 'estado_carta']
    search_fields = [
        'empleado__nombre_completo',
        'empleado__rut',
        'dispositivo__serie_imei',
        'dispositivo__marca',
        'dispositivo__modelo',
        'observaciones'
    ]
    ordering_fields = ['fecha_entrega', 'fecha_devolucion', 'estado_asignacion', 'created_at']
    ordering = ['-fecha_entrega']

    def perform_create(self, serializer):
        """
        Asignar automáticamente el usuario actual como created_by al crear una asignación.
        """
        serializer.save(created_by=self.request.user)


class ReturnViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar las devoluciones de dispositivos.
    Proporciona operaciones CRUD completas con filtros y búsqueda.
    """
    queryset = Return.objects.select_related('asignacion', 'created_by').all()
    serializer_class = ReturnSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['estado_dispositivo', 'asignacion']
    search_fields = [
        'asignacion__empleado__nombre_completo',
        'asignacion__dispositivo__serie_imei',
        'observaciones'
    ]
    ordering_fields = ['fecha_devolucion', 'created_at']
    ordering = ['-fecha_devolucion']

    def perform_create(self, serializer):
        """
        Asignar automáticamente el usuario actual como created_by al crear una devolución.
        """
        serializer.save(created_by=self.request.user)
