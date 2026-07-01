from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/reports/', include('reports.urls')),
    path('api/property/', include('estates.urls')),
    path('api/tenants/', include('tenants.urls')),
    path('api/leases/', include('leases.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/maintenance/', include('maintenance.urls')),
    path('api/accounts/', include('accounts.urls')),

    # JWT Authentication URLs
    path(
        'api/token/',
        TokenObtainPairView.as_view(),
        name='token_obtain_pair'
    ),

    path(
        'api/token/refresh/',
        TokenRefreshView.as_view(),
        name='token_refresh'
    ),

    # path('api/notifications/', include('notifications.urls')),
] 