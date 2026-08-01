from django.core.management.base import BaseCommand

from notifications_app.utils import generate_rent_reminders


class Command(BaseCommand):
    help = "Notifies tenants whose active lease currently has a rent balance owed (debit)."

    def handle(self, *args, **options):
        sent = generate_rent_reminders()
        self.stdout.write(self.style.SUCCESS(f"Rent reminders sent: {sent}"))