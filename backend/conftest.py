"""Cấu hình pytest toàn dự án – fixtures dùng chung."""
import pytest
from django.core.cache import cache


# Dùng locmem backend để kiểm tra email không gửi thật
@pytest.fixture(autouse=True)
def use_locmem_email(settings):
    settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"


# Disable throttles và xóa throttle cache giữa các test
@pytest.fixture(autouse=True)
def disable_throttles(settings):
    settings.REST_FRAMEWORK["DEFAULT_THROTTLE_CLASSES"] = []
    settings.REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"] = {
        key: None
        for key in settings.REST_FRAMEWORK.get("DEFAULT_THROTTLE_RATES", {})
    }
    cache.clear()
    yield
    cache.clear()
