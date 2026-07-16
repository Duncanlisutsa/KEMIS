from django.db.models import ProtectedError
from rest_framework import viewsets, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from .models import Estate, Unit
from .serializers import EstateSerializer, UnitSerializer
from accounts.permissions import IsAdmin, IsAdminOrManager


class EstateViewSet(viewsets.ModelViewSet):
    serializer_class = EstateSerializer

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAdmin()]
        return [IsAdminOrManager()]

    def get_queryset(self):
        user = self.request.user

        if user.role == "ADMIN":
            return Estate.objects.all()

        if user.role == "MANAGER":
            return Estate.objects.filter(manager=user)

        return Estate.objects.none()

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"detail": "Cannot be deleted. Has unit(s) linked to it."},
                status=status.HTTP_400_BAD_REQUEST,
            )


class UnitViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminOrManager]
    serializer_class = UnitSerializer

    def get_queryset(self):
        user = self.request.user

        if user.role == "ADMIN":
            return Unit.objects.all()

        if user.role == "MANAGER":
            return Unit.objects.filter(estate__manager=user)

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
        serializer.save()

    def perform_update(self, serializer):
        user = self.request.user
        estate = serializer.validated_data.get("estate", serializer.instance.estate)

        self._check_estate_ownership(user, estate)
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"detail": "Cannot be deleted. Has lease(s) linked to it."},
                status=status.HTTP_400_BAD_REQUEST,
            )