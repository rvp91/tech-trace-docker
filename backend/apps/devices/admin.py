from django.contrib import admin
from .models import Device


@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = ('serie_imei', 'tipo_equipo', 'marca', 'modelo', 'estado', 'sucursal', 'fecha_ingreso')
    list_filter = ('tipo_equipo', 'estado', 'sucursal', 'marca')
    search_fields = ('serie_imei', 'marca', 'modelo', 'numero_telefono', 'numero_factura')
    readonly_fields = ('created_at', 'updated_at', 'created_by')
    autocomplete_fields = ['sucursal']

    def save_model(self, request, obj, form, change):
        if not change:  # Si es un nuevo objeto
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
