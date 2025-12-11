from django.contrib import admin
from .models import Device


@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = ('get_identificador', 'tipo_equipo', 'marca', 'modelo', 'estado', 'sucursal', 'fecha_ingreso', 'edad_dispositivo', 'get_valor_depreciado_display')
    list_filter = ('tipo_equipo', 'estado', 'sucursal', 'marca')
    search_fields = ('numero_serie', 'imei', 'marca', 'modelo', 'numero_telefono', 'numero_factura')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'edad_dispositivo', 'get_valor_depreciado_display')
    autocomplete_fields = ['sucursal']

    def get_identificador(self, obj):
        """Muestra numero_serie o IMEI como identificador"""
        return obj.numero_serie or obj.imei or 'S/N'
    get_identificador.short_description = 'Identificador'

    def get_valor_depreciado_display(self, obj):
        """Muestra el valor depreciado calculado"""
        if obj.debe_calcular_valor():
            valor = obj.get_valor_depreciado()
            if valor is not None:
                manual_tag = " (Manual)" if obj.es_valor_manual else " (Auto)"
                return f"${valor:,.2f}{manual_tag}"
        return "-"
    get_valor_depreciado_display.short_description = 'Valor Depreciado'

    def save_model(self, request, obj, form, change):
        if not change:  # Si es un nuevo objeto
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
