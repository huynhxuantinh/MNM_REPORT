"""
Test settings:
- SQLite in-memory
- Local-memory cache for placement/session flows
- Locmem email backend
"""
from .base import *  # noqa: F401, F403

SECRET_KEY = "django-insecure-test-secret-key-not-for-production"
DEBUG = True
ALLOWED_HOSTS = ["*"]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "mnm-test-cache",
    }
}

SESSION_ENGINE = "django.contrib.sessions.backends.db"
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

INSTALLED_APPS = [a for a in INSTALLED_APPS if a != "debug_toolbar"]  # noqa: F405
MIDDLEWARE = [m for m in MIDDLEWARE if "debug_toolbar" not in m]  # noqa: F405

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 8},
    },
]

# Keep throttles disabled by default in tests but define learning scopes
# so view-level throttles do not raise ImproperlyConfigured.
REST_FRAMEWORK["DEFAULT_THROTTLE_CLASSES"] = []  # noqa: F405
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"] = {  # noqa: F405
    "anon": None,
    "user": None,
    "login": None,
    "register": None,
    "password_reset": None,
    "login_strict": None,
    "register_strict": None,
    "password_reset_strict": None,
    "captcha": None,
    "burst": None,
    "sustained": None,
    "learning_session_start": None,
    "learning_session_answer_burst": None,
    "learning_session_answer_sustained": None,
    "learning_session_finish": None,
    "learning_session_quit": None,
    "learning_checkpoint_start": None,
    "learning_checkpoint_submit": None,
}
