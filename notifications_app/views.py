from rest_framework import viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import IsAdminOrManager

from .models import Notification
from .serializers import NotificationSerializer, SendTenantNotificationSerializer
from .utils import generate_rent_reminders, generate_lease_expiry_alerts


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only: notifications are created by the system (maintenance
    updates, rent reminders, lease-expiry alerts), never directly by
    a user. Users can only list their own and mark them read.
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = self.get_queryset().filter(is_read=False).count()
        return Response({"unread_count": count})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({"detail": "All notifications marked as read."})

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=["is_read"])
        return Response(NotificationSerializer(notification).data)


@api_view(['POST'])
@permission_classes([IsAdminOrManager])
def send_rent_reminders(request):
    sent = generate_rent_reminders()
    return Response({"detail": f"Rent reminders sent: {sent}", "sent": sent})


@api_view(['POST'])
@permission_classes([IsAdminOrManager])
def send_lease_expiry_alerts(request):
    sent = generate_lease_expiry_alerts()
    return Response({"detail": f"Lease expiry alerts sent: {sent}", "sent": sent})


@api_view(['POST'])
@permission_classes([IsAdminOrManager])
def send_notification_to_tenant(request):
    """
    Lets an admin/manager send a single ad-hoc notification to one OR
    MANY specific tenants, in addition to the automated rent-reminder
    and lease-expiry jobs above.

    Expects: {"tenant_ids": [1, 2, 3], "notification_type": "GENERAL", "message": "..."}
    """
    serializer = SendTenantNotificationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    notifications = serializer.save()

    return Response(
        {
            "detail": f"Notification sent to {len(notifications)} tenant(s).",
            "sent": len(notifications),
            "notifications": NotificationSerializer(notifications, many=True).data,
        },
        status=201,
    )