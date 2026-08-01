from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from leases.models import Lease
from leases.utils import auto_expire_leases
from notifications_app.models import Notification

# Don't re-notify the same tenant about the same lease more than once
# within this window, even if the command runs daily.
DEDUPE_WINDOW_DAYS = 5


class Command(BaseCommand):
    help = "Notifies tenants whose active lease currently has a rent balance owed (debit)."

    def handle(self, *args, **options):
        auto_expire_leases()

        cutoff = timezone.now() - timedelta(days=DEDUPE_WINDOW_DAYS)
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

        self.stdout.write(self.style.SUCCESS(f"Rent reminders sent: {sent}"))