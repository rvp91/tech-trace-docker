from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q
from .models import Device
from .serializers import DeviceSerializer, DeviceListSerializer


class DeviceViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar los dispositivos.
    Proporciona operaciones CRUD completas con filtros y búsqueda.
    OPTIMIZADO: Usa DeviceListSerializer para listados y DeviceSerializer para detalle.
    """
    serializer_class = DeviceSerializer  # Por defecto (detail, create, update)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo_equipo', 'estado', 'sucursal', 'marca']
    search_fields = ['numero_serie', 'imei', 'marca', 'modelo', 'numero_telefono', 'numero_factura']
    ordering_fields = ['marca', 'modelo', 'fecha_ingreso', 'created_at']
    ordering = ['-fecha_ingreso']

    # Desactivar método DELETE - los dispositivos se marcan como inactivos, no se eliminan
    http_method_names = ['get', 'post', 'put', 'patch', 'head', 'options']

    def get_queryset(self):
        """
        Retorna queryset filtrando dispositivos inactivos por defecto.
        Parámetro ?incluir_inactivos=true para incluirlos.
        """
        queryset = Device.objects.select_related('sucursal', 'created_by')

        incluir_inactivos = self.request.query_params.get('incluir_inactivos', 'false').lower()

        if incluir_inactivos not in ['true', '1', 'yes']:
            queryset = queryset.filter(activo=True)

        return queryset

    def destroy(self, request, *args, **kwargs):
        """Previene eliminación física de dispositivos"""
        from rest_framework import status as http_status

        return Response(
            {
                'error': 'No se permite eliminar dispositivos del sistema.',
                'detail': 'Los dispositivos deben marcarse como BAJA o ROBO para excluirlos del inventario activo.',
                'hint': 'Use los endpoints correspondientes: /mark-as-retired/ para dar de baja, /mark-as-stolen/ para robo/pérdida.'
            },
            status=http_status.HTTP_405_METHOD_NOT_ALLOWED
        )

    def get_serializer_class(self):
        """
        Usa serializer ligero para listados, completo para detalle.
        Esto evita N+1 queries en listados masivos.
        """
        if self.action == 'list':
            return DeviceListSerializer
        return DeviceSerializer

    def perform_create(self, serializer):
        """
        Asignar automáticamente el usuario actual como created_by al crear un dispositivo.
        """
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], url_path='send-to-maintenance')
    def send_to_maintenance(self, request, pk=None):
        """
        Envía un dispositivo a mantenimiento.

        POST /api/devices/{id}/send-to-maintenance/
        Body: { motivo: string, observaciones?: string }

        Transiciones permitidas:
        - DISPONIBLE → MANTENIMIENTO
        - ASIGNADO → MANTENIMIENTO (mantenimiento urgente, asignación sigue activa)

        Registra el cambio en auditoría via change_status().
        """
        from rest_framework import status
        from rest_framework.response import Response
        from rest_framework.exceptions import ValidationError

        device = self.get_object()
        motivo = request.data.get('motivo', '').strip()
        observaciones = request.data.get('observaciones', '').strip()

        # Validaciones
        if not motivo:
            return Response(
                {'error': 'El motivo es obligatorio'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar que no esté en estado final
        if device.estado in Device.FINAL_STATES:
            return Response(
                {'error': f'No se puede enviar a mantenimiento un dispositivo en estado {device.get_estado_display()}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar que no esté ya en mantenimiento
        if device.estado == 'MANTENIMIENTO':
            return Response(
                {'error': 'El dispositivo ya está en mantenimiento.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Cambiar estado con auditoría
        try:
            device.change_status('MANTENIMIENTO', user=request.user)

            # Añadir observación si se proporcionó
            # TODO: Si el modelo Device tuviera un campo para observaciones,
            # se agregaría aquí. Por ahora solo queda en auditoría.

            serializer = self.get_serializer(device)
            return Response({
                'message': f'Dispositivo enviado a mantenimiento. Motivo: {motivo}',
                'device': serializer.data
            }, status=status.HTTP_200_OK)

        except ValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'], url_path='mark-available')
    def mark_available(self, request, pk=None):
        """
        Marca un dispositivo como disponible (salida de mantenimiento).

        POST /api/devices/{id}/mark-available/
        Body: { observaciones?: string }

        Transiciones permitidas:
        - MANTENIMIENTO → DISPONIBLE

        Validaciones:
        - No permitir si tiene asignación activa
        - Solo desde MANTENIMIENTO

        Registra el cambio en auditoría via change_status().
        """
        from rest_framework import status
        from rest_framework.response import Response
        from rest_framework.exceptions import ValidationError

        device = self.get_object()
        observaciones = request.data.get('observaciones', '').strip()

        # Validar que esté en mantenimiento
        if device.estado != 'MANTENIMIENTO':
            return Response(
                {'error': f'Solo se pueden marcar como disponibles dispositivos en mantenimiento. Estado actual: {device.get_estado_display()}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar que no tenga asignación activa
        if device.has_active_assignment():
            return Response(
                {'error': 'No se puede marcar como disponible un dispositivo con asignación activa. '
                        'Si el dispositivo está en mantenimiento urgente, use "Retornar de Mantenimiento". '
                        'Si quiere finalizar la asignación, registre la devolución primero.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Cambiar estado con auditoría
        try:
            device.change_status('DISPONIBLE', user=request.user)

            serializer = self.get_serializer(device)
            return Response({
                'message': 'Dispositivo marcado como disponible.',
                'device': serializer.data
            }, status=status.HTTP_200_OK)

        except ValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'], url_path='return-from-maintenance')
    def return_from_maintenance(self, request, pk=None):
        """
        Retorna un dispositivo de mantenimiento urgente al estado ASIGNADO.
        Solo válido cuando el dispositivo tiene una asignación activa.

        POST /api/devices/{id}/return-from-maintenance/
        Body: { observaciones?: string }

        Transiciones permitidas:
        - MANTENIMIENTO → ASIGNADO (solo con asignación activa)

        Este endpoint es el complemento de send-to-maintenance para el flujo
        de mantenimiento urgente, donde el dispositivo mantiene su asignación activa.

        Registra el cambio en auditoría via change_status().
        """
        from rest_framework import status
        from rest_framework.response import Response
        from rest_framework.exceptions import ValidationError

        device = self.get_object()
        observaciones = request.data.get('observaciones', '').strip()

        # VALIDACIÓN 1: Solo desde MANTENIMIENTO
        if device.estado != 'MANTENIMIENTO':
            return Response(
                {'error': 'Solo se pueden retornar dispositivos que están en MANTENIMIENTO'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # VALIDACIÓN 2: No desde estados finales (ya cubierto por validación 1, pero por consistencia)
        if device.estado in Device.FINAL_STATES:
            return Response(
                {'error': f'No se puede cambiar el estado de un dispositivo en {device.estado}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # VALIDACIÓN 3: DEBE tener asignación activa
        if not device.has_active_assignment():
            return Response(
                {'error': 'Este dispositivo no tiene asignación activa. '
                        'Use "Marcar como Disponible" para dispositivos sin asignación.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Cambiar estado a ASIGNADO con auditoría
        try:
            device.change_status('ASIGNADO', user=request.user)

            serializer = self.get_serializer(device)
            return Response({
                'message': 'Dispositivo retornado de mantenimiento. Ahora está ASIGNADO nuevamente.',
                'device': serializer.data
            }, status=status.HTTP_200_OK)

        except ValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'], url_path='mark-as-retired')
    def mark_as_retired(self, request, pk=None):
        """
        Marca un dispositivo como dado de baja (fin de vida útil).

        POST /api/devices/{id}/mark-as-retired/
        Body: { motivo: string, observaciones?: string }

        Transiciones permitidas:
        - DISPONIBLE → BAJA
        - ASIGNADO → BAJA (finaliza asignación automáticamente)
        - MANTENIMIENTO → BAJA (finaliza asignación si existe)

        Validaciones:
        - No permitir si ya está en BAJA o ROBO

        IMPORTANTE:
        - BAJA es un estado final, NO es reversible.
        - Si el dispositivo tiene asignación activa, se finalizará automáticamente.

        Registra el cambio en auditoría via change_status().
        """
        from rest_framework import status
        from rest_framework.response import Response
        from rest_framework.exceptions import ValidationError

        device = self.get_object()
        motivo = request.data.get('motivo', '').strip()
        observaciones = request.data.get('observaciones', '').strip()

        # Validaciones
        if not motivo:
            return Response(
                {'error': 'El motivo es obligatorio para dar de baja un dispositivo'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar que no esté ya en estado final
        if device.estado in Device.FINAL_STATES:
            return Response(
                {'error': f'El dispositivo ya está en un estado final: {device.get_estado_display()}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar que esté en DISPONIBLE, ASIGNADO o MANTENIMIENTO
        if device.estado not in ['DISPONIBLE', 'ASIGNADO', 'MANTENIMIENTO']:
            return Response(
                {'error': f'Solo se pueden dar de baja dispositivos en estado DISPONIBLE, ASIGNADO o MANTENIMIENTO. Estado actual: {device.get_estado_display()}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Si tiene asignación activa, finalizarla automáticamente
        # (similar al comportamiento de ROBO/carta de descuento)
        if device.has_active_assignment():
            active_assignment = device.assignment_set.filter(estado_asignacion='ACTIVA').first()
            if active_assignment:
                active_assignment.estado_asignacion = 'FINALIZADA'

                # Agregar observación automática sobre la baja
                from django.utils import timezone
                fecha_baja = timezone.now().strftime('%Y-%m-%d')
                obs_baja = f"[{fecha_baja}] Dispositivo dado de baja. Motivo: {motivo}"

                if active_assignment.observaciones:
                    active_assignment.observaciones += f"\n{obs_baja}"
                else:
                    active_assignment.observaciones = obs_baja

                active_assignment.save(update_fields=['estado_asignacion', 'observaciones', 'updated_at'])

        # Cambiar estado con auditoría
        try:
            device.change_status('BAJA', user=request.user)

            serializer = self.get_serializer(device)
            return Response({
                'message': f'Dispositivo dado de baja. Motivo: {motivo}. NOTA: Este es un estado final y no puede ser revertido.',
                'device': serializer.data
            }, status=status.HTTP_200_OK)

        except ValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'], url_path='inventory-stats')
    def inventory_stats(self, request):
        """
        Endpoint optimizado para estadísticas de inventario.

        URL: /api/devices/inventory-stats/

        Retorna estadísticas agregadas calculadas en una sola query.
        Esto reemplaza el cálculo de 28 filtros en el frontend.
        Solo incluye dispositivos activos.
        """
        stats = Device.objects.filter(activo=True).aggregate(
            # Totales por tipo
            total_laptops=Count('id', filter=Q(tipo_equipo='LAPTOP')),
            total_desktops=Count('id', filter=Q(tipo_equipo='DESKTOP')),
            total_telefonos=Count('id', filter=Q(tipo_equipo='TELEFONO')),
            total_tablets=Count('id', filter=Q(tipo_equipo='TABLET')),
            total_tvs=Count('id', filter=Q(tipo_equipo='TV')),
            total_sims=Count('id', filter=Q(tipo_equipo='SIM')),

            # Laptops por estado
            laptops_asignados=Count('id', filter=Q(tipo_equipo='LAPTOP', estado='ASIGNADO')),
            laptops_disponibles=Count('id', filter=Q(tipo_equipo='LAPTOP', estado='DISPONIBLE')),
            laptops_mantenimiento=Count('id', filter=Q(tipo_equipo='LAPTOP', estado='MANTENIMIENTO')),

            # Desktops por estado
            desktops_asignados=Count('id', filter=Q(tipo_equipo='DESKTOP', estado='ASIGNADO')),
            desktops_disponibles=Count('id', filter=Q(tipo_equipo='DESKTOP', estado='DISPONIBLE')),
            desktops_mantenimiento=Count('id', filter=Q(tipo_equipo='DESKTOP', estado='MANTENIMIENTO')),

            # Teléfonos por estado
            telefonos_asignados=Count('id', filter=Q(tipo_equipo='TELEFONO', estado='ASIGNADO')),
            telefonos_disponibles=Count('id', filter=Q(tipo_equipo='TELEFONO', estado='DISPONIBLE')),
            telefonos_mantenimiento=Count('id', filter=Q(tipo_equipo='TELEFONO', estado='MANTENIMIENTO')),

            # Tablets por estado
            tablets_asignados=Count('id', filter=Q(tipo_equipo='TABLET', estado='ASIGNADO')),
            tablets_disponibles=Count('id', filter=Q(tipo_equipo='TABLET', estado='DISPONIBLE')),
            tablets_mantenimiento=Count('id', filter=Q(tipo_equipo='TABLET', estado='MANTENIMIENTO')),

            # TVs por estado
            tvs_asignados=Count('id', filter=Q(tipo_equipo='TV', estado='ASIGNADO')),
            tvs_disponibles=Count('id', filter=Q(tipo_equipo='TV', estado='DISPONIBLE')),
            tvs_mantenimiento=Count('id', filter=Q(tipo_equipo='TV', estado='MANTENIMIENTO')),

            # SIMs por estado
            sims_asignados=Count('id', filter=Q(tipo_equipo='SIM', estado='ASIGNADO')),
            sims_disponibles=Count('id', filter=Q(tipo_equipo='SIM', estado='DISPONIBLE')),
            sims_mantenimiento=Count('id', filter=Q(tipo_equipo='SIM', estado='MANTENIMIENTO')),
        )

        # Formatear respuesta de forma estructurada
        return Response({
            'laptops': {
                'total': stats['total_laptops'],
                'asignados': stats['laptops_asignados'],
                'disponibles': stats['laptops_disponibles'],
                'mantenimiento': stats['laptops_mantenimiento'],
            },
            'desktops': {
                'total': stats['total_desktops'],
                'asignados': stats['desktops_asignados'],
                'disponibles': stats['desktops_disponibles'],
                'mantenimiento': stats['desktops_mantenimiento'],
            },
            'telefonos': {
                'total': stats['total_telefonos'],
                'asignados': stats['telefonos_asignados'],
                'disponibles': stats['telefonos_disponibles'],
                'mantenimiento': stats['telefonos_mantenimiento'],
            },
            'tablets': {
                'total': stats['total_tablets'],
                'asignados': stats['tablets_asignados'],
                'disponibles': stats['tablets_disponibles'],
                'mantenimiento': stats['tablets_mantenimiento'],
            },
            'tvs': {
                'total': stats['total_tvs'],
                'asignados': stats['tvs_asignados'],
                'disponibles': stats['tvs_disponibles'],
                'mantenimiento': stats['tvs_mantenimiento'],
            },
            'simCards': {
                'total': stats['total_sims'],
                'asignados': stats['sims_asignados'],
                'disponibles': stats['sims_disponibles'],
                'mantenimiento': stats['sims_mantenimiento'],
            },
        })

    @action(detail=True, methods=['get'], url_path='history')
    def history(self, request, pk=None):
        """
        Endpoint personalizado para obtener el historial de asignaciones de un dispositivo.

        URL: /api/devices/{id}/history/

        Retorna todas las asignaciones (activas e históricas) del dispositivo,
        ordenadas de más reciente a más antigua.
        """
        from apps.assignments.serializers import AssignmentSerializer

        device = self.get_object()
        assignments = device.assignment_set.select_related(
            'empleado',
            'empleado__sucursal',
            'solicitud',
            'created_by'
        ).prefetch_related('return').order_by('-fecha_entrega')

        serializer = AssignmentSerializer(assignments, many=True)

        return Response({
            'device': {
                'id': device.id,
                'tipo_equipo': device.tipo_equipo,
                'marca': device.marca,
                'modelo': device.modelo,
                'numero_serie': device.numero_serie,
                'imei': device.imei,
                'estado': device.estado,
            },
            'total_assignments': assignments.count(),
            'active_assignments': assignments.filter(estado_asignacion='ACTIVA').count(),
            'assignments': serializer.data
        })

    @action(detail=False, methods=['get'], url_path='retired-devices-report')
    def retired_devices_report(self, request):
        """
        Endpoint especializado para reportes de dispositivos dados de baja.

        GET /api/devices/retired-devices-report/

        Query params:
          - fecha_inicio: YYYY-MM-DD (filtro opcional por fecha de inactivación)
          - fecha_fin: YYYY-MM-DD (filtro opcional)
          - sucursal: ID de la sucursal del dispositivo
          - tipo_dispositivo: LAPTOP, TELEFONO, DESKTOP, TABLET, TV, SIM, ACCESORIO
          - page: número de página (default 1)
          - page_size: tamaño de página (default 20, max 1000 para exportación)

        Returns:
          - Lista paginada de dispositivos dados de baja
          - Solo dispositivos con estado='BAJA' y activo=False
          - Ordenados por fecha de inactivación (más recientes primero)
        """
        # Filtrar dispositivos dados de baja
        queryset = Device.objects.filter(
            estado='BAJA',
            activo=False
        ).select_related(
            'sucursal',
            'created_by'
        ).order_by('-fecha_inactivacion')

        # Aplicar filtros opcionales
        fecha_inicio = request.query_params.get('fecha_inicio')
        fecha_fin = request.query_params.get('fecha_fin')
        sucursal_id = request.query_params.get('sucursal')
        tipo_dispositivo = request.query_params.get('tipo_dispositivo')

        if fecha_inicio:
            from datetime import datetime
            fecha_inicio_dt = datetime.fromisoformat(fecha_inicio)
            queryset = queryset.filter(fecha_inactivacion__gte=fecha_inicio_dt)

        if fecha_fin:
            from datetime import datetime, timedelta
            fecha_fin_dt = datetime.fromisoformat(fecha_fin)
            fecha_fin_dt = fecha_fin_dt + timedelta(days=1)
            queryset = queryset.filter(fecha_inactivacion__lt=fecha_fin_dt)

        if sucursal_id:
            queryset = queryset.filter(sucursal_id=sucursal_id)

        if tipo_dispositivo:
            queryset = queryset.filter(tipo_equipo=tipo_dispositivo)

        # Paginación
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class StatsViewSet(viewsets.ViewSet):
    """
    ViewSet para obtener estadísticas generales del sistema.

    Este ViewSet no tiene modelo asociado, solo proporciona endpoints
    personalizados para consultar estadísticas agregadas.
    """

    @action(detail=False, methods=['get'], url_path='dashboard')
    def dashboard(self, request):
        """
        Endpoint para obtener estadísticas generales del dashboard.

        URL: /api/stats/dashboard/

        Retorna:
        - Total de dispositivos por estado
        - Total de dispositivos por tipo
        - Total de empleados activos
        - Últimas 5 asignaciones
        - Asignaciones activas
        """
        from apps.employees.models import Employee
        from apps.assignments.models import Assignment
        from apps.assignments.serializers import AssignmentSerializer

        # 1. Dispositivos por estado (solo activos)
        devices_by_status = Device.objects.filter(activo=True).values('estado').annotate(
            total=Count('id')
        ).order_by('estado')

        devices_by_status_dict = {item['estado']: item['total'] for item in devices_by_status}

        # 2. Dispositivos por tipo (solo activos)
        devices_by_type = Device.objects.filter(activo=True).values('tipo_equipo').annotate(
            total=Count('id')
        ).order_by('tipo_equipo')

        devices_by_type_dict = {item['tipo_equipo']: item['total'] for item in devices_by_type}

        # 3. Total de empleados activos
        active_employees = Employee.objects.filter(estado='ACTIVO').count()

        # 4. Total de dispositivos (solo activos)
        total_devices = Device.objects.filter(activo=True).count()

        # 5. Dispositivos disponibles (solo activos)
        available_devices = Device.objects.filter(activo=True, estado='DISPONIBLE').count()

        # 6. Asignaciones activas
        active_assignments_count = Assignment.objects.filter(estado_asignacion='ACTIVA').count()

        # 7. Últimas 5 asignaciones
        recent_assignments = Assignment.objects.select_related(
            'empleado',
            'dispositivo',
            'created_by'
        ).order_by('-created_at')[:5]

        recent_assignments_serializer = AssignmentSerializer(recent_assignments, many=True)

        # 8. Dispositivos por sucursal (solo activos)
        from apps.branches.models import Branch
        devices_by_branch = Device.objects.filter(activo=True).values(
            'sucursal__nombre',
            'sucursal__codigo'
        ).annotate(total=Count('id')).order_by('-total')

        # 9. Últimas 5 devoluciones (incluyendo robos/pérdidas)
        from apps.assignments.models import Return
        from apps.assignments.serializers import ReturnSerializer

        # Obtener devoluciones normales
        recent_returns = Return.objects.select_related(
            'asignacion__empleado',
            'asignacion__dispositivo',
            'created_by'
        ).order_by('-created_at')[:10]  # Obtener más para combinar luego

        # Obtener asignaciones finalizadas por robo/pérdida (dispositivo en estado ROBO)
        from apps.assignments.models import Assignment
        from apps.assignments.serializers import AssignmentSerializer
        recent_losses = Assignment.objects.filter(
            estado_asignacion='FINALIZADA',
            dispositivo__estado='ROBO'
        ).select_related(
            'empleado',
            'dispositivo',
            'created_by'
        ).order_by('-updated_at')[:10]  # Obtener más para combinar luego

        # Serializar ambos tipos
        recent_returns_serializer = ReturnSerializer(recent_returns, many=True)

        # Crear una lista combinada con información unificada
        combined_returns = []

        # Agregar devoluciones normales
        for ret in recent_returns_serializer.data:
            combined_returns.append({
                'type': 'return',
                'data': ret,
                'timestamp': ret.get('created_at', ret.get('fecha_devolucion'))
            })

        # Agregar robos/pérdidas
        for loss in recent_losses:
            combined_returns.append({
                'type': 'loss',
                'data': {
                    'id': loss.id,
                    'asignacion_detail': {
                        'id': loss.id,
                        'empleado_detail': {
                            'nombre_completo': loss.empleado.nombre_completo,
                            'rut': loss.empleado.rut,
                        },
                        'dispositivo_detail': {
                            'id': loss.dispositivo.id,
                            'tipo_equipo': loss.dispositivo.tipo_equipo,
                            'marca': loss.dispositivo.marca,
                            'modelo': loss.dispositivo.modelo,
                            'numero_serie': loss.dispositivo.numero_serie,
                        }
                    },
                    'estado_dispositivo': 'ROBO',
                    'fecha_devolucion': loss.fecha_devolucion or loss.updated_at.date().isoformat(),
                },
                'timestamp': loss.updated_at.isoformat()
            })

        # Ordenar por timestamp y tomar las 5 más recientes
        combined_returns.sort(key=lambda x: x['timestamp'], reverse=True)
        recent_returns_data = [item['data'] for item in combined_returns[:5]]

        return Response({
            'summary': {
                'total_devices': total_devices,
                'available_devices': available_devices,
                'active_employees': active_employees,
                'active_assignments': active_assignments_count,
            },
            'devices_by_status': devices_by_status_dict,
            'devices_by_type': devices_by_type_dict,
            'devices_by_branch': list(devices_by_branch),
            'recent_assignments': recent_assignments_serializer.data,
            'recent_returns': recent_returns_data,
        })
