import pytest
from datetime import timedelta

from django.utils import timezone

from apps.learning.models import (
    DailyGoal,
    DailyGoalLog,
    LearningSession,
    UserHearts,
    UserReminderPreference,
    UserStreak,
)

pytestmark = pytest.mark.django_db


START_URL = "/api/v1/learning/session/start/"
ANSWER_URL = lambda sid: f"/api/v1/learning/session/{sid}/answer/"
DETAIL_URL = lambda sid: f"/api/v1/learning/session/{sid}/"
DAILY_GOAL_URL = "/api/v1/learning/daily-goal/"
DAILY_GOAL_CLAIM_URL = "/api/v1/learning/daily-goal/claim/"
STREAK_FREEZE_CLAIM_URL = "/api/v1/learning/streak-freeze/claim/"
REVIEW_ANSWER_URL = lambda wid: f"/api/v1/learning/review/{wid}/answer/"


@pytest.fixture
def course_with_units(lesson, unpublished_lesson):
    from apps.learning.models import Course, Unit, UnitLesson

    course = Course.objects.create(name="A1 Path", slug="a1-path-phase3", is_active=True)
    unit1 = Unit.objects.create(
        course=course,
        title="Unit 1",
        order_index=1,
        required_lessons_to_unlock=1,
        is_published=True,
    )
    unit2 = Unit.objects.create(
        course=course,
        title="Unit 2",
        order_index=2,
        required_lessons_to_unlock=1,
        is_published=True,
    )
    UnitLesson.objects.create(unit=unit1, lesson=lesson, order_index=1)
    UnitLesson.objects.create(unit=unit2, lesson=unpublished_lesson, order_index=1)
    return course, unit1, unit2


def test_daily_goal_endpoint_returns_payload(sc):
    response = sc.get(DAILY_GOAL_URL)
    assert response.status_code == 200
    assert "target_minutes" in response.data
    assert "today" in response.data
    assert "hearts" in response.data
    assert "streak" in response.data


def test_claim_daily_goal_success(sc, student):
    goal = DailyGoal.objects.create(user=student, target_minutes=5, reward_xp=15, is_active=True)
    DailyGoalLog.objects.create(
        user=student,
        goal=goal,
        goal_date=timezone.localdate(),
        studied_minutes=6,
        goal_minutes=5,
        is_achieved=True,
    )

    response = sc.post(DAILY_GOAL_CLAIM_URL)
    assert response.status_code == 200
    assert response.data["already_claimed"] is False
    assert response.data["reward_xp"] == 15


def test_hearts_consumed_and_blocked_when_zero(sc, lesson, student, course_with_units):
    start = sc.post(START_URL, {"lesson_id": lesson.id}, format="json")
    session_id = start.data["id"]
    session = LearningSession.objects.get(id=session_id)
    target_word_id = lesson.words.first().id
    session.exercises = [
        {
            "step_index": 1,
            "exercise_type": "mc_meaning",
            "prompt": "p1",
            "choices": ["A", "B"],
            "word_id": target_word_id,
            "correct_option": "A",
        },
        {
            "step_index": 2,
            "exercise_type": "mc_meaning",
            "prompt": "p2",
            "choices": ["A", "B"],
            "word_id": target_word_id,
            "correct_option": "A",
        },
    ]
    session.save(update_fields=["exercises"])

    hearts = UserHearts.objects.get(user=student)
    hearts.current_hearts = 1
    hearts.max_hearts = 5
    hearts.refill_interval_minutes = 10000
    hearts.last_refill_at = timezone.now()
    hearts.save(update_fields=["current_hearts", "max_hearts", "refill_interval_minutes", "last_refill_at", "updated_at"])

    first = sc.post(
        ANSWER_URL(session_id),
        {"step_index": 1, "submitted_answer": {"option": "B"}, "response_ms": 200},
        format="json",
    )
    assert first.status_code == 200
    assert first.data["feedback"]["hearts"] == 0

    second = sc.post(
        ANSWER_URL(session_id),
        {"step_index": 2, "submitted_answer": {"option": "B"}, "response_ms": 200},
        format="json",
    )
    assert second.status_code == 429


