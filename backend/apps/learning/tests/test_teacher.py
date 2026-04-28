"""
Tests cho Teacher API:
  GET /api/v1/learning/teacher/stats/    — TeacherStatsView
  GET /api/v1/auth/teacher/students/     — TeacherStudentListView
"""
import pytest

pytestmark = pytest.mark.django_db

STATS_URL    = "/api/v1/learning/teacher/stats/"
STUDENTS_URL = "/api/v1/auth/teacher/students/"


# ══════════════════════════════════════════════════════════════════════════════
# TeacherStatsView  GET /api/v1/learning/teacher/stats/
# ══════════════════════════════════════════════════════════════════════════════

class TestTeacherStatsView:
    def test_teacher_gets_stats(self, tc, lesson, assignment):
        r = tc.get(STATS_URL)
        assert r.status_code == 200

    def test_response_has_required_fields(self, tc, lesson, assignment):
        r = tc.get(STATS_URL)
        for field in ("lesson_count", "assignment_count", "student_count",
                      "recent_lessons", "recent_assignments"):
            assert field in r.data, f"Thiếu field: {field}"

    def test_lesson_count_correct(self, tc, lesson):
        r = tc.get(STATS_URL)
        assert r.data["lesson_count"] == 1

    def test_assignment_count_correct(self, tc, lesson, assignment):
        r = tc.get(STATS_URL)
        assert r.data["assignment_count"] == 1

    def test_student_count_correct(self, tc, lesson, assignment):
        r = tc.get(STATS_URL)
        assert r.data["student_count"] == 1

    def test_recent_lessons_contains_own_lesson(self, tc, lesson):
        r = tc.get(STATS_URL)
        ids = [l["id"] for l in r.data["recent_lessons"]]
        assert lesson.id in ids

    def test_recent_lessons_max_5(self, tc, teacher):
        """Chỉ trả về tối đa 5 bài học gần nhất."""
        from apps.learning.models import Lesson
        for i in range(7):
            Lesson.objects.create(
                title=f"Lesson {i}", level="A1",
                order_index=i, is_published=True, created_by=teacher,
            )
        r = tc.get(STATS_URL)
        assert len(r.data["recent_lessons"]) <= 5

    def test_teacher_only_sees_own_lessons(self, tc, teacher, db):
        """Lesson của giáo viên khác không được đếm vào stats."""
        from apps.accounts.models import User
        from apps.learning.models import Lesson

        other = User.objects.create_user(
            username="other_t", email="other_t@test.com",
            password="Pass123!", is_active=True, email_verified=True,
            role=User.Role.TEACHER,
        )
        Lesson.objects.create(
            title="Other Lesson", level="A1", order_index=99,
            is_published=True, created_by=other,
        )
        r = tc.get(STATS_URL)
        # stats chỉ tính bài của teacher fixture (0 bài)
        assert r.data["lesson_count"] == 0

    def test_student_denied(self, sc):
        r = sc.get(STATS_URL)
        assert r.status_code == 403

    def test_unauthenticated_denied(self, db):
        from rest_framework.test import APIClient
        r = APIClient().get(STATS_URL)
        assert r.status_code in (401, 403)

    def test_empty_stats_when_no_data(self, tc):
        r = tc.get(STATS_URL)
        assert r.data["lesson_count"] == 0
        assert r.data["assignment_count"] == 0
        assert r.data["student_count"] == 0
        assert r.data["recent_lessons"] == []
        assert r.data["recent_assignments"] == []


# ══════════════════════════════════════════════════════════════════════════════
# TeacherStudentListView  GET /api/v1/auth/teacher/students/
# ══════════════════════════════════════════════════════════════════════════════

class TestTeacherStudentListView:
    def test_teacher_gets_student_list(self, tc, student):
        r = tc.get(STUDENTS_URL)
        assert r.status_code == 200

    def test_response_is_paginated(self, tc):
        r = tc.get(STUDENTS_URL)
        assert "results" in r.data

    def test_student_appears_in_list(self, tc, student):
        r = tc.get(STUDENTS_URL)
        emails = [u["email"] for u in r.data["results"]]
        assert student.email in emails

    def test_teacher_not_in_list(self, tc, teacher):
        """Giáo viên không được liệt kê trong danh sách học sinh."""
        r = tc.get(STUDENTS_URL)
        emails = [u["email"] for u in r.data["results"]]
        assert teacher.email not in emails

    def test_admin_not_in_list(self, tc, admin):
        """Admin không được liệt kê trong danh sách học sinh."""
        r = tc.get(STUDENTS_URL)
        emails = [u["email"] for u in r.data["results"]]
        assert admin.email not in emails

    def test_search_by_email(self, tc, student):
        r = tc.get(STUDENTS_URL, {"search": student.email})
        assert r.status_code == 200
        emails = [u["email"] for u in r.data["results"]]
        assert student.email in emails

    def test_search_by_full_name(self, tc, student):
        r = tc.get(STUDENTS_URL, {"search": student.full_name or student.username})
        assert r.status_code == 200
        assert len(r.data["results"]) >= 1

    def test_search_no_match_returns_empty(self, tc):
        r = tc.get(STUDENTS_URL, {"search": "zzz_nobody_zzz"})
        assert r.status_code == 200
        assert r.data["results"] == []

    def test_inactive_user_not_listed(self, tc, db):
        """Học sinh bị vô hiệu hoá không xuất hiện trong danh sách."""
        from apps.accounts.models import User
        inactive = User.objects.create_user(
            username="inactive_s", email="inactive@test.com",
            password="Pass123!", is_active=False, email_verified=True,
            role=User.Role.USER,
        )
        r = tc.get(STUDENTS_URL)
        emails = [u["email"] for u in r.data["results"]]
        assert inactive.email not in emails

    def test_student_denied(self, sc):
        r = sc.get(STUDENTS_URL)
        assert r.status_code == 403

    def test_unauthenticated_denied(self, db):
        from rest_framework.test import APIClient
        r = APIClient().get(STUDENTS_URL)
        assert r.status_code in (401, 403)

    def test_page_size_param(self, tc, db):
        """Tham số page_size được tôn trọng."""
        from apps.accounts.models import User
        for i in range(5):
            User.objects.create_user(
                username=f"s{i}", email=f"s{i}@test.com",
                password="Pass123!", is_active=True, email_verified=True,
                role=User.Role.USER,
            )
        r = tc.get(STUDENTS_URL, {"page_size": 2})
        assert len(r.data["results"]) <= 2
