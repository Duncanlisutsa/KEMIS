from decimal import Decimal, InvalidOperation

from django.conf import settings
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from .models import Payment
from .serializers import PaymentSerializer
from accounts.permissions import IsAdminOrManagerOrTenantOrLandlordReadOnly
from audit.mixins import AuditLogMixin
from leases.models import Lease
from notifications_app.models import Notification


class PaymentViewSet(AuditLogMixin, viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [IsAdminOrManagerOrTenantOrLandlordReadOnly]

    def get_queryset(self):
        user = self.request.user

        if user.role == "ADMIN":
            return Payment.objects.all()

        if user.role == "MANAGER":
            return Payment.objects.filter(lease__unit__estate__manager=user)

        if user.role == "TENANT":
            return Payment.objects.filter(lease__tenant=user.tenant)

        if user.role == "LANDLORD":
            return Payment.objects.filter(lease__unit__estate__owner=user)

        return Payment.objects.none()

    def _tenants_active_lease(self, user):
        return Lease.objects.filter(
            tenant=user.tenant,
            status="ACTIVE",
        ).first()

    def _notify_managers_of_submission(self, payment):
        estate = payment.lease.unit.estate
        recipients = [r for r in [estate.manager, estate.owner] if r is not None]
        tenant_name = payment.lease.tenant.user.get_full_name() or payment.lease.tenant.user.username

        for recipient in recipients:
            if recipient.role not in ("MANAGER", "ADMIN"):
                continue

            Notification.objects.create(
                recipient=recipient,
                notification_type="GENERAL",
                message=(
                    f"{tenant_name} submitted a payment (transaction code "
                    f"{payment.reference_number}) for {payment.lease.unit.unit_number}, "
                    f"awaiting your approval."
                ),
            )

    # ---- create ---------------------------------------------------

    def perform_create(self, serializer):
        user = self.request.user

        if user.role == "TENANT":
            active_lease = self._tenants_active_lease(user)

            if not active_lease:
                raise ValidationError(
                    "You don't have an active lease, so you can't submit a payment."
                )

            if not serializer.validated_data.get("reference_number"):
                raise ValidationError(
                    {"reference_number": "Enter the M-Pesa transaction code."}
                )

            instance = serializer.save(
                lease=active_lease,
                amount=None,
                payment_date=None,
                status="PENDING",
                submitted_by=user,
                approved_by=None,
                approved_at=None,
                rejection_reason='',
            )
            self._audit_log("CREATE", instance)
            self._notify_managers_of_submission(instance)
            return

        # Manager/Admin recording a payment directly (e.g. cash or bank
        # handed to them in person) - the figures are known up front.
        if not serializer.validated_data.get("amount"):
            raise ValidationError({"amount": "This field is required."})

        if not serializer.validated_data.get("payment_date"):
            raise ValidationError({"payment_date": "This field is required."})

        lease = serializer.validated_data.get("lease")
        if not lease:
            raise ValidationError({"lease": "This field is required."})

        if user.role == "MANAGER" and lease.unit.estate.manager_id != user.id:
            raise ValidationError(
                {"lease": "You can only record payments for leases within your own estate."}
            )

        final_status = serializer.validated_data.get("status") or "PAID"
        save_kwargs = {"status": final_status}

        if final_status in ("PAID", "FAILED"):
            save_kwargs["approved_by"] = user
            save_kwargs["approved_at"] = timezone.now()

        instance = serializer.save(**save_kwargs)
        self._audit_log("CREATE", instance)

    # ---- update ----------------------------------------------------

    def perform_update(self, serializer):
        user = self.request.user

        if user.role == "TENANT":
            raise PermissionDenied(
                "You can't edit a submitted payment. Contact your manager if the "
                "transaction code was entered incorrectly."
            )

        if user.role == "MANAGER" and serializer.instance.lease.unit.estate.manager_id != user.id:
            raise PermissionDenied("You can only manage payments within your own estate.")

        old_snapshot = self._audit_snapshot(serializer.instance)
        instance = serializer.save()
        self._audit_log("UPDATE", instance, old_snapshot=old_snapshot)

    # ---- destroy -----------------------------------------------------

    def perform_destroy(self, instance):
        user = self.request.user

        if user.role == "TENANT":
            raise PermissionDenied("You can't delete a submitted payment.")

        if user.role == "MANAGER" and instance.lease.unit.estate.manager_id != user.id:
            raise PermissionDenied("You can only manage payments within your own estate.")

        self._audit_log("DELETE", instance)
        instance.delete()

    # ---- approve / reject -------------------------------------------

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        user = request.user

        if user.role not in ("ADMIN", "MANAGER"):
            raise PermissionDenied("Only a manager or admin can approve payments.")

        payment = self.get_object()

        if user.role == "MANAGER" and payment.lease.unit.estate.manager_id != user.id:
            raise PermissionDenied("You can only approve payments within your own estate.")

        if payment.status != "PENDING":
            raise ValidationError("Only a pending payment can be approved.")

        raw_amount = request.data.get("amount")
        if not raw_amount:
            raise ValidationError({"amount": "Enter the amount the tenant paid."})

        try:
            amount = Decimal(str(raw_amount))
        except InvalidOperation:
            raise ValidationError({"amount": "Enter a valid number."})

        if amount <= 0:
            raise ValidationError({"amount": "Amount must be greater than zero."})

        payment_date = request.data.get("payment_date") or timezone.now().date()
        payment_type = request.data.get("payment_type") or payment.payment_type

        old_snapshot = self._audit_snapshot(payment)

        payment.amount = amount
        payment.payment_date = payment_date
        payment.payment_type = payment_type
        payment.status = "PAID"
        payment.approved_by = user
        payment.approved_at = timezone.now()
        payment.rejection_reason = ''
        payment.save()

        self._audit_log("UPDATE", payment, old_snapshot=old_snapshot)

        Notification.objects.create(
            recipient=payment.lease.tenant.user,
            notification_type="GENERAL",
            message=(
                f"Your payment of KES {payment.amount:,.2f} (transaction code "
                f"{payment.reference_number}) for {payment.lease.unit.unit_number} "
                f"has been approved and marked as paid."
            ),
        )

        return Response(PaymentSerializer(payment).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        user = request.user

        if user.role not in ("ADMIN", "MANAGER"):
            raise PermissionDenied("Only a manager or admin can reject payments.")

        payment = self.get_object()

        if user.role == "MANAGER" and payment.lease.unit.estate.manager_id != user.id:
            raise PermissionDenied("You can only manage payments within your own estate.")

        if payment.status != "PENDING":
            raise ValidationError("Only a pending payment can be rejected.")

        reason = request.data.get("rejection_reason")
        if not reason:
            raise ValidationError({"rejection_reason": "Let the tenant know why it was rejected."})

        old_snapshot = self._audit_snapshot(payment)

        payment.status = "FAILED"
        payment.rejection_reason = reason
        payment.approved_by = user
        payment.approved_at = timezone.now()
        payment.save()

        self._audit_log("UPDATE", payment, old_snapshot=old_snapshot)

        Notification.objects.create(
            recipient=payment.lease.tenant.user,
            notification_type="GENERAL",
            message=(
                f"Your payment submission (transaction code {payment.reference_number}) "
                f"for {payment.lease.unit.unit_number} was rejected: {reason}"
            ),
        )

        return Response(PaymentSerializer(payment).data, status=status.HTTP_200_OK)

    # ---- paybill info -------------------------------------------------

    @action(detail=False, methods=["get"], url_path="info")
    def info(self, request):
        return Response({
            "paybill_number": settings.KEMIS_PAYBILL_NUMBER,
            "account_number": settings.KEMIS_ACCOUNT_NUMBER,
        })