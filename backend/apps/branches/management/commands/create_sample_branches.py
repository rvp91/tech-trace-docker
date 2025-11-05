from django.core.management.base import BaseCommand
from apps.branches.models import Branch


class Command(BaseCommand):
    help = 'Crea sucursales de prueba para el sistema'

    def handle(self, *args, **options):
        branches_data = [
            {
                'nombre': 'Casa Matriz Santiago',
                'codigo': 'SCL-01',
                'direccion': 'Av. Providencia 1234, Providencia',
                'ciudad': 'Santiago',
            },
            {
                'nombre': 'Sucursal Valparaíso',
                'codigo': 'VAL-01',
                'direccion': 'Av. Brasil 567, Valparaíso',
                'ciudad': 'Valparaíso',
            },
            {
                'nombre': 'Sucursal Concepción',
                'codigo': 'CON-01',
                'direccion': 'Calle O\'Higgins 890, Concepción',
                'ciudad': 'Concepción',
            },
        ]

        created_count = 0
        updated_count = 0

        for branch_data in branches_data:
            branch, created = Branch.objects.get_or_create(
                codigo=branch_data['codigo'],
                defaults=branch_data
            )

            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Sucursal creada: {branch.codigo} - {branch.nombre}')
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'○ Sucursal ya existe: {branch.codigo} - {branch.nombre}')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'\n✓ Proceso completado: {created_count} creadas, {updated_count} ya existían'
            )
        )
