"""Cấu hình pytest toàn dự án – fixtures dùng chung."""
import pytest
from django.test import override_settings


# Dùng locmem backend để kiểm tra email không gửi thật
@pytest.fixture(autouse=True)
def use_locmem_email(settings):
    settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
