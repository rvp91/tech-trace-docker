"""
Comando Django para importar inventario desde CSV.

Este comando lee un archivo CSV con información de empleados y dispositivos
y los importa al sistema TechTrace, creando las asignaciones correspondientes.

Uso:
    python manage.py import_inventory                    # Importación real
    python manage.py import_inventory --dry-run          # Solo validación
    python manage.py import_inventory --csv-path /ruta   # CSV personalizado
"""

import csv
import re
import time
from datetime import date
from decimal import Decimal
from collections import defaultdict
from typing import Dict, List, Tuple, Optional

from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db.utils import IntegrityError
from django.utils.text import slugify

from apps.branches.models import Branch
from apps.employees.models import Employee, BusinessUnit
from apps.employees.validators import validate_rut, format_rut
from apps.devices.models import Device
from apps.assignments.models import Request, Assignment


User = get_user_model()


class Command(BaseCommand):
    help = 'Importa empleados y dispositivos desde CSV de inventario general'

    def __init__(self):
        super().__init__()
        self.stats = {
            'employees_processed': 0,
            'employees_created': 0,
            'employees_existing': 0,
            'employees_duplicated': 0,
            'devices_processed': 0,
            'devices_created': 0,
            'devices_duplicated': 0,
            'devices_by_type': defaultdict(int),
            'assignments_created': 0,
            'devices_unassigned': 0,
            'branches_created': 0,
            'errors': [],
            'warnings': [],
        }

    def add_arguments(self, parser):
        parser.add_argument(
            '--csv-path',
            type=str,
            default='/home/rvpadmin/tech-trace/docs/Inventario_General.csv',
            help='Ruta al archivo CSV de inventario'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Validar sin importar (modo prueba)'
        )

    def handle(self, *args, **options):
        start_time = time.time()
        csv_path = options['csv_path']
        dry_run = options['dry_run']

        self.stdout.write('═' * 60)
        if dry_run:
            self.stdout.write(self.style.WARNING('🔍 MODO DRY-RUN (Solo validación)'))
        else:
            self.stdout.write(self.style.SUCCESS('🚀 INICIANDO IMPORTACIÓN DE INVENTARIO'))
        self.stdout.write('═' * 60)
        self.stdout.write('')

        try:
            # Fase 1: Lectura y limpieza
            self.stdout.write('📖 Fase 1: Leyendo CSV...')
            raw_rows = self.read_csv(csv_path)
            self.stdout.write(self.style.SUCCESS(f'   ✓ {len(raw_rows)} registros leídos'))

            # Fase 2: Consolidación
            self.stdout.write('🔄 Fase 2: Consolidando datos...')
            consolidated_data = self.consolidate_employee_devices(raw_rows)
            unassigned_devices = consolidated_data.pop(None, {'devices': []})
            self.stdout.write(self.style.SUCCESS(
                f'   ✓ {len(consolidated_data)} empleados únicos'
            ))
            self.stdout.write(self.style.SUCCESS(
                f'   ✓ {len(unassigned_devices["devices"])} dispositivos sin empleado'
            ))

            # Fase 3: Validación
            self.stdout.write('✅ Fase 3: Validando datos...')
            is_valid = self.validate_data(consolidated_data, unassigned_devices)

            if not is_valid:
                self.stdout.write(self.style.ERROR(
                    f'\n❌ Validación fallida: {len(self.stats["errors"])} errores encontrados'
                ))
                for error in self.stats['errors'][:10]:  # Mostrar primeros 10
                    self.stdout.write(self.style.ERROR(f'   • {error}'))
                if len(self.stats['errors']) > 10:
                    self.stdout.write(self.style.ERROR(
                        f'   ... y {len(self.stats["errors"]) - 10} errores más'
                    ))
                return

            self.stdout.write(self.style.SUCCESS('   ✓ Validación completada'))

            # Mostrar estadísticas proyectadas
            self.print_projected_stats(consolidated_data, unassigned_devices)

            if dry_run:
                self.stdout.write('')
                self.stdout.write(self.style.WARNING('🔍 Modo dry-run: No se importaron datos'))
                return

            # Fase 4: Importación real
            self.stdout.write('')
            self.stdout.write('💾 Fase 4: Importando datos...')
            self.import_data(consolidated_data, unassigned_devices)

            # Reporte final
            elapsed_time = time.time() - start_time
            self.print_final_report(elapsed_time)

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'\n❌ ERROR CRÍTICO: {str(e)}'))
            raise

    def read_csv(self, csv_path: str) -> List[Dict]:
        """Lee el archivo CSV y retorna lista de diccionarios."""
        rows = []
        try:
            with open(csv_path, 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f, delimiter=';')
                rows = list(reader)
        except FileNotFoundError:
            self.stdout.write(self.style.ERROR(f'❌ Archivo no encontrado: {csv_path}'))
            raise
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Error leyendo CSV: {str(e)}'))
            raise

        return rows

    def clean_rut(self, rut: str) -> Optional[str]:
        """
        Limpia y valida RUT chileno.

        Returns:
            RUT limpio y validado o None si es NA/inválido
        """
        if not rut or rut.strip().upper() == 'NA':
            return None

        # Normalizar formato
        rut = rut.strip().upper()

        # Corregir doble guion
        rut = rut.replace('--', '-')

        # Remover puntos
        rut = rut.replace('.', '')

        # Validar formato básico
        if '-' not in rut:
            return None

        try:
            validate_rut(rut)
            return rut
        except ValidationError as e:
            self.stats['warnings'].append(f'RUT inválido: {rut} - {str(e)}')
            return None

    def parse_marca_modelo(self, marca_modelo_str: str) -> Tuple[Optional[str], Optional[str]]:
        """
        Separa marca y modelo de una string.

        Args:
            marca_modelo_str: String con formato "Marca Modelo"

        Returns:
            Tupla (marca, modelo)
        """
        if not marca_modelo_str or marca_modelo_str.strip().upper() in ['NO APLICA', 'NA', '']:
            return (None, None)

        marca_modelo_str = marca_modelo_str.strip()

        # Corregir typos conocidos
        marca_modelo_str = marca_modelo_str.replace('Samgung', 'Samsung')
        marca_modelo_str = marca_modelo_str.replace('samgung', 'Samsung')

        # Normalizar "Iphone" a "Apple"
        if marca_modelo_str.lower().startswith('iphone'):
            return ('Apple', marca_modelo_str)

        # Split por primer espacio
        parts = marca_modelo_str.split(' ', 1)

        if len(parts) == 1:
            # Solo marca, no modelo
            return (parts[0], None)

        marca = parts[0]
        modelo = parts[1] if len(parts) > 1 else None

        return (marca, modelo)

    def generate_branch_code(self, branch_name: str) -> str:
        """
        Genera código único para sucursal (max 20 caracteres).

        Args:
            branch_name: Nombre de la sucursal

        Returns:
            Código slug
        """
        code = slugify(branch_name)

        # Truncar a 20 caracteres
        if len(code) > 20:
            code = code[:20]

        # Remover guión final si existe
        code = code.rstrip('-')

        return code

    def consolidate_employee_devices(self, raw_rows: List[Dict]) -> Dict:
        """
        Consolida filas por RUT, combinando dispositivos de un mismo empleado.

        Args:
            raw_rows: Lista de diccionarios del CSV

        Returns:
            Dict {rut: {employee_data, devices: [...]}}
        """
        consolidated = defaultdict(lambda: {'employee_data': None, 'devices': []})

        for row in raw_rows:
            rut = self.clean_rut(row.get('Rut', ''))

            # Datos del empleado (tomar del primer registro)
            if rut and consolidated[rut]['employee_data'] is None:
                consolidated[rut]['employee_data'] = {
                    'rut': rut,
                    'nombre_completo': row.get('Nombre', '').strip(),
                    'correo_electronico': row.get('Correo electrónico', '').strip(),
                    'cargo': row.get('Cargo', '').strip(),
                    'centro_costo': row.get('Centro Costo', '').strip(),
                    'area_negocio': row.get('Area de negocio', '').strip(),
                    'sucursal': row.get('sucursal corregida', '').strip(),
                }

            # Procesar dispositivos de esta fila
            devices_in_row = []

            # Notebook
            if row.get('NOTEBOOK', '').strip().upper() == 'SI':
                marca, modelo = self.parse_marca_modelo(row.get('Marca / Modelo NB', ''))
                if marca:
                    devices_in_row.append({
                        'tipo': 'NOTEBOOK',
                        'marca': marca,
                        'modelo': modelo,
                        'numero_serie': row.get('Serie NB', '').strip(),
                        'imei': None,
                        'numero_telefono': None,
                    })

            # Celular
            if row.get('CELULAR', '').strip().upper() == 'SI':
                marca, modelo = self.parse_marca_modelo(row.get('Marca/Modelo Telefono', ''))
                if marca:
                    devices_in_row.append({
                        'tipo': 'CELULAR',
                        'marca': marca,
                        'modelo': modelo,
                        'numero_serie': None,
                        'imei': row.get('IMEI', '').strip(),
                        'numero_telefono': row.get('N° Telefono', '').strip(),
                    })

            # Tablet
            if row.get('TABLET', '').strip().upper() == 'SI':
                marca, modelo = self.parse_marca_modelo(row.get('Marca/Modelo Tablet', ''))
                serie_imei = row.get('Serie/IMEI', '').strip()
                if marca:
                    # Determinar si es serie o IMEI (IMEI son 15 dígitos)
                    is_imei = serie_imei.isdigit() and len(serie_imei) == 15
                    devices_in_row.append({
                        'tipo': 'TABLET',
                        'marca': marca,
                        'modelo': modelo,
                        'numero_serie': None if is_imei else serie_imei,
                        'imei': serie_imei if is_imei else None,
                        'numero_telefono': None,
                    })

            # PC Escritorio
            if row.get('PC-ESCRITORIO', '').strip().upper() == 'SI':
                marca, modelo = self.parse_marca_modelo(row.get('MODELO', ''))
                if marca:
                    devices_in_row.append({
                        'tipo': 'PC-ESCRITORIO',
                        'marca': marca,
                        'modelo': modelo,
                        'numero_serie': row.get('SERIE', '').strip(),
                        'imei': None,
                        'numero_telefono': None,
                    })

            # Agregar dispositivos al empleado (o a sin asignar)
            key = rut if rut else None
            consolidated[key]['devices'].extend(devices_in_row)

        # Eliminar duplicados de dispositivos (mismo serie/IMEI)
        for key in consolidated:
            unique_devices = []
            seen = set()

            for device in consolidated[key]['devices']:
                # Crear identificador único
                identifier = None
                if device['numero_serie']:
                    identifier = ('serie', device['numero_serie'])
                elif device['imei']:
                    identifier = ('imei', device['imei'])
                else:
                    # Sin identificador, permitir duplicado
                    unique_devices.append(device)
                    continue

                if identifier not in seen:
                    seen.add(identifier)
                    unique_devices.append(device)
                else:
                    self.stats['warnings'].append(
                        f'Dispositivo duplicado en CSV (mismo {identifier[0]}): {identifier[1]}'
                    )

            consolidated[key]['devices'] = unique_devices

        # Contar empleados duplicados
        rut_counts = defaultdict(int)
        for row in raw_rows:
            rut = self.clean_rut(row.get('Rut', ''))
            if rut:
                rut_counts[rut] += 1

        self.stats['employees_duplicated'] = sum(1 for count in rut_counts.values() if count > 1)

        return dict(consolidated)

    def validate_data(self, consolidated_data: Dict, unassigned_devices: Dict) -> bool:
        """
        Valida todos los datos antes de importar.

        Returns:
            True si validación exitosa, False si hay errores críticos
        """
        is_valid = True

        # Validar empleados
        for rut, data in consolidated_data.items():
            emp_data = data['employee_data']

            # Validar RUT
            if rut:
                try:
                    validate_rut(rut)
                except ValidationError as e:
                    self.stats['errors'].append(f'RUT inválido: {rut} - {str(e)}')
                    is_valid = False

            # Validar correo
            correo = emp_data.get('correo_electronico', '')
            if correo and '@' not in correo:
                self.stats['warnings'].append(f'Correo inválido para {rut}: {correo}')

            # Validar que tiene sucursal
            if not emp_data.get('sucursal'):
                self.stats['errors'].append(f'Empleado sin sucursal: {rut}')
                is_valid = False

        # Validar dispositivos
        all_series = []
        all_imeis = []

        for rut, data in consolidated_data.items():
            for device in data['devices']:
                if device.get('numero_serie'):
                    all_series.append(device['numero_serie'])
                if device.get('imei'):
                    all_imeis.append(device['imei'])

        # También de dispositivos sin asignar
        for device in unassigned_devices.get('devices', []):
            if device.get('numero_serie'):
                all_series.append(device['numero_serie'])
            if device.get('imei'):
                all_imeis.append(device['imei'])

        # Detectar duplicados
        serie_counts = defaultdict(int)
        for serie in all_series:
            if serie and serie.upper() not in ['NO APLICA', 'NA', '']:
                serie_counts[serie] += 1

        imei_counts = defaultdict(int)
        for imei in all_imeis:
            if imei and imei.upper() not in ['NO APLICA', 'NA', '']:
                imei_counts[imei] += 1

        for serie, count in serie_counts.items():
            if count > 1:
                self.stats['warnings'].append(f'Serie duplicada en CSV: {serie} ({count} veces)')

        for imei, count in imei_counts.items():
            if count > 1:
                self.stats['warnings'].append(f'IMEI duplicado en CSV: {imei} ({count} veces)')

        return is_valid

    def print_projected_stats(self, consolidated_data: Dict, unassigned_devices: Dict):
        """Muestra estadísticas proyectadas de la importación."""
        total_employees = len(consolidated_data)
        total_devices = sum(len(data['devices']) for data in consolidated_data.values())
        total_devices += len(unassigned_devices.get('devices', []))

        device_counts = defaultdict(int)
        for data in consolidated_data.values():
            for device in data['devices']:
                tipo = device['tipo']
                device_counts[tipo] += 1

        for device in unassigned_devices.get('devices', []):
            tipo = device['tipo']
            device_counts[tipo] += 1

        # Contar sucursales únicas
        sucursales = set()
        for data in consolidated_data.values():
            sucursales.add(data['employee_data']['sucursal'])

        self.stdout.write('')
        self.stdout.write('📊 ESTADÍSTICAS PROYECTADAS:')
        self.stdout.write(f'   • Empleados a crear: {total_employees}')
        self.stdout.write(f'   • Dispositivos a crear: {total_devices}')
        self.stdout.write(f'     - LAPTOP: {device_counts.get("NOTEBOOK", 0)}')
        self.stdout.write(f'     - TELEFONO: {device_counts.get("CELULAR", 0)}')
        self.stdout.write(f'     - TABLET: {device_counts.get("TABLET", 0)}')
        self.stdout.write(f'     - DESKTOP: {device_counts.get("PC-ESCRITORIO", 0)}')
        self.stdout.write(f'   • Asignaciones a crear: {total_devices - len(unassigned_devices.get("devices", []))}')
        self.stdout.write(f'   • Dispositivos sin asignar: {len(unassigned_devices.get("devices", []))}')
        self.stdout.write(f'   • Sucursales a crear: {len(sucursales)}')
        self.stdout.write(f'   • Advertencias: {len(self.stats["warnings"])}')

    def import_data(self, consolidated_data: Dict, unassigned_devices: Dict):
        """Importa todos los datos en una transacción atómica."""
        try:
            with transaction.atomic():
                # Obtener usuario
                user = self.get_or_create_import_user()

                # Crear business units
                business_units = self.create_business_units()

                # Crear sucursales
                sucursales_names = set()
                for data in consolidated_data.values():
                    sucursales_names.add(data['employee_data']['sucursal'])
                branches = self.create_branches(sucursales_names, user)

                # Crear empleados
                employees = self.create_employees(consolidated_data, branches, business_units, user)

                # Crear dispositivos asignados
                devices = self.create_devices(consolidated_data, branches, employees, user)

                # Crear dispositivos sin asignar
                self.create_unassigned_devices(unassigned_devices, branches, user)

                # Crear asignaciones
                self.create_assignments(consolidated_data, employees, devices, user)

                self.stdout.write('')
                self.stdout.write(self.style.SUCCESS('✓ Transacción completada exitosamente'))

        except Exception as e:
            self.stdout.write('')
            self.stdout.write(self.style.ERROR(f'❌ ERROR en importación: {str(e)}'))
            self.stdout.write(self.style.ERROR('🔄 Todos los cambios fueron revertidos (rollback)'))
            raise

    def get_or_create_import_user(self) -> User:
        """Obtiene o crea usuario para created_by."""
        try:
            user = User.objects.filter(username='admin').first()
            if user:
                self.stdout.write(f'   ✓ Usuario encontrado: admin')
                return user
        except:
            pass

        # Crear usuario de importación
        user, created = User.objects.get_or_create(
            username='import_system',
            defaults={
                'email': 'import@system.local',
                'is_active': False,
            }
        )

        if created:
            self.stdout.write(self.style.WARNING('   ⚠ Usuario creado: import_system'))

        return user

    def create_business_units(self) -> Dict[str, BusinessUnit]:
        """Crea unidades de negocio."""
        units = [
            {'nombre': 'Back Office', 'codigo': 'BACKOFFICE'},
            {'nombre': 'Post Venta', 'codigo': 'POSTVENTA'},
            {'nombre': 'Ventas', 'codigo': 'VENTAS'},
        ]

        business_units = {}

        for unit_data in units:
            unit, created = BusinessUnit.objects.get_or_create(
                codigo=unit_data['codigo'],
                defaults={'nombre': unit_data['nombre']}
            )
            business_units[unit_data['codigo']] = unit

        self.stdout.write('   ✓ Unidades de negocio verificadas')
        return business_units

    def create_branches(self, branch_names: set, user: User) -> Dict[str, Branch]:
        """Crea todas las sucursales."""
        branches = {}
        created_count = 0

        for name in sorted(branch_names):
            if not name:
                continue

            code = self.generate_branch_code(name)

            branch, created = Branch.objects.get_or_create(
                codigo=code,
                defaults={
                    'nombre': name,
                    'is_active': True
                }
            )

            branches[name] = branch

            if created:
                created_count += 1
                self.stats['branches_created'] += 1

        self.stdout.write(f'   ✓ Sucursales creadas: {created_count}/{len(branch_names)}')
        return branches

    def create_employees(self, consolidated_data: Dict, branches: Dict,
                        business_units: Dict, user: User) -> Dict[str, Employee]:
        """Crea todos los empleados."""
        employees = {}
        created_count = 0
        existing_count = 0

        for rut, data in consolidated_data.items():
            if not rut:
                continue

            emp_data = data['employee_data']

            # Determinar correo corporativo vs personal
            correo = emp_data.get('correo_electronico', '').strip()
            correo_corporativo = correo if '@pompeyo.cl' in correo.lower() else None
            gmail_personal = correo if '@gmail.com' in correo.lower() else None

            # Obtener unidad de negocio
            area_negocio = emp_data.get('area_negocio', '').strip().upper()
            unidad_negocio = business_units.get(area_negocio)

            # Obtener sucursal
            sucursal_name = emp_data.get('sucursal')
            sucursal = branches.get(sucursal_name)

            if not sucursal:
                self.stats['warnings'].append(f'Sucursal no encontrada para empleado {rut}: {sucursal_name}')
                continue

            try:
                employee, created = Employee.objects.get_or_create(
                    rut=rut,
                    defaults={
                        'nombre_completo': emp_data.get('nombre_completo', ''),
                        'cargo': emp_data.get('cargo', ''),
                        'sucursal': sucursal,
                        'correo_corporativo': correo_corporativo,
                        'gmail_personal': gmail_personal,
                        'unidad_negocio': unidad_negocio,
                        'estado': 'ACTIVO',
                        'created_by': user
                    }
                )

                employees[rut] = employee

                if created:
                    created_count += 1
                    self.stats['employees_created'] += 1
                else:
                    existing_count += 1
                    self.stats['employees_existing'] += 1

                self.stats['employees_processed'] += 1

            except Exception as e:
                self.stats['errors'].append(f'Error creando empleado {rut}: {str(e)}')

        self.stdout.write(f'   ✓ Empleados creados: {created_count} (existentes: {existing_count})')
        return employees

    def create_devices(self, consolidated_data: Dict, branches: Dict,
                      employees: Dict, user: User) -> List[Device]:
        """Crea dispositivos asignados a empleados."""
        devices = []
        created_count = 0
        duplicated_count = 0

        # Mapeo de tipos
        tipo_map = {
            'NOTEBOOK': 'LAPTOP',
            'CELULAR': 'TELEFONO',
            'TABLET': 'TABLET',
            'PC-ESCRITORIO': 'DESKTOP',
        }

        for rut, data in consolidated_data.items():
            if not rut or rut not in employees:
                continue

            employee = employees[rut]
            emp_data = data['employee_data']
            sucursal_name = emp_data.get('sucursal')
            sucursal = branches.get(sucursal_name)

            for device_data in data['devices']:
                tipo_csv = device_data['tipo']
                tipo_equipo = tipo_map.get(tipo_csv, tipo_csv)

                marca = device_data.get('marca')
                modelo = device_data.get('modelo')
                numero_serie = device_data.get('numero_serie')
                imei = device_data.get('imei')
                numero_telefono = device_data.get('numero_telefono')

                # Limpiar valores
                if numero_serie and numero_serie.upper() in ['NO APLICA', 'NA', '']:
                    numero_serie = None
                if imei and imei.upper() in ['NO APLICA', 'NA', '']:
                    imei = None
                if numero_telefono and numero_telefono.upper() in ['NO APLICA', 'NA', '']:
                    numero_telefono = None

                # Validar que tiene identificador único
                if not numero_serie and not imei:
                    self.stats['warnings'].append(
                        f'Dispositivo sin serie ni IMEI: {marca} {modelo} - {rut}'
                    )
                    continue

                try:
                    # Intentar encontrar por serie o IMEI
                    device = None
                    if numero_serie:
                        device = Device.objects.filter(numero_serie=numero_serie).first()
                    elif imei:
                        device = Device.objects.filter(imei=imei).first()

                    if device:
                        duplicated_count += 1
                        self.stats['devices_duplicated'] += 1
                        devices.append(device)
                        continue

                    # Crear dispositivo nuevo
                    device = Device.objects.create(
                        tipo_equipo=tipo_equipo,
                        marca=marca or 'DESCONOCIDA',
                        modelo=modelo,
                        numero_serie=numero_serie,
                        imei=imei,
                        numero_telefono=numero_telefono,
                        sucursal=sucursal,
                        fecha_ingreso=date.today(),
                        valor_inicial=None,
                        estado='DISPONIBLE',
                        created_by=user
                    )

                    devices.append(device)
                    created_count += 1
                    self.stats['devices_created'] += 1
                    self.stats['devices_processed'] += 1
                    self.stats['devices_by_type'][tipo_equipo] += 1

                except IntegrityError as e:
                    duplicated_count += 1
                    self.stats['devices_duplicated'] += 1
                    self.stats['warnings'].append(
                        f'Dispositivo duplicado (IntegrityError): {numero_serie or imei}'
                    )
                except Exception as e:
                    self.stats['errors'].append(
                        f'Error creando dispositivo {numero_serie or imei}: {str(e)}'
                    )

        self.stdout.write(f'   ✓ Dispositivos creados: {created_count} (duplicados: {duplicated_count})')
        return devices

    def create_unassigned_devices(self, unassigned_devices: Dict, branches: Dict, user: User):
        """Crea dispositivos sin empleado asignado."""
        devices = unassigned_devices.get('devices', [])

        if not devices:
            return

        created_count = 0

        # Usar primera sucursal como default
        default_branch = list(branches.values())[0] if branches else None

        if not default_branch:
            self.stats['warnings'].append('No hay sucursales para dispositivos sin asignar')
            return

        tipo_map = {
            'NOTEBOOK': 'LAPTOP',
            'CELULAR': 'TELEFONO',
            'TABLET': 'TABLET',
            'PC-ESCRITORIO': 'DESKTOP',
        }

        for device_data in devices:
            tipo_csv = device_data['tipo']
            tipo_equipo = tipo_map.get(tipo_csv, tipo_csv)

            marca = device_data.get('marca')
            modelo = device_data.get('modelo')
            numero_serie = device_data.get('numero_serie')
            imei = device_data.get('imei')

            if numero_serie and numero_serie.upper() in ['NO APLICA', 'NA', '']:
                numero_serie = None
            if imei and imei.upper() in ['NO APLICA', 'NA', '']:
                imei = None

            if not numero_serie and not imei:
                continue

            try:
                # Verificar si existe
                device = None
                if numero_serie:
                    device = Device.objects.filter(numero_serie=numero_serie).first()
                elif imei:
                    device = Device.objects.filter(imei=imei).first()

                if device:
                    self.stats['devices_duplicated'] += 1
                    continue

                device = Device.objects.create(
                    tipo_equipo=tipo_equipo,
                    marca=marca or 'DESCONOCIDA',
                    modelo=modelo,
                    numero_serie=numero_serie,
                    imei=imei,
                    sucursal=default_branch,
                    fecha_ingreso=date.today(),
                    valor_inicial=None,
                    estado='DISPONIBLE',
                    created_by=user
                )

                created_count += 1
                self.stats['devices_created'] += 1
                self.stats['devices_processed'] += 1
                self.stats['devices_unassigned'] += 1
                self.stats['devices_by_type'][tipo_equipo] += 1

            except Exception as e:
                self.stats['errors'].append(
                    f'Error creando dispositivo sin asignar {numero_serie or imei}: {str(e)}'
                )

        self.stdout.write(f'   ✓ Dispositivos sin asignar creados: {created_count}')

    def create_assignments(self, consolidated_data: Dict, employees: Dict,
                          devices: List[Device], user: User):
        """Crea solicitudes y asignaciones."""
        created_count = 0
        device_idx = 0

        for rut, data in consolidated_data.items():
            if not rut or rut not in employees:
                continue

            employee = employees[rut]
            num_devices = len(data['devices'])

            # Asignar dispositivos a este empleado
            employee_devices = devices[device_idx:device_idx + num_devices]
            device_idx += num_devices

            for device in employee_devices:
                try:
                    # Crear solicitud
                    request = Request.objects.create(
                        empleado=employee,
                        sucursal=device.sucursal,
                        motivo='NUEVA_ENTREGA',
                        jefatura_solicitante='IMPORTACION_AUTOMATICA',
                        tipo_dispositivo=device.tipo_equipo,
                        justificacion='Importación automática desde inventario general',
                        estado='COMPLETADA',
                        created_by=user
                    )

                    # Crear asignación
                    assignment = Assignment.objects.create(
                        solicitud=request,
                        empleado=employee,
                        dispositivo=device,
                        tipo_entrega='PERMANENTE',
                        fecha_entrega=date.today(),
                        estado_carta='PENDIENTE',
                        estado_asignacion='ACTIVA',
                        observaciones='Asignación importada desde inventario general',
                        created_by=user
                    )

                    # Actualizar estado del dispositivo
                    device.estado = 'ASIGNADO'
                    device.save()

                    created_count += 1
                    self.stats['assignments_created'] += 1

                except Exception as e:
                    self.stats['errors'].append(
                        f'Error creando asignación para {rut} - {device.numero_serie or device.imei}: {str(e)}'
                    )

        self.stdout.write(f'   ✓ Asignaciones creadas: {created_count}')

    def print_final_report(self, elapsed_time: float):
        """Imprime reporte final de la importación."""
        self.stdout.write('')
        self.stdout.write('═' * 60)
        self.stdout.write(self.style.SUCCESS('✅ IMPORTACIÓN COMPLETADA EXITOSAMENTE'))
        self.stdout.write('═' * 60)
        self.stdout.write('')
        self.stdout.write('📊 ESTADÍSTICAS:')
        self.stdout.write('')

        self.stdout.write('👥 EMPLEADOS:')
        self.stdout.write(f'   • Total procesados:    {self.stats["employees_processed"]}')
        self.stdout.write(f'   • Creados:             {self.stats["employees_created"]}')
        self.stdout.write(f'   • Ya existían:         {self.stats["employees_existing"]}')
        self.stdout.write(f'   • Duplicados:          {self.stats["employees_duplicated"]} (consolidados)')
        self.stdout.write('')

        self.stdout.write('📱 DISPOSITIVOS:')
        self.stdout.write(f'   • Total procesados:    {self.stats["devices_processed"]}')
        self.stdout.write(f'   • Creados:             {self.stats["devices_created"]}')
        self.stdout.write(f'   • Duplicados (skip):   {self.stats["devices_duplicated"]}')
        self.stdout.write('')
        self.stdout.write('   Por tipo:')
        for tipo, count in self.stats['devices_by_type'].items():
            self.stdout.write(f'   - {tipo:12s} {count} creados')
        self.stdout.write('')

        self.stdout.write('🔗 ASIGNACIONES:')
        self.stdout.write(f'   • Total creadas:       {self.stats["assignments_created"]}')
        self.stdout.write(f'   • Sin asignar:         {self.stats["devices_unassigned"]} (dispositivos sin empleado)')
        self.stdout.write('')

        self.stdout.write('🏢 SUCURSALES:')
        self.stdout.write(f'   • Total creadas:       {self.stats["branches_created"]}')
        self.stdout.write('')

        if self.stats['warnings']:
            self.stdout.write(self.style.WARNING(f'⚠️  ADVERTENCIAS:        {len(self.stats["warnings"])}'))
        else:
            self.stdout.write('⚠️  ADVERTENCIAS:        0')

        if self.stats['errors']:
            self.stdout.write(self.style.ERROR(f'❌ ERRORES:              {len(self.stats["errors"])}'))
        else:
            self.stdout.write('❌ ERRORES:              0')

        self.stdout.write('')
        self.stdout.write(f'⏱️  Tiempo de ejecución:  {elapsed_time:.1f} segundos')
        self.stdout.write('═' * 60)
