from rest_framework import serializers
from .models import Branch


class BranchListSerializer(serializers.ModelSerializer):
    """
    Serializer ligero para Branch sin estadísticas calculadas.
    Usado en dropdowns y listados anidados para evitar N+1 queries.
    """
    class Meta:
        model = Branch
        fields = ['id', 'nombre', 'codigo', 'is_active']


class BranchSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Branch (Sucursal).
    Incluye estadísticas de dispositivos y empleados asociados.
    Las estadísticas se calculan con annotate() en el queryset del ViewSet.
    """
    # OPTIMIZADO: Ahora usa IntegerField en lugar de SerializerMethodField
    # Las estadísticas se pre-calculan en el queryset con annotate()
    total_dispositivos = serializers.IntegerField(read_only=True, default=0)
    total_empleados = serializers.IntegerField(read_only=True, default=0)
    dispositivos_por_tipo = serializers.SerializerMethodField()

    class Meta:
        model = Branch
        fields = [
            'id',
            'nombre',
            'codigo',
            'is_active',
            'created_at',
            'updated_at',
            'total_dispositivos',
            'total_empleados',
            'dispositivos_por_tipo',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'total_dispositivos', 'total_empleados', 'dispositivos_por_tipo']

    def get_dispositivos_por_tipo(self, obj):
        """Retorna la cantidad de dispositivos agrupados por tipo."""
        # Si ya está en cache (pre-calculado), usarlo
        if hasattr(obj, '_dispositivos_por_tipo_cache'):
            return obj._dispositivos_por_tipo_cache

        # Fallback optimizado (solo si es necesario)
        from django.db.models import Count
        dispositivos = obj.device_set.values('tipo_equipo').annotate(
            cantidad=Count('id')
        )

        # Crear diccionario con todos los tipos inicializados en 0
        tipos = {
            'LAPTOP': 0,
            'DESKTOP': 0,
            'TELEFONO': 0,
            'TABLET': 0,
            'TV': 0,
            'SIM': 0,
            'ACCESORIO': 0,
        }

        # Actualizar con los valores reales
        for item in dispositivos:
            tipos[item['tipo_equipo']] = item['cantidad']

        return tipos
