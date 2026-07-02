from rest_framework import viewsets
from .models import Lease
from .serializers import LeaseSerializer
from accounts.permissions import IsAdminOrManager


class LeaseViewSet(viewsets.ModelViewSet):
    queryset = Lease.objects.all()   # <-- Add this back
    serializer_class = LeaseSerializer
    permission_classes = [IsAdminOrManager]

    def get_queryset(self):
        user = self.request.user

        # Admin and Manager
        if (
            user.groups.filter(name="Admin").exists() or
            user.groups.filter(name="Manager").exists()
        ):
            return Lease.objects.all()

        # Tenant
        if user.groups.filter(name="Tenant").exists():
            return Lease.objects.filter(
                tenant=user.tenant
            )

        return Lease.objects.none()