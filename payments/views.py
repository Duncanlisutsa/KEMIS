from rest_framework import viewsets
from .models import Payment
from .serializers import PaymentSerializer
from accounts.permissions import IsAdminOrManagerOrTenant


class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [IsAdminOrManagerOrTenant]

    def get_queryset(self):
        user = self.request.user

        # Admin and Manager can see all payments
        if user.role in ["ADMIN", "MANAGER"]:
            return Payment.objects.all()

        # Tenant can only see their own payments
        if user.role == "TENANT":
            return Payment.objects.filter(lease__tenant=user.tenant)

        return Payment.objects.none()