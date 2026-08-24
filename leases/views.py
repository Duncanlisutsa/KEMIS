from django.db import transaction
from django.db.models import ProtectedError
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from .models import Lease
from .serializers import LeaseSerializer, LeaseTransferSerializer
from .utils import auto_expire_leases
from accounts.permissions import IsAdminOrManager, IsAdminOrManagerOrTenantOrLandlordReadOnly
from audit.mixins import AuditLogMixin


class LeaseViewSet(AuditLogMixin, viewsets.ModelViewSet):
    serializer_class = LeaseSerializer
    permission_classes = [IsAdminOrManagerOrTenantOrLandlordReadOnly]

    def get_permissions(self):
        if self.action == "transfer":
            return [IsAdminOrManager()]
        return super().get_permissions()

    def get_queryset(self):
        auto_expire_leases()

        user = self.request.user

        if user.role == "ADMIN":
            return Lease.objects.all()

        if user.role == "MANAGER":
            return Lease.objects.filter(unit__estate__managers=user).distinct()

        if user.role == "TENANT":
            return Lease.objects.filter(tenant=user.tenant)

        if user.role == "LANDLORD":
            return Lease.objects.filter(unit__estate__owner=user)

        return Lease.objects.none()

    def _check_unit_ownership(self, user, unit):
        if user.role == "MANAGER" and not unit.estate.managers.filter(id=user.id).exists():
            raise ValidationError(
                {"unit": "You can only create leases for units within your own estate."}
            )

    def perform_create(self, serializer):
        user = self.request.user
        unit = serializer.validated_data.get("unit")

        self._check_unit_ownership(user, unit)
        instance = serializer.save()
        self._audit_log("CREATE", instance)

    def perform_update(self, serializer):
        user = self.request.user
        unit = serializer.validated_data.get("unit", serializer.instance.unit)

        self._check_unit_ownership(user, unit)
        old_snapshot = self._audit_snapshot(serializer.instance)
        instance = serializer.save()
        self._audit_log("UPDATE", instance, old_snapshot=old_snapshot)

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"detail": "Cannot be deleted. Has payment(s) linked to it."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=True, methods=["post"], url_path="transfer")
    def transfer(self, request, pk=None):
        """
        Move the tenant on this active lease into a different vacant
        unit within the same estate. The same Lease row is kept and
        just repointed at the new unit (with its rent updated to the
        new unit's rate) - so every Payment already linked to this
        lease (lease_id never changes) moves with the tenant
        automatically, with no separate migration of payment records
        needed. The vacated unit is freed up and the new one marked
        occupied in the same transaction.

        Reachable by: Admins/Managers only (within their scoped
        queryset). Tenants cannot transfer themselves, and Landlords
        are read-only and cannot call this either.
        """
        lease = self.get_object()

        if lease.status != "ACTIVE":
            return Response(
                {"detail": "Only an active lease can be transferred to another room."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = LeaseTransferSerializer(
            data=request.data,
            context={"lease": lease},
        )
        serializer.is_valid(raise_exception=True)
        new_unit = serializer.validated_data["new_unit"]
        old_unit = lease.unit

        old_snapshot = self._audit_snapshot(lease)

        with transaction.atomic():
            lease.unit = new_unit
            lease.monthly_rent = new_unit.rent_amount
            lease.save(update_fields=["unit", "monthly_rent"])

            if old_unit.status != "MAINTENANCE":
                old_unit.status = "VACANT"
                old_unit.save(update_fields=["status"])

            new_unit.status = "OCCUPIED"
            new_unit.save(update_fields=["status"])

        self._audit_log("UPDATE", lease, old_snapshot=old_snapshot)

        return Response(LeaseSerializer(lease).data)