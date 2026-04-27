"""Unit tests cho thuật toán SM-2 – không cần DB (dùng @pytest.mark.django_db chỉ khi save)."""
import pytest
from datetime import date, timedelta
from unittest.mock import patch

from apps.learning.models import ReviewLog


# ─── helpers ──────────────────────────────────────────────────────────────────

def make_log(**kwargs) -> ReviewLog:
    """Tạo ReviewLog giả (unsaved) với giá trị mặc định SM-2."""
    log = ReviewLog.__new__(ReviewLog)
    log.easiness_factor = kwargs.get("easiness_factor", 2.5)
    log.repetitions = kwargs.get("repetitions", 0)
    log.interval_days = kwargs.get("interval_days", 1)
    log.last_reviewed = kwargs.get("last_reviewed", None)
    log.next_review_date = kwargs.get("next_review_date", None)
    log.total_reviews = kwargs.get("total_reviews", 0)
    log.correct_count = kwargs.get("correct_count", 0)
    return log


TODAY = date(2026, 4, 27)
PATCH_DATE = "apps.learning.models.timezone"


def apply(log: ReviewLog, quality: int) -> ReviewLog:
    """Gọi apply_sm2 với ngày cố định + patch save()."""
    from django.utils import timezone as tz
    import datetime

    fake_now = datetime.datetime(TODAY.year, TODAY.month, TODAY.day, 12, 0, 0,
                                  tzinfo=datetime.timezone.utc)
    with patch.object(tz, "now", return_value=fake_now), \
         patch.object(log, "save"):
        log.apply_sm2(quality)
    return log


# ══════════════════════════════════════════════════════════════════════════════
# 1. Xác nhận chất lượng hợp lệ
# ══════════════════════════════════════════════════════════════════════════════

class TestQualityValidation:
    def test_quality_below_0_raises(self):
        log = make_log()
        with pytest.raises(ValueError, match="0–5"):
            apply(log, -1)

    def test_quality_above_5_raises(self):
        log = make_log()
        with pytest.raises(ValueError, match="0–5"):
            apply(log, 6)

    @pytest.mark.parametrize("q", [0, 1, 2, 3, 4, 5])
    def test_valid_qualities_do_not_raise(self, q):
        log = make_log()
        apply(log, q)  # không raise


# ══════════════════════════════════════════════════════════════════════════════
# 2. Interval progression khi q >= 3 (nhớ được)
# ══════════════════════════════════════════════════════════════════════════════

class TestIntervalCorrect:
    """Kiểm tra interval theo đặc tả chương 2.5."""

    def test_first_correct_interval_is_1(self):
        log = make_log(repetitions=0)
        apply(log, 4)
        assert log.interval_days == 1

    def test_second_correct_interval_is_6(self):
        log = make_log(repetitions=1, interval_days=1)
        apply(log, 4)
        assert log.interval_days == 6

    def test_third_correct_interval_uses_ef(self):
        # rep=2, interval=6, EF=2.5 → interval = round(6 * 2.5) = 15
        log = make_log(repetitions=2, interval_days=6, easiness_factor=2.5)
        apply(log, 4)
        assert log.interval_days == 15

    def test_fourth_correct_compounds(self):
        # rep=3, interval=15, EF=2.5 → round(15 * 2.5) = 38
        log = make_log(repetitions=3, interval_days=15, easiness_factor=2.5)
        apply(log, 4)
        assert log.interval_days == 38

    def test_repetitions_increments_on_correct(self):
        log = make_log(repetitions=0)
        apply(log, 3)
        assert log.repetitions == 1

    def test_correct_count_increments_on_correct(self):
        log = make_log(correct_count=2)
        apply(log, 5)
        assert log.correct_count == 3

    def test_correct_count_not_incremented_on_wrong(self):
        log = make_log(correct_count=2)
        apply(log, 2)
        assert log.correct_count == 2


# ══════════════════════════════════════════════════════════════════════════════
# 3. Reset khi q < 3 (quên)
# ══════════════════════════════════════════════════════════════════════════════

class TestIntervalWrong:
    @pytest.mark.parametrize("q", [0, 1, 2])
    def test_repetitions_reset_to_0(self, q):
        log = make_log(repetitions=5, interval_days=30)
        apply(log, q)
        assert log.repetitions == 0

    @pytest.mark.parametrize("q", [0, 1, 2])
    def test_interval_reset_to_1(self, q):
        log = make_log(repetitions=5, interval_days=30)
        apply(log, q)
        assert log.interval_days == 1

    def test_ef_still_decreases_on_wrong(self):
        log = make_log(easiness_factor=2.5, repetitions=3)
        ef_before = log.easiness_factor
        apply(log, 0)
        assert log.easiness_factor < ef_before


# ══════════════════════════════════════════════════════════════════════════════
# 4. Easiness Factor (EF) cập nhật đúng
# ══════════════════════════════════════════════════════════════════════════════

