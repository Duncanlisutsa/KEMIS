from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    current_user,
    change_password,
    request_password_reset,
    reset_password_confirm,
    list_managers,
    list_landlords,
    StaffUserViewSet,
)

router = DefaultRouter()
router.register(r'staff-accounts', StaffUserViewSet, basename='staff-accounts')

urlpatterns = [
    path('me/', current_user, name='current-user'),
    path('change-password/', change_password, name='change-password'),
    path('password-reset/', request_password_reset, name='password-reset'),
    path('password-reset-confirm/', reset_password_confirm, name='password-reset-confirm'),
    path('managers/', list_managers, name='list-managers'),
    path('landlords/', list_landlords, name='list-landlords'),
] + router.urls