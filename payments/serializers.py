from rest_framework import serializers
from leases.models import Lease
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):

    # Not required at the serializer level because a tenant submitting a
    # payment doesn't pick a lease - the view auto-assigns their active
    # one. Managers/admins recording a payment directly must supply it
    # (enforced in the view).
    lease = serializers.PrimaryKeyRelatedField(
        queryset=Lease.objects.all(),
        required=False,
    )

    tenant_name = serializers.CharField(
        source='lease.tenant.user.get_full_name',
        read_only=True
    )

    unit_number = serializers.CharField(
        source='lease.unit.unit_number',
        read_only=True
    )

    submitted_by_name = serializers.CharField(
        source='submitted_by.get_full_name',
        read_only=True,
        default=None,
    )

    approved_by_name = serializers.CharField(
        source='approved_by.get_full_name',
        read_only=True,
        default=None,
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
            'submitted_by',
            'submitted_by_name',
            'approved_by',
            'approved_by_name',
            'approved_at',
            'rejection_reason',
            'created_at',
        ]
        read_only_fields = [
            'status',
            'submitted_by',
            'approved_by',
            'approved_at',
            'rejection_reason',
        ]