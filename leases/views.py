from django.db.models import ProtectedError
from rest_framework import viewsets, status
from rest_framework.response import Response

from .models import Lease
from .serializers import LeaseSerializer
from accounts.permissions import IsAdminOrManagerOrTenant


class LeaseViewSet(viewsets.ModelViewSet):
    serializer_class = LeaseSerializer
    permission_classes = [IsAdminOrManagerOrTenant]

    def get_queryset(self):
        user = self.request.user

        if user.role in ["ADMIN", "MANAGER"]:
            return Lease.objects.all()

        if user.role == "TENANT":
            return Lease.objects.filter(tenant=user.tenant)

        return Lease.objects.none()

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"detail": "Cannot be deleted. Has payment(s) linked to it."},
                status=status.HTTP_400_BAD_REQUEST,
            )