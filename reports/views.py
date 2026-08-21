import calendar
from io import BytesIO

from django.http import FileResponse, Http404
from django.utils import timezone
from django.shortcuts import get_object_or_404

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from accounts.permissions import (
    IsAdminOrManager,
    IsAdminOrManagerOrTenant,
    IsTenant,
    IsAdminOrManagerOrLandlordReadOnly,
    IsAdminOrManagerOrTenantOrLandlordReadOnly,
)

from estates.models import Estate, Unit
from tenants.models import Tenant
from leases.models import Lease
from leases.utils import auto_expire_leases
from payments.models import Payment

from django.db.models import Sum, Q
from django.db.models.functions import TruncMonth

from maintenance.models import MaintenanceRequest

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer


def _vacant_units_by_estate(estates=None):
    """Per-estate vacancy breakdown, for the 'vacant units per estate'
    dashboard panel."""
    from django.db.models import Count, Q

    units_qs = Unit.objects.select_related('estate')
    if estates is not None:
        units_qs = units_qs.filter(estate__in=estates)

    data = (
        units_qs
        .values('estate__id', 'estate__name')
        .annotate(
            total=Count('id'),
            vacant=Count('id', filter=Q(status='VACANT')),
        )
        .order_by('-vacant', 'estate__name')
    )

    return [
        {
            "estate_id": item["estate__id"],
            "estate_name": item["estate__name"],
            "vacant": item["vacant"],
            "total": item["total"],
        }
        for item in data
    ]


def _top_debtors(estates=None, limit=5):
    """Tenants with the largest outstanding rent balance on an active
    lease, for the 'top tenants in debt' dashboard panel."""
    leases_qs = (
        Lease.objects.filter(status='ACTIVE')
        .select_related('tenant__user', 'unit__estate')
    )
    if estates is not None:
        leases_qs = leases_qs.filter(unit__estate__in=estates)

    debtors = []
    for lease in leases_qs:
        balance = lease.rent_balance
        if balance < 0:
            tenant_user = lease.tenant.user
            name = tenant_user.get_full_name() or tenant_user.username
            debtors.append({
                "tenant_name": name,
                "unit_number": lease.unit.unit_number,
                "estate_name": lease.unit.estate.name,
                "amount_owed": abs(balance),
            })

    debtors.sort(key=lambda d: d["amount_owed"], reverse=True)
    return debtors[:limit]


@api_view(['GET'])
@permission_classes([IsAdminOrManagerOrTenantOrLandlordReadOnly])
def dashboard_statistics(request):
    auto_expire_leases()

    user = request.user

    if user.role == "LANDLORD":
        owned_estates = Estate.objects.filter(owner=user)
        owned_units = Unit.objects.filter(estate__in=owned_estates)

        total_revenue = (
            Payment.objects.filter(
                lease__unit__estate__in=owned_estates,
                status='PAID',
            )
            .aggregate(total=Sum('amount'))
            .get('total')
            or 0
        )

        return Response({
            "role": "LANDLORD",
            "total_estates": owned_estates.count(),
            "total_units": owned_units.count(),
            "vacant_units": owned_units.filter(status='VACANT').count(),
            "occupied_units": owned_units.filter(status='OCCUPIED').count(),
            "total_tenants": Tenant.objects.filter(
                leases__unit__estate__in=owned_estates
            ).distinct().count(),
            "active_leases": Lease.objects.filter(
                unit__estate__in=owned_estates,
                status='ACTIVE',
            ).count(),
            "total_revenue": total_revenue,
            "vacant_units_by_estate": _vacant_units_by_estate(owned_estates),
            "top_debtors": _top_debtors(owned_estates),
        })

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
            "electricity_token_number": lease.unit.electricity_token_number,
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
        "total_revenue": total_revenue,
        "vacant_units_by_estate": _vacant_units_by_estate(),
        "top_debtors": _top_debtors(),
    })


def _monthly_revenue_data(estates=None):
    payments = Payment.objects.filter(status='PAID')

    if estates is not None:
        payments = payments.filter(lease__unit__estate__in=estates)

    revenue = (
        payments
        .annotate(month=TruncMonth('payment_date'))
        .values('month')
        .annotate(total=Sum('amount'))
        .order_by('month')
    )

    data = []

    for item in revenue:
        data.append({
            "year": item["month"].year,
            "month_number": item["month"].month,
            "month": item["month"].strftime("%B %Y"),
            "total": item["total"]
        })

    return data


