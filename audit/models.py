from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('CREATE', 'Created'),
        ('UPDATE', 'Updated'),
        ('DELETE', 'Deleted'),
    ]

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
    )

    action = models.CharField(max_length=10, choices=ACTION_CHOICES)

    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=50)
    object_repr = models.CharField(max_length=255)

    # For UPDATE: {"field": {"old": "...", "new": "..."}, ...}
    # None for CREATE/DELETE, or an UPDATE that changed nothing tracked.
    changes = models.JSONField(blank=True, null=True)

    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        who = self.actor or "System"
        return f"{who} {self.action} {self.model_name} #{self.object_id}"