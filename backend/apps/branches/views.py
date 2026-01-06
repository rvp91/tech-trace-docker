from rest_framework import viewsets, filters
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Prefetch
from .models import Branch
from .serializers import BranchSerializer


class BranchPagination(PageNumberPagination):
    """Paginación personalizada para sucursales."""
    page_size = 8
    page_size_query_param = 'page_size'
    max_page_size = 100


class BranchViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar las sucursales.
    Proporciona operaciones CRUD completas.
    OPTIMIZADO: Usa annotate() para pre-calcular estadísticas y evitar N+1 queries.
    """
    serializer_class = BranchSerializer
    pagination_class = BranchPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['nombre', 'codigo']
    ordering_fields = ['nombre', 'codigo', 'created_at']
    ordering = ['nombre']

    def get_queryset(self):
        """
        Queryset optimizado con estadísticas pre-calculadas usando annotate().
        Esto evita N+1 queries al serializar las sucursales.
        IMPORTANTE: Excluye dispositivos con estados finales (ROBO, BAJA) del conteo.
        """
        from django.db.models import Q
        from apps.devices.models import Device

        return Branch.objects.annotate(
            total_dispositivos=Count(
                'device',
                distinct=True,
                filter=~Q(device__estado__in=Device.FINAL_STATES)
            ),
            total_empleados=Count('employee', distinct=True)
        ).prefetch_related('device_set')

    def perform_destroy(self, instance):
        """
        Validar que no se puedan eliminar sucursales con dispositivos o empleados
        y proporcionar mensajes de error descriptivos.
        """
        from rest_framework.exceptions import ValidationError
        from django.db.models import ProtectedError

        try:
            instance.delete()
        except ProtectedError:
            # Contar referencias
            device_count = instance.device_set.count()
            employee_count = instance.employee_set.count()

            msg_parts = []
            if device_count > 0:
                msg_parts.append(f'{device_count} dispositivo(s)')
            if employee_count > 0:
                msg_parts.append(f'{employee_count} empleado(s)')

            raise ValidationError({
                'detail': f'No se puede eliminar la sucursal porque tiene {" y ".join(msg_parts)} asociado(s).',
                'devices': device_count,
                'employees': employee_count
            })
