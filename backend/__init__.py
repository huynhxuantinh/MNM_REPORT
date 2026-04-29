# Đảm bảo Celery app được load khi Django khởi động
# Import từ celery_app.py (không phải celery.py) để tránh circular import
from celery_app import app as celery_app  # noqa: F401

__all__ = ("celery_app",)
