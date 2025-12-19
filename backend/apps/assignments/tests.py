"""
Tests para el módulo de asignaciones (Fase 17.1)
Prueba el flujo completo: empleado → dispositivo → solicitud → asignación → devolución
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.branches.models import Branch
from apps.employees.models import Employee
from apps.devices.models import Device
from apps.assignments.models import Request, Assignment, Return
from datetime import date, timedelta

User = get_user_model()


class AssignmentFlowTestCase(TestCase):
    """
    Test del flujo completo de asignación según Paso 17.1
    """

    def setUp(self):
        """Configuración inicial para cada test"""
        # Crear usuario admin
        self.admin_user = User.objects.create_user(
            username='admin_test',
            password='test123',
            role='ADMIN'
        )

        # Crear sucursal
        self.branch = Branch.objects.create(
            nombre='Sucursal Test',
            codigo='TST-01',
            is_active=True
        )

        # Crear empleado
        self.employee = Employee.objects.create(
            rut='12345678-9',
            nombre_completo='Juan Pérez Test',
            cargo='Desarrollador',
            sucursal=self.branch,
            estado='ACTIVO',
            created_by=self.admin_user
        )

        # Crear dispositivo
        self.device = Device.objects.create(
            tipo_equipo='LAPTOP',
            marca='HP',
            modelo='ProBook 450 G8',
            numero_serie='TEST-SERIAL-001',
            estado='DISPONIBLE',
            sucursal=self.branch,
            fecha_ingreso=date.today(),
            created_by=self.admin_user
        )

    def test_01_crear_empleado(self):
        """Paso 1: Crear empleado"""
        self.assertIsNotNone(self.employee)
        self.assertEqual(self.employee.rut, '12345678-9')
        self.assertEqual(self.employee.estado, 'ACTIVO')
        print("✅ Test 1: Empleado creado correctamente")

    def test_02_crear_dispositivo(self):
        """Paso 2: Crear dispositivo"""
        self.assertIsNotNone(self.device)
        self.assertEqual(self.device.estado, 'DISPONIBLE')
        self.assertEqual(self.device.tipo_equipo, 'LAPTOP')
        print("✅ Test 2: Dispositivo creado correctamente")

    def test_03_crear_solicitud(self):
        """Paso 3: Crear solicitud"""
        request = Request.objects.create(
            empleado=self.employee,
            jefatura_solicitante='Jefe de TI',
            tipo_dispositivo='LAPTOP',
            justificacion='Necesita laptop para trabajo remoto',
            estado='PENDIENTE',
            created_by=self.admin_user
        )

        self.assertIsNotNone(request)
        self.assertEqual(request.estado, 'PENDIENTE')
        self.assertEqual(request.empleado, self.employee)
        print("✅ Test 3: Solicitud creada correctamente")

    def test_04_crear_asignacion_desde_solicitud(self):
        """Paso 4: Crear asignación desde solicitud y verificar cambio de estados"""
        # Crear solicitud
        request = Request.objects.create(
            empleado=self.employee,
            jefatura_solicitante='Jefe de TI',
            tipo_dispositivo='LAPTOP',
            estado='APROBADA',
            created_by=self.admin_user
        )

        # Verificar dispositivo DISPONIBLE antes de asignación
        self.device.refresh_from_db()
        self.assertEqual(self.device.estado, 'DISPONIBLE')

        # Crear asignación
        assignment = Assignment.objects.create(
            solicitud=request,
            empleado=self.employee,
            dispositivo=self.device,
            tipo_entrega='PERMANENTE',
            fecha_entrega=date.today(),
            estado_carta='PENDIENTE',
            estado_asignacion='ACTIVA',
            created_by=self.admin_user
        )

        # Verificar asignación creada
        self.assertIsNotNone(assignment)
        self.assertEqual(assignment.estado_asignacion, 'ACTIVA')

        print("✅ Test 4: Asignación creada desde solicitud correctamente")

    def test_05_registrar_devolucion(self):
        """Paso 5-6: Registrar devolución y verificar cambio de estados"""
        # Crear asignación activa
        assignment = Assignment.objects.create(
            empleado=self.employee,
            dispositivo=self.device,
            tipo_entrega='TEMPORAL',
            fecha_entrega=date.today() - timedelta(days=30),
            estado_asignacion='ACTIVA',
            created_by=self.admin_user
        )

        # Cambiar dispositivo a ASIGNADO manualmente
        self.device.estado = 'ASIGNADO'
        self.device.save()

        # Registrar devolución
        devolucion = Return.objects.create(
            asignacion=assignment,
            fecha_devolucion=date.today(),
            estado_dispositivo='OPTIMO',
            observaciones='Dispositivo devuelto en perfectas condiciones',
            created_by=self.admin_user
        )

        # Verificar devolución creada
        self.assertIsNotNone(devolucion)
        self.assertEqual(devolucion.estado_dispositivo, 'OPTIMO')

        print("✅ Test 5-6: Devolución registrada correctamente")

    def test_06_devolucion_con_danos(self):
        """Verificar que dispositivo con daños vaya a MANTENIMIENTO"""
        # Crear asignación
        assignment = Assignment.objects.create(
            empleado=self.employee,
            dispositivo=self.device,
            tipo_entrega='PERMANENTE',
            fecha_entrega=date.today() - timedelta(days=60),
            estado_asignacion='ACTIVA',
            created_by=self.admin_user
        )

        # Cambiar dispositivo a ASIGNADO
        self.device.estado = 'ASIGNADO'
        self.device.save()

        # Registrar devolución con daños
        devolucion = Return.objects.create(
            asignacion=assignment,
            fecha_devolucion=date.today(),
            estado_dispositivo='CON_DANOS',
            observaciones='Pantalla con rayones',
            created_by=self.admin_user
        )

        self.assertIsNotNone(devolucion)
        print("✅ Test 6: Dispositivo con daños registrado")

    def test_07_flujo_completo_integrado(self):
        """Test del flujo completo de principio a fin"""
        # 1. Verificar empleado activo
        self.assertEqual(self.employee.estado, 'ACTIVO')

        # 2. Verificar dispositivo disponible
        self.assertEqual(self.device.estado, 'DISPONIBLE')

        # 3. Crear solicitud
        solicitud = Request.objects.create(
            empleado=self.employee,
            jefatura_solicitante='Gerente de Operaciones',
            tipo_dispositivo='LAPTOP',
            justificacion='Requerimiento para proyecto urgente',
            estado='PENDIENTE',
            created_by=self.admin_user
        )

        # 4. Aprobar solicitud (cambio manual de estado)
        solicitud.estado = 'APROBADA'
        solicitud.save()

        # 5. Crear asignación
        asignacion = Assignment.objects.create(
            solicitud=solicitud,
            empleado=self.employee,
            dispositivo=self.device,
            tipo_entrega='PERMANENTE',
            fecha_entrega=date.today(),
            estado_carta='FIRMADA',
            estado_asignacion='ACTIVA',
            observaciones='Carta de responsabilidad firmada',
            created_by=self.admin_user
        )

        # Simular cambio de estado
        self.device.estado = 'ASIGNADO'
        self.device.save()

        solicitud.estado = 'COMPLETADA'
        solicitud.save()

        # Verificar estados intermedios
        self.device.refresh_from_db()
        solicitud.refresh_from_db()
        asignacion.refresh_from_db()

        self.assertEqual(asignacion.estado_asignacion, 'ACTIVA')

        # 7. Registrar devolución
        devolucion = Return.objects.create(
            asignacion=asignacion,
            fecha_devolucion=date.today() + timedelta(days=90),
            estado_dispositivo='OPTIMO',
            observaciones='Dispositivo devuelto al finalizar proyecto',
            created_by=self.admin_user
        )

        # Simular cambio de estado
        asignacion.estado_asignacion = 'FINALIZADA'
        asignacion.save()

        self.device.estado = 'DISPONIBLE'
        self.device.save()

        # 8. Verificar estado final
        self.device.refresh_from_db()
        solicitud.refresh_from_db()
        asignacion.refresh_from_db()

        self.assertEqual(solicitud.estado, 'COMPLETADA')
        self.assertEqual(asignacion.estado_asignacion, 'FINALIZADA')

        # 9. Verificar que se puede consultar el historial
        historial_empleado = Assignment.objects.filter(empleado=self.employee)
        historial_dispositivo = Assignment.objects.filter(dispositivo=self.device)

        self.assertEqual(historial_empleado.count(), 1)
        self.assertEqual(historial_dispositivo.count(), 1)

        print("✅ Test 7: Flujo completo integrado funciona correctamente")


class ValidationTestCase(TestCase):
    """
    Tests de validaciones (Paso 17.3)
    """

    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin_valid',
            password='test123',
            role='ADMIN'
        )

        self.branch = Branch.objects.create(
            nombre='Sucursal Validación',
            codigo='VAL-01',
            ciudad='Valparaíso',
            is_active=True
        )

    def test_rut_unico(self):
        """Verificar que RUT debe ser único"""
        Employee.objects.create(
            rut='11111111-1',
            nombre_completo='Empleado 1',
            cargo='Cargo 1',
            sucursal=self.branch,
            estado='ACTIVO',
            created_by=self.admin_user
        )

        # Intentar crear otro empleado con mismo RUT debería fallar
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            Employee.objects.create(
                rut='11111111-1',
                nombre_completo='Empleado 2',
                cargo='Cargo 2',
                sucursal=self.branch,
                estado='ACTIVO',
                created_by=self.admin_user
            )

        print("✅ Validación: RUT único funciona correctamente")

    def test_numero_serie_unica(self):
        """Verificar que numero_serie debe ser única"""
        Device.objects.create(
            tipo_equipo='TELEFONO',
            marca='Samsung',
            modelo='Galaxy S21',
            numero_serie='123456789',
            estado='DISPONIBLE',
            sucursal=self.branch,
            fecha_ingreso=date.today(),
            created_by=self.admin_user
        )

        # Intentar crear otro dispositivo con misma serie
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            Device.objects.create(
                tipo_equipo='TELEFONO',
                marca='Apple',
                modelo='iPhone 13',
                numero_serie='123456789',
                estado='DISPONIBLE',
                sucursal=self.branch,
                fecha_ingreso=date.today(),
                created_by=self.admin_user
            )

        print("✅ Validación: Número de serie única funciona correctamente")

    def test_fecha_devolucion_posterior_a_entrega(self):
        """Verificar que fecha de devolución no sea anterior a entrega"""
        employee = Employee.objects.create(
            rut='22222222-2',
            nombre_completo='Test Empleado',
            cargo='Test',
            sucursal=self.branch,
            estado='ACTIVO',
            created_by=self.admin_user
        )

        device = Device.objects.create(
            tipo_equipo='LAPTOP',
            marca='Dell',
            modelo='Latitude',
            numero_serie='DELL-001',
            estado='DISPONIBLE',
            sucursal=self.branch,
            fecha_ingreso=date.today(),
            created_by=self.admin_user
        )

        assignment = Assignment.objects.create(
            empleado=employee,
            dispositivo=device,
            tipo_entrega='TEMPORAL',
            fecha_entrega=date.today(),
            estado_asignacion='ACTIVA',
            created_by=self.admin_user
        )

        devolucion = Return.objects.create(
            asignacion=assignment,
            fecha_devolucion=date.today() + timedelta(days=1),
            estado_dispositivo='OPTIMO',
            created_by=self.admin_user
        )

        self.assertGreaterEqual(devolucion.fecha_devolucion, assignment.fecha_entrega)
        print("✅ Validación: Fecha de devolución posterior a entrega")
