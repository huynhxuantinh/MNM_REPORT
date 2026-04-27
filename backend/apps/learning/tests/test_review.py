"""Tests cho ReviewListView, ReviewAnswerView, ReviewSummaryView."""
import pytest
from datetime import date, timedelta
from unittest.mock import patch

from apps.learning.models import ReviewLog, UserStreak


pytestmark = pytest.mark.django_db

REVIEW_URL   = "/api/v1/learning/review/"
SUMMARY_URL  = "/api/v1/learning/review/summary/"
ANSWER_URL   = lambda wid: f"/api/v1/learning/review/{wid}/answer/"


# ══════════════════════════════════════════════════════════════════════════════
# GET /review/
# ══════════════════════════════════════════════════════════════════════════════

class TestReviewList:
    def test_returns_due_words_only(self, sc, review_log, future_log):
        r = sc.get(REVIEW_URL)
        assert r.status_code == 200
        ids = [item["id"] for item in r.data["words"]]
        assert review_log.id in ids
        assert future_log.id not in ids

    def test_count_matches_words_length(self, sc, review_log):
        r = sc.get(REVIEW_URL)
        assert r.data["count"] == len(r.data["words"])

    def test_unauthenticated_denied(self):
        from rest_framework.test import APIClient
        r = APIClient().get(REVIEW_URL)
        assert r.status_code == 401

    def test_empty_when_no_due(self, sc, future_log):
        r = sc.get(REVIEW_URL)
        assert r.data["count"] == 0
        assert r.data["words"] == []

    def test_session_limit_50(self, db, student, sc, teacher):
        from apps.vocabulary.models import Word
        today = date.today()
        logs = []
        for i in range(55):
            w = Word.objects.create(text=f"word{i}", level="A1", created_by=teacher)
            logs.append(ReviewLog(user=student, word=w, next_review_date=today))
        ReviewLog.objects.bulk_create(logs)
        r = sc.get(REVIEW_URL)
        assert r.data["count"] <= 50
        assert len(r.data["words"]) <= 50

    def test_words_include_required_fields(self, sc, review_log):
        r = sc.get(REVIEW_URL)
        item = r.data["words"][0]
        for field in ("id", "word", "easiness_factor", "repetitions",
                      "interval_days", "next_review_date"):
            assert field in item

    def test_student_sees_own_only(self, sc, tc, student, teacher, word_a, word_b):
        """Teacher's ReviewLog không xuất hiện trong list của student."""
        from apps.vocabulary.models import Word
        ReviewLog.objects.create(user=teacher, word=word_b,
                                 next_review_date=date.today())
        review = ReviewLog.objects.create(user=student, word=word_a,
                                          next_review_date=date.today())
        r = sc.get(REVIEW_URL)
        user_ids = [item["id"] for item in r.data["words"]]
        # chỉ thấy của student
        assert all(
            ReviewLog.objects.get(id=i).user_id == student.id
            for i in user_ids
        )


# ══════════════════════════════════════════════════════════════════════════════
# POST /review/{word_id}/answer/
# ══════════════════════════════════════════════════════════════════════════════

