from rest_framework import serializers

from tenants.models import Tenant

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id',
            'notification_type',
            'message',
            'is_read',
            'created_at',
        ]
        read_only_fields = fields


class SendTenantNotificationSerializer(serializers.Serializer):
    """
    Input serializer for an admin/manager sending a one-off notification
    to one OR MANY specific tenants (as opposed to the automated
    rent-reminder / lease-expiry jobs, which target everyone).
    """
    tenant_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tenant.objects.select_related('user'),
        source='tenants',
        many=True,
        write_only=True,
    )
    notification_type = serializers.ChoiceField(
        choices=Notification.TYPE_CHOICES,
        default='GENERAL',
        required=False,
    )
    message = serializers.CharField(max_length=2000, allow_blank=False)

    def validate_tenant_ids(self, value):
        if not value:
            raise serializers.ValidationError("Select at least one tenant.")
        return value

    def validate_message(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Message cannot be empty.")
        return value

    def create(self, validated_data):
        tenants = validated_data['tenants']
        notification_type = validated_data.get('notification_type', 'GENERAL')
        message = validated_data['message']

        notifications = [
            Notification(
                recipient=tenant.user,
                notification_type=notification_type,
                message=message,
            )
            for tenant in tenants
        ]
        return Notification.objects.bulk_create(notifications)