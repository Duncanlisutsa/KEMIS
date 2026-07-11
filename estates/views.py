from django.db.models import ProtectedError
from rest_framework import viewsets, status
from rest_framework.response import Response

from .models import Estate, Unit
from .serializers import EstateSerializer, UnitSerializer
from accounts.permissions import IsAdminOrManager


class EstateViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminOrManager]
    queryset = Estate.objects.all()
    serializer_class = EstateSerializer

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
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"detail": "Cannot be deleted. Has lease(s) linked to it."},
                status=status.HTTP_400_BAD_REQUEST,
            )