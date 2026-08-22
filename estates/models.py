from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db.models.signals import m2m_changed
from django.dispatch import receiver

MAX_MANAGERS_PER_ESTATE = 3


class Estate(models.Model):
    name = models.CharField(max_length=100)
    location = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="estates",
        limit_choices_to={"role": "LANDLORD"},
        null=True,
        blank=True
    )

    managers = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="managed_estates",
        limit_choices_to={"role": "MANAGER"},
        blank=True,
        help_text=f"Up to {MAX_MANAGERS_PER_ESTATE} managers may be assigned to an estate."
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


@receiver(m2m_changed, sender=Estate.managers.through)
def _enforce_max_managers(sender, instance, action, pk_set, **kwargs):
    """
    Belt-and-braces guard against an estate ending up with more than
    MAX_MANAGERS_PER_ESTATE managers, regardless of whether the change
    came from the API (already validated in EstateSerializer) or the
    Django admin.
    """
    if action != "pre_add":
        return

    current_count = instance.managers.count()
    incoming_count = len(pk_set or [])

    if current_count + incoming_count > MAX_MANAGERS_PER_ESTATE:
        raise ValidationError(
            f"An estate can have at most {MAX_MANAGERS_PER_ESTATE} managers assigned."
        )


class Unit(models.Model):

    UNIT_TYPES = (
        ('SINGLE', 'Single Room'),
        ('BEDSITTER', 'Bedsitter'),
        ('ONE_BEDROOM', 'One Bedroom'),
        ('TWO_BEDROOM', 'Two Bedroom'),
        ('BUSINESS', 'Business Premise'),
    )

    STATUS_CHOICES = (
        ('VACANT', 'Vacant'),
        ('OCCUPIED', 'Occupied'),
        ('RESERVED', 'Reserved'),
        ('MAINTENANCE', 'Under Maintenance'),
    )

    estate = models.ForeignKey(
        Estate,
        on_delete=models.PROTECT,
        related_name='units'
    )

    unit_number = models.CharField(max_length=20)

    unit_type = models.CharField(
        max_length=20,
        choices=UNIT_TYPES
    )

    rent_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='VACANT'
    )

    description = models.TextField(blank=True)

    electricity_token_number = models.CharField(
        max_length=50,
        blank=True,
        default='',
        help_text="The unit's electricity meter/token number, visible to the tenant."
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['estate', 'unit_number'],
                name='unique_unit_number_per_estate'
            )
        ]

    def __str__(self):
        return f"{self.estate.name} - {self.unit_number}"