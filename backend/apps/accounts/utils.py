"""
Hàm tiện ích cho module accounts: tạo token, gửi email.
"""
import secrets
from django.conf import settings
from django.core.mail import send_mail


def generate_token(nbytes: int = 48) -> str:
    """Tạo chuỗi token URL-safe ngẫu nhiên."""
    return secrets.token_urlsafe(nbytes)


def send_verification_email(user, token: str) -> None:
    """Gửi email kích hoạt tài khoản (link hết hạn sau 24h)."""
    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
    verify_url = f"{frontend_url}/verify-email?token={token}"
    send_mail(
        subject="[MNM Learn English] Xác thực tài khoản của bạn",
        message=(
            f"Xin chào {user.full_name or user.username},\n\n"
            f"Nhấn vào link bên dưới để kích hoạt tài khoản (hết hạn sau 24h):\n"
            f"{verify_url}\n\n"
            "Nếu bạn không đăng ký, hãy bỏ qua email này."
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )


def send_password_reset_email(user, token: str) -> None:
    """Gửi email đặt lại mật khẩu (link hết hạn sau 1h)."""
    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
    reset_url = f"{frontend_url}/reset-password?token={token}"
    send_mail(
        subject="[MNM Learn English] Đặt lại mật khẩu",
        message=(
            f"Xin chào {user.full_name or user.username},\n\n"
            f"Nhấn vào link bên dưới để đặt lại mật khẩu (hết hạn sau 1h):\n"
            f"{reset_url}\n\n"
            "Nếu bạn không yêu cầu, hãy bỏ qua email này.\n"
            "Mật khẩu cũ của bạn vẫn còn hoạt động."
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )
