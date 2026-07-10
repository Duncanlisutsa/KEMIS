from rest_framework import viewsets
from .models import Lease
from .serializers import LeaseSerializer
from accounts.permissions import IsAdminOrManagerOrTenant


class LeaseViewSet(viewsets.ModelViewSet):
    serializer_class = LeaseSerializer
    permission_classes = [IsAdminOrManagerOrTenant]

    def get_queryset(self):
        user = self.request.user

        # Admin and Manager
        if user.role in ["ADMIN", "MANAGER"]:
            return Lease.objects.all()

        # Tenant
        if user.role == "TENANT":
            return Lease.objects.filter(tenant=user.tenant)

        return Lease.objects.none()