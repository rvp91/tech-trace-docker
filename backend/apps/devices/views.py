from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
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
    search_fields = ['serie_imei', 'marca', 'modelo', 'numero_telefono', 'numero_factura']
    ordering_fields = ['marca', 'modelo', 'fecha_ingreso', 'created_at']
    ordering = ['-fecha_ingreso']

    def perform_create(self, serializer):
        """
        Asignar automáticamente el usuario actual como created_by al crear un dispositivo.
        """
        serializer.save(created_by=self.request.user)
