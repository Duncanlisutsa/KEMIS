from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):

    tenant_name = serializers.CharField(
        source='lease.tenant.user.get_full_name',
        read_only=True
    )

    unit_number = serializers.CharField(
        source='lease.unit.unit_number',
        read_only=True
    )

    class Meta:
        model = Payment
        fields = [
            'id',
            'lease',
            'tenant_name',
            'unit_number',
            'amount',
            'payment_date',
            'payment_method',
            'payment_type',
            'reference_number',
            'status',
            'created_at'
        ]