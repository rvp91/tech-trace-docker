from rest_framework import serializers
from .models import Device
from apps.branches.serializers import BranchSerializer, BranchListSerializer


class DeviceListSerializer(serializers.ModelSerializer):
    """
    Serializer ligero optimizado para listados de dispositivos.
    Evita N+1 queries usando BranchListSerializer en lugar del completo.
    """
    sucursal_detail = BranchListSerializer(source='sucursal', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    tipo_equipo_display = serializers.CharField(source='get_tipo_equipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    asignacion_activa = serializers.SerializerMethodField()

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
            'estado',
            'estado_display',
            'sucursal',
            'sucursal_detail',
            'fecha_ingreso',
            'asignacion_activa',
            'activo',
            'fecha_inactivacion',
            'created_at',
            'created_by_username',
        ]
        read_only_fields = [
            'id',
            'created_at',
            'sucursal_detail',
            'created_by_username',
            'tipo_equipo_display',
            'estado_display',
            'asignacion_activa',
            'activo',
            'fecha_inactivacion',
        ]

    def get_asignacion_activa(self, obj):
        """Retorna True si el dispositivo tiene asignación activa"""
        return obj.has_active_assignment()


class DeviceSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Device (Dispositivo).
    Los campos numero_serie e imei solo pueden ser modificados por usuarios ADMIN.
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
    asignacion_activa = serializers.SerializerMethodField()

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
            'asignacion_activa',
            'activo',
            'fecha_inactivacion',
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
            'estado',  # Solo lectura: cambios de estado via endpoints específicos
            'sucursal_detail',
            'created_by_username',
            'tipo_equipo_display',
            'estado_display',
            'edad_dispositivo_display',
            'valor_depreciado_calculado',
            'puede_tener_edad',
            'puede_tener_valor',
            'asignacion_activa',
            'activo',
            'fecha_inactivacion',
        ]

    def __init__(self, *args, **kwargs):
        """
        Inicializar serializer y hacer numero_serie e imei read-only para OPERADORES.
        Solo los usuarios ADMIN pueden modificar estos campos.
        """
        super().__init__(*args, **kwargs)

        # Obtener el usuario del contexto (si existe)
        request = self.context.get('request')

        # Si el usuario NO es ADMIN, hacer numero_serie e imei read-only
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            if request.user.role != 'ADMIN':
                # Para OPERADORES, estos campos son solo lectura
                self.fields['numero_serie'].read_only = True
                self.fields['imei'].read_only = True

    def validate_modelo(self, value):
        """Convertir cadena vacía a None para campos opcionales"""
        if value == "" or value is None:
            return None
        return value

    def validate_numero_serie(self, value):
        """Validar que el número de serie sea único si se proporciona"""
        # Convertir cadena vacía a None para evitar conflictos de unicidad
        if value == "" or value is None:
            return None

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
        # Convertir cadena vacía a None para evitar conflictos de unicidad
        if value == "" or value is None:
            return None

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
        | DESKTOP  | Obligatorio  | -        | Obligatorio | -               | Sí   | Sí    |
        | TELEFONO | Obligatorio  | Opcional | Obligatorio | Opcional        | Sí   | Sí    |
        | TABLET   | Obligatorio  | Opcional | Obligatorio | -               | Sí   | Sí    |
        | TV       | Obligatorio  | -        | Opcional    | -               | No   | No    |
        | SIM      | -            | -        | Opcional    | Obligatorio     | No   | No    |
        | ACCESORIO| -            | -        | Opcional    | -               | No   | No    |
        """
        errors = {}

        # VALIDACIÓN DE PERMISOS: Solo ADMIN puede modificar numero_serie e imei
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            if request.user.role != 'ADMIN' and self.instance:  # Solo en actualizaciones
                # Verificar si se intentó modificar numero_serie
                if 'numero_serie' in data and data['numero_serie'] != self.instance.numero_serie:
                    errors['numero_serie'] = 'Solo los administradores pueden modificar el número de serie'

                # Verificar si se intentó modificar imei
                if 'imei' in data and data['imei'] != self.instance.imei:
                    errors['imei'] = 'Solo los administradores pueden modificar el IMEI'

        # Obtener tipo_equipo (puede venir en data o en instance al editar)
        tipo_equipo = data.get('tipo_equipo')
        if not tipo_equipo and self.instance:
            tipo_equipo = self.instance.tipo_equipo

        # Si no hay tipo_equipo, no podemos validar (pero debería ser requerido)
        if not tipo_equipo:
            if errors:
                raise serializers.ValidationError(errors)
            return data

        # VALIDACIÓN 1: numero_serie obligatorio para LAPTOP, DESKTOP, TELEFONO, TABLET, TV
        if tipo_equipo in ['LAPTOP', 'DESKTOP', 'TELEFONO', 'TABLET', 'TV']:
            # En PATCH, si no viene en data, verificar que exista en instance
            numero_serie = data.get('numero_serie')
            if numero_serie is None and self.instance:
                numero_serie = self.instance.numero_serie

            # Solo validar si estamos creando o si se está intentando modificar el numero_serie
            if not self.instance or 'numero_serie' in data:
                if not numero_serie:
                    errors['numero_serie'] = f'El número de serie es obligatorio para {tipo_equipo}'

        # VALIDACIÓN 2: modelo obligatorio para LAPTOP, DESKTOP, TELEFONO, TABLET
        if tipo_equipo in ['LAPTOP', 'DESKTOP', 'TELEFONO', 'TABLET']:
            # En PATCH, si no viene en data, verificar que exista en instance
            modelo = data.get('modelo')
            if modelo is None and self.instance:
                modelo = self.instance.modelo

            # Solo validar si estamos creando o si se está intentando modificar el modelo
            if not self.instance or 'modelo' in data:
                if not modelo:
                    errors['modelo'] = f'El modelo es obligatorio para {tipo_equipo}'

        # VALIDACIÓN 3: numero_telefono obligatorio solo para SIM
        if tipo_equipo == 'SIM':
            # En PATCH, si no viene en data, verificar que exista en instance
            numero_telefono = data.get('numero_telefono')
            if numero_telefono is None and self.instance:
                numero_telefono = self.instance.numero_telefono

            # Solo validar si estamos creando o si se está intentando modificar el numero_telefono
            if not self.instance or 'numero_telefono' in data:
                if not numero_telefono:
                    errors['numero_telefono'] = 'El número de teléfono es obligatorio para SIM cards'

        # VALIDACIÓN: Prevenir cambio de estados finales
        if self.instance:  # Solo en actualización
            old_status = self.instance.estado
            new_status = data.get('estado')

            if old_status in Device.FINAL_STATES and new_status and new_status != old_status:
                errors['estado'] = (
                    f'No se puede cambiar el estado de un dispositivo en {old_status}. '
                    f'Este es un estado final y no puede ser modificado.'
                )
        else:  # Creación de nuevo dispositivo
            new_status = data.get('estado')
            if new_status in Device.FINAL_STATES:
                errors['estado'] = (
                    f'No se puede crear un dispositivo directamente en estado {new_status}. '
                    f'Los estados BAJA y ROBO solo se pueden alcanzar mediante transición.'
                )

        # NOTA: Las validaciones de cambio de estado se eliminaron porque el campo 'estado'
        # ahora es read-only. Los cambios de estado se realizan exclusivamente a través de
        # endpoints específicos en DeviceViewSet que incluyen sus propias validaciones.

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

    def get_asignacion_activa(self, obj):
        """Retorna True si el dispositivo tiene asignación activa"""
        return obj.has_active_assignment()

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
