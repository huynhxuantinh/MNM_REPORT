"""
Tests cho Quiz API:
  GET  /api/v1/quiz/generate/?lesson_id=X  — tạo câu hỏi
  POST /api/v1/quiz/submit/                — lưu kết quả
  GET  /api/v1/quiz/sessions/              — lịch sử quiz
"""
import pytest

from apps.quiz.models import Quiz, QuizResult

pytestmark = pytest.mark.django_db

GENERATE_URL = "/api/v1/quiz/generate/"
SUBMIT_URL   = "/api/v1/quiz/submit/"
HISTORY_URL  = "/api/v1/quiz/sessions/"


# ══════════════════════════════════════════════════════════════════════════════
# GENERATE
# ══════════════════════════════════════════════════════════════════════════════

class TestQuizGenerate:
    def test_generate_returns_questions(self, sc, lesson):
        r = sc.get(GENERATE_URL, {"lesson_id": lesson.id})
        assert r.status_code == 200
        assert "quiz_id" in r.data
        assert "questions" in r.data
        assert len(r.data["questions"]) >= 4

    def test_each_question_has_required_fields(self, sc, lesson):
        r = sc.get(GENERATE_URL, {"lesson_id": lesson.id})
        q = r.data["questions"][0]
        assert "word_text" in q
        assert "options" in q
        assert "correct_index" in q
        assert len(q["options"]) == 4

    def test_correct_index_points_to_right_option(self, sc, lesson, words):
        r = sc.get(GENERATE_URL, {"lesson_id": lesson.id})
        correct_defs = {w.text: w.definition_vi for w in words}
        for q in r.data["questions"]:
            expected = correct_defs[q["word_text"]]
            assert q["options"][q["correct_index"]] == expected

    def test_creates_quiz_object(self, sc, lesson):
        assert Quiz.objects.filter(lesson=lesson).count() == 0
        sc.get(GENERATE_URL, {"lesson_id": lesson.id})
        assert Quiz.objects.filter(lesson=lesson).count() == 1

    def test_reuses_existing_quiz_object(self, sc, lesson):
        sc.get(GENERATE_URL, {"lesson_id": lesson.id})
        sc.get(GENERATE_URL, {"lesson_id": lesson.id})
        assert Quiz.objects.filter(lesson=lesson).count() == 1

    def test_missing_lesson_id_returns_400(self, sc):
        r = sc.get(GENERATE_URL)
        assert r.status_code == 400

    def test_unpublished_lesson_returns_404(self, sc, unpublished_lesson):
        r = sc.get(GENERATE_URL, {"lesson_id": unpublished_lesson.id})
        assert r.status_code == 404

    def test_nonexistent_lesson_returns_404(self, sc):
        r = sc.get(GENERATE_URL, {"lesson_id": 999999})
        assert r.status_code == 404

    def test_unauthenticated_returns_403(self, db, lesson):
        from rest_framework.test import APIClient
        r = APIClient().get(GENERATE_URL, {"lesson_id": lesson.id})
        assert r.status_code in (401, 403)

    def test_lesson_title_in_response(self, sc, lesson):
        r = sc.get(GENERATE_URL, {"lesson_id": lesson.id})
        assert r.data["lesson_title"] == lesson.title


# ══════════════════════════════════════════════════════════════════════════════
# SUBMIT
# ══════════════════════════════════════════════════════════════════════════════

class TestQuizSubmit:
    @pytest.fixture
    def quiz_id(self, sc, lesson):
        r = sc.get(GENERATE_URL, {"lesson_id": lesson.id})
        return r.data["quiz_id"]

    def test_submit_creates_quiz_result(self, sc, quiz_id, student):
        payload = {
            "quiz_id": quiz_id,
            "score": 80,
            "total_questions": 4,
            "correct_answers": 3,
        }
        r = sc.post(SUBMIT_URL, payload, format="json")
        assert r.status_code == 201
        assert QuizResult.objects.filter(user=student, quiz_id=quiz_id).exists()

    def test_submit_returns_result_data(self, sc, quiz_id):
        payload = {
            "quiz_id": quiz_id,
            "score": 100,
            "total_questions": 4,
            "correct_answers": 4,
        }
        r = sc.post(SUBMIT_URL, payload, format="json")
        assert r.status_code == 201
        assert r.data["score"] == 100
        assert r.data["correct_answers"] == 4

    def test_submit_without_quiz_id_returns_400(self, sc):
        r = sc.post(SUBMIT_URL, {"score": 50}, format="json")
        assert r.status_code == 400

    def test_submit_invalid_quiz_id_returns_404(self, sc):
        r = sc.post(SUBMIT_URL, {"quiz_id": 999999, "score": 0}, format="json")
        assert r.status_code == 404

    def test_unauthenticated_submit_returns_403(self, db, quiz_id):
        from rest_framework.test import APIClient
        r = APIClient().post(SUBMIT_URL, {"quiz_id": quiz_id, "score": 0}, format="json")
        assert r.status_code in (401, 403)


# ══════════════════════════════════════════════════════════════════════════════
# HISTORY
# ══════════════════════════════════════════════════════════════════════════════

class TestQuizHistory:
    def test_empty_history(self, sc):
        r = sc.get(HISTORY_URL)
        assert r.status_code == 200

    def test_history_shows_own_results(self, sc, lesson, student):
        # generate + submit
        gen = sc.get(GENERATE_URL, {"lesson_id": lesson.id})
        sc.post(SUBMIT_URL, {
            "quiz_id": gen.data["quiz_id"],
            "score": 75, "total_questions": 4, "correct_answers": 3,
        }, format="json")

        r = sc.get(HISTORY_URL)
        assert r.status_code == 200
        data = r.data.get("results", r.data)
        assert len(data) >= 1

    def test_history_does_not_show_others_results(self, db, lesson, teacher):
        """Học sinh A không thấy kết quả của học sinh B."""
        from apps.accounts.models import User
        from rest_framework.test import APIClient

        student_b = User.objects.create_user(
            username="student_b", email="sb@quiz.test",
            password="Pass123!", is_active=True, email_verified=True,
            role=User.Role.USER,
        )
        bc = APIClient()
        bc.force_authenticate(user=student_b)

        # teacher generates, student_b submits
        tc = APIClient()
        tc.force_authenticate(user=teacher)
        gen = tc.get(GENERATE_URL, {"lesson_id": lesson.id})
        bc.post(SUBMIT_URL, {
            "quiz_id": gen.data["quiz_id"],
            "score": 50, "total_questions": 4, "correct_answers": 2,
        }, format="json")

        # student A's history should be empty
        from rest_framework.test import APIClient as AC
        ac = AC()
        from apps.accounts.models import User as U
        student_a = U.objects.create_user(
            username="student_a", email="sa@quiz.test",
            password="Pass123!", is_active=True, email_verified=True,
            role=U.Role.USER,
        )
        ac.force_authenticate(user=student_a)
        r = ac.get(HISTORY_URL)
        data = r.data.get("results", r.data)
        assert len(data) == 0

    def test_unauthenticated_returns_403(self, db):
        from rest_framework.test import APIClient
        r = APIClient().get(HISTORY_URL)
        assert r.status_code in (401, 403)
