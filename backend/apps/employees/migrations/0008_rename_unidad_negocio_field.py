# Generated manually for data migration

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('employees', '0007_remove_old_unidad_negocio'),
    ]

    operations = [
        migrations.RenameField(
            model_name='employee',
            old_name='unidad_negocio_nueva',
            new_name='unidad_negocio',
        ),
    ]
