from rest_framework import serializers
from .models import Estate
from .models import Estate, Unit



class EstateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Estate
        fields = '__all__'



class UnitSerializer(serializers.ModelSerializer):
    estate_name = serializers.CharField(
        source='estate.name',
        read_only=True
    )

    class Meta:
        model = Unit
        fields = '__all__'