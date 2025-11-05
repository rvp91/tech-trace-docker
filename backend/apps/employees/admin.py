from django.contrib import admin
from .models import Employee


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('rut', 'nombre_completo', 'cargo', 'sucursal', 'estado', 'created_at')
    list_filter = ('estado', 'sucursal', 'unidad_negocio')
    search_fields = ('rut', 'nombre_completo', 'cargo', 'correo_corporativo')
    readonly_fields = ('created_at', 'updated_at', 'created_by')
    autocomplete_fields = ['sucursal']

    def save_model(self, request, obj, form, change):
        if not change:  # Si es un nuevo objeto
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
