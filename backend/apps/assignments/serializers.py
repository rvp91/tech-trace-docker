from rest_framework import serializers
from .models import Request, Assignment, Return
from apps.employees.serializers import EmployeeSerializer
from apps.devices.serializers import DeviceSerializer
from apps.branches.serializers import BranchSerializer


class RequestSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Request (Solicitud de dispositivo).
    """
    # Campos de solo lectura con información anidada
    empleado_detail = EmployeeSerializer(source='empleado', read_only=True)
    sucursal_detail = BranchSerializer(source='sucursal', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    motivo_display = serializers.CharField(source='get_motivo_display', read_only=True)

    class Meta:
        model = Request
        fields = [
            'id',
            'empleado',
            'empleado_detail',
            'sucursal',
            'sucursal_detail',
            'motivo',
            'motivo_display',
            'jefatura_solicitante',
            'tipo_dispositivo',
            'justificacion',
            'fecha_solicitud',
            'estado',
            'estado_display',
            'created_by',
            'created_by_username',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'fecha_solicitud',
            'created_at',
            'updated_at',
            'created_by',
            'empleado_detail',
            'sucursal_detail',
            'created_by_username',
            'estado_display',
            'motivo_display',
        ]


class AssignmentSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Assignment (Asignación de dispositivo).
    """
    # Campos de solo lectura con información anidada
    empleado_detail = EmployeeSerializer(source='empleado', read_only=True)
    dispositivo_detail = DeviceSerializer(source='dispositivo', read_only=True)
    solicitud_detail = RequestSerializer(source='solicitud', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    tipo_entrega_display = serializers.CharField(source='get_tipo_entrega_display', read_only=True)
    estado_carta_display = serializers.CharField(source='get_estado_carta_display', read_only=True)
    estado_asignacion_display = serializers.CharField(source='get_estado_asignacion_display', read_only=True)

    class Meta:
        model = Assignment
        fields = [
            'id',
            'solicitud',
            'solicitud_detail',
            'empleado',
            'empleado_detail',
            'dispositivo',
            'dispositivo_detail',
            'tipo_entrega',
            'tipo_entrega_display',
            'fecha_entrega',
            'fecha_devolucion',
            'estado_carta',
            'estado_carta_display',
            'estado_asignacion',
            'estado_asignacion_display',
            'observaciones',
            'created_by',
            'created_by_username',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
            'created_by',
            'empleado_detail',
            'dispositivo_detail',
            'solicitud_detail',
            'created_by_username',
            'tipo_entrega_display',
            'estado_carta_display',
            'estado_asignacion_display',
        ]

    def validate_dispositivo(self, value):
        """
        Validar que el dispositivo esté disponible para asignación.
        """
        # Si estamos actualizando, permitir el mismo dispositivo
        if self.instance and self.instance.dispositivo == value:
            return value

        # Verificar que el dispositivo esté disponible
        if value.estado != 'DISPONIBLE':
            raise serializers.ValidationError(
                f"El dispositivo no está disponible para asignación. Estado actual: {value.get_estado_display()}"
            )

        return value

    def validate(self, data):
        """
        Validaciones a nivel de objeto.
        """
        # Validar que la fecha de devolución sea posterior a la fecha de entrega
        if data.get('fecha_devolucion') and data.get('fecha_entrega'):
            if data['fecha_devolucion'] < data['fecha_entrega']:
                raise serializers.ValidationError({
                    'fecha_devolucion': 'La fecha de devolución debe ser posterior a la fecha de entrega'
                })

        return data


class ReturnSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Return (Devolución de dispositivo).
    """
    # Campos de solo lectura con información anidada
    asignacion_detail = AssignmentSerializer(source='asignacion', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    estado_dispositivo_display = serializers.CharField(source='get_estado_dispositivo_display', read_only=True)

    class Meta:
        model = Return
        fields = [
            'id',
            'asignacion',
            'asignacion_detail',
            'fecha_devolucion',
            'estado_dispositivo',
            'estado_dispositivo_display',
            'observaciones',
            'created_by',
            'created_by_username',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'created_at',
            'created_by',
            'asignacion_detail',
            'created_by_username',
            'estado_dispositivo_display',
        ]

    def validate_asignacion(self, value):
        """
        Validar que la asignación esté activa y no tenga ya una devolución.
        """
        # Verificar que la asignación esté activa
        if value.estado_asignacion != 'ACTIVA':
            raise serializers.ValidationError("Solo se pueden registrar devoluciones de asignaciones activas")

        # Verificar que no tenga ya una devolución
        if hasattr(value, 'return'):
            raise serializers.ValidationError("Esta asignación ya tiene una devolución registrada")

        return value

    def validate(self, data):
        """
        Validaciones a nivel de objeto.
        """
        # Validar que la fecha de devolución no sea anterior a la fecha de entrega
        if data.get('fecha_devolucion') and data.get('asignacion'):
            if data['fecha_devolucion'] < data['asignacion'].fecha_entrega:
                raise serializers.ValidationError({
                    'fecha_devolucion': 'La fecha de devolución no puede ser anterior a la fecha de entrega de la asignación'
                })

        return data
