from rest_framework import serializers
from .models import Request, Assignment, Return
from apps.employees.serializers import EmployeeSerializer
from apps.devices.serializers import DeviceSerializer
from apps.branches.serializers import BranchSerializer


class AssignmentListSerializer(serializers.ModelSerializer):
    """
    Serializer ligero optimizado para listados de asignaciones.
    Evita N+1 queries usando campos directos en lugar de serializadores anidados completos.
    """
    empleado_nombre = serializers.CharField(source='empleado.nombre_completo', read_only=True)
    empleado_sucursal = serializers.CharField(source='empleado.sucursal.nombre', read_only=True)

    dispositivo_tipo = serializers.SerializerMethodField()
    dispositivo_marca = serializers.SerializerMethodField()
    dispositivo_modelo = serializers.SerializerMethodField()
    dispositivo_serial = serializers.SerializerMethodField()

    estado_asignacion_display = serializers.CharField(source='get_estado_asignacion_display', read_only=True)
    estado_carta_display = serializers.CharField(source='get_estado_carta_display', read_only=True)

    # Agregar detalles anidados para compatibilidad con frontend
    empleado_detail = serializers.SerializerMethodField()
    dispositivo_detail = serializers.SerializerMethodField()

    def get_dispositivo_tipo(self, obj):
        """Retorna el tipo de equipo del dispositivo o del snapshot"""
        if obj.dispositivo:
            return obj.dispositivo.get_tipo_equipo_display()

        # Fallback: usar snapshot si existe
        if obj.discount_data and 'dispositivo_snapshot' in obj.discount_data:
            return obj.discount_data['dispositivo_snapshot'].get('tipo_equipo_display', 'N/A')

        return 'N/A'

    def get_dispositivo_marca(self, obj):
        """Retorna la marca del dispositivo o del snapshot"""
        if obj.dispositivo:
            return obj.dispositivo.marca

        # Fallback: usar snapshot si existe
        if obj.discount_data and 'dispositivo_snapshot' in obj.discount_data:
            return obj.discount_data['dispositivo_snapshot'].get('marca', 'N/A')

        return 'N/A'

    def get_dispositivo_modelo(self, obj):
        """Retorna el modelo del dispositivo o del snapshot"""
        if obj.dispositivo:
            return obj.dispositivo.modelo or 'N/A'

        # Fallback: usar snapshot si existe
        if obj.discount_data and 'dispositivo_snapshot' in obj.discount_data:
            return obj.discount_data['dispositivo_snapshot'].get('modelo', 'N/A')

        return 'N/A'

    def get_dispositivo_serial(self, obj):
        """Retorna el serial o IMEI del dispositivo o del snapshot"""
        if obj.dispositivo:
            return obj.dispositivo.numero_serie or obj.dispositivo.imei or 'N/A'

        # Fallback: usar snapshot si existe
        if obj.discount_data and 'dispositivo_snapshot' in obj.discount_data:
            snapshot = obj.discount_data['dispositivo_snapshot']
            return snapshot.get('numero_serie') or snapshot.get('imei') or 'N/A'

        return 'Dispositivo eliminado'

    def get_empleado_detail(self, obj):
        """Retorna información básica del empleado"""
        return {
            'id': obj.empleado.id,
            'nombre_completo': obj.empleado.nombre_completo,
            'rut': obj.empleado.rut,
        }

    def get_dispositivo_detail(self, obj):
        """Retorna información del dispositivo o del snapshot"""
        if obj.dispositivo:
            return {
                'id': obj.dispositivo.id,
                'tipo_equipo': obj.dispositivo.tipo_equipo,
                'marca': obj.dispositivo.marca,
                'modelo': obj.dispositivo.modelo,
                'numero_serie': obj.dispositivo.numero_serie,
                'imei': obj.dispositivo.imei,
            }

        # Fallback: usar snapshot si existe
        if obj.discount_data and 'dispositivo_snapshot' in obj.discount_data:
            snapshot = obj.discount_data['dispositivo_snapshot']
            return {
                'id': snapshot.get('id'),
                'tipo_equipo': snapshot.get('tipo_equipo'),
                'marca': snapshot.get('marca'),
                'modelo': snapshot.get('modelo'),
                'numero_serie': snapshot.get('numero_serie'),
                'imei': snapshot.get('imei'),
            }

        return None

    class Meta:
        model = Assignment
        fields = [
            'id',
            'empleado',
            'empleado_nombre',
            'empleado_sucursal',
            'empleado_detail',
            'dispositivo',
            'dispositivo_tipo',
            'dispositivo_marca',
            'dispositivo_modelo',
            'dispositivo_serial',
            'dispositivo_detail',
            'tipo_entrega',
            'fecha_entrega',
            'estado_asignacion',
            'estado_asignacion_display',
            'estado_carta',
            'estado_carta_display',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'empleado_nombre',
            'empleado_sucursal',
            'empleado_detail',
            'dispositivo_tipo',
            'dispositivo_marca',
            'dispositivo_modelo',
            'dispositivo_serial',
            'dispositivo_detail',
            'estado_asignacion_display',
            'estado_carta_display',
            'created_at',
        ]


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

    def validate(self, data):
        """
        Validaciones a nivel de objeto.
        """
        # VALIDACIÓN: Prevenir edición de solicitudes completadas
        if self.instance and self.instance.estado == 'COMPLETADA':
            allowed_fields = {'justificacion'}
            changed_fields = set(data.keys()) - allowed_fields

            if changed_fields:
                raise serializers.ValidationError(
                    'No se puede modificar una solicitud completada. '
                    'Solo se permite actualizar la justificación.'
                )

        return data


class AssignmentSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Assignment (Asignación de dispositivo).
    """
    # Campos de solo lectura con información anidada
    empleado_detail = EmployeeSerializer(source='empleado', read_only=True)
    dispositivo_detail = DeviceSerializer(source='dispositivo', read_only=True)
    solicitud_detail = RequestSerializer(source='solicitud', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    firmado_por_username = serializers.CharField(source='firmado_por.username', read_only=True)
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
            'fecha_firma',
            'firmado_por',
            'firmado_por_username',
            'estado_asignacion',
            'estado_asignacion_display',
            'observaciones',
            'discount_data',
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
            'fecha_firma',
            'firmado_por',
            'firmado_por_username',
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
        # Si el valor es None (dispositivo eliminado), permitir solo en actualizaciones
        if value is None:
            if not self.instance:
                raise serializers.ValidationError("Debe especificar un dispositivo para crear una asignación")
            return value

        # Si estamos actualizando, permitir el mismo dispositivo
        if self.instance and self.instance.dispositivo == value:
            return value

        # Prevenir asignación a dispositivos en estados finales
        from apps.devices.models import Device

        if value.estado in Device.FINAL_STATES:
            raise serializers.ValidationError(
                f"No se puede asignar un dispositivo en estado {value.get_estado_display()}. "
                f"Este dispositivo está en un estado final."
            )

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

        # Validaciones para actualizaciones de asignaciones
        if self.instance:  # Solo en actualización
            errors = {}

            # VALIDACIÓN 1: Prevenir cambio de empleado en asignación activa
            if 'empleado' in data and data['empleado'] != self.instance.empleado:
                if self.instance.estado_asignacion == 'ACTIVA':
                    errors['empleado'] = (
                        'No se puede cambiar el empleado de una asignación activa. '
                        'Debe registrar la devolución primero.'
                    )

            # VALIDACIÓN 2: Prevenir cambio de dispositivo en asignación activa
            if 'dispositivo' in data and data['dispositivo'] != self.instance.dispositivo:
                if self.instance.estado_asignacion == 'ACTIVA':
                    errors['dispositivo'] = (
                        'No se puede cambiar el dispositivo de una asignación activa. '
                        'Debe registrar la devolución primero.'
                    )

            # VALIDACIÓN 3: Prevenir cambio manual de estado_asignacion
            old_status = self.instance.estado_asignacion
            new_status = data.get('estado_asignacion')

            if new_status and new_status != old_status:
                if old_status == 'ACTIVA' and new_status == 'FINALIZADA':
                    if not hasattr(self.instance, 'return'):
                        errors['estado_asignacion'] = (
                            'No se puede finalizar una asignación sin registrar la devolución. '
                            'Use el endpoint de devoluciones.'
                        )

            # VALIDACIÓN 4: Prevenir edición de asignaciones finalizadas
            if self.instance.estado_asignacion == 'FINALIZADA':
                allowed_fields = {'observaciones'}
                changed_fields = set(data.keys()) - allowed_fields

                if changed_fields:
                    errors['non_field_errors'] = (
                        'No se puede modificar una asignación finalizada. '
                        'Solo se permite actualizar observaciones.'
                    )

            if errors:
                raise serializers.ValidationError(errors)

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
        # VALIDACIÓN: Las devoluciones son inmutables
        if self.instance:  # Si existe, es una actualización
            raise serializers.ValidationError(
                'No se pueden modificar devoluciones ya registradas. '
                'Las devoluciones son registros inmutables de auditoría.'
            )

        # Validar que la fecha de devolución no sea anterior a la fecha de entrega
        if data.get('fecha_devolucion') and data.get('asignacion'):
            if data['fecha_devolucion'] < data['asignacion'].fecha_entrega:
                raise serializers.ValidationError({
                    'fecha_devolucion': 'La fecha de devolución no puede ser anterior a la fecha de entrega de la asignación'
                })

        return data


class ResponsibilityLetterSerializer(serializers.Serializer):
    """
    Serializer para datos de carta de responsabilidad (LAPTOP o TELÉFONO).
    """
    # Selección de empresa
    company_key = serializers.ChoiceField(
        choices=['pompeyo_carrasco', 'pompeyo_automoviles'],
        default='pompeyo_carrasco'
    )

    # Campos comunes
    jefatura_nombre = serializers.CharField(max_length=200, required=False, allow_blank=True)

    # Campos para LAPTOP
    procesador = serializers.CharField(max_length=100, required=False, allow_blank=True)
    disco_duro = serializers.CharField(max_length=100, required=False, allow_blank=True)
    memoria_ram = serializers.CharField(max_length=100, required=False, allow_blank=True)
    tiene_dvd = serializers.BooleanField(default=False)
    tiene_cargador = serializers.BooleanField(default=True)
    tiene_bateria = serializers.BooleanField(default=True)
    tiene_mouse = serializers.BooleanField(default=False)
    tiene_candado = serializers.BooleanField(default=False)

    # Campos para TELÉFONO
    plan_telefono = serializers.CharField(max_length=200, required=False, allow_blank=True)
    minutos_disponibles = serializers.CharField(max_length=100, required=False, allow_blank=True)
    tiene_audifonos = serializers.BooleanField(default=False)


class DiscountLetterSerializer(serializers.Serializer):
    """
    Serializer para datos de carta de descuento.
    """
    # Selección de empresa
    company_key = serializers.ChoiceField(
        choices=['pompeyo_carrasco', 'pompeyo_automoviles'],
        default='pompeyo_carrasco'
    )

    monto_total = serializers.DecimalField(max_digits=10, decimal_places=0, min_value=1)
    numero_cuotas = serializers.IntegerField(min_value=1, max_value=24)
    mes_primera_cuota = serializers.CharField(max_length=20)

    def validate_mes_primera_cuota(self, value):
        meses_validos = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                         'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
        if value not in meses_validos:
            raise serializers.ValidationError('Mes inválido')
        return value
