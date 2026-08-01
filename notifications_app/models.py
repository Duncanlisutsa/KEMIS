from django.conf import settings
from django.db import models


class Notification(models.Model):
    TYPE_CHOICES = [
        ('RENT_OVERDUE', 'Rent Overdue'),
        ('LEASE_EXPIRING', 'Lease Expiring Soon'),
        ('MAINTENANCE_UPDATE', 'Maintenance Update'),
        ('GENERAL', 'General'),
    ]

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
    )

    notification_type = models.CharField(
        max_length=30,
        choices=TYPE_CHOICES,
        default='GENERAL',
    )

    message = models.TextField()

    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.recipient} - {self.get_notification_type_display()}"