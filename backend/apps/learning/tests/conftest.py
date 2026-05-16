"""Fixtures for learning tests."""

from datetime import date, timedelta

import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.learning.models import Lesson, LessonProgress, LessonWord, ReviewLog, UserStreak
from apps.vocabulary.models import Word


def _user(username, role, db):
    return User.objects.create_user(
        username=username,
        email=f"{username}@test.com",
        password="Pass123!",
        is_active=True,
        email_verified=True,
        role=role,
    )


@pytest.fixture
def student(db):
    return _user("student", User.Role.USER, db)


@pytest.fixture
def teacher(db):
    return _user("teacher", User.Role.TEACHER, db)


@pytest.fixture
def admin(db):
    return _user("admin_u", User.Role.ADMIN, db)


def _client(user):
    c = APIClient()
    c.force_authenticate(user=user)
    return c


@pytest.fixture
def sc(student):
    return _client(student)


@pytest.fixture
def tc(teacher):
    return _client(teacher)


@pytest.fixture
def ac(admin):
    return _client(admin)


@pytest.fixture
def word_a(db, teacher):
    return Word.objects.create(text="apple", level="A1", created_by=teacher)


@pytest.fixture
def word_b(db, teacher):
    return Word.objects.create(text="banana", level="A1", created_by=teacher)


@pytest.fixture
def lesson(db, teacher, word_a, word_b):
    ls = Lesson.objects.create(
        title="Lesson 1",
        level="A1",
        order_index=1,
        is_published=True,
        created_by=teacher,
    )
    LessonWord.objects.create(lesson=ls, word=word_a, order_index=0)
    LessonWord.objects.create(lesson=ls, word=word_b, order_index=1)
    return ls


@pytest.fixture
def unpublished_lesson(db, teacher):
    return Lesson.objects.create(
        title="Draft Lesson",
        is_published=False,
        created_by=teacher,
    )


@pytest.fixture
def review_log(db, student, word_a):
    return ReviewLog.objects.create(
        user=student,
        word=word_a,
        next_review_date=date.today(),
    )


@pytest.fixture
def future_log(db, student, word_b):
    return ReviewLog.objects.create(
        user=student,
        word=word_b,
        next_review_date=date.today() + timedelta(days=5),
    )


@pytest.fixture
def streak(db, student):
    return UserStreak.objects.create(user=student)
