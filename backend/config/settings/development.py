"""Cài đặt cho môi trường development."""
from .base import *

DEBUG = True

INSTALLED_APPS += ["debug_toolbar"]

MIDDLEWARE = ["debug_toolbar.middleware.DebugToolbarMiddleware"] + MIDDLEWARE

INTERNAL_IPS = ["127.0.0.1"]

# Email đọc từ .env — mặc định dùng Mailtrap sandbox (xem EMAIL_* trong .env)

# --- OVERRIDE FOR DEVELOPMENT WITHOUT REDIS ---
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "unique-snowflake",
    }
}

# Sử dụng database cho sessions thay vì cache (Redis) để tránh lỗi connection
SESSION_ENGINE = "django.contrib.sessions.backends.db"

# Celery broker dùng database tạm thời nếu không có Redis
CELERY_BROKER_URL = "redis://localhost:6379/0" # Vẫn để đây nhưng LocMem sẽ giúp các view chạy được