def _owned_estates_or_none(user):
    """Returns the landlord's own estates, or None for non-landlords
    (meaning: no estate filter should be applied)."""
    if user.role == "LANDLORD":
        return Estate.objects.filter(owner=user)
    return None


@api_view(['GET'])
@permission_classes([IsAdminOrManagerOrLandlordReadOnly])
def monthly_revenue_report(request):
    estates = _owned_estates_or_none(request.user)
    return Response(_monthly_revenue_data(estates))


@api_view(['GET'])
@permission_classes([IsAdminOrManagerOrLandlordReadOnly])
def monthly_revenue_pdf(request):
    estates = _owned_estates_or_none(request.user)
    data = _monthly_revenue_data(estates)
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

    elements.append(Paragraph("KABRAS ESTATE", styles["Title"]))
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


def _get_year_month(request):
    year = request.query_params.get("year")
    month = request.query_params.get("month")

    if not year or not month:
        raise Http404("year and month query parameters are required.")

    try:
        year = int(year)
        month = int(month)
    except ValueError:
        raise Http404("year and month must be numbers.")

    if month < 1 or month > 12:
        raise Http404("month must be between 1 and 12.")

    return year, month


def _monthly_revenue_detail_data(year, month, estates=None):
    payments = Payment.objects.filter(
        payment_date__year=year,
        payment_date__month=month,
    )

    if estates is not None:
        payments = payments.filter(lease__unit__estate__in=estates)

    payments = (
        payments
        .select_related("lease__tenant__user", "lease__unit__estate")
        .order_by("payment_date")
    )

    items = []

    for p in payments:
        items.append({
            "id": p.id,
            "tenant_name": p.lease.tenant.user.get_full_name(),
            "unit_number": p.lease.unit.unit_number,
            "estate_name": p.lease.unit.estate.name,
            "amount": p.amount,
            "payment_date": p.payment_date,
            "payment_method": p.payment_method,
            "payment_type": p.payment_type,
            "reference_number": p.reference_number,
            "status": p.status,
        })

    paid_items = [i for i in items if i["status"] == "PAID"]

    total_revenue = sum(i["amount"] for i in paid_items) or 0
    total_transactions = len(paid_items)
    average_payment = (total_revenue / total_transactions) if total_transactions else 0

    by_method = {}
    for i in paid_items:
        by_method[i["payment_method"]] = by_method.get(i["payment_method"], 0) + i["amount"]

    by_type = {}
    for i in paid_items:
        by_type[i["payment_type"]] = by_type.get(i["payment_type"], 0) + i["amount"]

    status_counts = {}
    for i in items:
        status_counts[i["status"]] = status_counts.get(i["status"], 0) + 1

    month_label = f"{calendar.month_name[month]} {year}"

    return {
        "year": year,
        "month": month,
        "month_label": month_label,
        "summary": {
            "total_revenue": total_revenue,
            "total_transactions": total_transactions,
            "average_payment": round(average_payment, 2),
            "by_payment_method": by_method,
            "by_payment_type": by_type,
            "status_counts": status_counts,
        },
        "payments": items,
    }


