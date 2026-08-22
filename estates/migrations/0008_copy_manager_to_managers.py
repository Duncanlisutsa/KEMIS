from django.db import migrations


def copy_manager_forward(apps, schema_editor):
    Estate = apps.get_model('estates', 'Estate')
    for estate in Estate.objects.exclude(manager__isnull=True):
        estate.managers.add(estate.manager_id)


def copy_manager_backward(apps, schema_editor):
    """
    Best-effort reverse: restores the single `manager` FK from whichever
    manager happens to come first in the M2M set (order is arbitrary,
    since more than one manager may have been assigned going forward).
    """
    Estate = apps.get_model('estates', 'Estate')
    for estate in Estate.objects.all():
        first_manager = estate.managers.first()
        if first_manager:
            estate.manager_id = first_manager.id
            estate.save(update_fields=['manager'])


class Migration(migrations.Migration):

    dependencies = [
        ('estates', '0007_estate_managers'),
    ]

    operations = [
        migrations.RunPython(copy_manager_forward, copy_manager_backward),
    ]