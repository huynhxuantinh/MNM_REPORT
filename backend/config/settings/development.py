"""Settings for development environment."""

import importlib.util
import os

from .base import *  # noqa: F403

DEBUG = True

# Load debug toolbar only when package is installed.
if importlib.util.find_spec("debug_toolbar") is not None:
    INSTALLED_APPS += ["debug_toolbar"]  # noqa: F405
    MIDDLEWARE = ["debug_toolbar.middleware.DebugToolbarMiddleware"] + MIDDLEWARE  # noqa: F405
    INTERNAL_IPS = ["127.0.0.1"]

# When running outside Docker, allow app to run without Redis.
if not os.path.exists("/.dockerenv"):
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "norostu-dev-cache",
        }
    }
    SESSION_ENGINE = "django.contrib.sessions.backends.db"
    CELERY_BROKER_URL = "redis://localhost:6379/0"