@api_view(['GET'])
@permission_classes([IsAdminOrManagerOrLandlordReadOnly])
def monthly_revenue_detail(request):
    year, month = _get_year_month(request)
    estates = _owned_estates_or_none(request.user)
    data = _monthly_revenue_detail_data(year, month, estates)
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAdminOrManagerOrLandlordReadOnly])
def monthly_revenue_detail_pdf(request):
    year, month = _get_year_month(request)
    estates = _owned_estates_or_none(request.user)
    data = _monthly_revenue_detail_data(year, month, estates)

    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
    )

    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph("KABRAS ESTATE", styles["Title"]))
    elements.append(Paragraph(f"Financial Report — {data['month_label']}", styles["Heading2"]))
    elements.append(
        Paragraph(
            f"Generated on {timezone.now().strftime('%d %B %Y, %H:%M')}",
            styles["Normal"],
        )
    )
    elements.append(Spacer(1, 12))

    summary = data["summary"]

    summary_lines = [
        f"Total Revenue: KES {summary['total_revenue']:,.2f}",
        f"Total Transactions (Paid): {summary['total_transactions']}",
        f"Average Payment: KES {summary['average_payment']:,.2f}",
    ]

    if summary["by_payment_method"]:
        method_str = ", ".join(
            f"{k}: KES {v:,.2f}" for k, v in summary["by_payment_method"].items()
        )
        summary_lines.append(f"By Method — {method_str}")

    if summary["by_payment_type"]:
        type_str = ", ".join(
            f"{k}: KES {v:,.2f}" for k, v in summary["by_payment_type"].items()
        )
        summary_lines.append(f"By Type — {type_str}")

    if summary["status_counts"]:
        status_str = ", ".join(
            f"{k}: {v}" for k, v in summary["status_counts"].items()
        )
        summary_lines.append(f"Record Status Counts — {status_str}")

    for line in summary_lines:
        elements.append(Paragraph(line, styles["Normal"]))

    elements.append(Spacer(1, 16))

    table_data = [[
        "Tenant", "Estate", "Unit", "Amount (KES)", "Date",
        "Method", "Type", "Reference", "Status"
    ]]

    for p in data["payments"]:
        table_data.append([
            p["tenant_name"],
            p["estate_name"],
            p["unit_number"],
            f"{p['amount']:,.2f}",
            p["payment_date"].strftime("%d %b %Y"),
            p["payment_method"],
            p["payment_type"],
            p["reference_number"],
            p["status"],
        ])

    if len(table_data) == 1:
        table_data.append(["No payment records for this month."] + [""] * 8)

    table = Table(
        table_data,
        colWidths=[3.2 * cm, 3 * cm, 2 * cm, 2.6 * cm, 2.4 * cm, 2.2 * cm, 2 * cm, 3 * cm, 2 * cm],
        repeatRows=1,
    )

    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ALIGN", (3, 0), (3, -1), "RIGHT"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f1f5f9")]),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))

    elements.append(table)

    doc.build(elements)
    buffer.seek(0)

    filename = f"KEMIS_Financial_Report_{data['month_label'].replace(' ', '_')}.pdf"

    return FileResponse(buffer, as_attachment=True, filename=filename)


def _occupancy_data(estates=None):
    estates_qs = Estate.objects.all() if estates is None else estates

    rows = []
    total_units = 0
    total_occupied = 0
    total_vacant = 0
    total_reserved = 0
    total_maintenance = 0

    for estate in estates_qs.order_by("name"):
        units = Unit.objects.filter(estate=estate)
        unit_count = units.count()
        occupied = units.filter(status="OCCUPIED").count()
        vacant = units.filter(status="VACANT").count()
        reserved = units.filter(status="RESERVED").count()
        maintenance = units.filter(status="MAINTENANCE").count()

        occupancy_rate = round((occupied / unit_count) * 100, 1) if unit_count else 0

        rows.append({
            "estate_id": estate.id,
            "estate_name": estate.name,
            "location": estate.location,
            "total_units": unit_count,
            "occupied": occupied,
            "vacant": vacant,
            "reserved": reserved,
            "maintenance": maintenance,
            "occupancy_rate": occupancy_rate,
        })

        total_units += unit_count
        total_occupied += occupied
        total_vacant += vacant
        total_reserved += reserved
        total_maintenance += maintenance

    overall_occupancy_rate = round((total_occupied / total_units) * 100, 1) if total_units else 0

    return {
        "estates": rows,
        "summary": {
            "total_units": total_units,
            "occupied": total_occupied,
            "vacant": total_vacant,
            "reserved": total_reserved,
            "maintenance": total_maintenance,
            "occupancy_rate": overall_occupancy_rate,
        },
    }


@api_view(['GET'])
@permission_classes([IsAdminOrManagerOrLandlordReadOnly])
def occupancy_report(request):
    estates = _owned_estates_or_none(request.user)
    return Response(_occupancy_data(estates))


