"""
Comando de Django para rellenar snapshots de dispositivos en reportes de descuento.

Este comando ayuda a:
1. Identificar asignaciones con discount_data pero sin snapshot
2. Rellenar snapshots para dispositivos que aún existen
3. Reportar dispositivos ya eliminados que perdieron su información

Uso:
    python manage.py fix_discount_snapshots [--dry-run]
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.assignments.models import Assignment


class Command(BaseCommand):
    help = 'Rellena snapshots de dispositivos en reportes de descuento existentes'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Solo muestra lo que haría sin hacer cambios',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']

        if dry_run:
            self.stdout.write(self.style.WARNING('=== MODO DRY RUN - NO SE HARÁN CAMBIOS ===\n'))

        # Buscar asignaciones finalizadas con discount_data
        assignments = Assignment.objects.filter(
            estado_asignacion='FINALIZADA',
            discount_data__isnull=False
        ).select_related('dispositivo', 'dispositivo__sucursal')

        total = assignments.count()
        self.stdout.write(f'Total de asignaciones con discount_data: {total}\n')

        # Contadores
        with_snapshot = 0
        without_snapshot_with_device = 0
        without_snapshot_no_device = 0
        updated = 0

        for assignment in assignments:
            # Verificar si ya tiene snapshot
            if assignment.discount_data and 'dispositivo_snapshot' in assignment.discount_data:
                with_snapshot += 1
                continue

            # No tiene snapshot
            if assignment.dispositivo:
                # Dispositivo existe - podemos crear snapshot
                without_snapshot_with_device += 1

                self.stdout.write(
                    f'  → Asignación #{assignment.id}: '
                    f'{assignment.empleado.nombre_completo} - '
                    f'{assignment.dispositivo.get_tipo_equipo_display()} '
                    f'{assignment.dispositivo.marca} {assignment.dispositivo.modelo or ""} '
                    f'({assignment.dispositivo.numero_serie or assignment.dispositivo.imei or "sin serial"})'
                )

                if not dry_run:
                    # Agregar snapshot
                    assignment.discount_data['dispositivo_snapshot'] = {
                        'id': assignment.dispositivo.id,
                        'tipo_equipo': assignment.dispositivo.tipo_equipo,
                        'tipo_equipo_display': assignment.dispositivo.get_tipo_equipo_display(),
                        'marca': assignment.dispositivo.marca,
                        'modelo': assignment.dispositivo.modelo,
                        'numero_serie': assignment.dispositivo.numero_serie,
                        'imei': assignment.dispositivo.imei,
                        'numero_telefono': assignment.dispositivo.numero_telefono,
                        'estado': assignment.dispositivo.estado,
                        'sucursal_id': assignment.dispositivo.sucursal_id,
                        'sucursal_nombre': assignment.dispositivo.sucursal.nombre if assignment.dispositivo.sucursal else None,
                    }
                    assignment.save(update_fields=['discount_data', 'updated_at'])
                    updated += 1
                    self.stdout.write(self.style.SUCCESS('    ✓ Snapshot agregado'))

            else:
                # Dispositivo eliminado - no podemos recuperar la información
                without_snapshot_no_device += 1

                self.stdout.write(
                    self.style.ERROR(
                        f'  ✗ Asignación #{assignment.id}: '
                        f'{assignment.empleado.nombre_completo} - '
                        f'Dispositivo eliminado (sin snapshot)'
                    )
                )

        # Resumen
        self.stdout.write('\n' + '=' * 70)
        self.stdout.write(self.style.SUCCESS(f'\nRESUMEN:'))
        self.stdout.write(f'  Total procesadas: {total}')
        self.stdout.write(self.style.SUCCESS(f'  ✓ Con snapshot ya existente: {with_snapshot}'))

        if not dry_run:
            self.stdout.write(self.style.SUCCESS(f'  ✓ Snapshots agregados: {updated}'))
        else:
            self.stdout.write(self.style.WARNING(f'  → Se agregarían {without_snapshot_with_device} snapshots'))

        if without_snapshot_no_device > 0:
            self.stdout.write(
                self.style.ERROR(
                    f'  ✗ Dispositivos eliminados sin snapshot: {without_snapshot_no_device}\n'
                    f'    (Estos registros mostrarán "N/A" en el reporte)'
                )
            )

        if dry_run:
            self.stdout.write(
                self.style.WARNING('\nEjecuta sin --dry-run para aplicar los cambios')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f'\n✓ Proceso completado. {updated} snapshots agregados.')
            )
