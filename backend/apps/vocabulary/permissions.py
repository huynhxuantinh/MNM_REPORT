"""Custom permissions cho vocabulary module."""
from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsOwnerOrAdmin(BasePermission):
    """Sửa/xóa object: phải là người tạo hoặc admin.
    Admin không bị ràng buộc owner."""

    message = "Bạn không có quyền chỉnh sửa nội dung của người khác."

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return (
            getattr(obj, "created_by_id", None) == request.user.id
            or request.user.role == "admin"
            or request.user.is_staff
        )
