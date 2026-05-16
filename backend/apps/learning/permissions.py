"""Custom permissions cho learning module."""
from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsOwnerOrAdmin(BasePermission):
    message = "Bạn không có quyền chỉnh sửa nội dung của người khác."

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        owner_id = getattr(obj, "created_by_id", None)
        return (
            owner_id == request.user.id
            or request.user.role == "admin"
            or request.user.is_staff
        )
