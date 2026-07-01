from rest_framework import viewsets
from .models import Payment
from .serializers import PaymentSerializer
from accounts.permissions import IsAdminOrManager


class PaymentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminOrManager]
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer