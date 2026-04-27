from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Chỉ cho phép user có role='admin'."""

    message = "Chỉ quản trị viên mới có quyền truy cập."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == "admin"
        )
