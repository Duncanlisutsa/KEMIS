from django.shortcuts import render
from rest_framework import viewsets
from .models import Lease
from .serializers import LeaseSerializer
from accounts.permissions import IsAdminOrManager

class LeaseViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminOrManager]
    queryset = Lease.objects.all()
    serializer_class = LeaseSerializer

# Create your views here.
