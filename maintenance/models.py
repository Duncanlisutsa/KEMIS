from django.db import models
from tenants.models import Tenant
from estates.models import Unit


class MaintenanceRequest(models.Model):

    PRIORITY_CHOICES = (
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('EMERGENCY', 'Emergency'),
    )

    STATUS_CHOICES = (
        ('OPEN', 'Open'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CLOSED', 'Closed'),
    )

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
        default='OPEN'
    )

    reported_date = models.DateTimeField(
        auto_now_add=True
    )

    completed_date = models.DateTimeField(
        null=True,
        blank=True
    )

    def __str__(self):
        return f"{self.unit} - {self.title}"