from rest_framework import viewsets, filters
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
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
    """
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    pagination_class = BranchPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['nombre', 'codigo']
    ordering_fields = ['nombre', 'codigo', 'created_at']
    ordering = ['nombre']
