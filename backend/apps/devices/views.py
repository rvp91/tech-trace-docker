from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q
from .models import Device
from .serializers import DeviceSerializer


class DeviceViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar los dispositivos.
    Proporciona operaciones CRUD completas con filtros y búsqueda.
    """
    queryset = Device.objects.select_related('sucursal', 'created_by').all()
    serializer_class = DeviceSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo_equipo', 'estado', 'sucursal', 'marca']
    search_fields = ['numero_serie', 'imei', 'marca', 'modelo', 'numero_telefono', 'numero_factura']
    ordering_fields = ['marca', 'modelo', 'fecha_ingreso', 'created_at']
    ordering = ['-fecha_ingreso']

    def perform_create(self, serializer):
        """
        Asignar automáticamente el usuario actual como created_by al crear un dispositivo.
        """
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['get'], url_path='history')
    def history(self, request, pk=None):
        """
        Endpoint personalizado para obtener el historial de asignaciones de un dispositivo.

        URL: /api/devices/{id}/history/

        Retorna todas las asignaciones (activas e históricas) del dispositivo,
        ordenadas de más reciente a más antigua.
        """
        from apps.assignments.serializers import AssignmentSerializer

        device = self.get_object()
        assignments = device.assignment_set.select_related(
            'empleado',
            'empleado__sucursal',
            'solicitud',
            'created_by'
        ).prefetch_related('return').order_by('-fecha_entrega')

        serializer = AssignmentSerializer(assignments, many=True)

        return Response({
            'device': {
                'id': device.id,
                'tipo_equipo': device.tipo_equipo,
                'marca': device.marca,
                'modelo': device.modelo,
                'numero_serie': device.numero_serie,
                'imei': device.imei,
                'estado': device.estado,
            },
            'total_assignments': assignments.count(),
            'active_assignment': assignments.filter(estado_asignacion='ACTIVA').exists(),
            'assignments': serializer.data
        })


class StatsViewSet(viewsets.ViewSet):
    """
    ViewSet para obtener estadísticas generales del sistema.

    Este ViewSet no tiene modelo asociado, solo proporciona endpoints
    personalizados para consultar estadísticas agregadas.
    """

    @action(detail=False, methods=['get'], url_path='dashboard')
    def dashboard(self, request):
        """
        Endpoint para obtener estadísticas generales del dashboard.

        URL: /api/stats/dashboard/

        Retorna:
        - Total de dispositivos por estado
        - Total de dispositivos por tipo
        - Total de empleados activos
        - Últimas 5 asignaciones
        - Asignaciones activas
        """
        from apps.employees.models import Employee
        from apps.assignments.models import Assignment
        from apps.assignments.serializers import AssignmentSerializer

        # 1. Dispositivos por estado
        devices_by_status = Device.objects.values('estado').annotate(
            total=Count('id')
        ).order_by('estado')

        devices_by_status_dict = {item['estado']: item['total'] for item in devices_by_status}

        # 2. Dispositivos por tipo
        devices_by_type = Device.objects.values('tipo_equipo').annotate(
            total=Count('id')
        ).order_by('tipo_equipo')

        devices_by_type_dict = {item['tipo_equipo']: item['total'] for item in devices_by_type}

        # 3. Total de empleados activos
        active_employees = Employee.objects.filter(estado='ACTIVO').count()

        # 4. Total de dispositivos
        total_devices = Device.objects.count()

        # 5. Dispositivos disponibles
        available_devices = Device.objects.filter(estado='DISPONIBLE').count()

        # 6. Asignaciones activas
        active_assignments_count = Assignment.objects.filter(estado_asignacion='ACTIVA').count()

        # 7. Últimas 5 asignaciones
        recent_assignments = Assignment.objects.select_related(
            'empleado',
            'dispositivo',
            'created_by'
        ).order_by('-created_at')[:5]

        recent_assignments_serializer = AssignmentSerializer(recent_assignments, many=True)

        # 8. Dispositivos por sucursal
        from apps.branches.models import Branch
        devices_by_branch = Device.objects.values(
            'sucursal__nombre',
            'sucursal__codigo'
        ).annotate(total=Count('id')).order_by('-total')

        # 9. Últimas 5 devoluciones
        from apps.assignments.models import Return
        from apps.assignments.serializers import ReturnSerializer
        recent_returns = Return.objects.select_related(
            'asignacion__empleado',
            'asignacion__dispositivo',
            'created_by'
        ).order_by('-created_at')[:5]

        recent_returns_serializer = ReturnSerializer(recent_returns, many=True)

        return Response({
            'summary': {
                'total_devices': total_devices,
                'available_devices': available_devices,
                'active_employees': active_employees,
                'active_assignments': active_assignments_count,
            },
            'devices_by_status': devices_by_status_dict,
            'devices_by_type': devices_by_type_dict,
            'devices_by_branch': list(devices_by_branch),
            'recent_assignments': recent_assignments_serializer.data,
            'recent_returns': recent_returns_serializer.data,
        })
