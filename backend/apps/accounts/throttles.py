"""Throttle classes tùy chỉnh cho các endpoint nhạy cảm."""
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    """Giới hạn 10 lần/phút mỗi IP để ngăn brute-force login."""
    scope = "login"


class LoginStrictRateThrottle(AnonRateThrottle):
    """Giới hạn nghiêm ngặt hơn sau nhiều lần fail (3 lần/phút)."""
    scope = "login_strict"
    rate = "3/minute"


class RegisterRateThrottle(AnonRateThrottle):
    """Giới hạn 5 lần/phút mỗi IP để ngăn tạo tài khoản hàng loạt."""
    scope = "register"


class RegisterStrictRateThrottle(AnonRateThrottle):
    """Giới hạn nghiêm ngặt cho đăng ký (2 lần/phút sau 3 lần thử)."""
    scope = "register_strict"
    rate = "2/minute"


class PasswordResetRateThrottle(AnonRateThrottle):
    """Giới hạn 5 lần/giờ mỗi IP để ngăn spam email reset mật khẩu."""
    scope = "password_reset"


class PasswordResetStrictRateThrottle(AnonRateThrottle):
    """Giới hạn nghiêm ngặt hơn cho password reset (2 lần/giờ)."""
    scope = "password_reset_strict"
    rate = "2/hour"


class CaptchaRateThrottle(AnonRateThrottle):
    """
    Throttle kích hoạt khi captcha required.
    Giới hạn 5 lần/phút khi captcha không hợp lệ.
    """
    scope = "captcha"
    rate = "5/minute"


class BurstRateThrottle(UserRateThrottle):
    """Giới hạn burst requests cho user đã đăng nhập (100/phút)."""
    scope = "burst"
    rate = "100/minute"


class SustainedRateThrottle(UserRateThrottle):
    """Giới hạn sustained requests cho user đã đăng nhập (1000/ngày)."""
    scope = "sustained"
    rate = "1000/day"