@api_view(['GET'])
@permission_classes([IsAdminOrManagerOrLandlordReadOnly])
def occupancy_report_pdf(request):
    estates = _owned_estates_or_none(request.user)
    data = _occupancy_data(estates)
    summary = data["summary"]

    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph("KABRAS ESTATE", styles["Title"]))
    elements.append(Paragraph("Occupancy Report", styles["Heading2"]))
    elements.append(
        Paragraph(
            f"Generated on {timezone.now().strftime('%d %B %Y, %H:%M')}",
            styles["Normal"],
        )
    )
    elements.append(Spacer(1, 10))
    elements.append(
        Paragraph(
            f"Overall Occupancy Rate: {summary['occupancy_rate']}% "
            f"({summary['occupied']} of {summary['total_units']} units occupied)",
            styles["Normal"],
        )
    )
    elements.append(Spacer(1, 16))

    table_data = [[
        "Estate", "Location", "Total Units", "Occupied",
        "Vacant", "Reserved", "Maintenance", "Occupancy %"
    ]]

    for row in data["estates"]:
        table_data.append([
            row["estate_name"],
            row["location"],
            row["total_units"],
            row["occupied"],
            row["vacant"],
            row["reserved"],
            row["maintenance"],
            f"{row['occupancy_rate']}%",
        ])

    if len(table_data) == 1:
        table_data.append(["No estates found."] + [""] * 7)

    table_data.append([
        "TOTAL", "", summary["total_units"], summary["occupied"],
        summary["vacant"], summary["reserved"], summary["maintenance"],
        f"{summary['occupancy_rate']}%",
    ])

    table = Table(
        table_data,
        colWidths=[3.5 * cm, 3.5 * cm, 2.2 * cm, 2.2 * cm, 2.2 * cm, 2.2 * cm, 2.5 * cm, 2.5 * cm],
        repeatRows=1,
    )

    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("ALIGN", (2, 0), (-1, -1), "RIGHT"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2), [colors.white, colors.HexColor("#f1f5f9")]),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#2563eb")),
        ("TEXTCOLOR", (0, -1), (-1, -1), colors.white),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))

    elements.append(table)

    doc.build(elements)
    buffer.seek(0)

    filename = f"KEMIS_Occupancy_Report_{timezone.now().strftime('%Y%m%d')}.pdf"

    return FileResponse(buffer, as_attachment=True, filename=filename)


def _units_report_data(user):
    """Full unit listing, scoped to the requesting user's estates."""
    units_qs = Unit.objects.select_related("estate").order_by(
        "estate__name", "unit_number"
    )

    if user.role == "MANAGER":
        units_qs = units_qs.filter(estate__manager=user)
    elif user.role == "LANDLORD":
        units_qs = units_qs.filter(estate__owner=user)
    # ADMIN sees every unit, no filter applied.

    rows = []
    for unit in units_qs:
        active_lease = (
            Lease.objects.filter(unit=unit, status="ACTIVE")
            .select_related("tenant__user")
            .first()
        )

        rows.append({
            "estate_name": unit.estate.name,
            "unit_number": unit.unit_number,
            "unit_type": unit.get_unit_type_display(),
            "status": unit.get_status_display(),
            "rent_amount": unit.rent_amount,
            "tenant_name": (
                active_lease.tenant.user.get_full_name()
                or active_lease.tenant.user.username
            ) if active_lease else "-",
        })

    return rows


@api_view(['GET'])
@permission_classes([IsAdminOrManagerOrLandlordReadOnly])
def units_report(request):
    return Response(_units_report_data(request.user))


