"""Tests cho AssignmentViewSet – list, create (bulk), destroy."""
import pytest
from datetime import date, timedelta

from apps.learning.models import Assignment, Notification


pytestmark = pytest.mark.django_db

LIST_URL   = "/api/v1/learning/assignments/"
DETAIL_URL = lambda pk: f"/api/v1/learning/assignments/{pk}/"


# ══════════════════════════════════════════════════════════════════════════════
# LIST
# ══════════════════════════════════════════════════════════════════════════════

class TestAssignmentList:
    def test_student_sees_own_assignments(self, sc, assignment):
        r = sc.get(LIST_URL)
        assert r.status_code == 200
        ids = [d["id"] for d in r.data["results"]]
        assert assignment.id in ids

    def test_teacher_sees_assignments_they_gave(self, tc, assignment):
        r = tc.get(LIST_URL)
        assert r.status_code == 200
        ids = [d["id"] for d in r.data["results"]]
        assert assignment.id in ids

    def test_student_cannot_see_others_assignments(self, db, tc, lesson):
        from apps.accounts.models import User
        other = User.objects.create_user(
            username="other", email="other@test.com",
            password="Pass123!", is_active=True, email_verified=True,
            role=User.Role.USER,
        )
        from rest_framework.test import APIClient
        oc = APIClient()
        oc.force_authenticate(user=other)
        r = oc.get(LIST_URL)
        assert r.status_code == 200
        # other chưa có assignment nào
        assert r.data["count"] == 0

    def test_unauthenticated_denied(self):
        from rest_framework.test import APIClient
        r = APIClient().get(LIST_URL)
        assert r.status_code == 401

    def test_list_includes_lesson_title(self, sc, assignment):
        r = sc.get(LIST_URL)
        item = next(d for d in r.data["results"] if d["id"] == assignment.id)
        assert item["lesson_title"] == assignment.lesson.title


# ══════════════════════════════════════════════════════════════════════════════
# CREATE (bulk)
# ══════════════════════════════════════════════════════════════════════════════

class TestAssignmentCreate:
    def _payload(self, lesson, *students, **kwargs):
        return {
            "lesson_id": lesson.id,
            "student_ids": [s.id for s in students],
            **kwargs,
        }

    def test_teacher_can_assign(self, tc, teacher, student, lesson):
        r = tc.post(LIST_URL, self._payload(lesson, student), format="json")
        assert r.status_code == 201
        assert r.data["assigned"] == 1

    def test_bulk_assign_multiple_students(self, db, tc, teacher, lesson):
        from apps.accounts.models import User
        s1 = User.objects.create_user(
            username="s1", email="s1@t.com", password="Pass123!",
            is_active=True, email_verified=True, role=User.Role.USER,
        )
        s2 = User.objects.create_user(
            username="s2", email="s2@t.com", password="Pass123!",
            is_active=True, email_verified=True, role=User.Role.USER,
        )
        r = tc.post(LIST_URL, self._payload(lesson, s1, s2), format="json")
        assert r.status_code == 201
        assert r.data["assigned"] == 2

    def test_duplicate_skipped(self, tc, teacher, student, lesson, assignment):
        r = tc.post(LIST_URL, self._payload(lesson, student), format="json")
        assert r.status_code == 201
        assert r.data["assigned"] == 0
        assert r.data["skipped"] == 1

    def test_notification_created_for_new_assignment(self, tc, teacher, student, lesson):
        tc.post(LIST_URL, self._payload(lesson, student), format="json")
        assert Notification.objects.filter(
            user=student, type=Notification.Type.ASSIGNMENT
        ).exists()

    def test_no_notification_on_duplicate(self, tc, teacher, student, lesson, assignment):
        Notification.objects.filter(user=student).delete()
        tc.post(LIST_URL, self._payload(lesson, student), format="json")
        assert not Notification.objects.filter(
            user=student, type=Notification.Type.ASSIGNMENT
        ).exists()

    def test_student_cannot_assign(self, sc, student, lesson):
        r = sc.post(LIST_URL, self._payload(lesson, student), format="json")
        assert r.status_code == 403

    def test_invalid_student_ids_returns_400(self, tc, lesson):
        r = tc.post(LIST_URL, {"lesson_id": lesson.id, "student_ids": [99999]},
                    format="json")
        assert r.status_code == 400

    def test_unpublished_lesson_returns_400(self, tc, student, unpublished_lesson):
        r = tc.post(LIST_URL, {
            "lesson_id": unpublished_lesson.id,
            "student_ids": [student.id],
        }, format="json")
        assert r.status_code == 400

    def test_assign_with_due_date(self, tc, teacher, student, lesson):
        due = str(date.today() + timedelta(days=14))
        r = tc.post(LIST_URL, self._payload(lesson, student, due_date=due), format="json")
        assert r.status_code == 201
        a = Assignment.objects.get(lesson=lesson, student=student)
        assert str(a.due_date) == due

    def test_assign_without_due_date_ok(self, tc, teacher, student, lesson):
        r = tc.post(LIST_URL, self._payload(lesson, student), format="json")
        assert r.status_code == 201
        a = Assignment.objects.get(lesson=lesson, student=student)
        assert a.due_date is None

    def test_empty_student_ids_returns_400(self, tc, lesson):
        r = tc.post(LIST_URL, {"lesson_id": lesson.id, "student_ids": []},
                    format="json")
        assert r.status_code == 400


