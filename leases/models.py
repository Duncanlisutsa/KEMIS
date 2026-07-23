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
    end_date = models.DateField()

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
    def duration_months(self):
        """
        Number of months the lease covers, rounded up for any
        partial trailing month (e.g. Jan 1 - Apr 20 counts as 4 months).
        """
        from dateutil.relativedelta import relativedelta

        rd = relativedelta(self.end_date, self.start_date)
        months = rd.years * 12 + rd.months
        if rd.days > 0:
            months += 1
        return max(months, 1)

    @property
    def total_rent_due(self):
        return self.monthly_rent * self.duration_months

    def __str__(self):
        return f"{self.tenant} - {self.unit}"