"""Fixtures dùng chung cho vocabulary tests."""
import io
import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.vocabulary.models import Bookmark, Word, WordSet, WordSetWord


# ── Users ──────────────────────────────────────────────────────────────────

@pytest.fixture
def student(db):
    return User.objects.create_user(
        username="student", email="student@test.com",
        password="Pass123!", is_active=True, email_verified=True,
        role=User.Role.USER,
    )


@pytest.fixture
def teacher(db):
    return User.objects.create_user(
        username="teacher", email="teacher@test.com",
        password="Pass123!", is_active=True, email_verified=True,
        role=User.Role.TEACHER,
    )


@pytest.fixture
def admin(db):
    return User.objects.create_user(
        username="admin_user", email="admin@test.com",
        password="Pass123!", is_active=True, email_verified=True,
        role=User.Role.ADMIN,
    )


# ── API Clients ────────────────────────────────────────────────────────────

def _make_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def student_client(student):
    return _make_client(student)


@pytest.fixture
def teacher_client(teacher):
    return _make_client(teacher)


@pytest.fixture
def admin_client(admin):
    return _make_client(admin)


# ── Words ──────────────────────────────────────────────────────────────────

@pytest.fixture
def word(db, teacher):
    return Word.objects.create(
        text="enigma",
        phonetic="/ɪˈnɪɡmə/",
        part_of_speech="noun",
        definition_en="Something mysterious",
        definition_vi="Điều bí ẩn",
        example_en="The case remains an enigma.",
        example_vi="Vụ án vẫn còn là một bí ẩn.",
        level=Word.Level.B2,
        created_by=teacher,
    )


@pytest.fixture
def word_b1(db, teacher):
    return Word.objects.create(
        text="abundant",
        part_of_speech="adj",
        definition_vi="Phong phú",
        level=Word.Level.B1,
        created_by=teacher,
    )


@pytest.fixture
def wordset(db, teacher, word, word_b1):
    ws = WordSet.objects.create(
        name="Test Set", description="A test wordset",
        level="B2", is_public=True, created_by=teacher,
    )
    WordSetWord.objects.create(wordset=ws, word=word, order_index=0)
    WordSetWord.objects.create(wordset=ws, word=word_b1, order_index=1)
    return ws


@pytest.fixture
def private_wordset(db, teacher):
    return WordSet.objects.create(
        name="Private Set", is_public=False, created_by=teacher,
    )


# ── CSV helpers ────────────────────────────────────────────────────────────

def make_csv(rows: list[dict]) -> io.BytesIO:
    """Tạo BytesIO CSV từ list of dicts."""
    import csv as _csv
    if not rows:
        f = io.BytesIO(b"text\n")
        f.name = "words.csv"
        return f
    buf = io.StringIO()
    writer = _csv.DictWriter(buf, fieldnames=rows[0].keys())
    writer.writeheader()
    writer.writerows(rows)
    f = io.BytesIO(buf.getvalue().encode("utf-8"))
    f.name = "words.csv"
    return f