# ══════════════════════════════════════════════════════════════════════════════
# DELETE
# ══════════════════════════════════════════════════════════════════════════════

class TestAssignmentDelete:
    def test_teacher_can_delete_own(self, tc, assignment):
        r = tc.delete(DETAIL_URL(assignment.id))
        assert r.status_code == 204
        assert not Assignment.objects.filter(id=assignment.id).exists()

    def test_student_cannot_delete(self, sc, assignment):
        r = sc.delete(DETAIL_URL(assignment.id))
        assert r.status_code == 403

    def test_delete_nonexistent_returns_404(self, tc):
        r = tc.delete(DETAIL_URL(99999))
        assert r.status_code == 404

    def test_other_teacher_cannot_delete(self, db, lesson, student):
        from apps.accounts.models import User
        from rest_framework.test import APIClient
        t2 = User.objects.create_user(
            username="teacher2", email="teacher2@t.com", password="Pass123!",
            is_active=True, email_verified=True, role=User.Role.TEACHER,
        )
        a = Assignment.objects.create(
            teacher=t2, student=student, lesson=lesson,
            due_date=date.today() + timedelta(days=3),
        )
        # teacher1 (tc) cố xoá assignment của teacher2 → 404 vì queryset lọc teacher=user
        from apps.accounts.models import User as U
        t1 = User.objects.get(username="teacher")
        c1 = APIClient()
        c1.force_authenticate(user=t1)
        r = c1.delete(DETAIL_URL(a.id))
        assert r.status_code == 404  # không thấy trong queryset


# ══════════════════════════════════════════════════════════════════════════════
# NOTIFICATION content
# ══════════════════════════════════════════════════════════════════════════════

class TestAssignmentNotification:
    def test_notification_message_contains_lesson_title(self, tc, teacher, student, lesson):
        tc.post(LIST_URL, {
            "lesson_id": lesson.id,
            "student_ids": [student.id],
        }, format="json")
        n = Notification.objects.get(user=student, type=Notification.Type.ASSIGNMENT)
        assert lesson.title in n.message

    def test_notification_related_id_is_lesson_id(self, tc, teacher, student, lesson):
        tc.post(LIST_URL, {
            "lesson_id": lesson.id,
            "student_ids": [student.id],
        }, format="json")
        n = Notification.objects.get(user=student, type=Notification.Type.ASSIGNMENT)
        assert n.related_id == lesson.id