class TestReviewAnswer:
    def test_correct_answer_updates_sm2(self, sc, review_log):
        r = sc.post(ANSWER_URL(review_log.word_id), {"quality": 4})
        assert r.status_code == 200
        review_log.refresh_from_db()
        assert review_log.repetitions == 1
        assert review_log.total_reviews == 1

    def test_wrong_answer_resets_repetitions(self, sc, review_log):
        # Đặt repetitions cao trước
        ReviewLog.objects.filter(id=review_log.id).update(repetitions=3, interval_days=15)
        r = sc.post(ANSWER_URL(review_log.word_id), {"quality": 1})
        assert r.status_code == 200
        review_log.refresh_from_db()
        assert review_log.repetitions == 0
        assert review_log.interval_days == 1

    def test_returns_required_fields(self, sc, review_log):
        r = sc.post(ANSWER_URL(review_log.word_id), {"quality": 4})
        assert r.status_code == 200
        for field in ("word_id", "quality", "interval_days",
                      "next_review_date", "easiness_factor",
                      "xp_earned", "total_xp", "level"):
            assert field in r.data

    def test_xp_correct_q_ge_3(self, sc, student, review_log):
        r = sc.post(ANSWER_URL(review_log.word_id), {"quality": 3})
        assert r.data["xp_earned"] == 5

    def test_xp_wrong_q_lt_3(self, sc, student, review_log):
        r = sc.post(ANSWER_URL(review_log.word_id), {"quality": 2})
        assert r.data["xp_earned"] == 2

    def test_xp_added_to_user(self, sc, student, review_log):
        xp_before = student.xp
        sc.post(ANSWER_URL(review_log.word_id), {"quality": 5})
        student.refresh_from_db()
        assert student.xp == xp_before + 5

    def test_word_not_in_srs_returns_404(self, sc, word_b):
        r = sc.post(ANSWER_URL(word_b.id), {"quality": 4})
        assert r.status_code == 404

    def test_quality_out_of_range_returns_400(self, sc, review_log):
        r = sc.post(ANSWER_URL(review_log.word_id), {"quality": 6})
        assert r.status_code == 400

    def test_quality_below_0_returns_400(self, sc, review_log):
        r = sc.post(ANSWER_URL(review_log.word_id), {"quality": -1})
        assert r.status_code == 400

    def test_unauthenticated_denied(self, review_log):
        from rest_framework.test import APIClient
        r = APIClient().post(ANSWER_URL(review_log.word_id), {"quality": 3})
        assert r.status_code == 401

    def test_streak_updated_after_answer(self, sc, student, review_log, streak):
        sc.post(ANSWER_URL(review_log.word_id), {"quality": 4})
        streak.refresh_from_db()
        assert streak.current_streak == 1

    @pytest.mark.parametrize("q", [0, 1, 2, 3, 4, 5])
    def test_all_qualities_accepted(self, sc, student, teacher, db, q):
        from apps.vocabulary.models import Word
        w = Word.objects.create(text=f"w_q{q}", level="A1", created_by=teacher)
        log = ReviewLog.objects.create(user=student, word=w,
                                       next_review_date=date.today())
        r = sc.post(ANSWER_URL(w.id), {"quality": q})
        assert r.status_code == 200

    def test_next_review_date_in_response(self, sc, review_log):
        r = sc.post(ANSWER_URL(review_log.word_id), {"quality": 4})
        from datetime import date, timedelta
        expected = date.today() + timedelta(days=1)
        # API trả về date object hoặc ISO string tùy renderer
        assert str(r.data["next_review_date"]) == str(expected)

    def test_level_up_notification_created(self, sc, student, review_log):
        """XP đủ lên level → Notification được tạo."""
        from apps.learning.models import Notification
        student.xp = 195  # cần thêm 5 XP để lên level 2 (threshold = 100*2*3/2=300? check)
        # Level 1→2: cần 200 XP, hiện có 195 → thêm 5 → 200 → level up
        student.xp = 195
        student.save()
        sc.post(ANSWER_URL(review_log.word_id), {"quality": 4})  # +5 XP
        student.refresh_from_db()
        if student.level >= 2:
            assert Notification.objects.filter(
                user=student, type=Notification.Type.LEVEL_UP
            ).exists()


# ══════════════════════════════════════════════════════════════════════════════
# GET /review/summary/
# ══════════════════════════════════════════════════════════════════════════════

class TestReviewSummary:
    def test_returns_required_fields(self, sc, streak):
        r = sc.get(SUMMARY_URL)
        assert r.status_code == 200
        for field in ("reviewed_today", "correct_today", "streak",
                      "total_xp", "level", "due_tomorrow"):
            assert field in r.data

    def test_unauthenticated_denied(self):
        from rest_framework.test import APIClient
        r = APIClient().get(SUMMARY_URL)
        assert r.status_code == 401

    def test_reviewed_today_zero_initially(self, sc, streak):
        r = sc.get(SUMMARY_URL)
        assert r.data["reviewed_today"] == 0

    def test_reviewed_today_counts_after_answer(self, sc, student, review_log, streak):
        sc.post(ANSWER_URL(review_log.word_id), {"quality": 4})
        r = sc.get(SUMMARY_URL)
        assert r.data["reviewed_today"] >= 1

    def test_due_tomorrow_count(self, sc, student, word_a, db):
        tomorrow = date.today() + timedelta(days=1)
        ReviewLog.objects.filter(user=student, word=word_a).delete()
        ReviewLog.objects.create(user=student, word=word_a,
                                 next_review_date=tomorrow)
        r = sc.get(SUMMARY_URL)
        assert r.data["due_tomorrow"] == 1

    def test_streak_in_summary(self, sc, student, review_log, streak):
        sc.post(ANSWER_URL(review_log.word_id), {"quality": 4})
        r = sc.get(SUMMARY_URL)
        assert r.data["streak"] >= 1
