"""Tests for learning Celery tasks."""

from datetime import date, timedelta

import pytest
from django.core import mail
from django.utils import timezone

pytestmark = pytest.mark.django_db


class TestSendReviewReminders:
    def test_creates_notification_for_pending_user(self, student, word_a):
        from apps.learning.models import Notification, ReviewLog
        from apps.learning.tasks import send_review_reminders

        ReviewLog.objects.create(
            user=student,
            word=word_a,
            next_review_date=date.today(),
        )

        send_review_reminders()

        assert Notification.objects.filter(
            user=student,
            type=Notification.Type.REMINDER,
        ).exists()

    def test_sends_email_to_pending_user(self, student, word_a):
        from apps.learning.models import ReviewLog
        from apps.learning.tasks import send_review_reminders

        ReviewLog.objects.create(
            user=student,
            word=word_a,
            next_review_date=date.today(),
        )

        send_review_reminders()

        assert len(mail.outbox) == 1
        assert student.email in mail.outbox[0].to

    def test_skips_user_who_already_reviewed(self, student, word_a):
        from apps.learning.models import Notification, ReviewLog
        from apps.learning.tasks import send_review_reminders

        ReviewLog.objects.create(
            user=student,
            word=word_a,
            next_review_date=date.today(),
            last_reviewed=date.today(),
        )

        send_review_reminders()

        assert not Notification.objects.filter(user=student, type="reminder").exists()

    def test_skips_future_review_dates(self, student, word_b):
        from apps.learning.models import Notification, ReviewLog
        from apps.learning.tasks import send_review_reminders

        ReviewLog.objects.create(
            user=student,
            word=word_b,
            next_review_date=date.today() + timedelta(days=3),
        )

        send_review_reminders()

        assert not Notification.objects.filter(user=student, type="reminder").exists()

    def test_returns_sent_count(self, student, word_a):
        from apps.learning.models import ReviewLog
        from apps.learning.tasks import send_review_reminders

        ReviewLog.objects.create(
            user=student,
            word=word_a,
            next_review_date=date.today(),
        )

        result = send_review_reminders()

        assert "sent" in result
        assert result["sent"] >= 0

    def test_no_action_when_no_pending(self):
        from apps.learning.tasks import send_review_reminders

        result = send_review_reminders()
        assert result["sent"] == 0
        assert len(mail.outbox) == 0

    def test_uses_last_activity_hour_when_preferred_hour_missing(self, student, word_a):
        from apps.learning.models import Notification, ReviewLog, UserReminderPreference
        from apps.learning.tasks import send_review_reminders

        ReviewLog.objects.create(
            user=student,
            word=word_a,
            next_review_date=date.today(),
        )
        pref = UserReminderPreference.objects.create(
            user=student,
            preferred_hour=None,
            last_activity_at=timezone.now(),
        )

        result = send_review_reminders()
        assert result["sent"] >= 1
        assert Notification.objects.filter(user=student, type=Notification.Type.REMINDER).exists()


class TestSendOnboardingFirstLessonReminders:
    def test_reminds_after_24h_without_first_lesson(self, student):
        from apps.learning.models import LearningEvent, Notification
        from apps.learning.tasks import send_onboarding_first_lesson_reminders

        submit = LearningEvent.objects.create(
            user=student,
            event_type=LearningEvent.EventType.ONBOARDING_STEP,
            meta={"step": "placement_submit"},
        )
        LearningEvent.objects.filter(id=submit.id).update(
            created_at=timezone.now() - timedelta(hours=25)
        )

        result = send_onboarding_first_lesson_reminders()

        assert result["users_notified"] == 1
        assert Notification.objects.filter(
            user=student,
            type=Notification.Type.REMINDER,
        ).exists()
        assert LearningEvent.objects.filter(
            user=student,
            event_type=LearningEvent.EventType.ONBOARDING_STEP,
            meta__step="first_lesson_reminder_sent",
            meta__submit_event_id=submit.id,
        ).exists()

    def test_skip_if_first_lesson_already_started(self, student):
        from apps.learning.models import LearningEvent, Notification
        from apps.learning.tasks import send_onboarding_first_lesson_reminders

        submit = LearningEvent.objects.create(
            user=student,
            event_type=LearningEvent.EventType.ONBOARDING_STEP,
            meta={"step": "placement_submit"},
        )
        LearningEvent.objects.filter(id=submit.id).update(
            created_at=timezone.now() - timedelta(hours=25)
        )
        LearningEvent.objects.create(
            user=student,
            event_type=LearningEvent.EventType.ONBOARDING_STEP,
            meta={"step": "first_lesson_start"},
        )

        result = send_onboarding_first_lesson_reminders()

        assert result["users_notified"] == 0
        assert not Notification.objects.filter(
            user=student,
            type=Notification.Type.REMINDER,
        ).exists()

    def test_idempotent_per_submit_event(self, student):
        from apps.learning.models import LearningEvent, Notification
        from apps.learning.tasks import send_onboarding_first_lesson_reminders

        submit = LearningEvent.objects.create(
            user=student,
            event_type=LearningEvent.EventType.ONBOARDING_STEP,
            meta={"step": "placement_submit"},
        )
        LearningEvent.objects.filter(id=submit.id).update(
            created_at=timezone.now() - timedelta(hours=26)
        )

        first = send_onboarding_first_lesson_reminders()
        second = send_onboarding_first_lesson_reminders()

        assert first["users_notified"] == 1
        assert second["users_notified"] == 0
        assert Notification.objects.filter(
            user=student,
            type=Notification.Type.REMINDER,
        ).count() == 1


class TestRefillHearts:
    def test_handles_future_last_refill_without_crash(self, student):
        from apps.learning.models import UserHearts
        from apps.learning.tasks import refill_hearts

        hearts = UserHearts.objects.create(
            user=student,
            current_hearts=1,
            max_hearts=5,
            refill_interval_minutes=5,
            last_refill_at=timezone.now() + timedelta(hours=2),
        )
        result = refill_hearts()
        hearts.refresh_from_db()

        assert result["users_updated"] >= 0
        assert hearts.current_hearts == 1
        assert hearts.last_refill_at <= timezone.now()
