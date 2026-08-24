from django.db.models import ProtectedError, Q
from rest_framework import viewsets, status
from rest_framework.response import Response

from .models import Tenant
from .serializers import TenantSerializer
from accounts.permissions import IsAdminOrManagerOrLandlordReadOnly
from audit.mixins import AuditLogMixin


class TenantViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = Tenant.objects.all()
    permission_classes = [IsAdminOrManagerOrLandlordReadOnly]
    serializer_class = TenantSerializer

    def get_queryset(self):
        user = self.request.user

        if user.role == "ADMIN":
            return Tenant.objects.all()

        if user.role == "MANAGER":
            return Tenant.objects.filter(
                Q(leases__unit__estate__managers=user) | Q(leases__isnull=True)
            ).distinct()

        if user.role == "LANDLORD":
            return Tenant.objects.filter(
                leases__unit__estate__owner=user
            ).distinct()

        return Tenant.objects.none()

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"detail": "Cannot be deleted. Has active lease(s)."},
                status=status.HTTP_400_BAD_REQUEST,
            )