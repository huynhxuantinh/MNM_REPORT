"""Compatibility import for Celery app.

Prefer using:
  celery -A config.celery worker -l info
  celery -A config.celery beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
"""

from config.celery import app  # noqa: F401
