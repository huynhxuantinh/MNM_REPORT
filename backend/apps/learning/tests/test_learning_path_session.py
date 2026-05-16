"""Tests for learning path + learning session phase 1 endpoints."""
import pytest
from django.utils import timezone

from apps.learning.models import (
    Course,
    Exercise,
    ExerciseAttempt,
    LearningSession,
    LessonProgress,
    Unit,
    UnitLesson,
    UserCourseProgress,
    UserUnitProgress,
)

pytestmark = pytest.mark.django_db

PATH_URL = "/api/v1/learning/path/"
START_URL = "/api/v1/learning/session/start/"
DETAIL_URL = lambda sid: f"/api/v1/learning/session/{sid}/"
ANSWER_URL = lambda sid: f"/api/v1/learning/session/{sid}/answer/"
FINISH_URL = lambda sid: f"/api/v1/learning/session/{sid}/finish/"
CHECKPOINT_START_URL = "/api/v1/learning/checkpoint/start/"
CHECKPOINT_SUBMIT_URL = lambda sid: f"/api/v1/learning/checkpoint/{sid}/submit/"


@pytest.fixture
def course_with_units(lesson, unpublished_lesson):
    course = Course.objects.create(
        name="A1 Path",
        slug="a1-path",
        is_active=True,
    )
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


class TestLearningPath:
    def test_returns_path_with_unlock_flags(self, sc, course_with_units):
        response = sc.get(PATH_URL)
        assert response.status_code == 200
        assert response.data["slug"] == "a1-path"
        assert len(response.data["units"]) == 2
        assert response.data["units"][0]["unlocked"] is True
        assert response.data["units"][1]["unlocked"] is False

    def test_returns_lesson_word_learning_stats(self, sc, lesson, course_with_units):
        start = sc.post(START_URL, {"lesson_id": lesson.id}, format="json")
        assert start.status_code == 201
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
            }
        ]
        session.save(update_fields=["exercises"])
        answer = sc.post(
            ANSWER_URL(session_id),
            {"step_index": 1, "submitted_answer": {"option": "A"}, "response_ms": 300},
            format="json",
        )
        assert answer.status_code == 200

        response = sc.get(PATH_URL)
        assert response.status_code == 200
        first_lesson = response.data["units"][0]["lessons"][0]["lesson"]
        assert first_lesson["words_total"] == 2
        assert first_lesson["words_learned"] == 1


