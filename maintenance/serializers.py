from rest_framework import serializers
from .models import MaintenanceRequest


class MaintenanceRequestSerializer(serializers.ModelSerializer):

    tenant_name = serializers.CharField(
        source='tenant.user.get_full_name',
        read_only=True
    )

    unit_number = serializers.CharField(
        source='unit.unit_number',
        read_only=True
    )

    class Meta:
        model = MaintenanceRequest
        fields = [
            'id',
            'tenant',
            'tenant_name',
            'unit',
            'unit_number',
            'title',
            'description',
            'priority',
            'status',
            'reported_date',
            'resolved_date'
        ]
        extra_kwargs = {
            'tenant': {'required': False},
            'unit': {'required': False},
        }