from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from accounts.permissions import IsAdminOrManager

from estates.models import Estate, Unit
from tenants.models import Tenant
from leases.models import Lease
from payments.models import Payment

from django.db.models import Sum
from django.db.models.functions import TruncMonth


@api_view(['GET'])
@permission_classes([IsAdminOrManager])
def dashboard_statistics(request):

    total_estates = Estate.objects.count()
    total_units = Unit.objects.count()

    vacant_units = Unit.objects.filter(status='VACANT').count()
    occupied_units = Unit.objects.filter(status='OCCUPIED').count()

    total_tenants = Tenant.objects.count()

    active_leases = Lease.objects.filter(
        status='ACTIVE'
    ).count()

    total_revenue = (
        Payment.objects.filter(status='PAID')
        .aggregate(total=Sum('amount'))
        .get('total')
        or 0
    )

    return Response({
        "total_estates": total_estates,
        "total_units": total_units,
        "vacant_units": vacant_units,
        "occupied_units": occupied_units,
        "total_tenants": total_tenants,
        "active_leases": active_leases,
        "total_revenue": total_revenue
    })


@api_view(['GET'])
@permission_classes([IsAdminOrManager])
def monthly_revenue_report(request):
    # Standardized to 4 spaces inside the function
    revenue = (
        Payment.objects.filter(status='PAID')
        .annotate(month=TruncMonth('payment_date'))
        .values('month')
        .annotate(total=Sum('amount'))
        .order_by('month')
    )

    data = []

    for item in revenue:
        data.append({
            "month": item["month"].strftime("%B %Y"),
            "total": item["total"]
        })

    return Response(data)