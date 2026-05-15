import pytest

from apps.learning.models import Course, LearningEvent, LearningSession, Unit, UnitLesson

pytestmark = pytest.mark.django_db

START_URL = "/api/v1/learning/session/start/"
ANSWER_URL = lambda sid: f"/api/v1/learning/session/{sid}/answer/"
FINISH_URL = lambda sid: f"/api/v1/learning/session/{sid}/finish/"
QUIT_URL = lambda sid: f"/api/v1/learning/session/{sid}/quit/"
RESUME_URL = lambda sid: f"/api/v1/learning/session/{sid}/resume/"
RECOVER_URL = "/api/v1/learning/session/recover/"
KPI_URL = "/api/v1/learning/kpi/baseline/"


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


def test_kpi_baseline_teacher_access(tc, sc, lesson, course_with_units):
    start = sc.post(START_URL, {"lesson_id": lesson.id}, format="json")
    assert start.status_code == 201
    session_id = start.data["id"]
    sc.post(QUIT_URL(session_id), {"reason": "drop"}, format="json")

    response = tc.get(KPI_URL)
    assert response.status_code == 200
    assert "range" in response.data
    assert "kpis" in response.data
    assert "dau" in response.data["kpis"]
    assert "sessions_per_dau" in response.data["kpis"]
    assert "d1_retention_rate" in response.data["kpis"]
    assert "w4_retention_rate" in response.data["kpis"]


def test_recover_and_resume_abandoned_session(sc, lesson, course_with_units):
    start = sc.post(START_URL, {"lesson_id": lesson.id}, format="json")
    assert start.status_code == 201
    session_id = start.data["id"]

    quit_resp = sc.post(QUIT_URL(session_id), {"reason": "need_break"}, format="json")
    assert quit_resp.status_code == 200

    recover = sc.get(RECOVER_URL)
    assert recover.status_code == 200
    assert recover.data["has_recoverable_session"] is True
    assert recover.data["session"]["id"] == session_id

    resume = sc.post(RESUME_URL(session_id), format="json")
    assert resume.status_code == 200
    assert resume.data["resumed"] is True
    assert resume.data["session"]["status"] == "started"

    session = LearningSession.objects.get(id=session_id)
    assert session.status == LearningSession.Status.STARTED
    assert session.completed_at is None
