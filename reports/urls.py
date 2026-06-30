from django.urls import path
from .views import dashboard_statistics

urlpatterns = [
    path(
        'dashboard/',
        dashboard_statistics,
        name='dashboard-statistics'
    ),
]