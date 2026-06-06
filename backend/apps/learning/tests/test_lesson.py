"""Tests cho LessonViewSet – CRUD, start, complete, add_word, remove_word."""
import pytest
from django.urls import reverse

from apps.learning.models import LessonProgress, ReviewLog


pytestmark = pytest.mark.django_db

LIST_URL   = "/api/v1/learning/lessons/"
DETAIL_URL = lambda pk: f"/api/v1/learning/lessons/{pk}/"
START_URL  = lambda pk: f"/api/v1/learning/lessons/{pk}/start/"
COMPLETE_URL = lambda pk: f"/api/v1/learning/lessons/{pk}/complete/"
WORDS_URL  = lambda pk: f"/api/v1/learning/lessons/{pk}/words/"
WORD_URL   = lambda pk, wid: f"/api/v1/learning/lessons/{pk}/words/{wid}/"


# ══════════════════════════════════════════════════════════════════════════════
# LIST
# ══════════════════════════════════════════════════════════════════════════════

class TestLessonList:
    def test_student_sees_published_only(self, sc, lesson, unpublished_lesson):
        r = sc.get(LIST_URL)
        assert r.status_code == 200
        ids = [d["id"] for d in r.data["results"]]
        assert lesson.id in ids
        assert unpublished_lesson.id not in ids

    def test_teacher_sees_own_unpublished(self, tc, lesson, unpublished_lesson):
        r = tc.get(LIST_URL)
        assert r.status_code == 200
        ids = [d["id"] for d in r.data["results"]]
        assert unpublished_lesson.id in ids

    def test_unauthenticated_denied(self, client):
        from rest_framework.test import APIClient
        r = APIClient().get(LIST_URL)
        assert r.status_code == 401

    def test_list_returns_word_count(self, sc, lesson):
        r = sc.get(LIST_URL)
        assert r.status_code == 200
        item = next(d for d in r.data["results"] if d["id"] == lesson.id)
        assert item["word_count"] == 2

    def test_list_can_filter_by_skill_tag(self, tc, teacher):
        teacher.lessons_created.create(
            title="Listening Filter",
            level="A1",
            skill_tag="listening",
            listening_transcript="The student takes a bus to school.",
            order_index=12,
        )
        r = tc.get(f"{LIST_URL}?skill_tag=listening")
        assert r.status_code == 200
        titles = [item["title"] for item in r.data["results"]]
        assert "Listening Filter" in titles
        assert "Lesson 1" not in titles

    def test_list_returns_listening_metadata_fields(self, tc, teacher):
        r = tc.post(
            LIST_URL,
            {
                "title": "Listening Demo",
                "level": "A1",
                "skill_tag": "listening",
                "listening_transcript": "Tom opens the door and sees his room.",
                "listening_translation_vi": "Tom mo canh cua va nhin thay phong cua minh.",
                "listening_estimated_seconds": 35,
                "listening_tts_lang": "en-US",
                "listening_tts_rate": 0.85,
                "order_index": 9,
            },
        )
        assert r.status_code == 201
        assert r.data["skill_tag"] == "listening"
        assert r.data["listening_estimated_seconds"] == 35
        assert r.data["listening_tts_lang"] == "en-US"
        assert r.data["listening_tts_rate"] == 0.85


# ══════════════════════════════════════════════════════════════════════════════
# RETRIEVE
# ══════════════════════════════════════════════════════════════════════════════

class TestLessonRetrieve:
    def test_detail_includes_words(self, sc, lesson):
        r = sc.get(DETAIL_URL(lesson.id))
        assert r.status_code == 200
        assert "words" in r.data
        assert len(r.data["words"]) == 2

    def test_detail_includes_user_progress_null_if_not_started(self, sc, lesson):
        r = sc.get(DETAIL_URL(lesson.id))
        assert r.data["user_progress"] is None

    def test_detail_includes_user_progress_after_start(self, sc, student, lesson):
        sc.post(START_URL(lesson.id))
        r = sc.get(DETAIL_URL(lesson.id))
        assert r.data["user_progress"] is not None

    def test_student_cannot_retrieve_unpublished(self, sc, unpublished_lesson):
        r = sc.get(DETAIL_URL(unpublished_lesson.id))
        assert r.status_code == 404

    def test_detail_includes_listening_metadata(self, tc, teacher):
        lesson = teacher.lessons_created.create(
            title="Listening Detail",
            level="A1",
            skill_tag="listening",
            listening_transcript="Mary takes a bus to school every day.",
            listening_translation_vi="Mary di xe buyt den truong moi ngay.",
            listening_estimated_seconds=42,
        )
        r = tc.get(DETAIL_URL(lesson.id))
        assert r.status_code == 200
        assert r.data["skill_tag"] == "listening"
        assert r.data["listening_transcript"] == "Mary takes a bus to school every day."
        assert r.data["listening_estimated_seconds"] == 42


# ══════════════════════════════════════════════════════════════════════════════
# CREATE / UPDATE / DELETE
# ══════════════════════════════════════════════════════════════════════════════

