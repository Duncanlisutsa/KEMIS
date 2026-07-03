from django.urls import path
from .views import dashboard_statistics, monthly_revenue_report

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
]