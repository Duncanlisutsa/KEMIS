from django.shortcuts import render
from rest_framework import viewsets
from .models import Lease
from .serializers import LeaseSerializer


class LeaseViewSet(viewsets.ModelViewSet):
    queryset = Lease.objects.all()
    serializer_class = LeaseSerializer

# Create your views here.
