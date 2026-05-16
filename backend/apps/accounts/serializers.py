"""
Serializers cho module accounts.
"""
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import User


# ── Đăng ký ────────────────────────────────────────────────────────────────

class RegisterSerializer(serializers.ModelSerializer):
    """Đăng ký tài khoản mới – yêu cầu xác nhận mật khẩu."""

    password = serializers.CharField(
        write_only=True, validators=[validate_password],
        style={"input_type": "password"},
    )
    password_confirm = serializers.CharField(
        write_only=True, style={"input_type": "password"}
    )

    class Meta:
        model = User
        fields = ("username", "email", "full_name", "password", "password_confirm")
        extra_kwargs = {
            "email": {"required": True},
            "full_name": {"required": False},
        }

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email này đã được sử dụng.")
        return value.lower()

    def validate(self, attrs):
        if attrs["password"] != attrs.pop("password_confirm"):
            raise serializers.ValidationError(
                {"password_confirm": "Mật khẩu xác nhận không khớp."}
            )
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        # Tài khoản không hoạt động cho đến khi xác thực email
        user.is_active = False
        user.save()
        return user


# ── Đăng nhập ──────────────────────────────────────────────────────────────

class LoginSerializer(serializers.Serializer):
    """Đăng nhập bằng email + mật khẩu."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={"input_type": "password"})

    def validate(self, attrs):
        user = authenticate(
            request=self.context.get("request"),
            email=attrs["email"].lower(),
            password=attrs["password"],
        )
        if user is None:
            raise serializers.ValidationError(
                {"non_field_errors": "Email hoặc mật khẩu không đúng."}
            )
        # Phân biệt user chưa verify email vs user bị ban
        if not user.email_verified:
            raise serializers.ValidationError(
                {"non_field_errors": "Tài khoản chưa được xác thực. Vui lòng kiểm tra email để kích hoạt."}
            )
        if not user.is_active:
            raise serializers.ValidationError(
                {"non_field_errors": "Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên."}
            )
        attrs["user"] = user
        return attrs


# ── Profile ────────────────────────────────────────────────────────────────

class UserSerializer(serializers.ModelSerializer):
    """Thông tin cá nhân – dùng cho response và cập nhật profile."""

    class Meta:
        model = User
        fields = (
            "id", "email", "username", "full_name", "role",
            "xp", "level", "avatar_url", "notification_enabled", "created_at",
        )
        read_only_fields = ("id", "email", "username", "role", "xp", "level", "created_at")


# ── Xác thực email ─────────────────────────────────────────────────────────

class VerifyEmailSerializer(serializers.Serializer):
    token = serializers.CharField()


# ── Quên mật khẩu ─────────────────────────────────────────────────────────

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


# ── Đặt lại mật khẩu ──────────────────────────────────────────────────────

class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField()
    password = serializers.CharField(
        write_only=True, validators=[validate_password],
        style={"input_type": "password"},
    )
    password_confirm = serializers.CharField(
        write_only=True, style={"input_type": "password"}
    )

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {"password_confirm": "Mật khẩu xác nhận không khớp."}
            )
        return attrs


# ── Đổi mật khẩu ──────────────────────────────────────────────────────────

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(
        write_only=True, style={"input_type": "password"}
    )
    new_password = serializers.CharField(
        write_only=True, validators=[validate_password],
        style={"input_type": "password"},
    )
    new_password_confirm = serializers.CharField(
        write_only=True, style={"input_type": "password"}
    )

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Mật khẩu cũ không đúng.")
        return value

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError(
                {"new_password_confirm": "Mật khẩu mới xác nhận không khớp."}
            )
        return attrs


# ── Logout ─────────────────────────────────────────────────────────────────

class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField(help_text="Refresh token cần thu hồi")


# ── Admin ───────────────────────────────────────────────────────────────────

class AdminUserSerializer(serializers.ModelSerializer):
    """Dùng cho admin – hiển thị & cập nhật role / is_active."""

    class Meta:
        model = User
        fields = (
            "id", "email", "username", "full_name", "role",
            "xp", "level", "is_active", "email_verified",
            "notification_enabled", "created_at",
        )
        read_only_fields = (
            "id", "email", "username", "xp", "level",
            "email_verified", "created_at",
        )
