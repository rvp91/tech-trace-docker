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

    # Campos calculados dinámicamente
    edad_dispositivo_display = serializers.SerializerMethodField()
    valor_depreciado_calculado = serializers.SerializerMethodField()
    puede_tener_edad = serializers.SerializerMethodField()
    puede_tener_valor = serializers.SerializerMethodField()

    class Meta:
        model = Device
        fields = [
            'id',
            'tipo_equipo',
            'tipo_equipo_display',
            'marca',
            'modelo',
            'numero_serie',
            'imei',
            'numero_telefono',
            'numero_factura',
            'estado',
            'estado_display',
            'sucursal',
            'sucursal_detail',
            'fecha_ingreso',
            'edad_dispositivo',
            'edad_dispositivo_display',
            'valor_inicial',
            'valor_depreciado',
            'valor_depreciado_calculado',
            'es_valor_manual',
            'puede_tener_edad',
            'puede_tener_valor',
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
            'edad_dispositivo_display',
            'valor_depreciado_calculado',
            'puede_tener_edad',
            'puede_tener_valor',
        ]

    def validate_numero_serie(self, value):
        """Validar que el número de serie sea único si se proporciona"""
        if not value:  # Permitir null/blank
            return value

        if self.instance:
            # Si estamos actualizando, excluir el registro actual
            if Device.objects.exclude(pk=self.instance.pk).filter(numero_serie=value).exists():
                raise serializers.ValidationError("Ya existe un dispositivo con este número de serie")
        else:
            # Si estamos creando, verificar que no exista
            if Device.objects.filter(numero_serie=value).exists():
                raise serializers.ValidationError("Ya existe un dispositivo con este número de serie")

        return value

    def validate_imei(self, value):
        """Validar que el IMEI sea único si se proporciona"""
        if not value:  # Permitir null/blank
            return value

        if self.instance:
            # Si estamos actualizando, excluir el registro actual
            if Device.objects.exclude(pk=self.instance.pk).filter(imei=value).exists():
                raise serializers.ValidationError("Ya existe un dispositivo con este IMEI")
        else:
            # Si estamos creando, verificar que no exista
            if Device.objects.filter(imei=value).exists():
                raise serializers.ValidationError("Ya existe un dispositivo con este IMEI")

        return value

    def validate(self, data):
        """
        Validaciones condicionales según tipo de dispositivo.

        Matriz de validaciones:
        | Tipo     | numero_serie | imei     | modelo      | numero_telefono | edad | valor |
        |----------|--------------|----------|-------------|-----------------|------|-------|
        | LAPTOP   | Obligatorio  | -        | Obligatorio | -               | Sí   | Sí    |
        | TELEFONO | Obligatorio  | Opcional | Obligatorio | Opcional        | Sí   | Sí    |
        | TABLET   | Obligatorio  | Opcional | Obligatorio | -               | Sí   | Sí    |
        | TV       | Obligatorio  | -        | Opcional    | -               | No   | No    |
        | SIM      | -            | -        | Opcional    | Obligatorio     | No   | No    |
        | ACCESORIO| -            | -        | Opcional    | -               | No   | No    |
        """
        # Obtener tipo_equipo (puede venir en data o en instance al editar)
        tipo_equipo = data.get('tipo_equipo')
        if not tipo_equipo and self.instance:
            tipo_equipo = self.instance.tipo_equipo

        # Si no hay tipo_equipo, no podemos validar (pero debería ser requerido)
        if not tipo_equipo:
            return data

        errors = {}

        # VALIDACIÓN 1: numero_serie obligatorio para LAPTOP, TELEFONO, TABLET, TV
        if tipo_equipo in ['LAPTOP', 'TELEFONO', 'TABLET', 'TV']:
            if not data.get('numero_serie'):
                errors['numero_serie'] = f'El número de serie es obligatorio para {tipo_equipo}'

        # VALIDACIÓN 2: modelo obligatorio para LAPTOP, TELEFONO, TABLET
        if tipo_equipo in ['LAPTOP', 'TELEFONO', 'TABLET']:
            if not data.get('modelo'):
                errors['modelo'] = f'El modelo es obligatorio para {tipo_equipo}'

        # VALIDACIÓN 3: numero_telefono obligatorio solo para SIM
        if tipo_equipo == 'SIM':
            if not data.get('numero_telefono'):
                errors['numero_telefono'] = 'El número de teléfono es obligatorio para SIM cards'

        if errors:
            raise serializers.ValidationError(errors)

        return data

    def get_edad_dispositivo_display(self, obj):
        """Retorna la edad calculada del dispositivo"""
        if not obj.debe_calcular_edad():
            return None
        return obj.edad_calculada

    def get_valor_depreciado_calculado(self, obj):
        """Retorna el valor depreciado (manual o calculado)"""
        if not obj.debe_calcular_valor():
            return None
        return obj.get_valor_depreciado()

    def get_puede_tener_edad(self, obj):
        """Indica si el tipo de dispositivo puede tener edad"""
        return obj.debe_calcular_edad()

    def get_puede_tener_valor(self, obj):
        """Indica si el tipo de dispositivo puede tener valor"""
        return obj.debe_calcular_valor()

    def create(self, validated_data):
        """Crear dispositivo y calcular edad si aplica"""
        device = super().create(validated_data)

        # Actualizar edad si aplica
        if device.debe_calcular_edad():
            edad = device.edad_calculada
            device.edad_dispositivo = 5 if edad == "5+" else edad
            device.save(update_fields=['edad_dispositivo'])

        # Si tiene valor_inicial pero no valor_depreciado, calcularlo
        if device.debe_calcular_valor() and device.valor_inicial and not device.es_valor_manual:
            device.valor_depreciado = device.calcular_depreciacion()
            device.save(update_fields=['valor_depreciado'])

        return device

    def update(self, instance, validated_data):
        """Actualizar dispositivo y recalcular edad/valor si aplica"""
        # Si se modificó valor_depreciado manualmente, marcar es_valor_manual
        if 'valor_depreciado' in validated_data and validated_data['valor_depreciado'] != instance.valor_depreciado:
            validated_data['es_valor_manual'] = True

        device = super().update(instance, validated_data)

        # Actualizar edad si aplica
        if device.debe_calcular_edad():
            edad = device.edad_calculada
            device.edad_dispositivo = 5 if edad == "5+" else edad
            device.save(update_fields=['edad_dispositivo'])

        # Recalcular valor si no es manual
        if device.debe_calcular_valor() and device.valor_inicial and not device.es_valor_manual:
            device.valor_depreciado = device.calcular_depreciacion()
            device.save(update_fields=['valor_depreciado'])

        return device
