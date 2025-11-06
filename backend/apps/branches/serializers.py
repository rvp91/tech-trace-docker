from rest_framework import serializers
from .models import Branch


class BranchSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Branch (Sucursal).
    Incluye estadísticas de dispositivos y empleados asociados.
    """
    total_dispositivos = serializers.SerializerMethodField()
    total_empleados = serializers.SerializerMethodField()
    dispositivos_por_tipo = serializers.SerializerMethodField()

    class Meta:
        model = Branch
        fields = [
            'id',
            'nombre',
            'codigo',
            'direccion',
            'ciudad',
            'is_active',
            'created_at',
            'updated_at',
            'total_dispositivos',
            'total_empleados',
            'dispositivos_por_tipo',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'total_dispositivos', 'total_empleados', 'dispositivos_por_tipo']

    def get_total_dispositivos(self, obj):
        """Retorna el total de dispositivos en esta sucursal."""
        return obj.device_set.count()

    def get_total_empleados(self, obj):
        """Retorna el total de empleados en esta sucursal."""
        return obj.employee_set.count()

    def get_dispositivos_por_tipo(self, obj):
        """Retorna la cantidad de dispositivos agrupados por tipo."""
        from django.db.models import Count
        dispositivos = obj.device_set.values('tipo_equipo').annotate(
            cantidad=Count('id')
        )

        # Crear diccionario con todos los tipos inicializados en 0
        tipos = {
            'LAPTOP': 0,
            'TELEFONO': 0,
            'TABLET': 0,
            'SIM': 0,
            'ACCESORIO': 0,
        }

        # Actualizar con los valores reales
        for item in dispositivos:
            tipos[item['tipo_equipo']] = item['cantidad']

        return tipos
