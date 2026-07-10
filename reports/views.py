from io import BytesIO

from django.http import FileResponse
from django.utils import timezone

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from accounts.permissions import IsAdminOrManager, IsAdminOrManagerOrTenant

from estates.models import Estate, Unit
from tenants.models import Tenant
from leases.models import Lease
from payments.models import Payment

from django.db.models import Sum
from django.db.models.functions import TruncMonth

from django.db.models import Count

from maintenance.models import MaintenanceRequest

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer


@api_view(['GET'])
@permission_classes([IsAdminOrManagerOrTenant])
def dashboard_statistics(request):
    user = request.user

    if user.role == "TENANT":
        lease = Lease.objects.filter(
            tenant=user.tenant,
            status="ACTIVE",
        ).first()

        if not lease:
            return Response({
                "role": "TENANT",
                "has_active_lease": False,
            })

        total_paid = (
            Payment.objects.filter(lease=lease, status="PAID")
            .aggregate(total=Sum("amount"))
            .get("total")
            or 0
        )

        open_maintenance_requests = (
            MaintenanceRequest.objects.filter(tenant=user.tenant)
            .exclude(status="COMPLETED")
            .count()
        )

        return Response({
            "role": "TENANT",
            "has_active_lease": True,
            "estate_name": lease.unit.estate.name,
            "unit_number": lease.unit.unit_number,
            "monthly_rent": lease.monthly_rent,
            "lease_start": lease.start_date,
            "lease_end": lease.end_date,
            "total_paid": total_paid,
            "open_maintenance_requests": open_maintenance_requests,
        })

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
        "role": user.role,
        "total_estates": total_estates,
        "total_units": total_units,
        "vacant_units": vacant_units,
        "occupied_units": occupied_units,
        "total_tenants": total_tenants,
        "active_leases": active_leases,
        "total_revenue": total_revenue
    })


def _monthly_revenue_data():
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

    return data


@api_view(['GET'])
@permission_classes([IsAdminOrManager])
def monthly_revenue_report(request):
    return Response(_monthly_revenue_data())


@api_view(['GET'])
@permission_classes([IsAdminOrManager])
def monthly_revenue_pdf(request):
    data = _monthly_revenue_data()
    total_revenue = sum(item["total"] for item in data)

    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph("KABRAS ESTATE MANAGEMENT SYSTEM", styles["Title"]))
    elements.append(Paragraph("Monthly Revenue Report", styles["Heading2"]))
    elements.append(
        Paragraph(
            f"Generated on {timezone.now().strftime('%d %B %Y, %H:%M')}",
            styles["Normal"],
        )
    )
    elements.append(Spacer(1, 20))

    table_data = [["Month", "Total Revenue (KES)"]]

    for item in data:
        table_data.append([item["month"], f"{item['total']:,.2f}"])

    table_data.append(["TOTAL", f"{total_revenue:,.2f}"])

    table = Table(table_data, colWidths=[8 * cm, 8 * cm])

    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2), [colors.white, colors.HexColor("#f1f5f9")]),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#2563eb")),
        ("TEXTCOLOR", (0, -1), (-1, -1), colors.white),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))

    elements.append(table)

    doc.build(elements)
    buffer.seek(0)

    filename = f"KEMIS_Monthly_Revenue_{timezone.now().strftime('%Y%m%d')}.pdf"

    return FileResponse(buffer, as_attachment=True, filename=filename)