def test_wrong_answer_hard_mode_costs_two_hearts(sc, lesson, student, course_with_units):
    start = sc.post(START_URL, {"lesson_id": lesson.id}, format="json")
    session_id = start.data["id"]
    session = LearningSession.objects.get(id=session_id)
    session.difficulty = "hard"
    target_word_id = lesson.words.first().id
    session.exercises = [
        {
            "step_index": 1,
            "exercise_type": "mc_meaning",
            "prompt": "p1",
            "choices": ["A", "B"],
            "word_id": target_word_id,
            "correct_option": "A",
        }
    ]
    session.save(update_fields=["difficulty", "exercises"])

    hearts = UserHearts.objects.get(user=student)
    hearts.current_hearts = 3
    hearts.max_hearts = 5
    hearts.refill_interval_minutes = 10000
    hearts.last_refill_at = timezone.now()
    hearts.save(update_fields=["current_hearts", "max_hearts", "refill_interval_minutes", "last_refill_at", "updated_at"])

    answer = sc.post(
        ANSWER_URL(session_id),
        {"step_index": 1, "submitted_answer": {"option": "B"}, "response_ms": 200},
        format="json",
    )
    assert answer.status_code == 200
    assert answer.data["feedback"]["heart_cost"] == 2
    assert answer.data["feedback"]["hearts"] == 1


def test_easy_mode_correct_answer_awards_8_xp(sc, lesson, course_with_units):
    start = sc.post(START_URL, {"lesson_id": lesson.id}, format="json")
    session_id = start.data["id"]
    session = LearningSession.objects.get(id=session_id)
    session.difficulty = "easy"
    target_word_id = lesson.words.first().id
    session.exercises = [
        {
            "step_index": 1,
            "exercise_type": "mc_meaning",
            "prompt": "p1",
            "choices": ["A", "B"],
            "word_id": target_word_id,
            "correct_option": "A",
        }
    ]
    session.save(update_fields=["difficulty", "exercises"])

    answer = sc.post(
        ANSWER_URL(session_id),
        {"step_index": 1, "submitted_answer": {"option": "A"}, "response_ms": 120},
        format="json",
    )
    assert answer.status_code == 200
    assert answer.data["feedback"]["awarded_xp"] == 8


def test_session_detail_returns_hearts(sc, lesson, course_with_units):
    start = sc.post(START_URL, {"lesson_id": lesson.id}, format="json")
    assert start.status_code == 201
    detail = sc.get(DETAIL_URL(start.data["id"]))
    assert detail.status_code == 200
    assert "hearts" in detail.data
    assert "current" in detail.data["hearts"]


def test_streak_freeze_is_consumed_on_gap_day(sc, student, review_log):
    streak = UserStreak.objects.create(
        user=student,
        current_streak=5,
        longest_streak=5,
        last_active_date=timezone.localdate() - timedelta(days=2),
        streak_freezes=1,
    )
    response = sc.post(REVIEW_ANSWER_URL(review_log.word_id), {"quality": 4}, format="json")
    assert response.status_code == 200

    streak.refresh_from_db()
    assert streak.current_streak == 6
    assert streak.streak_freezes == 0
    assert streak.last_freeze_used_on == timezone.localdate()


def test_streak_freeze_rewarded_at_7_day_milestone(sc, student, review_log):
    streak = UserStreak.objects.create(
        user=student,
        current_streak=6,
        longest_streak=6,
        last_active_date=timezone.localdate() - timedelta(days=1),
        streak_freezes=0,
    )
    response = sc.post(REVIEW_ANSWER_URL(review_log.word_id), {"quality": 4}, format="json")
    assert response.status_code == 200

    streak.refresh_from_db()
    assert streak.current_streak == 7
    assert streak.streak_freezes == 1
    assert streak.last_freeze_reward_streak == 7


def test_review_answer_updates_reminder_preference(sc, review_log, student):
    response = sc.post(REVIEW_ANSWER_URL(review_log.word_id), {"quality": 4}, format="json")
    assert response.status_code == 200

    pref = UserReminderPreference.objects.filter(user=student).first()
    assert pref is not None
    assert pref.preferred_hour is not None


def test_claim_streak_freeze_with_xp(sc, student):
    student.xp = 120
    student.save(update_fields=["xp", "updated_at"])
    response = sc.post(STREAK_FREEZE_CLAIM_URL)
    assert response.status_code == 200
    assert response.data["freeze_count"] >= 1
    assert response.data["spent_xp"] == 50


def test_claim_streak_freeze_without_enough_xp(sc, student):
    student.xp = 10
    student.save(update_fields=["xp", "updated_at"])
    response = sc.post(STREAK_FREEZE_CLAIM_URL)
    assert response.status_code == 400


def test_claim_streak_freeze_respects_cap(sc, student):
    streak = UserStreak.objects.create(user=student, streak_freezes=5)
    student.xp = 200
    student.save(update_fields=["xp", "updated_at"])
    response = sc.post(STREAK_FREEZE_CLAIM_URL)
    assert response.status_code == 400
    streak.refresh_from_db()
    assert streak.streak_freezes == 5