@api_view(['GET'])
@permission_classes([IsAdminOrManagerOrLandlordReadOnly])
def units_report_pdf(request):
    data = _units_report_data(request.user)

    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph("KABRAS ESTATE", styles["Title"]))
    elements.append(Paragraph("Units Report", styles["Heading2"]))
    elements.append(
        Paragraph(
            f"Generated on {timezone.now().strftime('%d %B %Y, %H:%M')}",
            styles["Normal"],
        )
    )
    elements.append(Spacer(1, 10))
    elements.append(Paragraph(f"Total Units: {len(data)}", styles["Normal"]))
    elements.append(Spacer(1, 16))

    table_data = [["Estate", "Unit", "Type", "Status", "Rent (KES)", "Current Tenant"]]

    for u in data:
        table_data.append([
            u["estate_name"],
            u["unit_number"],
            u["unit_type"],
            u["status"],
            f"{u['rent_amount']:,.2f}",
            u["tenant_name"],
        ])

    if len(table_data) == 1:
        table_data.append(["No units found."] + [""] * 5)

    table = Table(
        table_data,
        colWidths=[3.2 * cm, 2.5 * cm, 3 * cm, 2.8 * cm, 2.8 * cm, 4 * cm],
        repeatRows=1,
    )

    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ALIGN", (4, 0), (4, -1), "RIGHT"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f1f5f9")]),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))

    elements.append(table)

    doc.build(elements)
    buffer.seek(0)

    filename = f"KEMIS_Units_Report_{timezone.now().strftime('%Y%m%d')}.pdf"

    return FileResponse(buffer, as_attachment=True, filename=filename)


def _tenants_report_data(user):
    """Full tenant listing, scoped to the requesting user's estates."""
    tenants_qs = Tenant.objects.select_related("user").order_by(
        "user__first_name", "user__last_name"
    )

    if user.role == "MANAGER":
        tenants_qs = tenants_qs.filter(
            Q(leases__unit__estate__manager=user) | Q(leases__isnull=True)
        ).distinct()
    elif user.role == "LANDLORD":
        tenants_qs = tenants_qs.filter(leases__unit__estate__owner=user).distinct()
    # ADMIN sees every tenant, no filter applied.

    rows = []
    for tenant in tenants_qs:
        active_lease = (
            Lease.objects.filter(tenant=tenant, status="ACTIVE")
            .select_related("unit__estate")
            .first()
        )

        rows.append({
            "full_name": tenant.user.get_full_name() or tenant.user.username,
            "national_id": tenant.national_id,
            "phone_number": tenant.phone_number,
            "emergency_contact_name": tenant.emergency_contact_name,
            "emergency_contact_phone": tenant.emergency_contact_phone,
            "estate_name": active_lease.unit.estate.name if active_lease else "-",
            "unit_number": active_lease.unit.unit_number if active_lease else "-",
        })

    return rows


@api_view(['GET'])
@permission_classes([IsAdminOrManagerOrLandlordReadOnly])
def tenants_report(request):
    return Response(_tenants_report_data(request.user))


@api_view(['GET'])
@permission_classes([IsAdminOrManagerOrLandlordReadOnly])
def tenants_report_pdf(request):
    data = _tenants_report_data(request.user)

    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
    )

    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph("KABRAS ESTATE", styles["Title"]))
    elements.append(Paragraph("Tenants Report", styles["Heading2"]))
    elements.append(
        Paragraph(
            f"Generated on {timezone.now().strftime('%d %B %Y, %H:%M')}",
            styles["Normal"],
        )
    )
    elements.append(Spacer(1, 10))
    elements.append(Paragraph(f"Total Tenants: {len(data)}", styles["Normal"]))
    elements.append(Spacer(1, 16))

    table_data = [[
        "Full Name", "National ID", "Phone", "Emergency Contact",
        "Emergency Phone", "Estate", "Unit"
    ]]

    for t in data:
        table_data.append([
            t["full_name"],
            t["national_id"],
            t["phone_number"],
            t["emergency_contact_name"],
            t["emergency_contact_phone"],
            t["estate_name"],
            t["unit_number"],
        ])

    if len(table_data) == 1:
        table_data.append(["No tenants found."] + [""] * 6)

    table = Table(
        table_data,
        colWidths=[3.5 * cm, 3 * cm, 3 * cm, 3.5 * cm, 3.5 * cm, 3 * cm, 2.5 * cm],
        repeatRows=1,
    )

    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f1f5f9")]),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))

    elements.append(table)

    doc.build(elements)
    buffer.seek(0)

    filename = f"KEMIS_Tenants_Report_{timezone.now().strftime('%Y%m%d')}.pdf"

    return FileResponse(buffer, as_attachment=True, filename=filename)