class TestEasinessFactor:
    """EF mới = max(1.3, EF + 0.1 − (5−q)×(0.08 + (5−q)×0.02))"""

    def _expected_ef(self, ef: float, q: int) -> float:
        return max(1.3, ef + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))

    @pytest.mark.parametrize("q", [0, 1, 2, 3, 4, 5])
    def test_ef_formula_all_qualities(self, q):
        ef0 = 2.5
        log = make_log(easiness_factor=ef0)
        apply(log, q)
        expected = self._expected_ef(ef0, q)
        assert abs(log.easiness_factor - expected) < 1e-9

    def test_ef_increases_on_perfect(self):
        log = make_log(easiness_factor=2.5)
        apply(log, 5)
        assert log.easiness_factor > 2.5

    def test_ef_decreases_on_low_quality(self):
        log = make_log(easiness_factor=2.5)
        apply(log, 1)
        assert log.easiness_factor < 2.5

    def test_ef_not_below_minimum(self):
        # EF = 1.3 là sàn
        log = make_log(easiness_factor=1.3)
        for _ in range(10):
            apply(log, 0)
        assert log.easiness_factor >= 1.3

    def test_ef_floor_enforced_from_high_start(self):
        # Bắt đầu cao nhưng nhiều lần q=0 → sàn 1.3
        log = make_log(easiness_factor=2.5)
        for _ in range(20):
            apply(log, 0)
        assert round(log.easiness_factor, 9) >= 1.3

    def test_ef_q3_slight_decrease(self):
        # q=3: EF thay đổi một lượng nhỏ
        log = make_log(easiness_factor=2.5)
        apply(log, 3)
        expected = self._expected_ef(2.5, 3)
        assert abs(log.easiness_factor - expected) < 1e-9


# ══════════════════════════════════════════════════════════════════════════════
# 5. next_review_date tính đúng
# ══════════════════════════════════════════════════════════════════════════════

class TestNextReviewDate:
    def test_first_correct_next_review_tomorrow(self):
        log = make_log(repetitions=0)
        apply(log, 4)
        assert log.next_review_date == TODAY + timedelta(days=1)

    def test_second_correct_next_review_6_days(self):
        log = make_log(repetitions=1, interval_days=1)
        apply(log, 4)
        assert log.next_review_date == TODAY + timedelta(days=6)

    def test_wrong_next_review_tomorrow(self):
        log = make_log(repetitions=5, interval_days=30)
        apply(log, 1)
        assert log.next_review_date == TODAY + timedelta(days=1)

    def test_last_reviewed_set_to_today(self):
        log = make_log()
        apply(log, 4)
        assert log.last_reviewed == TODAY


# ══════════════════════════════════════════════════════════════════════════════
# 6. total_reviews tăng mỗi lần
# ══════════════════════════════════════════════════════════════════════════════

class TestTotalReviews:
    def test_total_reviews_increments_each_call(self):
        log = make_log(total_reviews=0)
        for i in range(1, 6):
            apply(log, 4)
            assert log.total_reviews == i

    def test_total_reviews_increments_on_wrong(self):
        log = make_log(total_reviews=3)
        apply(log, 0)
        assert log.total_reviews == 4


# ══════════════════════════════════════════════════════════════════════════════
# 7. Kiểm tra luồng học thực tế nhiều session
# ══════════════════════════════════════════════════════════════════════════════

class TestSM2Sequence:
    """Mô phỏng người học học từ qua nhiều phiên."""

    def test_full_mastery_sequence(self):
        """q=5 liên tiếp → interval tăng theo EF."""
        log = make_log()
        apply(log, 5)
        assert log.interval_days == 1
        assert log.repetitions == 1

        apply(log, 5)
        assert log.interval_days == 6
        assert log.repetitions == 2

        ef = log.easiness_factor
        apply(log, 5)
        assert log.interval_days == round(6 * ef)
        assert log.repetitions == 3

    def test_forget_resets_streak(self):
        log = make_log()
        apply(log, 5)  # rep=1
        apply(log, 5)  # rep=2
        apply(log, 0)  # quên → reset
        assert log.repetitions == 0
        assert log.interval_days == 1

    def test_recovery_after_forget(self):
        log = make_log()
        apply(log, 5)  # rep=1
        apply(log, 0)  # quên
        apply(log, 4)  # nhớ lại → rep=1 lần nữa
        assert log.repetitions == 1
        assert log.interval_days == 1

    def test_mixed_quality_progression(self):
        """q=4,4,3,5 – kiểm tra EF và repetitions."""
        log = make_log()
        qualities = [4, 4, 3, 5]
        for q in qualities:
            apply(log, q)
        assert log.repetitions == 4
        assert log.correct_count == 4
        assert log.total_reviews == 4
