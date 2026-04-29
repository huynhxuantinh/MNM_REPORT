"""
Celery application entry point cho dự án MNM English.

File này KHÔNG tên là celery.py để tránh shadow package celery của pip.

Khởi động worker:
  celery -A celery_app worker -l info -c 2

Khởi động beat:
  celery -A celery_app beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
"""
import os

from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

app = Celery("mnm_english")

# Đọc cấu hình từ CELERY_* trong Django settings
app.config_from_object("django.conf:settings", namespace="CELERY")

# Tự phát hiện tasks.py trong mỗi installed app
app.autodiscover_tasks()

# Lịch chạy task tự động với crontab đúng giờ
app.conf.beat_schedule = {
    # 20:00 ICT mỗi ngày — nhắc học sinh có từ đến hạn chưa ôn
    "review-reminders-daily": {
        "task": "learning.send_review_reminders",
        "schedule": crontab(hour=20, minute=0),
    },
    # 08:00 ICT mỗi ngày — nhắc bài tập sắp đến hạn (≤ 2 ngày)
    "assignment-digest-daily": {
        "task": "learning.send_assignment_digest",
        "schedule": crontab(hour=8, minute=0),
    },
}
