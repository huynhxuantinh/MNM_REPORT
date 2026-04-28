"""
Cấu hình Celery cho dự án MNM English.
Khởi động worker: celery -A celery worker -l info
Khởi động beat:   celery -A celery beat -l info
"""
import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.base")

app = Celery("mnm_english")

# Đọc cấu hình từ CELERY_* trong Django settings
app.config_from_object("django.conf:settings", namespace="CELERY")

# Tự phát hiện tasks.py trong mỗi installed app
app.autodiscover_tasks()
