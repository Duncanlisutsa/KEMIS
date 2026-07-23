from django.db import transaction
from django.db.models import Sum
from rest_framework import serializers

from .models import Lease
from estates.models import Unit


class LeaseSerializer(serializers.ModelSerializer):

    tenant_name = serializers.CharField(
        source="tenant.user.get_full_name",
        read_only=True,
    )

    unit_number = serializers.CharField(
        source="unit.unit_number",
        read_only=True,
    )

    duration_months = serializers.IntegerField(read_only=True)
    total_rent_due = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    total_rent_paid = serializers.SerializerMethodField(read_only=True)
    rent_balance = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Lease
        fields = [
            "id",
            "tenant",
            "tenant_name",
            "unit",
            "unit_number",
            "start_date",
            "end_date",
            "monthly_rent",
            "security_deposit",
            "status",
            "duration_months",
            "total_rent_due",
            "total_rent_paid",
            "rent_balance",
            "created_at",
        ]

    def get_total_rent_paid(self, obj):
        total = obj.payments.filter(
            status="PAID",
            payment_type="RENT",
        ).aggregate(total=Sum("amount"))["total"]
        return total or 0

    def get_rent_balance(self, obj):
        """
        Positive = credit (tenant has paid more than owed so far).
        Negative = debit (tenant still owes rent).
        """
        return self.get_total_rent_paid(obj) - obj.total_rent_due

    def validate(self, attrs):
        """
        Prevent more than one ACTIVE lease for the same unit.
        """

        unit = attrs.get("unit")
        status = attrs.get("status", "ACTIVE")

        if self.instance:
            unit = attrs.get("unit", self.instance.unit)
            status = attrs.get("status", self.instance.status)

        if status == "ACTIVE":
            active_lease = Lease.objects.filter(
                unit=unit,
                status="ACTIVE",
            )

            if self.instance:
                active_lease = active_lease.exclude(pk=self.instance.pk)

            if active_lease.exists():
                raise serializers.ValidationError(
                    {
                        "unit": "This unit already has an active lease."
                    }
                )

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        lease = Lease.objects.create(**validated_data)

        if (
            lease.status == "ACTIVE"
            and lease.unit.status != "MAINTENANCE"
        ):
            lease.unit.status = "OCCUPIED"
            lease.unit.save()

        return lease

    @transaction.atomic
    def update(self, instance, validated_data):

        old_status = instance.status

        lease = super().update(instance, validated_data)

        if (
            lease.status == "ACTIVE"
            and lease.unit.status != "MAINTENANCE"
        ):
            lease.unit.status = "OCCUPIED"
            lease.unit.save()

        elif (
            old_status == "ACTIVE"
            and lease.status in ["EXPIRED", "TERMINATED"]
        ):
            other_active = Lease.objects.filter(
                unit=lease.unit,
                status="ACTIVE",
            ).exclude(pk=lease.pk)

            if not other_active.exists():
                lease.unit.status = "VACANT"
                lease.unit.save()

        return lease