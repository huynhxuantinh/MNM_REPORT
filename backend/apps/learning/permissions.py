"""Custom permissions cho learning module."""
from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsTeacherOrAdmin(BasePermission):
    message = "Chỉ giáo viên hoặc quản trị viên mới có quyền thực hiện thao tác này."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.role in ("teacher", "admin") or request.user.is_staff


class IsOwnerOrAdmin(BasePermission):
    message = "Bạn không có quyền chỉnh sửa nội dung của người khác."

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        owner_id = getattr(obj, "created_by_id", None) or getattr(obj, "teacher_id", None)
        return (
            owner_id == request.user.id
            or request.user.role == "admin"
            or request.user.is_staff
        )
