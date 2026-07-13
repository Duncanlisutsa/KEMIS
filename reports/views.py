import calendar
from io import BytesIO

from django.http import FileResponse, Http404
from django.utils import timezone

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from accounts.permissions import IsAdminOrManager, IsAdminOrManagerOrTenant, IsTenant

from estates.models import Estate, Unit
from tenants.models import Tenant
from leases.models import Lease
from payments.models import Payment

from django.db.models import Sum
from django.db.models.functions import TruncMonth

from maintenance.models import MaintenanceRequest

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
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
            "year": item["month"].year,
            "month_number": item["month"].month,
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


def _monthly_revenue_detail_data(year, month):
    payments = (
        Payment.objects.filter(
            payment_date__year=year,
            payment_date__month=month,
        )
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
@permission_classes([IsAdminOrManager])
def monthly_revenue_detail(request):
    year, month = _get_year_month(request)
    data = _monthly_revenue_detail_data(year, month)
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAdminOrManager])
def monthly_revenue_detail_pdf(request):
    year, month = _get_year_month(request)
    data = _monthly_revenue_detail_data(year, month)

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

    from accounts.permissions import IsAdminOrManager, IsAdminOrManagerOrTenant, IsTenant


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