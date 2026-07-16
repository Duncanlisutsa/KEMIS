from django.db.models import ProtectedError
from rest_framework import viewsets, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from .models import Lease
from .serializers import LeaseSerializer
from accounts.permissions import IsAdminOrManagerOrTenant


class LeaseViewSet(viewsets.ModelViewSet):
    serializer_class = LeaseSerializer
    permission_classes = [IsAdminOrManagerOrTenant]

    def get_queryset(self):
        user = self.request.user

        if user.role == "ADMIN":
            return Lease.objects.all()

        if user.role == "MANAGER":
            return Lease.objects.filter(unit__estate__manager=user)

        if user.role == "TENANT":
            return Lease.objects.filter(tenant=user.tenant)

        return Lease.objects.none()

    def _check_unit_ownership(self, user, unit):
        if user.role == "MANAGER" and unit.estate.manager_id != user.id:
            raise ValidationError(
                {"unit": "You can only create leases for units within your own estate."}
            )

    def perform_create(self, serializer):
        user = self.request.user
        unit = serializer.validated_data.get("unit")

        self._check_unit_ownership(user, unit)
        serializer.save()

    def perform_update(self, serializer):
        user = self.request.user
        unit = serializer.validated_data.get("unit", serializer.instance.unit)

        self._check_unit_ownership(user, unit)
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"detail": "Cannot be deleted. Has payment(s) linked to it."},
                status=status.HTTP_400_BAD_REQUEST,
            )