class TestLessonCUD:
    def test_teacher_can_create(self, tc):
        r = tc.post(LIST_URL, {"title": "New Lesson", "level": "B1", "order_index": 5})
        assert r.status_code == 201
        assert r.data["title"] == "New Lesson"

    def test_student_cannot_create(self, sc):
        r = sc.post(LIST_URL, {"title": "Hack", "level": "A1"})
        assert r.status_code == 403

    def test_teacher_can_update_own(self, tc, lesson):
        r = tc.patch(DETAIL_URL(lesson.id), {"title": "Updated"})
        assert r.status_code == 200
        assert r.data["title"] == "Updated"

    def test_teacher_cannot_update_others(self, sc, teacher, lesson):
        """Student không thể update."""
        r = sc.patch(DETAIL_URL(lesson.id), {"title": "Hack"})
        assert r.status_code == 403

    def test_teacher_can_delete_own(self, tc, lesson):
        r = tc.delete(DETAIL_URL(lesson.id))
        assert r.status_code == 204

    def test_student_cannot_delete(self, sc, lesson):
        r = sc.delete(DETAIL_URL(lesson.id))
        assert r.status_code == 403

    def test_listening_lesson_requires_transcript(self, tc):
        r = tc.post(
            LIST_URL,
            {
                "title": "Listening Missing Transcript",
                "level": "A1",
                "skill_tag": "listening",
            },
        )
        assert r.status_code == 400
        assert "listening_transcript" in r.data

    def test_listening_lesson_needs_three_words_before_publish(self, tc):
        r = tc.post(
            LIST_URL,
            {
                "title": "Listening Published Too Early",
                "level": "A1",
                "skill_tag": "listening",
                "listening_transcript": "I wake up at six and brush my teeth.",
                "is_published": True,
            },
        )
        assert r.status_code == 400
        assert "is_published" in r.data


# ══════════════════════════════════════════════════════════════════════════════
# ADD / REMOVE WORD
# ══════════════════════════════════════════════════════════════════════════════

class TestLessonWords:
    def test_teacher_can_add_word(self, tc, teacher, lesson):
        from apps.vocabulary.models import Word
        w = Word.objects.create(text="cherry", level="A2", created_by=teacher)
        r = tc.post(WORDS_URL(lesson.id), {"word_id": w.id, "order_index": 2})
        assert r.status_code == 201

    def test_duplicate_word_returns_409(self, tc, lesson, word_a):
        r = tc.post(WORDS_URL(lesson.id), {"word_id": word_a.id, "order_index": 0})
        assert r.status_code == 409

    def test_teacher_can_remove_word(self, tc, lesson, word_a):
        r = tc.delete(WORD_URL(lesson.id, word_a.id))
        assert r.status_code == 204

    def test_remove_nonexistent_word_404(self, tc, lesson):
        r = tc.delete(WORD_URL(lesson.id, 9999))
        assert r.status_code == 404

    def test_student_cannot_add_word(self, sc, lesson, word_a):
        r = sc.post(WORDS_URL(lesson.id), {"word_id": word_a.id})
        assert r.status_code == 403


# ══════════════════════════════════════════════════════════════════════════════
# START
# ══════════════════════════════════════════════════════════════════════════════

class TestLessonStart:
    def test_start_creates_progress(self, sc, student, lesson):
        r = sc.post(START_URL(lesson.id))
        assert r.status_code == 200
        assert LessonProgress.objects.filter(user=student, lesson=lesson).exists()

    def test_start_idempotent(self, sc, student, lesson):
        sc.post(START_URL(lesson.id))
        sc.post(START_URL(lesson.id))
        assert LessonProgress.objects.filter(user=student, lesson=lesson).count() == 1

    def test_start_returns_started_at(self, sc, lesson):
        r = sc.post(START_URL(lesson.id))
        assert "started_at" in r.data

    def test_start_unpublished_denied_for_student(self, sc, unpublished_lesson):
        r = sc.post(START_URL(unpublished_lesson.id))
        assert r.status_code == 404


# ══════════════════════════════════════════════════════════════════════════════
# COMPLETE
# ══════════════════════════════════════════════════════════════════════════════

class TestLessonComplete:
    def test_complete_creates_review_logs(self, sc, student, lesson, word_a, word_b):
        r = sc.post(COMPLETE_URL(lesson.id))
        assert r.status_code == 200
        assert ReviewLog.objects.filter(user=student).count() == 2
        review_log = ReviewLog.objects.filter(user=student, word=word_a).first()
        assert review_log is not None
        assert review_log.repetitions == 0
        assert review_log.interval_days == 1
        assert review_log.easiness_factor == 2.5

    def test_complete_returns_xp_and_streak(self, sc, lesson):
        r = sc.post(COMPLETE_URL(lesson.id))
        assert r.status_code == 200
        assert "xp_earned" in r.data
        assert "streak" in r.data
        assert "new_words" in r.data
        assert "total_xp" in r.data

    def test_complete_xp_correct_amount(self, sc, student, lesson):
        # 2 từ mới × 10 + 20 bonus = 40
        r = sc.post(COMPLETE_URL(lesson.id))
        assert r.data["xp_earned"] == 40

    def test_complete_twice_returns_200_no_duplicate(self, sc, student, lesson):
        sc.post(COMPLETE_URL(lesson.id))
        r2 = sc.post(COMPLETE_URL(lesson.id))
        assert r2.status_code == 200
        assert "đã hoàn thành" in r2.data["detail"]
        assert ReviewLog.objects.filter(user=student).count() == 2  # không tạo thêm

    def test_complete_skips_existing_review_logs(self, sc, student, lesson, review_log):
        """word_a đã có ReviewLog → chỉ tạo thêm 1 log mới (word_b)."""
        r = sc.post(COMPLETE_URL(lesson.id))
        assert r.data["new_words"] == 1
        assert r.data["xp_earned"] == 10 + 20  # 1 từ mới + bonus

    def test_complete_marks_progress_completed_at(self, sc, student, lesson):
        sc.post(COMPLETE_URL(lesson.id))
        progress = LessonProgress.objects.get(user=student, lesson=lesson)
        assert progress.completed_at is not None

    def test_complete_returns_refreshed_total_xp(self, sc, student, lesson):
        response = sc.post(COMPLETE_URL(lesson.id))
        assert response.status_code == 200
        student.refresh_from_db()
        assert response.data["total_xp"] == student.xp
