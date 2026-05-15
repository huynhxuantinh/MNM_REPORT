import pytest
from django.core.cache import cache

from apps.learning.models import Course, ExerciseAttempt, LearningSession, Unit, UnitLesson
from apps.learning.throttles import LearningSessionStartRateThrottle

pytestmark = pytest.mark.django_db

START_URL = "/api/v1/learning/session/start/"
ANSWER_URL = lambda sid: f"/api/v1/learning/session/{sid}/answer/"
SWITCH_EASY_URL = lambda sid: f"/api/v1/learning/session/{sid}/switch-easy/"


@pytest.fixture
def course_with_units(lesson):
    course = Course.objects.create(name="A1 Path P4 Hardening", slug="a1-path-p4-hardening", is_active=True)
    unit1 = Unit.objects.create(
        course=course,
        title="Unit 1",
        order_index=1,
        required_lessons_to_unlock=1,
        is_published=True,
    )
    UnitLesson.objects.create(unit=unit1, lesson=lesson, order_index=1)
    return course, unit1


def test_answer_too_fast_marks_suspicious_and_zero_xp(sc, lesson, course_with_units):
    start = sc.post(START_URL, {"lesson_id": lesson.id}, format="json")
    assert start.status_code == 201
    session_id = start.data["id"]

    session = LearningSession.objects.get(id=session_id)
    session.exercises = [
        {
            "step_index": 1,
            "exercise_type": "mc_meaning",
            "prompt": "pick",
            "choices": ["A", "B", "C", "D"],
            "correct_option": "A",
            "word_id": 0,
        }
    ]
    session.save(update_fields=["exercises"])

    answer = sc.post(
        ANSWER_URL(session_id),
        {"step_index": 1, "submitted_answer": {"option": "A"}, "response_ms": 1},
        format="json",
    )
    assert answer.status_code == 200
    assert answer.data["feedback"]["is_correct"] is True
    assert answer.data["feedback"]["awarded_xp"] == 0
    assert answer.data["feedback"]["suspicious"] is True
    assert "too_fast_response" in answer.data["feedback"]["suspicious_flags"]

    attempt = ExerciseAttempt.objects.get(session_id=session_id, step_index=1)
    assert attempt.awarded_xp == 0
    assert attempt.response_ms == 1


def test_answer_requires_step_order(sc, lesson, course_with_units):
    start = sc.post(START_URL, {"lesson_id": lesson.id}, format="json")
    assert start.status_code == 201
    session_id = start.data["id"]

    session = LearningSession.objects.get(id=session_id)
    session.exercises = [
        {
            "step_index": 1,
            "exercise_type": "mc_meaning",
            "prompt": "q1",
            "choices": ["A", "B", "C", "D"],
            "correct_option": "A",
            "word_id": 0,
        },
        {
            "step_index": 2,
            "exercise_type": "mc_meaning",
            "prompt": "q2",
            "choices": ["A", "B", "C", "D"],
            "correct_option": "A",
            "word_id": 0,
        },
    ]
    session.save(update_fields=["exercises"])

    answer = sc.post(
        ANSWER_URL(session_id),
        {"step_index": 2, "submitted_answer": {"option": "A"}, "response_ms": 300},
        format="json",
    )
    assert answer.status_code == 400
    assert answer.data["expected_step_index"] == 1


def test_session_start_throttle_rate_limit(sc, lesson, course_with_units, monkeypatch):
    cache.clear()
    monkeypatch.setattr(LearningSessionStartRateThrottle, "rate", "2/minute", raising=False)

    first = sc.post(START_URL, {"lesson_id": lesson.id}, format="json")
    second = sc.post(START_URL, {"lesson_id": lesson.id}, format="json")
    third = sc.post(START_URL, {"lesson_id": lesson.id}, format="json")

    assert first.status_code == 201
    assert second.status_code == 201
    assert third.status_code == 429


def test_wrong_streak_triggers_easy_mode_cta(sc, lesson, course_with_units):
    start = sc.post(START_URL, {"lesson_id": lesson.id}, format="json")
    assert start.status_code == 201
    session_id = start.data["id"]

    session = LearningSession.objects.get(id=session_id)
    session.difficulty = LearningSession.Difficulty.HARD
    session.exercises = [
        {
            "step_index": 1,
            "exercise_type": "mc_meaning",
            "prompt": "q1",
            "choices": ["A", "B"],
            "correct_option": "A",
            "word_id": 0,
        },
        {
            "step_index": 2,
            "exercise_type": "mc_meaning",
            "prompt": "q2",
            "choices": ["A", "B"],
            "correct_option": "A",
            "word_id": 0,
        },
        {
            "step_index": 3,
            "exercise_type": "mc_meaning",
            "prompt": "q3",
            "choices": ["A", "B"],
            "correct_option": "A",
            "word_id": 0,
        },
    ]
    session.save(update_fields=["difficulty", "exercises"])

    for step in [1, 2]:
        resp = sc.post(
            ANSWER_URL(session_id),
            {"step_index": step, "submitted_answer": {"option": "B"}, "response_ms": 300},
            format="json",
        )
        assert resp.status_code == 200
        assert resp.data["feedback"]["show_easy_mode_cta"] is False

    third = sc.post(
        ANSWER_URL(session_id),
        {"step_index": 3, "submitted_answer": {"option": "B"}, "response_ms": 300},
        format="json",
    )
    assert third.status_code == 200
    assert third.data["feedback"]["wrong_streak"] == 3
    assert third.data["feedback"]["show_easy_mode_cta"] is True
    assert third.data["frustration_guard"]["show_easy_mode_cta"] is True


def test_switch_easy_endpoint_changes_difficulty(sc, lesson, course_with_units):
    start = sc.post(START_URL, {"lesson_id": lesson.id}, format="json")
    assert start.status_code == 201
    session_id = start.data["id"]
    session = LearningSession.objects.get(id=session_id)
    session.difficulty = LearningSession.Difficulty.HARD
    session.save(update_fields=["difficulty"])

    switch_resp = sc.post(SWITCH_EASY_URL(session_id), format="json")
    assert switch_resp.status_code == 200
    assert switch_resp.data["switched"] is True
    assert switch_resp.data["difficulty"] == LearningSession.Difficulty.EASY

    session.refresh_from_db()
    assert session.difficulty == LearningSession.Difficulty.EASY
