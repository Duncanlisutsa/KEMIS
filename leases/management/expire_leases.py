from django.core.management.base import BaseCommand

from leases.utils import auto_expire_leases


class Command(BaseCommand):
    help = "Marks any ACTIVE lease whose end_date has passed as EXPIRED, and frees its unit."

    def handle(self, *args, **options):
        auto_expire_leases()
        self.stdout.write(self.style.SUCCESS("Lease expiry check complete."))