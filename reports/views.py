from django.shortcuts import render

from rest_framework.views import APIView
from rest_framework.response import Response

from estates.models import Unit
from tenants.models import Tenant
from leases.models import Lease
from payments.models import Payment

from django.db.models import Sum
from datetime import date


class DashboardStatsView(APIView):

    def get(self, request):

        total_units = Unit.objects.count()

        occupied_units = Unit.objects.filter(
            status='OCCUPIED'
        ).count()

        vacant_units = Unit.objects.filter(
            status='VACANT'
        ).count()

        total_tenants = Tenant.objects.count()

        active_leases = Lease.objects.filter(
            status='ACTIVE'
        ).count()

        current_month = date.today().month

        monthly_income = (
            Payment.objects.filter(
                payment_date__month=current_month
            )
            .aggregate(total=Sum('amount'))
            .get('total')
            or 0
        )

        data = {
            'total_units': total_units,
            'occupied_units': occupied_units,
            'vacant_units': vacant_units,
            'total_tenants': total_tenants,
            'active_leases': active_leases,
            'monthly_income': monthly_income,
        }

        return Response(data)

# Create your views here.