def _leases_report_data(user):
    """Full lease listing, scoped to the requesting user's estates (or,
    for a tenant, to their own lease history)."""
    leases_qs = Lease.objects.select_related(
        "tenant__user", "unit__estate"
    ).order_by("-start_date")

    if user.role == "MANAGER":
        leases_qs = leases_qs.filter(unit__estate__manager=user)
    elif user.role == "LANDLORD":
        leases_qs = leases_qs.filter(unit__estate__owner=user)
    elif user.role == "TENANT":
        leases_qs = leases_qs.filter(tenant=user.tenant)
    # ADMIN sees every lease, no filter applied.

    rows = []
    for lease in leases_qs:
        rows.append({
            "tenant_name": lease.tenant.user.get_full_name() or lease.tenant.user.username,
            "estate_name": lease.unit.estate.name,
            "unit_number": lease.unit.unit_number,
            "start_date": lease.start_date,
            "end_date": lease.end_date,
            "monthly_rent": lease.monthly_rent,
            "status": lease.get_status_display(),
        })

    return rows


@api_view(['GET'])
@permission_classes([IsAdminOrManagerOrTenantOrLandlordReadOnly])
def leases_report(request):
    auto_expire_leases()
    return Response(_leases_report_data(request.user))


@api_view(['GET'])
@permission_classes([IsAdminOrManagerOrTenantOrLandlordReadOnly])
def leases_report_pdf(request):
    auto_expire_leases()
    data = _leases_report_data(request.user)

    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph("KABRAS ESTATE", styles["Title"]))
    elements.append(Paragraph("Leases Report", styles["Heading2"]))
    elements.append(
        Paragraph(
            f"Generated on {timezone.now().strftime('%d %B %Y, %H:%M')}",
            styles["Normal"],
        )
    )
    elements.append(Spacer(1, 10))
    elements.append(Paragraph(f"Total Leases: {len(data)}", styles["Normal"]))
    elements.append(Spacer(1, 16))

    table_data = [["Tenant", "Estate", "Unit", "Start", "End", "Rent (KES)", "Status"]]

    for l in data:
        table_data.append([
            l["tenant_name"],
            l["estate_name"],
            l["unit_number"],
            l["start_date"].strftime("%d %b %Y"),
            l["end_date"].strftime("%d %b %Y") if l["end_date"] else "Open-ended",
            f"{l['monthly_rent']:,.2f}",
            l["status"],
        ])

    if len(table_data) == 1:
        table_data.append(["No leases found."] + [""] * 6)

    table = Table(
        table_data,
        colWidths=[3.2 * cm, 3 * cm, 2.3 * cm, 2.5 * cm, 2.5 * cm, 2.8 * cm, 2.5 * cm],
        repeatRows=1,
    )

    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ALIGN", (5, 0), (5, -1), "RIGHT"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f1f5f9")]),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))

    elements.append(table)

    doc.build(elements)
    buffer.seek(0)

    filename = f"KEMIS_Leases_Report_{timezone.now().strftime('%Y%m%d')}.pdf"

    return FileResponse(buffer, as_attachment=True, filename=filename)


def _maintenance_summary_data(estates=None):
    requests_qs = MaintenanceRequest.objects.all()

    if estates is not None:
        requests_qs = requests_qs.filter(unit__estate__in=estates)

    requests_qs = requests_qs.select_related(
        "tenant__user", "unit__estate"
    ).order_by("-reported_date")

    items = []
    status_counts = {}
    priority_counts = {}

    for r in requests_qs:
        items.append({
            "id": r.id,
            "title": r.title,
            "tenant_name": r.tenant.user.get_full_name() or r.tenant.user.username,
            "estate_name": r.unit.estate.name,
            "unit_number": r.unit.unit_number,
            "priority": r.priority,
            "status": r.status,
            "reported_date": r.reported_date,
            "resolved_date": r.resolved_date,
        })

        status_counts[r.status] = status_counts.get(r.status, 0) + 1
        priority_counts[r.priority] = priority_counts.get(r.priority, 0) + 1

    total_requests = len(items)
    open_requests = sum(
        count for status, count in status_counts.items() if status != "COMPLETED"
    )

    return {
        "summary": {
            "total_requests": total_requests,
            "open_requests": open_requests,
            "status_counts": status_counts,
            "priority_counts": priority_counts,
        },
        "requests": items,
    }


