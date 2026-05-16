import pytest

from apps.learning.models import Course, LearningEvent, PlacementResult, Unit, UnitLesson
from apps.vocabulary.models import Word

pytestmark = pytest.mark.django_db

QUESTIONS_URL = "/api/v1/learning/placement/questions/"
SUBMIT_URL = "/api/v1/learning/placement/submit/"
START_URL = "/api/v1/learning/session/start/"


@pytest.fixture
def placement_lesson(lesson):
    course = Course.objects.create(name="Onboarding Course", slug="onboarding-course", is_active=True)
    unit = Unit.objects.create(
        course=course,
        title="Onboarding Unit",
        order_index=1,
        required_lessons_to_unlock=1,
        is_published=True,
    )
    UnitLesson.objects.create(unit=unit, lesson=lesson, order_index=1)
    return lesson


def _seed_words(teacher, total=10):
    levels = ["A1", "A2", "B1", "B2", "C1"]
    for idx in range(total):
        Word.objects.create(
            text=f"funnel_word_{idx}",
            level=levels[idx % len(levels)],
            definition_vi=f"nghia_{idx}",
            created_by=teacher,
        )


def test_onboarding_events(sc, student, teacher, placement_lesson):
    _seed_words(teacher, total=12)

    first_questions = sc.get(QUESTIONS_URL)
    assert first_questions.status_code == 200
    second_questions = sc.get(QUESTIONS_URL)
    assert second_questions.status_code == 200

    enter_events = LearningEvent.objects.filter(
        user=student,
        event_type=LearningEvent.EventType.ONBOARDING_STEP,
        meta__step="placement_enter",
    ).count()
    abandon_events = LearningEvent.objects.filter(
        user=student,
        event_type=LearningEvent.EventType.ONBOARDING_STEP,
        meta__step="placement_abandon",
    ).count()
    assert enter_events >= 2
    assert abandon_events >= 1

    from django.core.cache import cache
    cached = cache.get(f"placement_q:u{student.id}")
    answers = [
        {"question_id": item["question_id"], "option": item["correct_option"]}
        for item in cached
    ]
    submit = sc.post(SUBMIT_URL, {"answers": answers}, format="json")
    assert submit.status_code == 200
    assert PlacementResult.objects.filter(user=student).exists()

    start = sc.post(START_URL, {"lesson_id": placement_lesson.id}, format="json")
    assert start.status_code == 201

    submit_events = LearningEvent.objects.filter(
        user=student,
        event_type=LearningEvent.EventType.ONBOARDING_STEP,
        meta__step="placement_submit",
    ).count()
    first_lesson_events = LearningEvent.objects.filter(
        user=student,
        event_type=LearningEvent.EventType.ONBOARDING_STEP,
        meta__step="first_lesson_start",
    ).count()
    assert submit_events >= 1
    assert first_lesson_events >= 1
