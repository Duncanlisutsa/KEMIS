from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Estate, Unit

User = get_user_model()


class EstateSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(
        source="owner.get_full_name",
        read_only=True
    )

    manager_name = serializers.CharField(
        source="manager.get_full_name",
        read_only=True
    )

    manager = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role="MANAGER"),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Estate
        fields = [
            "id",
            "name",
            "location",
            "description",
            "owner",
            "owner_name",
            "manager",
            "manager_name",
            "created_at",
        ]


class UnitSerializer(serializers.ModelSerializer):
    estate_name = serializers.CharField(
        source="estate.name",
        read_only=True
    )

    class Meta:
        model = Unit
        fields = "__all__"

    def validate(self, attrs):
        estate = attrs.get("estate", getattr(self.instance, "estate", None))
        unit_number = attrs.get("unit_number", getattr(self.instance, "unit_number", None))

        query = Unit.objects.filter(estate=estate, unit_number=unit_number)

        if self.instance:
            query = query.exclude(pk=self.instance.pk)

        if query.exists():
            raise serializers.ValidationError(
                {"unit_number": f"Unit number \"{unit_number}\" already exists in this estate."}
            )

        return attrs