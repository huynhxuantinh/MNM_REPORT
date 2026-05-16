"""Django Admin cho module accounts."""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html

from .models import EmailVerificationToken, PasswordResetToken, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Quản lý người dùng – mở rộng từ BaseUserAdmin để giữ form đổi mật khẩu."""

    list_display = (
        "email", "username", "full_name", "role_badge",
        "level_xp", "is_active", "email_verified", "date_joined",
    )
    list_filter = ("role", "is_active", "email_verified", "is_staff")
    search_fields = ("email", "username", "full_name")
    ordering = ("-date_joined",)
    readonly_fields = ("created_at", "updated_at", "date_joined", "last_login")

    fieldsets = (
        (None, {"fields": ("email", "username", "password")}),
        ("Thông tin cá nhân", {"fields": ("full_name", "avatar_url")}),
        ("Vai trò & Gamification", {"fields": ("role", "xp", "level")}),
        ("Trạng thái", {"fields": ("is_active", "email_verified", "notification_enabled")}),
        ("Quyền hệ thống", {"fields": ("is_staff", "is_superuser", "groups", "user_permissions"), "classes": ("collapse",)}),
        ("Thời gian", {"fields": ("date_joined", "last_login", "created_at", "updated_at"), "classes": ("collapse",)}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "username", "full_name", "role", "password1", "password2"),
        }),
    )

    @admin.display(description="Vai trò")
    def role_badge(self, obj):
        colors = {"admin": "#d32f2f", "user": "#388e3c"}
        color = colors.get(obj.role, "#757575")
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:4px;font-size:11px">{}</span>',
            color, obj.get_role_display(),
        )

    @admin.display(description="Level / XP")
    def level_xp(self, obj):
        return f"Lv.{obj.level} ({obj.xp} XP)"

    actions = ["activate_users", "deactivate_users"]

    @admin.action(description="Kích hoạt tài khoản đã chọn")
    def activate_users(self, request, queryset):
        updated = queryset.update(is_active=True, email_verified=True)
        self.message_user(request, f"Đã kích hoạt {updated} tài khoản.")

    @admin.action(description="Vô hiệu hóa tài khoản đã chọn")
    def deactivate_users(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f"Đã vô hiệu hóa {updated} tài khoản.")


@admin.register(EmailVerificationToken)
class EmailVerificationTokenAdmin(admin.ModelAdmin):
    list_display = ("user", "token", "expires_at", "created_at")
    search_fields = ("user__email",)
    readonly_fields = ("created_at",)


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = ("user", "token", "expires_at", "is_used", "created_at")
    list_filter = ("is_used",)
    search_fields = ("user__email",)
    readonly_fields = ("created_at",)
