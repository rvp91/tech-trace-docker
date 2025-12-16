# Generated manually for data migration

from django.db import migrations


def create_business_units_and_migrate_data(apps, schema_editor):
    """
    Crea las unidades de negocio y migra los datos existentes del campo CharField
    al nuevo campo ForeignKey.
    """
    BusinessUnit = apps.get_model('employees', 'BusinessUnit')
    Employee = apps.get_model('employees', 'Employee')

    # Definir las unidades de negocio a crear
    UNIDADES_INICIALES = [
        {'nombre': 'Operaciones', 'codigo': 'OPS'},
        {'nombre': 'Tecnología', 'codigo': 'TEC'},
        {'nombre': 'Soporte Técnico', 'codigo': 'SOP'},
        {'nombre': 'Logística', 'codigo': 'LOG'},
        {'nombre': 'Administración', 'codigo': 'ADM'},
        {'nombre': 'Recursos Humanos', 'codigo': 'RRH'},
        {'nombre': 'Ventas', 'codigo': 'VEN'},
        {'nombre': 'Marketing', 'codigo': 'MKT'},
    ]

    # Crear unidades de negocio
    unidades_map = {}
    for unidad_data in UNIDADES_INICIALES:
        unidad = BusinessUnit.objects.create(
            nombre=unidad_data['nombre'],
            codigo=unidad_data['codigo'],
            is_active=True
        )
        unidades_map[unidad.nombre] = unidad

    # Migrar empleados existentes
    for employee in Employee.objects.all():
        # Solo migrar si el campo antiguo tiene un valor
        if employee.unidad_negocio and employee.unidad_negocio.strip():
            # Buscar la unidad de negocio correspondiente
            if employee.unidad_negocio in unidades_map:
                employee.unidad_negocio_nueva = unidades_map[employee.unidad_negocio]
                employee.save(update_fields=['unidad_negocio_nueva'])


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
