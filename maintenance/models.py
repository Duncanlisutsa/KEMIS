from django.db import models
from estates.models import Unit
from tenants.models import Tenant


class MaintenanceRequest(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
    ]

    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    ]

    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE
    )

    unit = models.ForeignKey(
        Unit,
        on_delete=models.CASCADE
    )

    title = models.CharField(max_length=200)

    description = models.TextField()

    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default='MEDIUM'
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING'
    )

    reported_date = models.DateTimeField(auto_now_add=True)

    resolved_date = models.DateTimeField(
        null=True,
        blank=True
    )

    def __str__(self):
        return f"{self.title} - {self.unit}"