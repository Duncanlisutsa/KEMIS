import logging

from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Notification

logger = logging.getLogger(__name__)

NOTIFICATION_EMAIL_SUBJECTS = {
    "RENT_OVERDUE": "KEMIS: Rent Payment Reminder",
    "LEASE_EXPIRING": "KEMIS: Lease Expiring Soon",
    "MAINTENANCE_UPDATE": "KEMIS: Maintenance Request Update",
    "GENERAL": "KEMIS Notification",
}


def _send_notification_email(notification_id):
    """
    Emails the in-app notification's message to the recipient's registered
    email address (the one they provided on registration). Only TENANT
    recipients are emailed — managers/landlords/admins still only see
    their notifications in-app.

    Runs after the DB transaction that created the notification has
    committed, and never raises: a missing address or an email-backend
    failure must never break the request/command that triggered the
    notification.
    """
    try:
        notification = Notification.objects.select_related("recipient").get(
            pk=notification_id
        )
    except Notification.DoesNotExist:
        return

    recipient = notification.recipient
    if recipient.role != "TENANT":
        return

    if not recipient.email:
        return

    subject = NOTIFICATION_EMAIL_SUBJECTS.get(
        notification.notification_type, "KEMIS Notification"
    )
    greeting_name = recipient.get_full_name() or recipient.username

    try:
        send_mail(
            subject=subject,
            message=(
                f"Hi {greeting_name},\n\n"
                f"{notification.message}\n\n"
                f"Log in to KEMIS to view more details: {settings.FRONTEND_URL}"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient.email],
            fail_silently=False,
        )
    except Exception:
        logger.exception(
            "Failed to email notification #%s to %s",
            notification.pk,
            recipient.email,
        )


@receiver(post_save, sender=Notification)
def email_new_notification(sender, instance, created, **kwargs):
    """
    Fires for every Notification created anywhere in the system (rent
    reminders, lease-expiry alerts, maintenance updates, payment
    approvals/rejections, etc.). Filtering happens in
    _send_notification_email — only TENANT recipients actually get an
    email — so no per-call-site changes are needed.
    """
    if not created:
        return

    transaction.on_commit(lambda: _send_notification_email(instance.pk))