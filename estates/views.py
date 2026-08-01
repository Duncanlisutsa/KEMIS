from django.db.models import ProtectedError
from rest_framework import viewsets, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from .models import Estate, Unit
from .serializers import EstateSerializer, UnitSerializer
from accounts.permissions import (
    IsAdmin,
    IsAdminOrManager,
    IsAdminOrManagerOrLandlordReadOnly,
)
from leases.utils import auto_expire_leases
from audit.mixins import AuditLogMixin


class EstateViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = Estate.objects.all()
    serializer_class = EstateSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAdmin()]
        return [IsAdminOrManagerOrLandlordReadOnly()]

    def get_queryset(self):
        user = self.request.user

        if user.role == "ADMIN":
            return Estate.objects.all()

        if user.role == "MANAGER":
            return Estate.objects.filter(manager=user)

        if user.role == "LANDLORD":
            return Estate.objects.filter(owner=user)

        return Estate.objects.none()

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"detail": "Cannot be deleted. Has unit(s) linked to it."},
                status=status.HTTP_400_BAD_REQUEST,
            )


class UnitViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = Unit.objects.all()
    permission_classes = [IsAdminOrManagerOrLandlordReadOnly]
    serializer_class = UnitSerializer

    def get_queryset(self):
        auto_expire_leases()

        user = self.request.user

        if user.role == "ADMIN":
            return Unit.objects.all()

        if user.role == "MANAGER":
            return Unit.objects.filter(estate__manager=user)

        if user.role == "LANDLORD":
            return Unit.objects.filter(estate__owner=user)

        return Unit.objects.none()

    def _check_estate_ownership(self, user, estate):
        if user.role == "MANAGER" and estate.manager_id != user.id:
            raise ValidationError(
                {"estate": "You can only manage units within your own estate."}
            )

    def perform_create(self, serializer):
        user = self.request.user
        estate = serializer.validated_data.get("estate")

        self._check_estate_ownership(user, estate)
        instance = serializer.save()
        self._audit_log("CREATE", instance)

    def perform_update(self, serializer):
        user = self.request.user
        estate = serializer.validated_data.get("estate", serializer.instance.estate)

        self._check_estate_ownership(user, estate)
        old_snapshot = self._audit_snapshot(serializer.instance)
        instance = serializer.save()
        self._audit_log("UPDATE", instance, old_snapshot=old_snapshot)

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"detail": "Cannot be deleted. Has lease(s) linked to it."},
                status=status.HTTP_400_BAD_REQUEST,
            )