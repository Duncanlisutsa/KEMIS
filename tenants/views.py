from django.shortcuts import render

from rest_framework import viewsets
from .models import Tenant
from .serializers import TenantSerializer
from accounts.permissions import IsAdminOrManager


class TenantViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminOrManager]
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer

# Create your views here.
