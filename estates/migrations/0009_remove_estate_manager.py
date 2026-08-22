from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('estates', '0008_copy_manager_to_managers'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='estate',
            name='manager',
        ),
        migrations.AlterField(
            model_name='estate',
            name='managers',
            field=models.ManyToManyField(
                blank=True,
                help_text='Up to 3 managers may be assigned to an estate.',
                limit_choices_to={'role': 'MANAGER'},
                related_name='managed_estates',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]