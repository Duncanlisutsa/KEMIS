from django.shortcuts import render
from rest_framework import viewsets
from .models import Estate
from .serializers import EstateSerializer
from .models import Estate, Unit
from .serializers import EstateSerializer, UnitSerializer



class EstateViewSet(viewsets.ModelViewSet):
    queryset = Estate.objects.all()
    serializer_class = EstateSerializer


class UnitViewSet(viewsets.ModelViewSet):
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer

# Create your views here.
