from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from django_filters.rest_framework import DjangoFilterBackend
from .models import Request, Assignment, Return
from .serializers import (
    RequestSerializer,
    AssignmentSerializer,
    AssignmentListSerializer,
    ReturnSerializer,
    ResponsibilityLetterSerializer,
    DiscountLetterSerializer
)
from .pdf_generator import PDFLetterGenerator


class RequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar las solicitudes de dispositivos.
    Proporciona operaciones CRUD completas con filtros y búsqueda.
    """
    queryset = Request.objects.select_related('empleado', 'created_by').all()
    serializer_class = RequestSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['estado', 'empleado', 'tipo_dispositivo']
    search_fields = ['jefatura_solicitante', 'justificacion', 'empleado__nombre_completo', 'empleado__rut']
    ordering_fields = ['fecha_solicitud', 'estado', 'created_at']
    ordering = ['-fecha_solicitud']

    def perform_create(self, serializer):
        """
        Asignar automáticamente el usuario actual como created_by al crear una solicitud.
        """
        serializer.save(created_by=self.request.user)


class AssignmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar las asignaciones de dispositivos.
    Proporciona operaciones CRUD completas con filtros y búsqueda.
    OPTIMIZADO: Usa AssignmentListSerializer para listados y AssignmentSerializer para detalle.
    """
    serializer_class = AssignmentSerializer  # Por defecto (detail, create, update)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['estado_asignacion', 'empleado', 'dispositivo', 'tipo_entrega', 'estado_carta']
    search_fields = [
        'empleado__nombre_completo',
        'empleado__rut',
        'dispositivo__numero_serie',
        'dispositivo__imei',
        'dispositivo__marca',
        'dispositivo__modelo',
        'observaciones'
    ]
    ordering_fields = ['fecha_entrega', 'fecha_devolucion', 'estado_asignacion', 'created_at']
    ordering = ['-fecha_entrega']

    def get_queryset(self):
        """
        Queryset optimizado según la acción.
        Para listados usa select_related optimizado, para detalle incluye todo.
        """
        if self.action == 'list':
            # Listado: solo campos necesarios para la tabla
            return Assignment.objects.select_related(
                'empleado',
                'empleado__sucursal',
                'dispositivo'
            ).only(
                # Solo campos necesarios
                'id', 'tipo_entrega', 'fecha_entrega', 'estado_asignacion', 'created_at',
                'empleado__nombre_completo', 'empleado__sucursal__nombre',
                'dispositivo__tipo_equipo', 'dispositivo__marca', 'dispositivo__modelo',
                'dispositivo__numero_serie', 'dispositivo__imei'
            )
        # Detalle: todo completo
        return Assignment.objects.select_related(
            'empleado',
            'empleado__sucursal',
            'dispositivo',
            'dispositivo__sucursal',
            'solicitud',
            'created_by',
            'firmado_por'
        )

    def get_serializer_class(self):
        """
        Usa serializer ligero para listados, completo para detalle.
        Esto evita N+1 queries en listados masivos.
        """
        if self.action == 'list':
            return AssignmentListSerializer
        return AssignmentSerializer

    def perform_create(self, serializer):
        """
        Asignar automáticamente el usuario actual como created_by al crear una asignación.
        """
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], url_path='generate-responsibility-letter')
    def generate_responsibility_letter(self, request, pk=None):
        """
        Genera una carta de responsabilidad (LAPTOP o TELÉFONO) en formato PDF.

        POST /api/assignments/assignments/{id}/generate-responsibility-letter/
        Body: ResponsibilityLetterSerializer data (campos del formulario)
        Returns: PDF como blob (application/pdf)
        """
        assignment = self.get_object()

        # Validar que la asignación esté activa
        if assignment.estado_asignacion != 'ACTIVA':
            return Response(
                {'error': 'Solo se pueden generar cartas para asignaciones activas'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar que el empleado esté activo
        if assignment.empleado.estado != 'ACTIVO':
            return Response(
                {'error': 'El empleado debe estar activo para generar la carta'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar tipo de dispositivo
        dispositivo = assignment.dispositivo
        if dispositivo.tipo_equipo not in ['LAPTOP', 'DESKTOP', 'TELEFONO']:
            return Response(
                {'error': 'Solo se pueden generar cartas de responsabilidad para laptops, desktops y teléfonos'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar datos del formulario
        serializer = ResponsibilityLetterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Extraer company_key y extra_data
        validated_data = serializer.validated_data
        company_key = validated_data.pop('company_key', 'pompeyo_carrasco')
        extra_data = validated_data

        try:
            # Obtener asignación con relaciones necesarias
            assignment = Assignment.objects.select_related(
                'empleado',
                'empleado__sucursal',
                'dispositivo'
            ).get(pk=pk)

            # Crear generador de PDF con la empresa seleccionada
            generator = PDFLetterGenerator(company_key=company_key)

            # Generar PDF según el tipo de dispositivo
            if dispositivo.tipo_equipo in ['LAPTOP', 'DESKTOP']:
                pdf_buffer = generator.generate_laptop_responsibility_letter(assignment, extra_data)
                filename = f'carta_responsabilidad_{dispositivo.tipo_equipo.lower()}_{assignment.id}.pdf'
            else:  # TELEFONO
                pdf_buffer = generator.generate_phone_responsibility_letter(assignment, extra_data)
                filename = f'carta_responsabilidad_telefono_{assignment.id}.pdf'

            # Retornar PDF
            response = HttpResponse(pdf_buffer.read(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response

        except Exception as e:
            return Response(
                {'error': f'Error al generar la carta: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], url_path='generate-discount-letter')
    def generate_discount_letter(self, request, pk=None):
        """
        Genera una carta de descuento en formato PDF y cambia el estado del dispositivo a ROBO.

        POST /api/assignments/assignments/{id}/generate-discount-letter/
        Body: DiscountLetterSerializer data (monto_total, numero_cuotas, mes_primera_cuota, company_key)
        Returns: PDF como blob (application/pdf)
        Side Effect: Cambia device.estado a 'ROBO'
        """
        assignment = self.get_object()

        # Validar que la asignación esté activa
        if assignment.estado_asignacion != 'ACTIVA':
            return Response(
                {'error': 'Solo se pueden generar cartas de descuento para asignaciones activas'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar que el dispositivo no esté ya en estado ROBO
        if assignment.dispositivo.estado == 'ROBO':
            return Response(
                {'error': 'El dispositivo ya está marcado como robado'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validar datos del formulario
        serializer = DiscountLetterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Extraer company_key y discount_data
        validated_data = serializer.validated_data
        company_key = validated_data.pop('company_key', 'pompeyo_carrasco')
        discount_data = validated_data

        try:
            # Obtener asignación con relaciones necesarias
            assignment = Assignment.objects.select_related(
                'empleado',
                'dispositivo'
            ).get(pk=pk)

            # Crear generador de PDF con la empresa seleccionada
            generator = PDFLetterGenerator(company_key=company_key)

            # Generar PDF
            pdf_buffer = generator.generate_discount_letter(assignment, discount_data)
            filename = f'carta_descuento_{assignment.id}.pdf'

            # Cambiar estado del dispositivo a ROBO
            assignment.dispositivo.change_status('ROBO', user=request.user)

            # Retornar PDF
            response = HttpResponse(pdf_buffer.read(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response

        except Exception as e:
            return Response(
                {'error': f'Error al generar la carta: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], url_path='mark-as-signed')
    def mark_as_signed(self, request, pk=None):
        """
        Marca una carta de responsabilidad como firmada.

        POST /api/assignments/assignments/{id}/mark-as-signed/
        Body: {} (vacío)
        Returns: Assignment actualizado con auditoría de firma
        """
        assignment = self.get_object()

        # Validación 1: La asignación debe estar activa
        if assignment.estado_asignacion != 'ACTIVA':
            return Response(
                {'error': 'Solo se pueden marcar como firmadas las cartas de asignaciones activas'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validación 2: La carta debe estar en estado PENDIENTE
        if assignment.estado_carta != 'PENDIENTE':
            return Response(
                {
                    'error': f'La carta no puede ser marcada como firmada. Estado actual: {assignment.get_estado_carta_display()}',
                    'current_status': assignment.estado_carta
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Actualizar estado y campos de auditoría
        from django.utils import timezone

        assignment.estado_carta = 'FIRMADA'
        assignment.fecha_firma = timezone.now()
        assignment.firmado_por = request.user
        assignment.save(update_fields=['estado_carta', 'fecha_firma', 'firmado_por'])

        # Serializar y retornar
        serializer = self.get_serializer(assignment)

        return Response({
            'message': 'Carta marcada como firmada exitosamente',
            'assignment': serializer.data
        }, status=status.HTTP_200_OK)


class ReturnViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar las devoluciones de dispositivos.
    Proporciona operaciones CRUD completas con filtros y búsqueda.
    """
    queryset = Return.objects.select_related('asignacion', 'created_by').all()
    serializer_class = ReturnSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['estado_dispositivo', 'asignacion']
    search_fields = [
        'asignacion__empleado__nombre_completo',
        'asignacion__dispositivo__numero_serie',
        'asignacion__dispositivo__imei',
        'observaciones'
    ]
    ordering_fields = ['fecha_devolucion', 'created_at']
    ordering = ['-fecha_devolucion']

    def perform_create(self, serializer):
        """
        Asignar automáticamente el usuario actual como created_by al crear una devolución.
        """
        serializer.save(created_by=self.request.user)
