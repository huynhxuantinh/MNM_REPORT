"""
Celery application entry point cho dự án MNM English.

Đặt trong package config/ để tránh conflict với package celery của pip.
  Khởi động worker: celery -A config.celery worker -l info
  Khởi động beat:   celery -A config.celery beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler

Hoặc dùng alias qua backend/celery.py:
  celery -A celery worker -l info
"""
import os

from celery import Celery
from celery.schedules import crontab  # An toàn: import ở đây KHÔNG gây circular import

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

app = Celery("mnm_english")

# Đọc cấu hình từ CELERY_* trong Django settings
app.config_from_object("django.conf:settings", namespace="CELERY")

# Tự phát hiện tasks.py trong mỗi installed app
app.autodiscover_tasks()

# Override beat schedule với crontab chuẩn theo từng task
# base.py dùng timedelta làm fallback; ở đây chúng ta đặt lịch chính xác.
app.conf.beat_schedule = {
    # 20:00 ICT mỗi ngày — nhắc học sinh có từ đến hạn chưa ôn
    "review-reminders-daily": {
        "task": "learning.send_review_reminders",
        "schedule": crontab(hour=20, minute=0),
    },
    # Every hour: send daily-goal reminders based on user preferred hour
    "daily-goal-reminders-hourly": {
        "task": "learning.send_daily_goal_reminders",
        "schedule": crontab(minute=0),
    },
    # Every hour: refill hearts based on each user's refill interval
    "onboarding-first-lesson-reminders-hourly": {
        "task": "learning.send_onboarding_first_lesson_reminders",
        "schedule": crontab(minute=15),
    },
    "refill-hearts-hourly": {
        "task": "learning.refill_hearts",
        "schedule": crontab(minute=0),
    },
    "rebuild-weekly-league-daily": {
        "task": "learning.rebuild_weekly_league",
        "schedule": crontab(hour=0, minute=10),
    },
}

