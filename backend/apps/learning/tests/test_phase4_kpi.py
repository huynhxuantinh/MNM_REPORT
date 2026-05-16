import pytest
from datetime import timedelta
from django.utils import timezone

from apps.learning.models import DailyGoal, DailyGoalLog, LearningEvent, LearningSession
from apps.learning.models import Course, Unit, UnitLesson

pytestmark = pytest.mark.django_db

KPI_BASELINE_URL = "/api/v1/learning/kpi/baseline/"
KPI_FUNNEL_URL = "/api/v1/learning/kpi/onboarding-funnel/"


@pytest.fixture
def course_with_units(lesson, unpublished_lesson):
    course = Course.objects.create(name="KPI Course", slug="kpi-course", is_active=True)
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


def test_kpi_baseline_admin_access(ac, student, lesson, course_with_units):
    _, unit, _ = course_with_units

    session = LearningSession.objects.create(
        user=student,
        unit=unit,
        lesson=lesson,
        status=LearningSession.Status.COMPLETED,
        session_type=LearningSession.SessionType.LESSON,
        difficulty=LearningSession.Difficulty.NORMAL,
        exercises=[{"step_index": 1, "exercise_type": "mc_meaning", "prompt": "q"}],
        total_answered=1,
        correct_answered=1,
        xp_earned=10,
        completed_at=timezone.now(),
    )
    LearningEvent.objects.create(
        user=student,
        session=session,
        event_type=LearningEvent.EventType.SESSION_START,
        meta={"session_type": "lesson"},
    )
    LearningEvent.objects.create(
        user=student,
        event_type=LearningEvent.EventType.ONBOARDING_STEP,
        meta={"step": "placement_enter"},
    )
    LearningEvent.objects.create(
        user=student,
        event_type=LearningEvent.EventType.ONBOARDING_STEP,
        meta={"step": "placement_submit"},
    )
    LearningEvent.objects.create(
        user=student,
        event_type=LearningEvent.EventType.ONBOARDING_STEP,
        meta={"step": "first_lesson_start"},
    )

    goal = DailyGoal.objects.create(user=student, target_minutes=10, reward_xp=15)
    DailyGoalLog.objects.create(
        user=student,
        goal=goal,
        goal_date=timezone.localdate(),
        studied_minutes=12,
        goal_minutes=10,
        is_achieved=True,
        claimed_at=timezone.now(),
    )

    response = ac.get(f"{KPI_BASELINE_URL}?range=7d")
    assert response.status_code == 200
    assert response.data["range_days"] == 7
    assert "sessions_per_dau" in response.data
    assert "session_completion_rate" in response.data
    assert "daily_goal_claim_rate" in response.data
    assert "retention" in response.data


def test_kpi_baseline_forbidden_for_non_admin(sc):
    response = sc.get(KPI_BASELINE_URL)
    assert response.status_code == 403


def test_onboarding_funnel_endpoint_counts(ac, student):
    now = timezone.now()
    for step in ["placement_enter", "placement_abandon", "placement_submit", "first_lesson_start"]:
        event = LearningEvent.objects.create(
            user=student,
            event_type=LearningEvent.EventType.ONBOARDING_STEP,
            meta={"step": step},
        )
        LearningEvent.objects.filter(id=event.id).update(created_at=now - timedelta(hours=1))

    response = ac.get(f"{KPI_FUNNEL_URL}?range=7d")
    assert response.status_code == 200
    assert response.data["counts"]["placement_enter"] >= 1
    assert response.data["counts"]["placement_submit"] >= 1
    assert "placement_submit_rate" in response.data["rates"]
