from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role == "ADMIN"
        )


class IsManager(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role == "MANAGER"
        )


class IsTenant(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role == "TENANT"
        )


class IsAdminOrManager(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role in ["ADMIN", "MANAGER"]
        )


class IsAdminOrManagerOrTenant(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role in ["ADMIN", "MANAGER", "TENANT"]
        )


class IsLandlord(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role == "LANDLORD"
        )


class IsLandlordOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role in ["LANDLORD", "ADMIN"]
        )


class IsAdminOrManagerOrLandlordReadOnly(BasePermission):
    """
    Admins and Managers have full access.
    Landlords have read-only (GET/HEAD/OPTIONS) access, scoped to their
    own estate(s) at the queryset level in each view.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        if request.user.role in ["ADMIN", "MANAGER"]:
            return True

        if request.user.role == "LANDLORD":
            return request.method in SAFE_METHODS

        return False


class IsAdminOrManagerOrTenantOrLandlordReadOnly(BasePermission):
    """
    Admins, Managers and Tenants have full access (subject to further
    scoping in each view). Landlords have read-only (GET/HEAD/OPTIONS)
    access, scoped to their own estate(s) at the queryset level.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        if request.user.role in ["ADMIN", "MANAGER", "TENANT"]:
            return True

        if request.user.role == "LANDLORD":
            return request.method in SAFE_METHODS

        return False