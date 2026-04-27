"""Cài đặt cho môi trường development."""
from .base import *

DEBUG = True

INSTALLED_APPS += ["debug_toolbar"]

MIDDLEWARE = ["debug_toolbar.middleware.DebugToolbarMiddleware"] + MIDDLEWARE

INTERNAL_IPS = ["127.0.0.1"]

# Email đọc từ .env — mặc định dùng Mailtrap sandbox (xem EMAIL_* trong .env)