@api_view(['GET'])
@permission_classes([IsAdminOrManagerOrLandlordReadOnly])
def maintenance_summary(request):
    estates = _owned_estates_or_none(request.user)
    return Response(_maintenance_summary_data(estates))


@api_view(['GET'])
@permission_classes([IsAdminOrManagerOrLandlordReadOnly])
def maintenance_summary_pdf(request):
    estates = _owned_estates_or_none(request.user)
    data = _maintenance_summary_data(estates)
    summary = data["summary"]

    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
    )

    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph("KABRAS ESTATE", styles["Title"]))
    elements.append(Paragraph("Maintenance Activity Report", styles["Heading2"]))
    elements.append(
        Paragraph(
            f"Generated on {timezone.now().strftime('%d %B %Y, %H:%M')}",
            styles["Normal"],
        )
    )
    elements.append(Spacer(1, 10))

    summary_lines = [
        f"Total Requests: {summary['total_requests']}",
        f"Open (Not Completed): {summary['open_requests']}",
    ]

    if summary["status_counts"]:
        status_str = ", ".join(f"{k}: {v}" for k, v in summary["status_counts"].items())
        summary_lines.append(f"By Status — {status_str}")

    if summary["priority_counts"]:
        priority_str = ", ".join(f"{k}: {v}" for k, v in summary["priority_counts"].items())
        summary_lines.append(f"By Priority — {priority_str}")

    for line in summary_lines:
        elements.append(Paragraph(line, styles["Normal"]))

    elements.append(Spacer(1, 16))

    table_data = [[
        "Title", "Tenant", "Estate", "Unit", "Priority",
        "Status", "Reported", "Resolved"
    ]]

    for r in data["requests"]:
        table_data.append([
            r["title"],
            r["tenant_name"],
            r["estate_name"],
            r["unit_number"],
            r["priority"],
            r["status"],
            r["reported_date"].strftime("%d %b %Y"),
            r["resolved_date"].strftime("%d %b %Y") if r["resolved_date"] else "-",
        ])

    if len(table_data) == 1:
        table_data.append(["No maintenance requests found."] + [""] * 7)

    table = Table(
        table_data,
        colWidths=[3.5 * cm, 3 * cm, 3 * cm, 2 * cm, 2.2 * cm, 2.5 * cm, 2.5 * cm, 2.5 * cm],
        repeatRows=1,
    )

    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f1f5f9")]),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))

    elements.append(table)

    doc.build(elements)
    buffer.seek(0)

    filename = f"KEMIS_Maintenance_Report_{timezone.now().strftime('%Y%m%d')}.pdf"

    return FileResponse(buffer, as_attachment=True, filename=filename)


@api_view(['GET'])
@permission_classes([IsTenant])
def my_payments_pdf(request):
    user = request.user
    tenant = user.tenant

    payments = (
        Payment.objects.filter(lease__tenant=tenant)
        .select_related("lease__unit__estate")
        .order_by("-payment_date")
    )

    total_paid = (
        payments.filter(status="PAID")
        .aggregate(total=Sum("amount"))
        .get("total")
        or 0
    )

    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph("KABRAS ESTATE", styles["Title"]))
    elements.append(Paragraph("Payment History Report", styles["Heading2"]))
    elements.append(
        Paragraph(f"Tenant: {user.get_full_name() or user.username}", styles["Normal"])
    )
    elements.append(
        Paragraph(
            f"Generated on {timezone.now().strftime('%d %B %Y, %H:%M')}",
            styles["Normal"],
        )
    )
    elements.append(Spacer(1, 10))
    elements.append(
        Paragraph(f"Total Paid To Date: KES {total_paid:,.2f}", styles["Normal"])
    )
    elements.append(Spacer(1, 16))

    table_data = [["Date", "Unit", "Estate", "Amount (KES)", "Method", "Type", "Reference", "Status"]]

    for p in payments:
        table_data.append([
            p.payment_date.strftime("%d %b %Y"),
            p.lease.unit.unit_number,
            p.lease.unit.estate.name,
            f"{p.amount:,.2f}",
            p.payment_method,
            p.payment_type,
            p.reference_number,
            p.status,
        ])

    if len(table_data) == 1:
        table_data.append(["No payment records found."] + [""] * 7)

    table = Table(
        table_data,
        colWidths=[2.2 * cm, 2 * cm, 2.6 * cm, 2.6 * cm, 2.2 * cm, 2 * cm, 3 * cm, 2 * cm],
        repeatRows=1,
    )

    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ALIGN", (3, 0), (3, -1), "RIGHT"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f1f5f9")]),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))

    elements.append(table)

    doc.build(elements)
    buffer.seek(0)

    filename = f"KEMIS_Payment_History_{user.username}_{timezone.now().strftime('%Y%m%d')}.pdf"

    

    return FileResponse(buffer, as_attachment=True, filename=filename)

