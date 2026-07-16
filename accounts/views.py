from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

from .serializers import (
    ChangePasswordSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
)
from accounts.permissions import IsAdmin

User = get_user_model()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    user = request.user

    return Response({
        "id": user.id,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "role": user.role,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    serializer = ChangePasswordSerializer(
        data=request.data,
        context={"request": request}
    )
    serializer.is_valid(raise_exception=True)

    user = request.user
    user.set_password(serializer.validated_data["new_password"])
    user.save()

    return Response({"detail": "Password changed successfully."})


@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset(request):
    serializer = PasswordResetRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    email = serializer.validated_data["email"]

    # Always return a generic response, whether or not the email exists,
    # so this endpoint can't be used to check which emails are registered.
    generic_response = Response({
        "detail": "If an account with that email exists, a reset link has been sent."
    })

    # NOTE: falls back to the most recently created matching account.
    # This only exists because multiple test accounts currently share
    # one email for local testing. In production, email should be
    # unique per user and this fallback becomes unnecessary.
    user = User.objects.filter(email__iexact=email).order_by('-id').first()
    if user is None:
        return generic_response

    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)

    reset_link = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}/"

    send_mail(
        subject="KEMIS Password Reset",
        message=(
            f"Hi {user.first_name or user.username},\n\n"
            f"Click the link below to reset your KEMIS password:\n\n"
            f"{reset_link}\n\n"
            f"If you didn't request this, you can safely ignore this email."
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )

    return generic_response


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password_confirm(request):
    serializer = PasswordResetConfirmSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    user = serializer.validated_data["user"]
    user.set_password(serializer.validated_data["new_password"])
    user.save()

    return Response({"detail": "Password reset successful. You can now log in."})

@api_view(['GET'])
@permission_classes([IsAdmin])
def list_managers(request):
    managers = User.objects.filter(role="MANAGER").order_by("first_name", "last_name")

    data = [
        {
            "id": m.id,
            "full_name": m.get_full_name() or m.username,
        }
        for m in managers
    ]

    return Response(data)