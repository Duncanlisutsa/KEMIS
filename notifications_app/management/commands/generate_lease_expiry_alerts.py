from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from leases.models import Lease
from leases.utils import auto_expire_leases
from notifications_app.models import Notification

# How far ahead to warn about an upcoming lease expiry.
LOOKAHEAD_DAYS = 30

# Don't re-notify about the same lease more than once within this window.
DEDUPE_WINDOW_DAYS = 7


class Command(BaseCommand):
    help = "Notifies estate managers and owners about active leases expiring within 30 days."

    def handle(self, *args, **options):
        auto_expire_leases()

        today = timezone.now().date()
        horizon = today + timedelta(days=LOOKAHEAD_DAYS)
        cutoff = timezone.now() - timedelta(days=DEDUPE_WINDOW_DAYS)
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

        self.stdout.write(self.style.SUCCESS(f"Lease expiry alerts sent: {sent}"))