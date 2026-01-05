# Generated manually for data migration

from django.db import migrations


def create_business_units_and_migrate_data(apps, schema_editor):
    """
    Migración deshabilitada: Las unidades de negocio fueron eliminadas por el usuario.
    Esta función ya no crea unidades de negocio ni migra datos.
    """
    # Migración deshabilitada - no crear unidades de negocio automáticamente
    pass


def reverse_migration(apps, schema_editor):
    """
    Revertir la migración eliminando las unidades de negocio creadas.
    """
    BusinessUnit = apps.get_model('employees', 'BusinessUnit')
    BusinessUnit.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('employees', '0005_add_temp_unidad_negocio_field'),
    ]

    operations = [
        migrations.RunPython(
            create_business_units_and_migrate_data,
            reverse_migration
        ),
    ]
