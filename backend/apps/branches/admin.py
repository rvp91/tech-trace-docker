from django.contrib import admin
from .models import Branch


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre', 'ciudad', 'is_active', 'created_at')
    list_filter = ('is_active', 'ciudad')
    search_fields = ('codigo', 'nombre', 'ciudad')
    readonly_fields = ('created_at', 'updated_at')