@api_view(['GET'])
@permission_classes([IsAdminOrManagerOrTenantOrLandlordReadOnly])
def payment_receipt_pdf(request, payment_id):
    user = request.user

    if user.role == "ADMIN":
        queryset = Payment.objects.all()
    elif user.role == "MANAGER":
        queryset = Payment.objects.filter(lease__unit__estate__manager=user)
    elif user.role == "TENANT":
        queryset = Payment.objects.filter(lease__tenant=user.tenant)
    elif user.role == "LANDLORD":
        queryset = Payment.objects.filter(lease__unit__estate__owner=user)
    else:
        queryset = Payment.objects.none()

    payment = get_object_or_404(
        queryset.select_related("lease__unit__estate", "lease__tenant__user"),
        pk=payment_id,
    )

    if payment.status != "PAID" or payment.amount is None or payment.payment_date is None:
        return Response(
            {"detail": "A receipt is only available once this payment has been approved."},
            status=400,
        )

    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=2.5 * cm,
        bottomMargin=2.5 * cm,
        leftMargin=2.5 * cm,
        rightMargin=2.5 * cm,
    )

    styles = getSampleStyleSheet()
    elements = []

    tenant = payment.lease.tenant
    tenant_name = tenant.user.get_full_name() or tenant.user.username
    unit = payment.lease.unit

    elements.append(Paragraph("KABRAS ESTATE", styles["Title"]))
    elements.append(Paragraph("Official Payment Receipt", styles["Heading2"]))
    elements.append(Spacer(1, 4))
    elements.append(
        Paragraph(f"Issued on {timezone.now().strftime('%d %B %Y, %H:%M')}", styles["Normal"])
    )
    elements.append(Spacer(1, 20))

    status_colors = {
        "PAID": colors.HexColor("#16a34a"),
        "PENDING": colors.HexColor("#d97706"),
        "FAILED": colors.HexColor("#b91c1c"),
        "REFUNDED": colors.HexColor("#475569"),
    }

    details = [
        ["Receipt No.", payment.reference_number],
        ["Tenant", tenant_name],
        ["Unit", f"{unit.unit_number} \u2014 {unit.estate.name}"],
        ["Payment Date", payment.payment_date.strftime("%d %B %Y")],
        ["Payment Type", payment.get_payment_type_display()],
        ["Payment Method", payment.get_payment_method_display()],
        ["Status", payment.get_status_display()],
        ["Amount Paid", f"KES {payment.amount:,.2f}"],
    ]

    table = Table(details, colWidths=[5 * cm, 10 * cm])
    table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 10.5),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#475569")),
        ("TEXTCOLOR", (1, 0), (1, -1), colors.HexColor("#0f172a")),
        ("LINEBELOW", (0, 0), (-1, -2), 0.5, colors.HexColor("#e2e8f0")),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("TEXTCOLOR", (1, 6), (1, 6), status_colors.get(payment.status, colors.HexColor("#0f172a"))),
        ("FONTNAME", (1, 6), (1, 6), "Helvetica-Bold"),
        ("FONTSIZE", (1, 7), (1, 7), 14),
        ("FONTNAME", (1, 7), (1, 7), "Helvetica-Bold"),
    ]))
    elements.append(table)

    elements.append(Spacer(1, 30))
    elements.append(
        Paragraph(
            "This receipt was generated automatically by KEMIS (Kabras Estate "
            "Management Information System) and is valid without a signature.",
            styles["Normal"],
        )
    )

    doc.build(elements)
    buffer.seek(0)

    filename = f"KEMIS_Receipt_{payment.reference_number}.pdf"

    return FileResponse(buffer, as_attachment=True, filename=filename)