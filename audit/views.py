from rest_framework import viewsets

from accounts.permissions import IsAdmin

from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin-only. Supports optional filtering:
      ?model=Lease
      ?action=DELETE
    Capped at the 500 most recent entries per request.
    """
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = AuditLog.objects.select_related('actor').all()

        model_name = self.request.query_params.get('model')
        if model_name:
            qs = qs.filter(model_name__iexact=model_name)

        action = self.request.query_params.get('action')
        if action:
            qs = qs.filter(action__iexact=action)

        return qs[:500]