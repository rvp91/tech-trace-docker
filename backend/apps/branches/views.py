from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Branch
from .serializers import BranchSerializer


class BranchViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar las sucursales.
    Proporciona operaciones CRUD completas.
    """
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'ciudad']
    search_fields = ['nombre', 'codigo', 'ciudad', 'direccion']
    ordering_fields = ['nombre', 'codigo', 'ciudad', 'created_at']
    ordering = ['nombre']
