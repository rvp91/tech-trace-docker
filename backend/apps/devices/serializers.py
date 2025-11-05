from rest_framework import serializers
from .models import Device
from apps.branches.serializers import BranchSerializer


class DeviceSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Device (Dispositivo).
    """
    # Campos de solo lectura con información anidada
    sucursal_detail = BranchSerializer(source='sucursal', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    tipo_equipo_display = serializers.CharField(source='get_tipo_equipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = Device
        fields = [
            'id',
            'tipo_equipo',
            'tipo_equipo_display',
            'marca',
            'modelo',
            'serie_imei',
            'numero_telefono',
            'numero_factura',
            'estado',
            'estado_display',
            'sucursal',
            'sucursal_detail',
            'fecha_ingreso',
            'created_at',
            'updated_at',
            'created_by',
            'created_by_username',
        ]
        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
            'created_by',
            'sucursal_detail',
            'created_by_username',
            'tipo_equipo_display',
            'estado_display',
        ]

    def validate_serie_imei(self, value):
        """
        Validar que la serie/IMEI sea única.
        """
        if self.instance:
            # Si estamos actualizando, excluir el registro actual
            if Device.objects.exclude(pk=self.instance.pk).filter(serie_imei=value).exists():
                raise serializers.ValidationError("Ya existe un dispositivo con esta serie/IMEI")
        else:
            # Si estamos creando, verificar que no exista
            if Device.objects.filter(serie_imei=value).exists():
                raise serializers.ValidationError("Ya existe un dispositivo con esta serie/IMEI")

        return value

    def validate(self, data):
        """
        Validaciones a nivel de objeto.
        """
        # Validar que los teléfonos y SIM cards tengan número de teléfono
        if data.get('tipo_equipo') in ['TELEFONO', 'SIM']:
            if not data.get('numero_telefono'):
                raise serializers.ValidationError({
                    'numero_telefono': 'Este campo es requerido para teléfonos y SIM cards'
                })

        return data
