from rest_framework import permissions


class IsOfficerUser(permissions.BasePermission):
    """
    Allows access only to authenticated users with role='OFFICER' or having an OfficerProfile, or ADMIN.
    """
    def has_permission(self, request, view):
        user = request.user
        return bool(
            user and
            user.is_authenticated and
            (user.role in ['OFFICER', 'ADMIN'] or hasattr(user, 'officer_profile') or user.is_superuser)
        )


class IsCentralDeskUser(permissions.BasePermission):
    """
    Allows access only to Central Desk Triage Operators, System Administrators, or Staff.
    """
    def has_permission(self, request, view):
        user = request.user
        return bool(
            user and
            user.is_authenticated and
            (user.role in ['CENTRAL_DESK', 'ADMIN'] or user.is_staff or user.is_superuser)
        )


class IsOfficerOrCentralDesk(permissions.BasePermission):
    """
    Allows access to Frontline Officers, Central Desk Operators, or Admins.
    Citizens are strictly excluded.
    """
    def has_permission(self, request, view):
        user = request.user
        return bool(
            user and
            user.is_authenticated and
            (
                user.role in ['OFFICER', 'CENTRAL_DESK', 'ADMIN'] or
                hasattr(user, 'officer_profile') or
                user.is_staff or
                user.is_superuser
            )
        )


class IsAssignedOfficerOrStaff(permissions.BasePermission):
    """
    Allows action only if the user is the officer assigned to the specific complaint,
    or has Central Desk / Staff / Superuser authority.
    """
    def has_permission(self, request, view):
        user = request.user
        return bool(
            user and
            user.is_authenticated and
            (
                user.role in ['OFFICER', 'CENTRAL_DESK', 'ADMIN'] or
                hasattr(user, 'officer_profile') or
                user.is_staff or
                user.is_superuser
            )
        )

    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_staff or user.is_superuser or user.role in ['CENTRAL_DESK', 'ADMIN']:
            return True
        if hasattr(user, 'officer_profile'):
            return obj.assigned_officer == user.officer_profile
        return False


class IsCitizenUser(permissions.BasePermission):
    """
    Allows access only to authenticated citizen users.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == 'CITIZEN'
        )
