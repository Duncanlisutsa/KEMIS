from rest_framework import viewsets
from .models import Payment
from .serializers import PaymentSerializer
from accounts.permissions import IsAdminOrManager


class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer

    def get_queryset(self):

        user = self.request.user

        # Admin and Manager can see all payments
        if (
            user.groups.filter(name="Admin").exists() or
            user.groups.filter(name="Manager").exists()
        ):
            return Payment.objects.all()

        # Tenant can only see their own payments
        if user.groups.filter(name="Tenant").exists():
            return Payment.objects.filter(
                lease__tenant=user.tenant
            )

        return Payment.objects.none()