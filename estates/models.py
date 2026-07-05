from django.db import models
from django.conf import settings 


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

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


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
        on_delete=models.CASCADE,
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

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.estate.name} - {self.unit_number}"