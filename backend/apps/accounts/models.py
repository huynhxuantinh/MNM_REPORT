"""
Models cho module xác thực và tài khoản người dùng.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models import F
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    """Custom user model theo bảng User trong tài liệu đặc tả chương 3."""

    class Role(models.TextChoices):
        USER = "user", "Học sinh"
        ADMIN = "admin", "Quản trị viên"

    # Dùng email làm username chính để đăng nhập
    email = models.EmailField(_("email address"), max_length=254, unique=True)
    full_name = models.CharField("Họ và tên", max_length=200, blank=True)
    role = models.CharField(
        "Vai trò", max_length=10, choices=Role.choices, default=Role.USER
    )
    xp = models.IntegerField("Điểm kinh nghiệm", default=0)
    level = models.IntegerField("Cấp độ", default=1)
    avatar_url = models.CharField("Ảnh đại diện", max_length=500, blank=True)
    # is_active = False cho đến khi xác thực email
    is_active = models.BooleanField("Hoạt động", default=False)
    email_verified = models.BooleanField("Email đã xác thực", default=False)
    notification_enabled = models.BooleanField("Bật thông báo", default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        verbose_name = "Người dùng"
        verbose_name_plural = "Người dùng"
        db_table = "users"

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"

    @property
    def is_admin_user(self) -> bool:
        return self.role == self.Role.ADMIN

    def add_xp(self, amount: int) -> bool:
        """Cộng XP và tự động nâng level. Trả về True nếu vừa lên level."""
        type(self).objects.filter(pk=self.pk).update(xp=F("xp") + amount)
        self.refresh_from_db(fields=["xp"])
        new_level = self._calculate_level(self.xp)
        leveled_up = new_level > self.level
        self.level = new_level
        self.save(update_fields=["level"])
        return leveled_up

    @staticmethod
    def _calculate_level(xp: int) -> int:
        """Công thức cấp độ: cần 100×N×(N+1)/2 XP để đạt level N."""
        level = 1
        while xp >= 100 * level * (level + 1) // 2:
            level += 1
        return level


class EmailVerificationToken(models.Model):
    """Token xác thực email – hạn sử dụng 24 giờ."""

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="email_verification"
    )
    token = models.CharField(max_length=64, unique=True, db_index=True)
    expires_at = models.DateTimeField("Hết hạn lúc")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Token xác thực email"
        verbose_name_plural = "Token xác thực email"
        db_table = "email_verification_tokens"

    def __str__(self):
        return f"EmailVerify – {self.user.email}"


class PasswordResetToken(models.Model):
    """Token reset mật khẩu – hạn sử dụng 1 giờ."""

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="password_resets"
    )
    token = models.CharField(max_length=64, unique=True, db_index=True)
    expires_at = models.DateTimeField("Hết hạn lúc")
    is_used = models.BooleanField("Đã dùng", default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Token reset mật khẩu"
        verbose_name_plural = "Token reset mật khẩu"
        db_table = "password_reset_tokens"

    def __str__(self):
        return f"PasswordReset – {self.user.email}"
