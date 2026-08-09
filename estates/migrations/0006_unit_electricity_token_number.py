from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('estates', '0005_estate_manager'),
    ]

    operations = [
        migrations.AddField(
            model_name='unit',
            name='electricity_token_number',
            field=models.CharField(blank=True, default='', help_text="The unit's electricity meter/token number, visible to the tenant.", max_length=50),
        ),
    ]