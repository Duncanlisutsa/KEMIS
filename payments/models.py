from django.db import models
from leases.models import Lease


class Payment(models.Model):
    PAYMENT_METHODS = [
        ('MPESA', 'M-Pesa'),
        ('BANK', 'Bank'),
        ('CASH', 'Cash'),
    ]

    PAYMENT_TYPES = [
        ('RENT', 'Rent'),
        ('DEPOSIT', 'Deposit'),
    ]

    PAYMENT_STATUS = [
        ('PAID', 'Paid'),
        ('PENDING', 'Pending'),
        ('FAILED', 'Failed'),
        ('REFUNDED', 'Refunded'),
    ]

    lease = models.ForeignKey(
        Lease,
        on_delete=models.CASCADE,
        related_name='payments'
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    payment_date = models.DateField()

    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHODS
    )

    payment_type = models.CharField(
        max_length=20,
        choices=PAYMENT_TYPES,
        default='RENT'
    )

    reference_number = models.CharField(
        max_length=100,
        unique=True
    )

    status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS,
        default='PAID'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.lease} - {self.amount}"