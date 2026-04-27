"""Cài đặt cho môi trường development."""
from .base import *

DEBUG = True

INSTALLED_APPS += ["debug_toolbar"]

MIDDLEWARE = ["debug_toolbar.middleware.DebugToolbarMiddleware"] + MIDDLEWARE

INTERNAL_IPS = ["127.0.0.1"]

# Ghi email ra console thay vì gửi thật
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
