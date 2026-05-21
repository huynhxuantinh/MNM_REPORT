"""
Celery application entry point cho dá»± Ă¡n NoroStu.

File nĂ y KHĂ”NG tĂªn lĂ  celery.py Ä‘á»ƒ trĂ¡nh shadow package celery cá»§a pip.

Khá»Ÿi Ä‘á»™ng worker:
  celery -A celery_app worker -l info -c 2

Khá»Ÿi Ä‘á»™ng beat:
  celery -A celery_app beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
"""
import os

from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

app = Celery("mnm_english")

# Äá»c cáº¥u hĂ¬nh tá»« CELERY_* trong Django settings
app.config_from_object("django.conf:settings", namespace="CELERY")

# Tá»± phĂ¡t hiá»‡n tasks.py trong má»—i installed app
app.autodiscover_tasks()

# Lá»‹ch cháº¡y task tá»± Ä‘á»™ng vá»›i crontab Ä‘Ăºng giá»
app.conf.beat_schedule = {
    # 20:00 ICT má»—i ngĂ y â€” nháº¯c há»c sinh cĂ³ tá»« Ä‘áº¿n háº¡n chÆ°a Ă´n
    "review-reminders-daily": {
        "task": "learning.send_review_reminders",
        "schedule": crontab(hour=20, minute=0),
    },
}

