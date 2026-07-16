from rest_framework import viewsets
from rest_framework.exceptions import ValidationError

from .models import MaintenanceRequest
from .serializers import MaintenanceRequestSerializer
from accounts.permissions import IsAdminOrManagerOrTenant
from leases.models import Lease


class MaintenanceRequestViewSet(viewsets.ModelViewSet):
    serializer_class = MaintenanceRequestSerializer
    permission_classes = [IsAdminOrManagerOrTenant]

    def get_queryset(self):
        user = self.request.user

        if user.role == "ADMIN":
            return MaintenanceRequest.objects.all()

        if user.role == "MANAGER":
            return MaintenanceRequest.objects.filter(unit__estate__manager=user)

        if user.role == "TENANT":
            return MaintenanceRequest.objects.filter(tenant=user.tenant)

        return MaintenanceRequest.objects.none()

    def _tenants_active_lease(self, user):
        return Lease.objects.filter(
            tenant=user.tenant,
            status="ACTIVE",
        ).first()

    def perform_create(self, serializer):
        user = self.request.user

        if user.role == "TENANT":
            active_lease = self._tenants_active_lease(user)

            if not active_lease:
                raise ValidationError(
                    "You don't have an active lease, so you can't file a maintenance request."
                )

            serializer.save(tenant=user.tenant, unit=active_lease.unit)
            return

        if not serializer.validated_data.get("tenant") or not serializer.validated_data.get("unit"):
            raise ValidationError("Both tenant and unit are required.")

        unit = serializer.validated_data.get("unit")
        if user.role == "MANAGER" and unit.estate.manager_id != user.id:
            raise ValidationError(
                {"unit": "You can only file requests for units within your own estate."}
            )

        serializer.save()

    def perform_update(self, serializer):
        user = self.request.user

        if user.role == "TENANT":
            active_lease = self._tenants_active_lease(user)

            serializer.save(
                tenant=user.tenant,
                unit=active_lease.unit if active_lease else serializer.instance.unit,
                status=serializer.instance.status,
                resolved_date=serializer.instance.resolved_date,
            )
            return

        serializer.save()