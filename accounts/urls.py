from django.urls import path
from .views import (
    current_user,
    change_password,
    request_password_reset,
    reset_password_confirm,
)

urlpatterns = [
    path('me/', current_user, name='current-user'),
    path('change-password/', change_password, name='change-password'),
    path('password-reset/', request_password_reset, name='password-reset'),
    path('password-reset-confirm/', reset_password_confirm, name='password-reset-confirm'),
]