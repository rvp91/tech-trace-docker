# Generated manually for data migration

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('employees', '0004_create_businessunit'),
    ]

    operations = [
        migrations.AddField(
            model_name='employee',
            name='unidad_negocio_nueva',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='employees_temp',
                to='employees.businessunit',
                verbose_name='Unidad de negocio',
                limit_choices_to={'is_active': True}
            ),
        ),
    ]
