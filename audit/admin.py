from django.contrib import admin

from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'actor', 'action', 'model_name', 'object_repr')
    list_filter = ('action', 'model_name')
    search_fields = ('object_repr', 'actor__username')

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False