from rest_framework import serializers
from .models import Employee
from apps.branches.serializers import BranchSerializer


class EmployeeSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Employee (Empleado).
    """
    # Campos de solo lectura con información anidada
    sucursal_detail = BranchSerializer(source='sucursal', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = Employee
        fields = [
            'id',
            'rut',
            'nombre_completo',
            'cargo',
            'correo_corporativo',
            'gmail_personal',
            'telefono',
            'sucursal',
            'sucursal_detail',
            'unidad_negocio',
            'estado',
            'created_at',
            'updated_at',
            'created_by',
            'created_by_username',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by', 'sucursal_detail', 'created_by_username']

    def validate_rut(self, value):
        """
        Validación básica del formato de RUT chileno.
        TODO: Implementar validación completa del dígito verificador en Fase 5.
        """
        # Remover puntos y guiones
        rut = value.replace('.', '').replace('-', '')

        if len(rut) < 8 or len(rut) > 9:
            raise serializers.ValidationError("El RUT debe tener entre 8 y 9 caracteres (sin puntos ni guión)")

        return value
