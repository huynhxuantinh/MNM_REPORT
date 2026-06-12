"""Tests for learning path + learning session phase 1 endpoints."""
import pytest
from django.core.cache import cache
from django.utils import timezone

from apps.learning.models import (
    Course,
    Exercise,
    ExerciseAttempt,
    LearningSession,
    LessonProgress,
    LessonWord,
    PlacementResult,
    ReviewLog,
    Unit,
    UnitLesson,
    UserCourseProgress,
    UserUnitProgress,
)
from apps.learning.models import Lesson
from apps.learning.shared_flow import _placement_cache_key
from apps.vocabulary.models import Word

pytestmark = pytest.mark.django_db

PATH_URL = "/api/v1/learning/path/"
LISTENING_PATH_URL = "/api/v1/learning/listening/"
START_URL = "/api/v1/learning/session/start/"
LISTENING_START_URL = "/api/v1/learning/listening/session/start/"
PLACEMENT_SUBMIT_URL = "/api/v1/learning/placement/submit/"
DETAIL_URL = lambda sid: f"/api/v1/learning/session/{sid}/"
LISTENING_DETAIL_URL = lambda sid: f"/api/v1/learning/listening/session/{sid}/"
ANSWER_URL = lambda sid: f"/api/v1/learning/session/{sid}/answer/"
FINISH_URL = lambda sid: f"/api/v1/learning/session/{sid}/finish/"
CHECKPOINT_START_URL = "/api/v1/learning/checkpoint/start/"
CHECKPOINT_SUBMIT_URL = lambda sid: f"/api/v1/learning/checkpoint/{sid}/submit/"
RESUME_URL = lambda sid: f"/api/v1/learning/session/{sid}/resume/"


@pytest.fixture
def listening_lesson(db, teacher):
    lesson = Lesson.objects.create(
        title="Listening Demo",
        level="A1",
        order_index=3,
        is_published=True,
        created_by=teacher,
        skill_tag=Lesson.SkillTag.LISTENING,
        listening_transcript="Anna takes a bus to school every morning.",
        listening_translation_vi="Anna di xe buyt den truong moi buoi sang.",
        listening_estimated_seconds=35,
    )
    for index, text in enumerate(["bus", "school", "morning"], start=1):
        word = Word.objects.create(text=text, level="A1", created_by=teacher)
        LessonWord.objects.create(lesson=lesson, word=word, order_index=index)
    return lesson


@pytest.fixture
def course_with_dedicated_listening_unit(listening_lesson):
    course = Course.objects.create(
        name="English Foundation",
        slug="english-foundation",
        is_active=True,
    )
    unit = Unit.objects.create(
        course=course,
        title="Listening Lab",
        order_index=6,
        required_lessons_to_unlock=0,
        is_published=True,
    )
    UnitLesson.objects.create(unit=unit, lesson=listening_lesson, order_index=1)
    return course, unit


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


