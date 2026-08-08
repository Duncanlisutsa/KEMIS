from django.conf import settings
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
        on_delete=models.PROTECT,
        related_name='payments'
    )

    # Set by the tenant on submission; left blank until the manager/admin
    # approves the payment and fills in the actual figures.
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )

    payment_date = models.DateField(
        null=True,
        blank=True,
        help_text="Set by the manager/admin when the payment is approved."
    )

    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHODS,
        default='MPESA',
    )

    payment_type = models.CharField(
        max_length=20,
        choices=PAYMENT_TYPES,
        default='RENT'
    )

    # For an M-Pesa paybill payment, this is the transaction code the
    # tenant received from Safaricom and typed into their dashboard.
    reference_number = models.CharField(
        max_length=100,
        unique=True
    )

    status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS,
        default='PENDING'
    )

    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='submitted_payments',
        help_text="The tenant who submitted this payment for approval."
    )

    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_payments',
        help_text="The manager/admin who approved or rejected this payment."
    )

    approved_at = models.DateTimeField(null=True, blank=True)

    rejection_reason = models.CharField(max_length=255, blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.lease} - {self.amount if self.amount is not None else 'pending'}"