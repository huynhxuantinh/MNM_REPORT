import pytest
from datetime import timedelta
from django.utils import timezone

from apps.learning.models import Course, LearningEvent, LearningSession, Unit, UnitLesson

pytestmark = pytest.mark.django_db

START_URL = "/api/v1/learning/session/start/"
ANSWER_URL = lambda sid: f"/api/v1/learning/session/{sid}/answer/"
FINISH_URL = lambda sid: f"/api/v1/learning/session/{sid}/finish/"
QUIT_URL = lambda sid: f"/api/v1/learning/session/{sid}/quit/"
RESUME_URL = lambda sid: f"/api/v1/learning/session/{sid}/resume/"
RECOVER_URL = "/api/v1/learning/session/recover/"

def _submit_first_answer(sc, session_id):
    session = LearningSession.objects.get(id=session_id)
    first = (session.exercises or [])[0]
    payload = {
        "step_index": first["step_index"],
        "response_ms": 300,
    }
    if first["exercise_type"] in {"mc_meaning", "listen_choose_word"}:
        payload["submitted_answer"] = {"option": first["choices"][0]}
    elif first["exercise_type"] == "fill_blank":
        payload["submitted_answer"] = {"text": "x"}
    else:
        payload["submitted_answer"] = {"tokens": first["tokens"]}
    return sc.post(ANSWER_URL(session_id), payload, format="json")


@pytest.fixture
def course_with_units(lesson, unpublished_lesson):
    course = Course.objects.create(name="A1 Path P4", slug="a1-path-p4", is_active=True)
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


def test_track_events_for_start_answer_finish(sc, lesson, course_with_units):
    start = sc.post(START_URL, {"lesson_id": lesson.id}, format="json")
    assert start.status_code == 201
    session_id = start.data["id"]

    session = LearningSession.objects.get(id=session_id)
    first = (session.exercises or [])[0]
    answer_payload = {
        "step_index": first["step_index"],
        "response_ms": 300,
    }
    if first["exercise_type"] in {"mc_meaning", "listen_choose_word"}:
        answer_payload["submitted_answer"] = {"option": first["choices"][0]}
    elif first["exercise_type"] == "fill_blank":
        answer_payload["submitted_answer"] = {"text": "x"}
    else:
        answer_payload["submitted_answer"] = {"tokens": first["tokens"]}
    answer = sc.post(ANSWER_URL(session_id), answer_payload, format="json")
    assert answer.status_code == 200

    finish = sc.post(FINISH_URL(session_id))
    assert finish.status_code == 200

    assert LearningEvent.objects.filter(
        session_id=session_id, event_type=LearningEvent.EventType.SESSION_START
    ).exists()
    assert LearningEvent.objects.filter(
        session_id=session_id, event_type=LearningEvent.EventType.ANSWER_SUBMIT
    ).exists()
    assert LearningEvent.objects.filter(
        session_id=session_id, event_type=LearningEvent.EventType.SESSION_FINISH
    ).exists()


def test_quit_session_tracks_event(sc, lesson, course_with_units):
    start = sc.post(START_URL, {"lesson_id": lesson.id}, format="json")
    assert start.status_code == 201
    session_id = start.data["id"]
    quit_resp = sc.post(QUIT_URL(session_id), {"reason": "left"}, format="json")
    assert quit_resp.status_code == 200
    session = LearningSession.objects.get(id=session_id)
    assert session.status == LearningSession.Status.ABANDONED
    assert LearningEvent.objects.filter(
        session_id=session_id, event_type=LearningEvent.EventType.SESSION_QUIT
    ).exists()


def test_recover_returns_started_session_and_resume_works(sc, lesson, course_with_units):
    start = sc.post(START_URL, {"lesson_id": lesson.id}, format="json")
    assert start.status_code == 201
    session_id = start.data["id"]

    # Recoverable session now requires real progress (at least one attempt).
    answer = _submit_first_answer(sc, session_id)
    assert answer.status_code == 200

    recover = sc.get(RECOVER_URL)
    assert recover.status_code == 200
    assert recover.data["has_recoverable_session"] is True
    assert recover.data["session"]["id"] == session_id
    assert recover.data["session"]["status"] == "started"

    resume = sc.post(f"{RESUME_URL(session_id)}?source=home_page", format="json")
    assert resume.status_code == 200
    assert resume.data["resumed"] is True
    assert resume.data["already_started"] is True
    assert resume.data["session"]["status"] == "started"
    assert LearningEvent.objects.filter(
        session_id=session_id,
        event_type=LearningEvent.EventType.SESSION_START,
        meta__resume_source="home_page",
    ).exists()

    session = LearningSession.objects.get(id=session_id)
    assert session.status == LearningSession.Status.STARTED
    assert session.completed_at is None


def test_recover_auto_abandons_stale_started_session(sc, lesson, course_with_units):
    start = sc.post(START_URL, {"lesson_id": lesson.id}, format="json")
    assert start.status_code == 201
    session_id = start.data["id"]

    LearningSession.objects.filter(id=session_id).update(
        started_at=timezone.now() - timedelta(hours=25)
    )

    recover = sc.get(RECOVER_URL)
    assert recover.status_code == 200
    assert recover.data["has_recoverable_session"] is False
    assert recover.data["recover_context"]["stale_sessions_auto_abandoned"] >= 1

    session = LearningSession.objects.get(id=session_id)
    assert session.status == LearningSession.Status.ABANDONED
    assert session.completed_at is not None
