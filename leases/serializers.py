from rest_framework import serializers
from .models import Lease


class LeaseSerializer(serializers.ModelSerializer):

    tenant_name = serializers.CharField(
        source='tenant.user.get_full_name',
        read_only=True
    )

    unit_number = serializers.CharField(
        source='unit.unit_number',
        read_only=True
    )

    class Meta:
        model = Lease
        fields = [
            'id',
            'tenant',
            'tenant_name',
            'unit',
            'unit_number',
            'start_date',
            'end_date',
            'monthly_rent',
            'security_deposit',
            'status',
            'created_at'
        ]