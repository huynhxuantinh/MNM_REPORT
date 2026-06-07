"""Models for account and authentication domain."""
import math

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models import F
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    """Custom user model."""

    class Role(models.TextChoices):
        USER = "user", "Hoc sinh"
        ADMIN = "admin", "Quan tri vien"

    # Use email as primary login identifier.
    email = models.EmailField(_("email address"), max_length=254, unique=True)
    full_name = models.CharField("Ho va ten", max_length=200, blank=True)
    role = models.CharField("Vai tro", max_length=10, choices=Role.choices, default=Role.USER)
    xp = models.IntegerField("Diem kinh nghiem", default=0)
    level = models.IntegerField("Cap do", default=1)
    avatar_url = models.CharField("Anh dai dien", max_length=500, blank=True)
    timezone = models.CharField("Mui gio", max_length=64, default="Asia/Ho_Chi_Minh")
    # Keep inactive until email verification succeeds.
    is_active = models.BooleanField("Hoat dong", default=False)
    email_verified = models.BooleanField("Email da xac thuc", default=False)
    notification_enabled = models.BooleanField("Bat thong bao", default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        verbose_name = "Nguoi dung"
        verbose_name_plural = "Nguoi dung"
        db_table = "users"

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"

    @property
    def is_admin_user(self) -> bool:
        return self.role == self.Role.ADMIN

    def add_xp(self, amount: int) -> bool:
        """Add XP and auto level-up. Returns True when user leveled up."""
        type(self).objects.filter(pk=self.pk).update(xp=F("xp") + amount)
        self.refresh_from_db(fields=["xp"])
        new_level = self._calculate_level(self.xp)
        leveled_up = new_level > self.level
        self.level = new_level
        self.save(update_fields=["level"])
        return leveled_up

    @staticmethod
    def _calculate_level(xp: int) -> int:
        """Level formula: need 100*N*(N+1)/2 XP to reach level N."""
        xp = max(0, int(xp or 0))
        level = int((1 + math.sqrt(1 + (2 * xp) / 25)) // 2)
        return max(1, level)


class EmailVerificationToken(models.Model):
    """Email verification token, expires in 24 hours."""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="email_verification")
    token = models.CharField(max_length=64, unique=True, db_index=True)
    expires_at = models.DateTimeField("Het han luc")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Token xac thuc email"
        verbose_name_plural = "Token xac thuc email"
        db_table = "email_verification_tokens"

    def __str__(self):
        return f"EmailVerify - {self.user.email}"


class PasswordResetToken(models.Model):
    """Password reset token, expires in 1 hour."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="password_resets")
    token = models.CharField(max_length=64, unique=True, db_index=True)
    expires_at = models.DateTimeField("Het han luc")
    is_used = models.BooleanField("Da dung", default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Token reset mat khau"
        verbose_name_plural = "Token reset mat khau"
        db_table = "password_reset_tokens"

    def __str__(self):
        return f"PasswordReset - {self.user.email}"
