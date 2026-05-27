"""Celery application for NoroStu.

Run:
  celery -A config.celery worker -l info
  celery -A config.celery beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
"""

import os

from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

app = Celery("norostu")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

# Single source of truth for periodic tasks.
app.conf.beat_schedule = {
    "review-reminders-daily": {
        "task": "learning.send_review_reminders",
        "schedule": crontab(hour=20, minute=0),
    },
    "daily-goal-reminders-hourly": {
        "task": "learning.send_daily_goal_reminders",
        "schedule": crontab(minute=0),
    },
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
