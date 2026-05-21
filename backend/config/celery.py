"""
Celery application entry point cho dá»± Ă¡n NoroStu.

Äáº·t trong package config/ Ä‘á»ƒ trĂ¡nh conflict vá»›i package celery cá»§a pip.
  Khá»Ÿi Ä‘á»™ng worker: celery -A config.celery worker -l info
  Khá»Ÿi Ä‘á»™ng beat:   celery -A config.celery beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler

Hoáº·c dĂ¹ng alias qua backend/celery.py:
  celery -A celery worker -l info
"""
import os

from celery import Celery
from celery.schedules import crontab  # An toĂ n: import á»Ÿ Ä‘Ă¢y KHĂ”NG gĂ¢y circular import

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

app = Celery("mnm_english")

# Äá»c cáº¥u hĂ¬nh tá»« CELERY_* trong Django settings
app.config_from_object("django.conf:settings", namespace="CELERY")

# Tá»± phĂ¡t hiá»‡n tasks.py trong má»—i installed app
app.autodiscover_tasks()

# Override beat schedule vá»›i crontab chuáº©n theo tá»«ng task
# base.py dĂ¹ng timedelta lĂ m fallback; á»Ÿ Ä‘Ă¢y chĂºng ta Ä‘áº·t lá»‹ch chĂ­nh xĂ¡c.
app.conf.beat_schedule = {
    # 20:00 ICT má»—i ngĂ y â€” nháº¯c há»c sinh cĂ³ tá»« Ä‘áº¿n háº¡n chÆ°a Ă´n
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


