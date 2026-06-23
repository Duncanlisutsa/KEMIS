from django.db import models
from tenants.models import Tenant
from estates.models import Unit


class Lease(models.Model):

    STATUS_CHOICES = (
        ('ACTIVE', 'Active'),
        ('EXPIRED', 'Expired'),
        ('TERMINATED', 'Terminated'),
    )

    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE
    )

    unit = models.OneToOneField(
        Unit,
        on_delete=models.CASCADE
    )

    start_date = models.DateField()

    end_date = models.DateField(
        null=True,
        blank=True
    )

    monthly_rent = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    deposit_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='ACTIVE'
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.tenant} - {self.unit}"