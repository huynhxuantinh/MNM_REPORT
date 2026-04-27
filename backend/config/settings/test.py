"""
Cài đặt cho môi trường test:
- SQLite in-memory (không cần PostgreSQL)
- Cache in-memory (không cần Redis)
- Tắt debug toolbar
- Mật khẩu đơn giản để tạo user nhanh
"""
from .base import *  # noqa: F401, F403

# Override để tránh cần env vars
SECRET_KEY = "django-insecure-test-secret-key-not-for-production"
DEBUG = True
ALLOWED_HOSTS = ["*"]

# ── Database: SQLite in-memory ─────────────────────────────────────
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

# ── Cache: dummy (no-op) – evita cache pollution entre tests ──────
# Caching é otimização de deployment; os testes verificam lógica de negócio.
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.dummy.DummyCache",
    }
}

SESSION_ENGINE = "django.contrib.sessions.backends.db"

# ── Email: locmem ──────────────────────────────────────────────────
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

# ── Tắt debug toolbar (không có trong test) ───────────────────────
INSTALLED_APPS = [a for a in INSTALLED_APPS if a != "debug_toolbar"]  # noqa: F405
MIDDLEWARE = [m for m in MIDDLEWARE if "debug_toolbar" not in m]       # noqa: F405

# ── Giữ validator tối thiểu (8 ký tự) để test weak-password hoạt động ─
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 8},
    },
]

# ── Tắt throttling trong test (tránh 429 khi chạy suite nhanh) ────
REST_FRAMEWORK["DEFAULT_THROTTLE_CLASSES"] = []           # noqa: F405
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"] = {              # noqa: F405
    "anon": None, "user": None,
    "login": None, "register": None, "password_reset": None,
}
