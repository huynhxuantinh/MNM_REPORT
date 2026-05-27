# Ensure Celery app is loaded with Django startup.
from config.celery import app as celery_app  # noqa: F401

__all__ = ("celery_app",)
