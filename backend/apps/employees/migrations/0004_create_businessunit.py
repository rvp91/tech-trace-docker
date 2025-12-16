# Generated manually for data migration

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('employees', '0003_alter_employee_rut'),
    ]

    operations = [
        migrations.CreateModel(
            name='BusinessUnit',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=100, unique=True, verbose_name='Nombre')),
                ('codigo', models.CharField(help_text='Código corto identificador (ej: TEC, OPS, VEN)', max_length=20, unique=True, verbose_name='Código')),
                ('descripcion', models.TextField(blank=True, null=True, verbose_name='Descripción')),
                ('is_active', models.BooleanField(default=True, verbose_name='Activo')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Última actualización')),
            ],
            options={
                'verbose_name': 'Unidad de Negocio',
                'verbose_name_plural': 'Unidades de Negocio',
                'ordering': ['nombre'],
            },
        ),
    ]
