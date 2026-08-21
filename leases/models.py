from django.db import models
from tenants.models import Tenant
from estates.models import Unit


class Lease(models.Model):
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('EXPIRED', 'Expired'),
        ('TERMINATED', 'Terminated'),
    ]

    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.PROTECT,
        related_name='leases'
    )

    unit = models.ForeignKey(
        Unit,
        on_delete=models.PROTECT,
        related_name='leases'
    )

    start_date = models.DateField()
    end_date = models.DateField(
        null=True,
        blank=True,
        help_text="Leave blank for an open-ended lease with no fixed end date.",
    )

    monthly_rent = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    security_deposit = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='ACTIVE'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def is_open_ended(self):
        return self.end_date is None

    @property
    def duration_months(self):
        """
        Number of months the lease covers, rounded up for any
        partial trailing month (e.g. Jan 1 - Apr 20 counts as 4 months).

        Open-ended leases (no end_date) use today's date instead, so
        this reflects the number of months elapsed so far rather than
        a fixed total - it grows month by month as the tenancy continues.
        """
        from dateutil.relativedelta import relativedelta
        from django.utils import timezone

        effective_end = self.end_date or timezone.localdate()

        rd = relativedelta(effective_end, self.start_date)
        months = rd.years * 12 + rd.months
        if rd.days > 0:
            months += 1
        return max(months, 1)

    @property
    def total_rent_due(self):
        return self.monthly_rent * self.duration_months

    @property
    def total_rent_paid(self):
        from django.db.models import Sum

        total = self.payments.filter(
            status="PAID",
            payment_type="RENT",
        ).aggregate(total=Sum("amount"))["total"]

        return total or 0

    @property
    def rent_balance(self):
        """
        Positive = credit (tenant has paid more than owed so far).
        Negative = debit (tenant still owes rent).
        """
        return self.total_rent_paid - self.total_rent_due

    def __str__(self):
        return f"{self.tenant} - {self.unit}"