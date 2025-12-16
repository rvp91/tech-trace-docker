# Generated manually for data migration

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('employees', '0006_migrate_business_unit_data'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='employee',
            name='unidad_negocio',
        ),
    ]
