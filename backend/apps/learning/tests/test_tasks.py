"""
Tests cho Celery tasks:
  send_review_reminders   — nhắc ôn từ đến hạn
  send_assignment_digest  — nhắc bài tập sắp đến hạn
"""
import pytest
from datetime import date, timedelta
from django.core import mail
from django.utils import timezone

pytestmark = pytest.mark.django_db


# ══════════════════════════════════════════════════════════════════════════════
# send_review_reminders
# ══════════════════════════════════════════════════════════════════════════════

class TestSendReviewReminders:
    def test_creates_notification_for_pending_user(self, student, word_a):
        from apps.learning.models import Notification, ReviewLog
        from apps.learning.tasks import send_review_reminders

        ReviewLog.objects.create(
            user=student, word=word_a,
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
            user=student, word=word_a,
            next_review_date=date.today(),
        )

        send_review_reminders()

        assert len(mail.outbox) == 1
        assert student.email in mail.outbox[0].to

    def test_skips_user_who_already_reviewed(self, student, word_a):
        from apps.learning.models import Notification, ReviewLog
        from apps.learning.tasks import send_review_reminders

        ReviewLog.objects.create(
            user=student, word=word_a,
            next_review_date=date.today(),
            last_reviewed=date.today(),
        )

        send_review_reminders()

        assert not Notification.objects.filter(
            user=student, type="reminder"
        ).exists()

    def test_skips_future_review_dates(self, student, word_b):
        from apps.learning.models import Notification, ReviewLog
        from apps.learning.tasks import send_review_reminders

        ReviewLog.objects.create(
            user=student, word=word_b,
            next_review_date=date.today() + timedelta(days=3),
        )

        send_review_reminders()

        assert not Notification.objects.filter(
            user=student, type="reminder"
        ).exists()

    def test_returns_sent_count(self, student, word_a):
        from apps.learning.models import ReviewLog
        from apps.learning.tasks import send_review_reminders

        ReviewLog.objects.create(
            user=student, word=word_a,
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


# ══════════════════════════════════════════════════════════════════════════════
# send_assignment_digest
# ══════════════════════════════════════════════════════════════════════════════

class TestSendAssignmentDigest:
    def test_creates_notification_for_upcoming_deadline(
        self, student, teacher, lesson
    ):
        from apps.learning.models import Assignment, Notification
        from apps.learning.tasks import send_assignment_digest

        Assignment.objects.create(
            teacher=teacher, student=student, lesson=lesson,
            due_date=date.today() + timedelta(days=1),
            completed_at=None,
        )

        send_assignment_digest()

        assert Notification.objects.filter(
            user=student, type=Notification.Type.REMINDER
        ).exists()

    def test_sends_email_for_upcoming_deadline(self, student, teacher, lesson):
        from apps.learning.models import Assignment
        from apps.learning.tasks import send_assignment_digest

        Assignment.objects.create(
            teacher=teacher, student=student, lesson=lesson,
            due_date=date.today() + timedelta(days=1),
            completed_at=None,
        )

        send_assignment_digest()

        assert len(mail.outbox) == 1
        assert student.email in mail.outbox[0].to

    def test_skips_completed_assignments(self, student, teacher, lesson):
        from apps.learning.models import Assignment, Notification
        from apps.learning.tasks import send_assignment_digest

        Assignment.objects.create(
            teacher=teacher, student=student, lesson=lesson,
            due_date=date.today() + timedelta(days=1),
            completed_at=timezone.now(),
        )

        send_assignment_digest()

        assert not Notification.objects.filter(
            user=student, type="reminder"
        ).exists()

    def test_skips_assignments_beyond_2_days(self, student, teacher, lesson):
        from apps.learning.models import Assignment, Notification
        from apps.learning.tasks import send_assignment_digest

        Assignment.objects.create(
            teacher=teacher, student=student, lesson=lesson,
            due_date=date.today() + timedelta(days=5),
            completed_at=None,
        )

        send_assignment_digest()

        assert not Notification.objects.filter(
            user=student, type="reminder"
        ).exists()

    def test_returns_stats_dict(self, student, teacher, lesson):
        from apps.learning.models import Assignment
        from apps.learning.tasks import send_assignment_digest

        Assignment.objects.create(
            teacher=teacher, student=student, lesson=lesson,
            due_date=date.today(),
            completed_at=None,
        )

        result = send_assignment_digest()

        assert "users_notified" in result
        assert result["users_notified"] == 1

    def test_each_user_notified_only_once(self, student, teacher, lesson, db):
        """Học sinh có nhiều bài sắp đến hạn chỉ nhận 1 email."""
        from apps.learning.models import Assignment, Lesson, LessonWord
        from apps.learning.tasks import send_assignment_digest
        from apps.vocabulary.models import Word

        word = Word.objects.create(
            text="extra", level="A1", created_by=teacher
        )
        lesson2 = Lesson.objects.create(
            title="Lesson 2", level="A1", order_index=2,
            is_published=True, created_by=teacher,
        )
        LessonWord.objects.create(lesson=lesson2, word=word, order_index=0)

        Assignment.objects.create(
            teacher=teacher, student=student, lesson=lesson,
            due_date=date.today() + timedelta(days=1), is_completed=False,
        )
        Assignment.objects.create(
            teacher=teacher, student=student, lesson=lesson2,
            due_date=date.today() + timedelta(days=2), is_completed=False,
        )

        send_assignment_digest()

        assert len(mail.outbox) == 1


class TestSendOnboardingFirstLessonReminders:
    def test_reminds_after_24h_without_first_lesson(self, student):
        from apps.learning.models import LearningEvent, Notification
        from apps.learning.tasks import send_onboarding_first_lesson_reminders

        submit = LearningEvent.objects.create(
            user=student,
            event_type=LearningEvent.EventType.ONBOARDING_STEP,
            meta={"step": "placement_submit"},
        )
        LearningEvent.objects.filter(id=submit.id).update(created_at=timezone.now() - timedelta(hours=25))

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
        LearningEvent.objects.filter(id=submit.id).update(created_at=timezone.now() - timedelta(hours=25))
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
        LearningEvent.objects.filter(id=submit.id).update(created_at=timezone.now() - timedelta(hours=26))

        first = send_onboarding_first_lesson_reminders()
        second = send_onboarding_first_lesson_reminders()

        assert first["users_notified"] == 1
        assert second["users_notified"] == 0
        assert Notification.objects.filter(
            user=student,
            type=Notification.Type.REMINDER,
        ).count() == 1
