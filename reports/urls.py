from django.urls import path
from .views import (
    dashboard_statistics,
    monthly_revenue_report,
    monthly_revenue_pdf,
    monthly_revenue_detail,
    monthly_revenue_detail_pdf,
    my_payments_pdf,
)

urlpatterns = [
    path('dashboard/', dashboard_statistics, name='dashboard-statistics'),
    path('monthly-revenue/', monthly_revenue_report, name='monthly-revenue-report'),
    path('monthly-revenue/pdf/', monthly_revenue_pdf, name='monthly-revenue-pdf'),
    path('monthly-revenue/detail/', monthly_revenue_detail, name='monthly-revenue-detail'),
    path('monthly-revenue/detail/pdf/', monthly_revenue_detail_pdf, name='monthly-revenue-detail-pdf'),
    path('my-payments/pdf/', my_payments_pdf, name='my-payments-pdf'),
]