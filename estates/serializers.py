from rest_framework import serializers
from .models import Estate, Unit


class EstateSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(
        source="owner.get_full_name",
        read_only=True
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