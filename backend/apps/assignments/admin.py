from django.contrib import admin
from .models import Request, Assignment, Return


@admin.register(Request)
class RequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'empleado', 'tipo_dispositivo', 'fecha_solicitud', 'estado', 'jefatura_solicitante')
    list_filter = ('estado', 'tipo_dispositivo', 'fecha_solicitud')
    search_fields = ('empleado__nombre_completo', 'jefatura_solicitante')
    readonly_fields = ('fecha_solicitud', 'created_at', 'updated_at', 'created_by')
    autocomplete_fields = ['empleado']

    def save_model(self, request, obj, form, change):
        if not change:  # Si es un nuevo objeto
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'empleado', 'dispositivo', 'fecha_entrega', 'estado_asignacion', 'tipo_entrega')
    list_filter = ('estado_asignacion', 'tipo_entrega', 'estado_carta', 'fecha_entrega')
    search_fields = ('empleado__nombre_completo', 'dispositivo__serie_imei')
    readonly_fields = ('created_at', 'updated_at', 'created_by')
    autocomplete_fields = ['empleado', 'dispositivo', 'solicitud']

    def save_model(self, request, obj, form, change):
        if not change:  # Si es un nuevo objeto
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(Return)
class ReturnAdmin(admin.ModelAdmin):
    list_display = ('id', 'asignacion', 'fecha_devolucion', 'estado_dispositivo', 'created_at')
    list_filter = ('estado_dispositivo', 'fecha_devolucion')
    search_fields = ('asignacion__empleado__nombre_completo', 'asignacion__dispositivo__serie_imei')
    readonly_fields = ('created_at', 'created_by')
    autocomplete_fields = ['asignacion']

    def save_model(self, request, obj, form, change):
        if not change:  # Si es un nuevo objeto
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
