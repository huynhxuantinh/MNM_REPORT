"""Throttle classes tùy chỉnh cho các endpoint nhạy cảm."""
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    """Giới hạn 10 lần/phút mỗi IP để ngăn brute-force login."""
    scope = "login"


class RegisterRateThrottle(AnonRateThrottle):
    """Giới hạn 5 lần/phút mỗi IP để ngăn tạo tài khoản hàng loạt."""
    scope = "register"


class PasswordResetRateThrottle(AnonRateThrottle):
    """Giới hạn 5 lần/giờ mỗi IP để ngăn spam email reset mật khẩu."""
    scope = "password_reset"
