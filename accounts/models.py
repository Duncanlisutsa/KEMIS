from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):

    ROLE_CHOICES = (
        ('ADMIN', 'Administrator'),
        ('MANAGER', 'Manager'),
        ('TENANT', 'Tenant'),
        ('LANDLORD', 'Landlord'),
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES
    )

    must_change_password = models.BooleanField(
        default=True,
        help_text=(
            "If True, the user is required to set a new password before "
            "they can use the system. Set automatically whenever an Admin "
            "or Manager creates an account or resets someone's password. "
            "Never enforced for ADMIN accounts, regardless of this value."
        )
    )

    phone = models.CharField(
        max_length=20,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.username

class ContactMessage(models.Model):
    """A message submitted through the public landing page's contact form."""

    name = models.CharField(max_length=150)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} <{self.email}>"        