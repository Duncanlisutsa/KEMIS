from django.db import transaction
from rest_framework import serializers

from .models import Lease
from estates.models import Unit


class LeaseTransferSerializer(serializers.Serializer):
    """
    Validates a request to move an active lease's tenant from their
    current unit into a different, vacant one. The Lease row itself
    (and therefore every Payment linked to it via lease_id) is kept -
    only its `unit` and `monthly_rent` change - so the tenant's full
    payment history travels with her to the new room automatically.
    """

    new_unit = serializers.PrimaryKeyRelatedField(queryset=Unit.objects.all())

    def validate_new_unit(self, value):
        lease = self.context["lease"]

        if value.pk == lease.unit_id:
            raise serializers.ValidationError(
                "The tenant is already occupying this unit."
            )

        if value.estate_id != lease.unit.estate_id:
            raise serializers.ValidationError(
                "You can only transfer to a vacant room within the same estate."
            )

        if value.status != "VACANT":
            raise serializers.ValidationError(
                "This unit is not vacant."
            )

        if Lease.objects.filter(unit=value, status="ACTIVE").exists():
            raise serializers.ValidationError(
                "This unit already has an active lease."
            )

        return value


class LeaseSerializer(serializers.ModelSerializer):

    tenant_name = serializers.CharField(
        source="tenant.user.get_full_name",
        read_only=True,
    )

    unit_number = serializers.CharField(
        source="unit.unit_number",
        read_only=True,
    )

    electricity_token_number = serializers.CharField(
        source="unit.electricity_token_number",
        read_only=True,
    )

    duration_months = serializers.IntegerField(read_only=True)
    is_open_ended = serializers.BooleanField(read_only=True)
    total_rent_due = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    total_rent_paid = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    rent_balance = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )

    class Meta:
        model = Lease
        fields = [
            "id",
            "tenant",
            "tenant_name",
            "unit",
            "unit_number",
            "electricity_token_number",
            "start_date",
            "end_date",
            "monthly_rent",
            "security_deposit",
            "status",
            "duration_months",
            "is_open_ended",
            "total_rent_due",
            "total_rent_paid",
            "rent_balance",
            "created_at",
        ]
        extra_kwargs = {
            "end_date": {"required": False, "allow_null": True},
        }

    def validate(self, attrs):
        """
        Prevent more than one ACTIVE lease for the same unit, and make
        sure a fixed end date (when given) is after the start date.
        """

        unit = attrs.get("unit")
        status = attrs.get("status", "ACTIVE")

        if self.instance:
            unit = attrs.get("unit", self.instance.unit)
            status = attrs.get("status", self.instance.status)

        start_date = attrs.get("start_date", getattr(self.instance, "start_date", None))
        end_date = attrs.get("end_date", getattr(self.instance, "end_date", None))

        if start_date and end_date and end_date <= start_date:
            raise serializers.ValidationError(
                {"end_date": "End date must be after the start date."}
            )

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