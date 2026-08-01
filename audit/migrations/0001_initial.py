import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='AuditLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('action', models.CharField(choices=[('CREATE', 'Created'), ('UPDATE', 'Updated'), ('DELETE', 'Deleted')], max_length=10)),
                ('model_name', models.CharField(max_length=100)),
                ('object_id', models.CharField(max_length=50)),
                ('object_repr', models.CharField(max_length=255)),
                ('changes', models.JSONField(blank=True, null=True)),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('actor', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='audit_logs', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-timestamp'],
            },
        ),
    ]