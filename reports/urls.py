from django.urls import path
from .views import dashboard_statistics, monthly_revenue_report, monthly_revenue_pdf

urlpatterns = [
    path(
        'dashboard/',
        dashboard_statistics,
        name='dashboard-statistics'
    ),

    path(
        'monthly-revenue/',
        monthly_revenue_report,
        name='monthly-revenue-report'
    ),

    path(
        'monthly-revenue/pdf/',
        monthly_revenue_pdf,
        name='monthly-revenue-pdf'
    ),
]