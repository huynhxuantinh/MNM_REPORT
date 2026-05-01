"""
Captcha validation utilities for enhanced security.
Supports hCaptcha and reCAPTCHA.
"""
import requests
from django.conf import settings
from rest_framework.exceptions import ValidationError


class CaptchaValidator:
    """Validator for captcha responses."""

    HCAPTCHA_VERIFY_URL = "https://hcaptcha.com/siteverify"
    RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify"

    def __init__(self, provider=None):
        self.provider = provider or getattr(settings, "CAPTCHA_PROVIDER", "hcaptcha")
        self.secret = getattr(settings, "CAPTCHA_SECRET_KEY", None)

    def validate(self, captcha_response, client_ip=None):
        """
        Validate captcha response from client.

        Args:
            captcha_response: The response token from captcha widget
            client_ip: Optional client IP address

        Returns:
            bool: True if captcha is valid

        Raises:
            ValidationError: If captcha is invalid or missing
        """
        if not captcha_response:
            raise ValidationError({"captcha": "Vui lòng hoàn thành xác thực captcha."})

        if not self.secret:
            # In development, skip validation if no secret key
            if settings.DEBUG:
                return True
            raise ValidationError({"captcha": "Captcha chưa được cấu hình."})

        verify_url = (
            self.HCAPTCHA_VERIFY_URL
            if self.provider == "hcaptcha"
            else self.RECAPTCHA_VERIFY_URL
        )

        data = {
            "secret": self.secret,
            "response": captcha_response,
        }
        if client_ip:
            data["remoteip"] = client_ip

        try:
            response = requests.post(verify_url, data=data, timeout=10)
            response.raise_for_status()
            result = response.json()
        except requests.RequestException as e:
            raise ValidationError({"captcha": f"Lỗi xác thực captcha: {str(e)}"})

        if not result.get("success"):
            error_codes = result.get("error-codes", [])
            raise ValidationError({"captcha": f"Captcha không hợp lệ: {', '.join(error_codes)}"})

        # Check score for reCAPTCHA v3
        score = result.get("score")
        if score is not None and score < 0.5:
            raise ValidationError({"captcha": "Điểm tin cậy quá thấp. Vui lòng thử lại."})

        return True


class CaptchaRequiredException(Exception):
    """Raised when captcha is required but not provided."""

    def __init__(self, message="Captcha required", fail_count=0):
        self.message = message
        self.fail_count = fail_count
        super().__init__(self.message)


def check_captcha_required(fail_count, threshold=3):
    """
    Check if captcha is required based on failure count.

    Args:
        fail_count: Number of consecutive failures
        threshold: Threshold after which captcha is required

    Returns:
        bool: True if captcha is required
    """
    return fail_count >= threshold
