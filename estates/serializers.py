from rest_framework import serializers
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
        fields = [
            'id',
            'estate',
            'estate_name',
            'unit_number',
            'unit_type',
            'rent_amount',
            'status'
        ]