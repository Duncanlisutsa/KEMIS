from django.db.models import ProtectedError
from rest_framework import viewsets, status
from rest_framework.response import Response

from .models import Tenant
from .serializers import TenantSerializer
from accounts.permissions import IsAdminOrManager


class TenantViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminOrManager]
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"detail": "Cannot be deleted. Has active lease(s)."},
                status=status.HTTP_400_BAD_REQUEST,
            )