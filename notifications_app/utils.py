from datetime import timedelta

from django.utils import timezone

from leases.models import Lease
from leases.utils import auto_expire_leases
from .models import Notification

RENT_REMINDER_DEDUPE_DAYS = 5
LEASE_EXPIRY_LOOKAHEAD_DAYS = 30
LEASE_EXPIRY_DEDUPE_DAYS = 7


def generate_rent_reminders():
    """
    Notifies tenants whose active lease currently has a rent balance
    owed (debit). Returns the number of notifications created.
    """
    auto_expire_leases()

    cutoff = timezone.now() - timedelta(days=RENT_REMINDER_DEDUPE_DAYS)
    sent = 0

    for lease in Lease.objects.filter(status="ACTIVE").select_related("tenant__user", "unit"):
        if lease.rent_balance >= 0:
            continue

        marker = f"(Lease #{lease.id})"

        already_notified = Notification.objects.filter(
            recipient=lease.tenant.user,
            notification_type="RENT_OVERDUE",
            message__icontains=marker,
            created_at__gte=cutoff,
        ).exists()

        if already_notified:
            continue

        amount_owed = abs(lease.rent_balance)

        Notification.objects.create(
            recipient=lease.tenant.user,
            notification_type="RENT_OVERDUE",
            message=(
                f"You have an outstanding rent balance of KES {amount_owed:,.2f} "
                f"for {lease.unit.unit_number}. {marker}"
            ),
        )
        sent += 1

    return sent


def generate_lease_expiry_alerts():
    """
    Notifies estate managers and owners about active leases expiring
    within the lookahead window. Returns the number of notifications
    created.
    """
    auto_expire_leases()

    today = timezone.now().date()
    horizon = today + timedelta(days=LEASE_EXPIRY_LOOKAHEAD_DAYS)
    cutoff = timezone.now() - timedelta(days=LEASE_EXPIRY_DEDUPE_DAYS)
    sent = 0

    expiring_leases = Lease.objects.filter(
        status="ACTIVE",
        end_date__gte=today,
        end_date__lte=horizon,
    ).select_related("unit__estate__manager", "unit__estate__owner", "tenant__user")

    for lease in expiring_leases:
        estate = lease.unit.estate
        days_left = (lease.end_date - today).days
        marker = f"(Lease #{lease.id})"

        message = (
            f"Lease for {lease.tenant.user.get_full_name() or lease.tenant.user.username} "
            f"in {lease.unit.unit_number} ({estate.name}) expires in {days_left} day(s) "
            f"on {lease.end_date}. {marker}"
        )

        recipients = [r for r in [estate.manager, estate.owner] if r is not None]

        for recipient in recipients:
            already_notified = Notification.objects.filter(
                recipient=recipient,
                notification_type="LEASE_EXPIRING",
                message__icontains=marker,
                created_at__gte=cutoff,
            ).exists()

            if already_notified:
                continue

            Notification.objects.create(
                recipient=recipient,
                notification_type="LEASE_EXPIRING",
                message=message,
            )
            sent += 1

    return sent