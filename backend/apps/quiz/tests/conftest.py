"""Fixtures cho quiz tests."""
import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.vocabulary.models import Word
from apps.learning.models import Lesson, LessonWord


def _user(username, role, db):
    return User.objects.create_user(
        username=username, email=f"{username}@quiz.test",
        password="Pass123!", is_active=True, email_verified=True, role=role,
    )


@pytest.fixture
def student(db):  return _user("qstudent", User.Role.USER,    db)
@pytest.fixture
def teacher(db):  return _user("qteacher", User.Role.TEACHER, db)


def _client(user):
    c = APIClient()
    c.force_authenticate(user=user)
    return c


@pytest.fixture
def sc(student):  return _client(student)
@pytest.fixture
def tc(teacher):  return _client(teacher)


@pytest.fixture
def words(db, teacher):
    """4 từ vựng A1 – đủ điều kiện tạo quiz."""
    data = [
        ("apple",  "Quả táo"),
        ("banana", "Quả chuối"),
        ("orange", "Quả cam"),
        ("grape",  "Quả nho"),
    ]
    return [
        Word.objects.create(
            text=t, definition_vi=d, level="A1", created_by=teacher
        )
        for t, d in data
    ]


@pytest.fixture
def lesson(db, teacher, words):
    ls = Lesson.objects.create(
        title="Quiz Test Lesson", level="A1",
        order_index=1, is_published=True, created_by=teacher,
    )
    for i, w in enumerate(words):
        LessonWord.objects.create(lesson=ls, word=w, order_index=i)
    return ls


@pytest.fixture
def unpublished_lesson(db, teacher):
    return Lesson.objects.create(
        title="Draft Lesson", is_published=False, created_by=teacher,
    )
