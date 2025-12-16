from django.contrib import admin
from .models import Employee, BusinessUnit


@admin.register(BusinessUnit)
class BusinessUnitAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'is_active', 'total_empleados', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('codigo', 'nombre', 'descripcion')
    readonly_fields = ('created_at', 'updated_at', 'total_empleados')
    fieldsets = (
        ('Información Básica', {
            'fields': ('nombre', 'codigo', 'descripcion')
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Metadatos', {
            'fields': ('created_at', 'updated_at', 'total_empleados'),
            'classes': ('collapse',)
        }),
    )

    def total_empleados(self, obj):
        """Muestra el total de empleados asignados a esta unidad"""
        if obj.pk:
            return obj.employee_set.count()
        return 0
    total_empleados.short_description = 'Total de empleados'


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
