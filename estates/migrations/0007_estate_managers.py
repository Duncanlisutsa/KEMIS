from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('estates', '0006_unit_electricity_token_number'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='estate',
            name='managers',
            field=models.ManyToManyField(
                blank=True,
                help_text='Up to 3 managers may be assigned to an estate.',
                limit_choices_to={'role': 'MANAGER'},
                related_name='managed_estates_m2m',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]