from django.db import models
from django.conf import settings


class Tenant(models.Model):

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )

    national_id = models.CharField(
        max_length=20,
        unique=True
    )

    phone_number = models.CharField(
        max_length=20
    )

    emergency_contact_name = models.CharField(
        max_length=100
    )

    emergency_contact_phone = models.CharField(
        max_length=20
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.user.get_full_name()