class AuditLogMixin:
    """
    Add to any ModelViewSet's base classes to automatically record
    CREATE/UPDATE/DELETE actions to the AuditLog.

    Viewsets whose perform_create/perform_update just call
    serializer.save() with no extra logic get this for free - no other
    changes needed.

    Viewsets with custom perform_create/perform_update (that check
    ownership, branch by role, pass extra save() kwargs, etc.) should
    call self._audit_snapshot() before saving and self._audit_log()
    after, instead of relying on this mixin's default perform_create/
    perform_update. See UnitViewSet, LeaseViewSet, and
    MaintenanceRequestViewSet for examples.
    """

    # Never record these in a snapshot/diff, even though they're real
    # model fields - passwords are hashed by the time we'd see them,
    # but there's no reason to keep them in a log at all.
    AUDIT_EXCLUDED_FIELDS = {"password"}

    def _audit_snapshot(self, instance):
        data = {}

        for field in instance._meta.fields:
            if field.name in self.AUDIT_EXCLUDED_FIELDS:
                continue

            data[field.name] = str(getattr(instance, field.name))

        return data

    def _audit_log(self, action, instance, old_snapshot=None):
        from .models import AuditLog

        user = getattr(self.request, "user", None)
        if user is not None and not user.is_authenticated:
            user = None

        changes = None

        if action == "UPDATE" and old_snapshot is not None:
            new_snapshot = self._audit_snapshot(instance)

            diff = {
                field: {"old": old_snapshot.get(field), "new": new_value}
                for field, new_value in new_snapshot.items()
                if old_snapshot.get(field) != new_value
            }

            changes = diff or None

        AuditLog.objects.create(
            actor=user,
            action=action,
            model_name=instance.__class__.__name__,
            object_id=str(instance.pk),
            object_repr=str(instance)[:255],
            changes=changes,
        )

    def perform_create(self, serializer):
        instance = serializer.save()
        self._audit_log("CREATE", instance)
        return instance

    def perform_update(self, serializer):
        old_snapshot = self._audit_snapshot(self.get_object())
        instance = serializer.save()
        self._audit_log("UPDATE", instance, old_snapshot=old_snapshot)
        return instance

    def perform_destroy(self, instance):
        self._audit_log("DELETE", instance)
        instance.delete()