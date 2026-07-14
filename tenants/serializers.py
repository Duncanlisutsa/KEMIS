from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Tenant

User = get_user_model()


class TenantSerializer(serializers.ModelSerializer):

    username = serializers.CharField(write_only=True, required=False)
    first_name = serializers.CharField(write_only=True, required=False)
    last_name = serializers.CharField(write_only=True, required=False)
    email = serializers.EmailField(write_only=True, required=False)

    full_name = serializers.SerializerMethodField(read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Tenant
        fields = [
            'id',
            'username',
            'first_name',
            'last_name',
            'user_email',
            'full_name',
            'national_id',
            'phone_number',
            'occupation',
            'emergency_contact_name',
            'emergency_contact_phone',
            'created_at'
        ]

        read_only_fields = ['created_at']

    def get_full_name(self, obj):
        return obj.user.get_full_name()

    def create(self, validated_data):

        username = validated_data.pop('username')
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        email = validated_data.pop('email')

        user = User.objects.create(
            username=username,
            first_name=first_name,
            last_name=last_name,
            email=email
        )

        user.set_password("password123")
        user.save()

        tenant = Tenant.objects.create(
            user=user,
            **validated_data
        )

        return tenant

    def update(self, instance, validated_data):

        user = instance.user

        user.username = validated_data.pop(
            'username',
            user.username
        )

        user.first_name = validated_data.pop(
            'first_name',
            user.first_name
        )

        user.last_name = validated_data.pop(
            'last_name',
            user.last_name
        )

        user.email = validated_data.pop(
            'email',
            user.email
        )

        user.save()

        instance.national_id = validated_data.get(
            'national_id',
            instance.national_id
        )

        instance.phone_number = validated_data.get(
            'phone_number',
            instance.phone_number
        )

        instance.occupation = validated_data.get(
            'occupation',
            instance.occupation
        )

        instance.emergency_contact_name = validated_data.get(
            'emergency_contact_name',
            instance.emergency_contact_name
        )

        instance.emergency_contact_phone = validated_data.get(
            'emergency_contact_phone',
            instance.emergency_contact_phone
        )

        instance.save()

        return instance

        