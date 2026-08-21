from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    NotificationViewSet,
    send_rent_reminders,
    send_lease_expiry_alerts,
    send_notification_to_tenant,
)

router = DefaultRouter()
router.register(r'', NotificationViewSet, basename='notifications')

urlpatterns = [
    path('send-rent-reminders/', send_rent_reminders, name='send-rent-reminders'),
    path('send-lease-expiry-alerts/', send_lease_expiry_alerts, name='send-lease-expiry-alerts'),
    path('send-to-tenant/', send_notification_to_tenant, name='send-notification-to-tenant'),
] + router.urls