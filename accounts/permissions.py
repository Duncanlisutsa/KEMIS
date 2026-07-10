from rest_framework.permissions import BasePermission


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