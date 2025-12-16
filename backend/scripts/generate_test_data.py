"""
Script para generar datos de prueba para testing manual de Fase 17
Genera: 100 dispositivos, 50 empleados, 30 asignaciones
"""
import os
import sys
import django
from datetime import date, timedelta
import random

# Configurar Django
sys.path.append('/home/rvpadmin/tech-trace/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.branches.models import Branch
from apps.employees.models import Employee, BusinessUnit
from apps.devices.models import Device
from apps.assignments.models import Request, Assignment

User = get_user_model()

def create_test_data():
    print("🚀 Iniciando generación de datos de prueba...")

    # 1. Obtener o crear usuario admin
    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'role': 'ADMIN',
            'email': 'admin@techtrace.com'
        }
    )
    if created:
        admin_user.set_password('admin123')
        admin_user.save()
        print(f"✅ Usuario admin creado: admin / admin123")
    else:
        print(f"✅ Usuario admin ya existe")

    # 2. Crear usuario operador
    operador_user, created = User.objects.get_or_create(
        username='operador',
        defaults={
            'role': 'OPERADOR',
            'email': 'operador@techtrace.com'
        }
    )
    if created:
        operador_user.set_password('operador123')
        operador_user.save()
        print(f"✅ Usuario operador creado: operador / operador123")
    else:
        print(f"✅ Usuario operador ya existe")

    # 3. Verificar/crear sucursales
    branches_data = [
        {'nombre': 'Sucursal Santiago Centro', 'codigo': 'SCL-01', 'ciudad': 'Santiago'},
        {'nombre': 'Sucursal Valparaíso', 'codigo': 'VAL-01', 'ciudad': 'Valparaíso'},
        {'nombre': 'Sucursal Concepción', 'codigo': 'CON-01', 'ciudad': 'Concepción'},
        {'nombre': 'Sucursal La Serena', 'codigo': 'LSR-01', 'ciudad': 'La Serena'},
        {'nombre': 'Sucursal Temuco', 'codigo': 'TMC-01', 'ciudad': 'Temuco'},
    ]

    branches = []
    for branch_data in branches_data:
        branch, created = Branch.objects.get_or_create(
            codigo=branch_data['codigo'],
            defaults={
                'nombre': branch_data['nombre'],
                'ciudad': branch_data['ciudad'],
                'is_active': True
            }
        )
        branches.append(branch)
    print(f"✅ Sucursales verificadas: {len(branches)}")

    # 4. Crear 50 empleados
    nombres = [
        'Juan Pérez', 'María González', 'Carlos Silva', 'Ana Martínez', 'Luis Rodríguez',
        'Patricia López', 'Jorge Fernández', 'Carmen Sánchez', 'Roberto Torres', 'Laura Ramírez',
        'Diego Castro', 'Valentina Muñoz', 'Sebastián Rojas', 'Camila Morales', 'Matías Núñez',
        'Francisca Reyes', 'Felipe Herrera', 'Javiera Contreras', 'Cristóbal Pizarro', 'Constanza Vega',
        'Andrés Campos', 'Daniela Bravo', 'Nicolás Guzmán', 'Catalina Medina', 'Tomás Fuentes',
        'Isidora Castillo', 'Benjamín Espinoza', 'Sofía Vargas', 'Gabriel Alarcón', 'Antonia Sepúlveda',
        'Maximiliano Carrasco', 'Emilia Mendoza', 'Samuel Cortés', 'Martina Flores', 'Lucas Paredes',
        'Josefa Bustamante', 'Agustín Riquelme', 'Amanda Garrido', 'Vicente Palacios', 'Trinidad Maldonado',
        'Joaquín Cáceres', 'Maite Valenzuela', 'Ignacio Soto', 'Belén Tapia', 'Dante Jara',
        'Renata Ibáñez', 'Esteban Sandoval', 'Elisa Vera', 'Bruno Araya', 'Amparo Ortiz'
    ]

    cargos = [
        'Desarrollador Senior', 'Desarrollador Junior', 'Analista de Sistemas',
        'Jefe de Proyecto', 'Diseñador UX/UI', 'Analista de Datos',
        'Administrador de Sistemas', 'Soporte Técnico', 'Gerente de TI',
        'Coordinador de Proyectos'
    ]

    # Obtener unidades de negocio activas
    unidades = list(BusinessUnit.objects.filter(is_active=True))
    if not unidades:
        print("⚠️  No hay unidades de negocio activas. Algunas asignaciones no tendrán unidad de negocio.")

    employees = []
    existing_count = Employee.objects.count()

    if existing_count < 50:
        print(f"📝 Creando empleados... (existentes: {existing_count})")
        for i in range(existing_count, 50):
            rut_number = 10000000 + i * 100
            rut_dv = random.choice(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'K'])

            try:
                employee = Employee.objects.create(
                    rut=f"{rut_number}-{rut_dv}",
                    nombre_completo=nombres[i % len(nombres)],
                    cargo=random.choice(cargos),
                    correo_corporativo=f"empleado{i+1}@techtrace.com",
                    gmail_personal=f"empleado{i+1}@gmail.com",
                    telefono=f"+569{random.randint(10000000, 99999999)}",
                    sucursal=random.choice(branches),
                    unidad_negocio=random.choice(unidades) if unidades else None,
                    estado='ACTIVO',
                    created_by=admin_user
                )
                employees.append(employee)
            except Exception as e:
                print(f"⚠️  Error creando empleado {i+1}: {e}")

        print(f"✅ Empleados creados: {len(employees)} nuevos")
    else:
        employees = list(Employee.objects.all()[:50])
        print(f"✅ Empleados ya existentes: {len(employees)}")

    # 5. Crear 100 dispositivos
    marcas_laptop = ['HP', 'Dell', 'Lenovo', 'Apple', 'Asus']
    modelos_laptop = ['ProBook 450', 'Latitude 5420', 'ThinkPad T14', 'MacBook Air', 'VivoBook']

    marcas_telefono = ['Samsung', 'Apple', 'Huawei', 'Xiaomi', 'Motorola']
    modelos_telefono = ['Galaxy S21', 'iPhone 13', 'P40 Pro', 'Redmi Note 10', 'Moto G']

    marcas_tablet = ['Samsung', 'Apple', 'Huawei', 'Lenovo']
    modelos_tablet = ['Galaxy Tab S7', 'iPad Air', 'MatePad', 'Tab M10']

    devices = []
    existing_devices = Device.objects.count()

    if existing_devices < 100:
        print(f"📱 Creando dispositivos... (existentes: {existing_devices})")

        tipos_distribucion = {
            'LAPTOP': 40,
            'TELEFONO': 35,
            'TABLET': 15,
            'SIM': 7,
            'ACCESORIO': 3
        }

        device_count = existing_devices

        for tipo, cantidad in tipos_distribucion.items():
            for i in range(cantidad):
                if device_count >= 100:
                    break

                try:
                    if tipo == 'LAPTOP':
                        marca = random.choice(marcas_laptop)
                        modelo = random.choice(modelos_laptop)
                        serie = f"LPT-{device_count:04d}"
                        numero_tel = None
                    elif tipo == 'TELEFONO':
                        marca = random.choice(marcas_telefono)
                        modelo = random.choice(modelos_telefono)
                        serie = f"TEL-{device_count:04d}"
                        numero_tel = f"+569{random.randint(10000000, 99999999)}"
                    elif tipo == 'TABLET':
                        marca = random.choice(marcas_tablet)
                        modelo = random.choice(modelos_tablet)
                        serie = f"TAB-{device_count:04d}"
                        numero_tel = None
                    elif tipo == 'SIM':
                        marca = 'Entel'
                        modelo = 'SIM Card'
                        serie = f"SIM-{device_count:04d}"
                        numero_tel = f"+569{random.randint(10000000, 99999999)}"
                    else:  # ACCESORIO
                        marca = 'Logitech'
                        modelo = random.choice(['Mouse', 'Teclado', 'Webcam'])
                        serie = f"ACC-{device_count:04d}"
                        numero_tel = None

                    # Distribución de estados: 60% disponible, 30% asignado, 10% otros
                    rand = random.random()
                    if rand < 0.6:
                        estado = 'DISPONIBLE'
                    elif rand < 0.9:
                        estado = 'ASIGNADO'
                    else:
                        estado = random.choice(['MANTENIMIENTO', 'BAJA'])

                    device = Device.objects.create(
                        tipo_equipo=tipo,
                        marca=marca,
                        modelo=modelo,
                        numero_serie=serie,
                        numero_telefono=numero_tel,
                        numero_factura=f"FAC-{device_count:05d}",
                        estado=estado,
                        sucursal=random.choice(branches),
                        fecha_ingreso=date.today() - timedelta(days=random.randint(1, 365)),
                        created_by=admin_user
                    )
                    devices.append(device)
                    device_count += 1

                except Exception as e:
                    print(f"⚠️  Error creando dispositivo: {e}")

        print(f"✅ Dispositivos creados: {len(devices)} nuevos")
    else:
        devices = list(Device.objects.all()[:100])
        print(f"✅ Dispositivos ya existentes: {len(devices)}")

    # 6. Crear 30 asignaciones
    assignments = []
    existing_assignments = Assignment.objects.count()

    if existing_assignments < 30:
        print(f"📋 Creando asignaciones... (existentes: {existing_assignments})")

        # Obtener dispositivos disponibles
        available_devices = list(Device.objects.filter(estado='DISPONIBLE')[:30])

        for i in range(min(30 - existing_assignments, len(available_devices))):
            try:
                device = available_devices[i]
                employee = random.choice(employees)

                # Crear solicitud primero
                request = Request.objects.create(
                    empleado=employee,
                    jefatura_solicitante=random.choice(['Gerente TI', 'Jefe de Proyecto', 'Director']),
                    tipo_dispositivo=device.tipo_equipo,
                    justificacion=f"Necesario para proyecto {i+1}",
                    estado='COMPLETADA',
                    created_by=admin_user
                )

                # Crear asignación
                fecha_entrega = date.today() - timedelta(days=random.randint(1, 180))

                assignment = Assignment.objects.create(
                    solicitud=request,
                    empleado=employee,
                    dispositivo=device,
                    tipo_entrega=random.choice(['PERMANENTE', 'TEMPORAL']),
                    fecha_entrega=fecha_entrega,
                    estado_carta=random.choice(['FIRMADA', 'PENDIENTE']),
                    estado_asignacion='ACTIVA',
                    observaciones=f"Asignación para proyecto {i+1}",
                    created_by=admin_user
                )

                # Actualizar estado del dispositivo
                device.estado = 'ASIGNADO'
                device.save()

                assignments.append(assignment)

            except Exception as e:
                print(f"⚠️  Error creando asignación: {e}")

        print(f"✅ Asignaciones creadas: {len(assignments)} nuevas")
    else:
        assignments = list(Assignment.objects.all()[:30])
        print(f"✅ Asignaciones ya existentes: {len(assignments)}")

    # Resumen final
    print("\n" + "="*60)
    print("📊 RESUMEN DE DATOS GENERADOS")
    print("="*60)
    print(f"👥 Usuarios: {User.objects.count()}")
    print(f"🏢 Sucursales: {Branch.objects.count()}")
    print(f"👤 Empleados: {Employee.objects.count()}")
    print(f"📱 Dispositivos: {Device.objects.count()}")
    print(f"   - DISPONIBLE: {Device.objects.filter(estado='DISPONIBLE').count()}")
    print(f"   - ASIGNADO: {Device.objects.filter(estado='ASIGNADO').count()}")
    print(f"   - MANTENIMIENTO: {Device.objects.filter(estado='MANTENIMIENTO').count()}")
    print(f"   - BAJA: {Device.objects.filter(estado='BAJA').count()}")
    print(f"📋 Solicitudes: {Request.objects.count()}")
    print(f"🔗 Asignaciones: {Assignment.objects.count()}")
    print("="*60)
    print("\n✅ Datos de prueba generados exitosamente!")
    print("\n🔐 Credenciales:")
    print("   Admin: admin / admin123")
    print("   Operador: operador / operador123")
    print("\n🌐 URLs:")
    print("   Backend: http://localhost:8000/admin/")
    print("   Frontend: http://localhost:3000/")

if __name__ == '__main__':
    create_test_data()