@pytest.fixture
def course_with_listening_unit(lesson, unpublished_lesson):
    course = Course.objects.create(
        name="Listening Path",
        slug="listening-path",
        is_active=True,
    )
    unit1 = Unit.objects.create(
        course=course,
        title="Unit 1",
        order_index=1,
        required_lessons_to_unlock=2,
        is_published=True,
    )
    unit2 = Unit.objects.create(
        course=course,
        title="Listening Lab",
        order_index=2,
        required_lessons_to_unlock=0,
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

    def test_unit_with_zero_unlock_requirement_is_open(self, sc, course_with_listening_unit):
        response = sc.get(PATH_URL)
        assert response.status_code == 200
        assert len(response.data["units"]) == 2
        assert response.data["units"][1]["required_lessons_to_unlock"] == 0
        assert response.data["units"][1]["unlocked"] is True

    def test_listening_path_returns_only_listening_units(self, sc, course_with_dedicated_listening_unit):
        response = sc.get(LISTENING_PATH_URL)
        assert response.status_code == 200
        assert response.data["slug"] == "english-foundation"
        assert len(response.data["units"]) == 1
        assert response.data["units"][0]["title"] == "Listening Lab"
        lesson = response.data["units"][0]["lessons"][0]["lesson"]
        assert lesson["skill_tag"] == "listening"
        assert lesson["listening_estimated_seconds"] == 35

    def test_placement_recommends_start_unit_in_path(self, sc, student, teacher):
        lesson_a1 = Lesson.objects.create(title="A1 Start", level="A1", order_index=1, is_published=True, created_by=teacher)
        lesson_b1 = Lesson.objects.create(title="B1 Start", level="B1", order_index=2, is_published=True, created_by=teacher)
        for idx, lesson_item in enumerate([lesson_a1, lesson_b1], start=1):
            word = Word.objects.create(text=f"placement_{idx}", level=lesson_item.level, created_by=teacher)
            LessonWord.objects.create(lesson=lesson_item, word=word, order_index=1)

        course = Course.objects.create(name="Placement Path", slug="placement-path", is_active=True)
        unit_a1 = Unit.objects.create(course=course, title="Unit A1", order_index=1, required_lessons_to_unlock=1, is_published=True)
        unit_b1 = Unit.objects.create(course=course, title="Unit B1", order_index=2, required_lessons_to_unlock=1, is_published=True)
        UnitLesson.objects.create(unit=unit_a1, lesson=lesson_a1, order_index=1)
        UnitLesson.objects.create(unit=unit_b1, lesson=lesson_b1, order_index=1)
        PlacementResult.objects.create(user=student, recommended_level="B1", score_pct=80, total_questions=10, correct_answers=8)

        response = sc.get(PATH_URL)
        assert response.status_code == 200
        assert response.data["placement"]["recommended_level"] == "B1"
        assert response.data["placement"]["recommended_start_unit_id"] == unit_b1.id
        assert response.data["units"][1]["placement_recommended"] is True
        assert response.data["units"][1]["unlocked"] is True


class TestLearningSession:
    def test_start_session_success(self, sc, lesson, course_with_units):
        response = sc.post(START_URL, {"lesson_id": lesson.id}, format="json")
        assert response.status_code == 201
        assert response.data["status"] == "started"
        assert LearningSession.objects.filter(id=response.data["id"]).exists()

    def test_start_grammar_session_uses_grammar_exercise_types(self, sc, teacher):
        grammar_lesson = Lesson.objects.create(
            title="Grammar Pattern",
            level="A1",
            order_index=1,
            is_published=True,
            created_by=teacher,
            skill_tag=Lesson.SkillTag.GRAMMAR,
        )
        examples = [
            ("am", "I am a student."),
            ("is", "She is happy."),
            ("are", "They are friends."),
            ("like", "I like apples."),
        ]
        for index, (text, example) in enumerate(examples, start=1):
            word = Word.objects.create(
                text=text,
                definition_vi=text,
                example_en=example,
                level="A1",
                created_by=teacher,
            )
            LessonWord.objects.create(lesson=grammar_lesson, word=word, order_index=index)

        course = Course.objects.create(name="Grammar Path", slug="grammar-path", is_active=True)
        unit = Unit.objects.create(
            course=course,
            title="Grammar Unit",
            order_index=1,
            required_lessons_to_unlock=0,
            is_published=True,
        )
        UnitLesson.objects.create(unit=unit, lesson=grammar_lesson, order_index=1)

        response = sc.post(START_URL, {"lesson_id": grammar_lesson.id}, format="json")

        assert response.status_code == 201
        detail = sc.get(DETAIL_URL(response.data["id"]))
        assert detail.status_code == 200
        exercise_types = {item["exercise_type"] for item in detail.data["exercises"]}
        assert exercise_types
        assert exercise_types <= {"grammar_fill_blank", "grammar_sentence_order"}

        session = LearningSession.objects.get(id=response.data["id"])
        first = session.exercises[0]
        submitted = (
            {"text": first["correct_text"]}
            if first["exercise_type"] == "grammar_fill_blank"
            else {"tokens": first["correct_tokens"]}
        )
        answer = sc.post(
            ANSWER_URL(session.id),
            {"step_index": first["step_index"], "submitted_answer": submitted, "response_ms": 500},
            format="json",
        )
        assert answer.status_code == 200
        assert answer.data["feedback"]["is_correct"] is True

    def test_start_session_locked_unit_forbidden(self, sc, unpublished_lesson, course_with_units):
        response = sc.post(START_URL, {"lesson_id": unpublished_lesson.id}, format="json")
        assert response.status_code == 400

    def test_start_session_prefers_primary_course_link_when_same_lesson_is_duplicated(self, sc, lesson):
        primary = Course.objects.create(name="Primary", slug="primary-path", is_active=True)
        primary_unit = Unit.objects.create(
            course=primary,
            title="Primary Unit",
            order_index=6,
            required_lessons_to_unlock=1,
            is_published=True,
        )
        UnitLesson.objects.create(unit=primary_unit, lesson=lesson, order_index=1)

        secondary = Course.objects.create(name="Secondary", slug="secondary-path", is_active=True)
        secondary_unit_1 = Unit.objects.create(
            course=secondary,
            title="Secondary Unit 1",
            order_index=1,
            required_lessons_to_unlock=1,
            is_published=True,
        )
        secondary_unit_2 = Unit.objects.create(
            course=secondary,
            title="Secondary Unit 2",
            order_index=2,
            required_lessons_to_unlock=1,
            is_published=True,
        )
        UnitLesson.objects.create(unit=secondary_unit_2, lesson=lesson, order_index=1)

        response = sc.post(START_URL, {"lesson_id": lesson.id}, format="json")
        assert response.status_code == 201
        session = LearningSession.objects.get(id=response.data["id"])
        assert session.unit_id == primary_unit.id

    def test_start_listening_session_success(self, sc, listening_lesson, course_with_dedicated_listening_unit):
        response = sc.post(LISTENING_START_URL, {"lesson_id": listening_lesson.id}, format="json")
        assert response.status_code == 201
        assert response.data["lesson_skill_tag"] == "listening"
        assert LearningSession.objects.filter(id=response.data["id"], lesson=listening_lesson).exists()

    def test_listening_session_detail_returns_listening_metadata(self, sc, listening_lesson, course_with_dedicated_listening_unit):
        start = sc.post(LISTENING_START_URL, {"lesson_id": listening_lesson.id}, format="json")
        assert start.status_code == 201

        detail = sc.get(LISTENING_DETAIL_URL(start.data["id"]))
        assert detail.status_code == 200
        assert detail.data["session"]["lesson_skill_tag"] == "listening"
        assert detail.data["session"]["lesson_listening_transcript"] == "Anna takes a bus to school every morning."
        assert detail.data["session"]["lesson_listening_estimated_seconds"] == 35

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
        assert "total_xp" in submit.data
        assert "level" in submit.data
        assert "streak" in submit.data

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

    def test_finish_session_seeds_review_logs_for_all_session_words(self, sc, student, teacher):
        word1 = Word.objects.create(text="seed_one", level="A1", created_by=teacher)
        word2 = Word.objects.create(text="seed_two", level="A1", created_by=teacher)
        lesson = Lesson.objects.create(title="Seed Review", level="A1", order_index=1, is_published=True, created_by=teacher)
        LessonWord.objects.create(lesson=lesson, word=word1, order_index=1)
        LessonWord.objects.create(lesson=lesson, word=word2, order_index=2)
        course = Course.objects.create(name="Seed Review Course", slug="seed-review-course", is_active=True)
        unit = Unit.objects.create(course=course, title="Unit 1", order_index=1, required_lessons_to_unlock=1, is_published=True)
        UnitLesson.objects.create(unit=unit, lesson=lesson, order_index=1)

        start = sc.post(START_URL, {"lesson_id": lesson.id}, format="json")
        assert start.status_code == 201
        session = LearningSession.objects.get(id=start.data["id"])
        session.exercises = [
            {"step_index": 1, "exercise_type": "mc_meaning", "prompt": "p1", "choices": ["A", "B"], "word_id": word1.id, "correct_option": "A"},
            {"step_index": 2, "exercise_type": "mc_meaning", "prompt": "p2", "choices": ["A", "B"], "word_id": word2.id, "correct_option": "A"},
        ]
        session.save(update_fields=["exercises"])

        sc.post(ANSWER_URL(session.id), {"step_index": 1, "submitted_answer": {"option": "A"}, "response_ms": 200}, format="json")
        sc.post(ANSWER_URL(session.id), {"step_index": 2, "submitted_answer": {"option": "A"}, "response_ms": 200}, format="json")
        finish = sc.post(FINISH_URL(session.id))
        assert finish.status_code == 200
        assert set(finish.data["review_seeded_word_ids"]) == {word1.id, word2.id}
        assert ReviewLog.objects.filter(user=student, word_id__in=[word1.id, word2.id]).count() == 2

    def test_checkpoint_fail_locks_retry_temporarily(self, sc, student, lesson):
        course = Course.objects.create(name="Checkpoint Course", slug="checkpoint-course", is_active=True)
        unit = Unit.objects.create(course=course, title="Unit 1", order_index=1, required_lessons_to_unlock=1, is_published=True)
        UnitLesson.objects.create(unit=unit, lesson=lesson, order_index=1)
        LessonProgress.objects.create(user=student, lesson=lesson, started_at=timezone.now(), completed_at=timezone.now())
        UserUnitProgress.objects.create(user=student, unit=unit, completed_lessons=1)

        start = sc.post(CHECKPOINT_START_URL, {"unit_id": unit.id}, format="json")
        assert start.status_code == 201
        session = LearningSession.objects.get(id=start.data["id"])
        session.total_answered = 4
        session.correct_answered = 1
        session.exercises = [
            {"step_index": idx, "exercise_type": "mc_meaning", "prompt": f"q{idx}", "choices": ["A", "B"], "word_id": lesson.words.first().id, "correct_option": "A"}
            for idx in range(1, 5)
        ]
        session.save(update_fields=["total_answered", "correct_answered", "exercises"])

        submit = sc.post(CHECKPOINT_SUBMIT_URL(session.id))
        assert submit.status_code == 200
        assert submit.data["passed"] is False
        assert submit.data["checkpoint_lock"]["locked_until"] is not None

        retry = sc.post(CHECKPOINT_START_URL, {"unit_id": unit.id}, format="json")
        assert retry.status_code == 429

    def test_adaptive_difficulty_can_raise_session_out_of_easy(self, sc, lesson, course_with_units):
        words = list(lesson.words.all())
        for word in words:
            word.example_en = f"I use {word.text} every day."
            word.save(update_fields=["example_en"])

        start = sc.post(START_URL, {"lesson_id": lesson.id}, format="json")
        assert start.status_code == 201
        session = LearningSession.objects.get(id=start.data["id"])
        session.difficulty = LearningSession.Difficulty.EASY
        session.exercises = [
            {"step_index": idx, "exercise_type": "mc_meaning", "prompt": f"p{idx}", "choices": ["A", "B"], "word_id": words[(idx - 1) % len(words)].id, "correct_option": "A"}
            for idx in range(1, 7)
        ]
        session.save(update_fields=["difficulty", "exercises"])

        third = None
        for step_index in range(1, 4):
            third = sc.post(
                ANSWER_URL(session.id),
                {"step_index": step_index, "submitted_answer": {"option": "A"}, "response_ms": 250},
                format="json",
            )
            assert third.status_code == 200
        session.refresh_from_db()
        assert third is not None
        assert third.data["feedback"]["difficulty_adjustment"]["difficulty"] == "normal"
        assert session.difficulty == LearningSession.Difficulty.NORMAL

    def test_checkpoint_resume_rejected_for_abandoned_checkpoint(self, sc, student, lesson):
        course = Course.objects.create(name="Resume Checkpoint", slug="resume-checkpoint", is_active=True)
        unit = Unit.objects.create(course=course, title="Unit 1", order_index=1, required_lessons_to_unlock=1, is_published=True)
        session = LearningSession.objects.create(
            user=student,
            unit=unit,
            lesson=lesson,
            status=LearningSession.Status.ABANDONED,
            session_type=LearningSession.SessionType.CHECKPOINT,
            difficulty=LearningSession.Difficulty.NORMAL,
            exercises=[],
        )

        response = sc.post(RESUME_URL(session.id))
        assert response.status_code == 400
        assert "Checkpoint" in response.data["detail"]


class TestPlacementSubmit:
    def test_double_submit_returns_existing_result_without_duplicate_rows(self, sc, student, teacher):
        questions = []
        answers = []
        for idx in range(1, 6):
            word = Word.objects.create(
                text=f"placement_word_{idx}",
                definition_vi=f"nghia_{idx}",
                level="A1",
                created_by=teacher,
            )
            questions.append(
                {
                    "question_id": idx,
                    "word_id": word.id,
                    "word_text": word.text,
                    "word_level": "A1",
                    "prompt": f'Chon nghia dung cua "{word.text}"',
                    "choices": [f"nghia_{idx}", "sai_1", "sai_2", "sai_3"],
                    "correct_option": f"nghia_{idx}",
                }
            )
            answers.append({"question_id": idx, "option": f"nghia_{idx}"})

        cache.set(_placement_cache_key(student.id), questions, timeout=300)

        first = sc.post(PLACEMENT_SUBMIT_URL, {"answers": answers}, format="json")
        second = sc.post(PLACEMENT_SUBMIT_URL, {"answers": answers}, format="json")

        assert first.status_code == 200
        assert second.status_code == 200
        assert second.data["already_submitted"] is True
        assert PlacementResult.objects.filter(user=student).count() == 1
