from django.utils import timezone


def auto_expire_leases():
    """
    Flips any ACTIVE lease whose end_date has already passed to EXPIRED,
    and frees up its unit (marks it VACANT) if no other active lease
    still covers that unit.

    Called from the read paths that display leases/units/dashboard data,
    so lease status stays accurate without needing a separate scheduled
    job. Safe to call as often as needed - it's a no-op once nothing is
    overdue.
    """
    from .models import Lease

    today = timezone.now().date()

    expiring = Lease.objects.filter(
        status="ACTIVE",
        end_date__lt=today,
    ).select_related("unit")

    for lease in expiring:
        lease.status = "EXPIRED"
        lease.save(update_fields=["status"])

        still_active = Lease.objects.filter(
            unit=lease.unit,
            status="ACTIVE",
        ).exclude(pk=lease.pk).exists()

        if not still_active and lease.unit.status != "MAINTENANCE":
            lease.unit.status = "VACANT"
            lease.unit.save(update_fields=["status"])