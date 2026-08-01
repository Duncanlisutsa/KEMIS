from django.core.management.base import BaseCommand

from notifications_app.utils import generate_lease_expiry_alerts


class Command(BaseCommand):
    help = "Notifies estate managers and owners about active leases expiring within 30 days."

    def handle(self, *args, **options):
        sent = generate_lease_expiry_alerts()
        self.stdout.write(self.style.SUCCESS(f"Lease expiry alerts sent: {sent}"))