class TestLearningSession:
    def test_start_session_success(self, sc, lesson, course_with_units):
        response = sc.post(START_URL, {"lesson_id": lesson.id}, format="json")
        assert response.status_code == 201
        assert response.data["status"] == "started"
        assert LearningSession.objects.filter(id=response.data["id"]).exists()

    def test_start_session_locked_unit_forbidden(self, sc, unpublished_lesson, course_with_units):
        response = sc.post(START_URL, {"lesson_id": unpublished_lesson.id}, format="json")
        assert response.status_code == 400

    def test_answer_then_finish_updates_progress(self, sc, student, lesson, course_with_units):
        start = sc.post(START_URL, {"lesson_id": lesson.id}, format="json")
        session_id = start.data["id"]
        detail = sc.get(DETAIL_URL(session_id))
        first_exercise = detail.data["exercises"][0]
        selected = first_exercise["choices"][0]

        answer = sc.post(
            ANSWER_URL(session_id),
            {
                "step_index": 1,
                "submitted_answer": {"option": selected},
                "response_ms": 800,
            },
            format="json",
        )
        assert answer.status_code == 200
        assert "awarded_xp" in answer.data["feedback"]
        assert ExerciseAttempt.objects.filter(session_id=session_id, step_index=1).exists()

        finish = sc.post(FINISH_URL(session_id))
        assert finish.status_code == 200
        assert finish.data["session"]["status"] == "completed"
        assert "summary" in finish.data
        assert "accuracy_by_type" in finish.data["summary"]

        session = LearningSession.objects.get(id=session_id)
        assert session.completed_at is not None
        assert LessonProgress.objects.filter(user=student, lesson=lesson, completed_at__isnull=False).exists()
        assert UserUnitProgress.objects.filter(user=student, unit=session.unit).exists()

    def test_session_detail_returns_attempts(self, sc, lesson, course_with_units):
        start = sc.post(START_URL, {"lesson_id": lesson.id}, format="json")
        session_id = start.data["id"]
        detail = sc.get(DETAIL_URL(session_id))
        assert detail.status_code == 200
        assert detail.data["session"]["id"] == session_id
        assert isinstance(detail.data["attempts"], list)
        assert isinstance(detail.data["exercises"], list)

    def test_checkpoint_start_and_submit(self, sc, student, lesson, course_with_units):
        _, unit1, _ = course_with_units
        LessonProgress.objects.update_or_create(
            user=student,
            lesson=lesson,
            defaults={"started_at": lesson.created_at, "completed_at": lesson.created_at},
        )
        UserUnitProgress.objects.update_or_create(
            user=student,
            unit=unit1,
            defaults={"completed_lessons": 1},
        )

        start = sc.post(CHECKPOINT_START_URL, {"unit_id": unit1.id}, format="json")
        assert start.status_code == 201
        session_id = start.data["id"]

        detail = sc.get(DETAIL_URL(session_id))
        for exercise in detail.data["exercises"]:
            payload = {"step_index": exercise["step_index"], "response_ms": 500}
            if exercise["exercise_type"] in {"mc_meaning", "listen_choose_word"}:
                payload["submitted_answer"] = {"option": exercise["choices"][0]}
            elif exercise["exercise_type"] == "fill_blank":
                payload["submitted_answer"] = {"text": "wrong"}
            else:
                payload["submitted_answer"] = {"tokens": exercise["tokens"]}
            sc.post(ANSWER_URL(session_id), payload, format="json")

        submit = sc.post(CHECKPOINT_SUBMIT_URL(session_id))
        assert submit.status_code == 200
        assert "score_pct" in submit.data
        assert "summary" in submit.data

    def test_wrong_twice_pushes_word_to_early_review(self, sc, student, lesson, course_with_units):
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

        sc.post(
            ANSWER_URL(session_id),
            {"step_index": 1, "submitted_answer": {"option": "B"}, "response_ms": 300},
            format="json",
        )
        sc.post(
            ANSWER_URL(session_id),
            {"step_index": 2, "submitted_answer": {"option": "B"}, "response_ms": 300},
            format="json",
        )

        from apps.learning.models import ReviewLog
        log = ReviewLog.objects.filter(user=student, word_id=target_word_id).first()
        assert log is not None
        assert log.next_review_date <= timezone.now().date()

    def test_start_session_prefers_exercise_bank(self, sc, lesson, course_with_units):
        Exercise.objects.create(
            lesson=lesson,
            step_index=1,
            exercise_type=Exercise.ExerciseType.MC_MEANING,
            prompt="Bank question 1",
            payload={
                "choices": ["A", "B", "C", "D"],
                "correct_option": "A",
                "word_id": lesson.words.first().id,
            },
            is_active=True,
        )
        Exercise.objects.create(
            lesson=lesson,
            step_index=2,
            exercise_type=Exercise.ExerciseType.FILL_BLANK,
            prompt="Bank question 2",
            payload={
                "correct_text": "apple",
                "word_id": lesson.words.first().id,
            },
            is_active=True,
        )

        start = sc.post(START_URL, {"lesson_id": lesson.id}, format="json")
        assert start.status_code == 201
        session = LearningSession.objects.get(id=start.data["id"])
        assert len(session.exercises) == 2
        assert session.exercises[0]["prompt"] == "Bank question 1"
        assert session.exercises[1]["prompt"] == "Bank question 2"

    def test_finish_session_updates_course_progress(self, sc, student, lesson, course_with_units):
        start = sc.post(START_URL, {"lesson_id": lesson.id}, format="json")
        session_id = start.data["id"]

        detail = sc.get(DETAIL_URL(session_id))
        first_exercise = detail.data["exercises"][0]
        answer_payload = {"step_index": first_exercise["step_index"], "response_ms": 500}
        if first_exercise["exercise_type"] in {"mc_meaning", "listen_choose_word"}:
            answer_payload["submitted_answer"] = {"option": first_exercise["choices"][0]}
        elif first_exercise["exercise_type"] == "fill_blank":
            answer_payload["submitted_answer"] = {"text": "wrong"}
        else:
            answer_payload["submitted_answer"] = {"tokens": first_exercise["tokens"]}
        sc.post(ANSWER_URL(session_id), answer_payload, format="json")

        finish = sc.post(FINISH_URL(session_id))
        assert finish.status_code == 200
        assert "course_progress" in finish.data

        session = LearningSession.objects.get(id=session_id)
        progress = UserCourseProgress.objects.filter(
            user=student, course=session.unit.course
        ).first()
        assert progress is not None
