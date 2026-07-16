from rest_framework import viewsets
from .models import Payment
from .serializers import PaymentSerializer
from accounts.permissions import IsAdminOrManagerOrTenant


class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [IsAdminOrManagerOrTenant]

    def get_queryset(self):
        user = self.request.user

        if user.role == "ADMIN":
            return Payment.objects.all()

        if user.role == "MANAGER":
            return Payment.objects.filter(lease__unit__estate__manager=user)

        if user.role == "TENANT":
            return Payment.objects.filter(lease__tenant=user.tenant)

        return Payment.objects.none()