from rest_framework import serializers
from .models import Branch


class BranchSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Branch (Sucursal).
    """
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
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
