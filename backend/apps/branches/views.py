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
        """
        from apps.devices.models import Device

        return Branch.objects.annotate(
            total_dispositivos=Count('device', distinct=True),
            total_empleados=Count('employee', distinct=True)
        ).prefetch_related(
            # Evita queries innecesarias en dispositivos_por_tipo
            Prefetch('device_set', queryset=Device.objects.none())
        )
