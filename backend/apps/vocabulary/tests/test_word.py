"""
Tests cho Word API:
  CRUD, search, filter, pagination, CSV import, bookmark toggle, permissions.

Chạy: pytest apps/vocabulary/tests/test_word.py -v
"""
import pytest
from rest_framework import status

from apps.vocabulary.models import Bookmark, Word
from apps.vocabulary.tests.conftest import make_csv

WORDS_URL = "/api/v1/vocabulary/words/"
IMPORT_URL = "/api/v1/vocabulary/words/import/"


# ══════════════════════════════════════════════════════════════════════════════
#  LIST & FILTER
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.django_db
class TestWordList:
    def test_student_can_list(self, student_client, word):
        r = student_client.get(WORDS_URL)
        assert r.status_code == status.HTTP_200_OK

    def test_list_returns_paginated_results(self, student_client, word, word_b1):
        r = student_client.get(WORDS_URL)
        assert "results" in r.data
        assert r.data["count"] == 2

    def test_filter_by_level(self, student_client, word, word_b1):
        r = student_client.get(WORDS_URL, {"level": "B1"})
        assert r.data["count"] == 1
        assert r.data["results"][0]["text"] == "abundant"

    def test_filter_by_part_of_speech(self, student_client, word, word_b1):
        r = student_client.get(WORDS_URL, {"part_of_speech": "noun"})
        assert r.data["count"] == 1
        assert r.data["results"][0]["text"] == "enigma"

    def test_filter_by_set_id(self, student_client, wordset, word, word_b1):
        r = student_client.get(WORDS_URL, {"set_id": wordset.id})
        assert r.data["count"] == 2

    def test_search_by_text(self, student_client, word, word_b1):
        r = student_client.get(WORDS_URL, {"search": "enig"})
        assert r.data["count"] == 1
        assert r.data["results"][0]["text"] == "enigma"

    def test_search_by_definition_vi(self, student_client, word):
        r = student_client.get(WORDS_URL, {"search": "bí ẩn"})
        assert r.data["count"] == 1

    def test_search_by_example_en(self, student_client, word):
        r = student_client.get(WORDS_URL, {"search": "remains"})
        assert r.data["count"] == 1

    def test_unauthenticated_returns_401(self):
        from rest_framework.test import APIClient
        r = APIClient().get(WORDS_URL)
        assert r.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_does_not_expose_password(self, student_client, word):
        r = student_client.get(WORDS_URL)
        for item in r.data["results"]:
            assert "password" not in item


# ══════════════════════════════════════════════════════════════════════════════
#  RETRIEVE
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.django_db
class TestWordRetrieve:
    def test_returns_full_fields(self, student_client, word):
        r = student_client.get(f"{WORDS_URL}{word.id}/")
        assert r.status_code == status.HTTP_200_OK
        for field in ("text", "phonetic", "definition_en", "definition_vi", "example_en"):
            assert field in r.data

    def test_includes_is_bookmarked_false(self, student_client, word):
        r = student_client.get(f"{WORDS_URL}{word.id}/")
        assert r.data["is_bookmarked"] is False

    def test_includes_is_bookmarked_true(self, student_client, student, word):
        Bookmark.objects.create(user=student, word=word)
        r = student_client.get(f"{WORDS_URL}{word.id}/")
        assert r.data["is_bookmarked"] is True

    def test_nonexistent_word_returns_404(self, student_client):
        r = student_client.get(f"{WORDS_URL}9999/")
        assert r.status_code == status.HTTP_404_NOT_FOUND


# ══════════════════════════════════════════════════════════════════════════════
#  CREATE
# ══════════════════════════════════════════════════════════════════════════════

VALID_WORD_DATA = {
    "text": "serendipity",
    "phonetic": "/ˌserənˈdɪpɪti/",
    "part_of_speech": "noun",
    "definition_en": "The occurrence of finding something by chance",
    "definition_vi": "Sự tình cờ may mắn",
    "example_en": "It was pure serendipity.",
    "level": "C1",
}


@pytest.mark.django_db
class TestWordCreate:
    def test_teacher_can_create(self, teacher_client):
        r = teacher_client.post(WORDS_URL, VALID_WORD_DATA)
        assert r.status_code == status.HTTP_201_CREATED

    def test_admin_can_create(self, admin_client):
        r = admin_client.post(WORDS_URL, VALID_WORD_DATA)
        assert r.status_code == status.HTTP_201_CREATED

    def test_student_cannot_create(self, student_client):
        r = student_client.post(WORDS_URL, VALID_WORD_DATA)
        assert r.status_code == status.HTTP_403_FORBIDDEN

    def test_created_by_set_to_request_user(self, teacher_client, teacher):
        r = teacher_client.post(WORDS_URL, VALID_WORD_DATA)
        assert r.data["created_by"] == teacher.id

    def test_missing_text_returns_400(self, teacher_client):
        data = {k: v for k, v in VALID_WORD_DATA.items() if k != "text"}
        r = teacher_client.post(WORDS_URL, data)
        assert r.status_code == status.HTTP_400_BAD_REQUEST

    def test_invalid_level_returns_400(self, teacher_client):
        r = teacher_client.post(WORDS_URL, {**VALID_WORD_DATA, "level": "X9"})
        assert r.status_code == status.HTTP_400_BAD_REQUEST


# ══════════════════════════════════════════════════════════════════════════════
#  UPDATE
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.django_db
class TestWordUpdate:
    def test_owner_can_update(self, teacher_client, word):
        r = teacher_client.patch(f"{WORDS_URL}{word.id}/", {"definition_vi": "Bí ẩn mới"})
        assert r.status_code == status.HTTP_200_OK
        word.refresh_from_db()
        assert word.definition_vi == "Bí ẩn mới"

    def test_admin_can_update_any_word(self, admin_client, word):
        r = admin_client.patch(f"{WORDS_URL}{word.id}/", {"definition_vi": "Admin sửa"})
        assert r.status_code == status.HTTP_200_OK

    def test_student_cannot_update(self, student_client, word):
        r = student_client.patch(f"{WORDS_URL}{word.id}/", {"definition_vi": "x"})
        assert r.status_code == status.HTTP_403_FORBIDDEN

    def test_other_teacher_cannot_update(self, db, word):
        other = __import__("apps.accounts.models", fromlist=["User"]).User.objects.create_user(
            username="other_t", email="other@test.com", password="Pass123!",
            is_active=True, role="teacher",
        )
        from rest_framework.test import APIClient
        c = APIClient()
        c.force_authenticate(user=other)
        r = c.patch(f"{WORDS_URL}{word.id}/", {"definition_vi": "x"})
        assert r.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND)


# ══════════════════════════════════════════════════════════════════════════════
#  DELETE
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.django_db
class TestWordDelete:
    def test_owner_can_delete(self, teacher_client, word):
        r = teacher_client.delete(f"{WORDS_URL}{word.id}/")
        assert r.status_code == status.HTTP_204_NO_CONTENT
        assert not Word.objects.filter(id=word.id).exists()

    def test_admin_can_delete_any(self, admin_client, word):
        r = admin_client.delete(f"{WORDS_URL}{word.id}/")
        assert r.status_code == status.HTTP_204_NO_CONTENT

    def test_student_cannot_delete(self, student_client, word):
        r = student_client.delete(f"{WORDS_URL}{word.id}/")
        assert r.status_code == status.HTTP_403_FORBIDDEN


# ══════════════════════════════════════════════════════════════════════════════
#  BOOKMARK TOGGLE
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.django_db
class TestBookmarkToggle:
    def test_bookmark_adds_entry(self, student_client, student, word):
        r = student_client.post(f"{WORDS_URL}{word.id}/bookmark/")
        assert r.status_code == status.HTTP_201_CREATED
        assert r.data["bookmarked"] is True
        assert Bookmark.objects.filter(user=student, word=word).exists()

    def test_bookmark_again_removes_entry(self, student_client, student, word):
        Bookmark.objects.create(user=student, word=word)
        r = student_client.post(f"{WORDS_URL}{word.id}/bookmark/")
        assert r.status_code == status.HTTP_200_OK
        assert r.data["bookmarked"] is False
        assert not Bookmark.objects.filter(user=student, word=word).exists()

    def test_bookmark_gives_xp(self, student_client, student, word):
        xp_before = student.xp
        student_client.post(f"{WORDS_URL}{word.id}/bookmark/")
        student.refresh_from_db()
        assert student.xp == xp_before + 1

    def test_remove_bookmark_does_not_give_xp(self, student_client, student, word):
        Bookmark.objects.create(user=student, word=word)
        xp_before = student.xp
        student_client.post(f"{WORDS_URL}{word.id}/bookmark/")
        student.refresh_from_db()
        assert student.xp == xp_before

    def test_teacher_can_bookmark(self, teacher_client, word):
        r = teacher_client.post(f"{WORDS_URL}{word.id}/bookmark/")
        assert r.status_code == status.HTTP_201_CREATED

    def test_unauthenticated_cannot_bookmark(self, word):
        from rest_framework.test import APIClient
        r = APIClient().post(f"{WORDS_URL}{word.id}/bookmark/")
        assert r.status_code == status.HTTP_401_UNAUTHORIZED


# ══════════════════════════════════════════════════════════════════════════════
#  CSV IMPORT
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.django_db
class TestWordImport:
    def test_import_valid_csv(self, teacher_client):
        csv_file = make_csv([
            {"text": "apple", "level": "A1", "definition_vi": "Táo"},
            {"text": "banana", "level": "A1", "definition_vi": "Chuối"},
        ])
        r = teacher_client.post(
            IMPORT_URL, {"file": csv_file}, format="multipart"
        )
        assert r.status_code == status.HTTP_201_CREATED
        assert r.data["imported"] == 2
        assert r.data["errors"] == []
        assert Word.objects.filter(text="apple").exists()

    def test_import_skips_missing_text(self, teacher_client):
        csv_file = make_csv([
            {"text": "valid", "level": "A1"},
            {"text": "",      "level": "A1"},   # thiếu text
        ])
        r = teacher_client.post(IMPORT_URL, {"file": csv_file}, format="multipart")
        assert r.data["imported"] == 1
        assert len(r.data["errors"]) == 1
        assert r.data["errors"][0]["row"] == 3

    def test_import_skips_invalid_level(self, teacher_client):
        csv_file = make_csv([{"text": "test", "level": "X9"}])
        r = teacher_client.post(IMPORT_URL, {"file": csv_file}, format="multipart")
        assert r.data["imported"] == 0
        assert len(r.data["errors"]) == 1

    def test_import_handles_bom_encoding(self, teacher_client):
        """File CSV export từ Excel thường có BOM (\\ufeff)."""
        content = "﻿text,level\napple,A1\n".encode("utf-8-sig")
        import io
        csv_file = io.BytesIO(content)
        csv_file.name = "words.csv"
        r = teacher_client.post(IMPORT_URL, {"file": csv_file}, format="multipart")
        assert r.data["imported"] == 1

    def test_import_rejects_non_csv(self, teacher_client):
        import io
        f = io.BytesIO(b"not a csv")
        f.name = "words.txt"
        r = teacher_client.post(IMPORT_URL, {"file": f}, format="multipart")
        assert r.status_code == status.HTTP_400_BAD_REQUEST

    def test_import_rejects_large_file(self, teacher_client):
        import io
        f = io.BytesIO(b"x" * (6 * 1024 * 1024))
        f.name = "big.csv"
        r = teacher_client.post(IMPORT_URL, {"file": f}, format="multipart")
        assert r.status_code == status.HTTP_400_BAD_REQUEST

    def test_student_cannot_import(self, student_client):
        csv_file = make_csv([{"text": "apple", "level": "A1"}])
        r = student_client.post(IMPORT_URL, {"file": csv_file}, format="multipart")
        assert r.status_code == status.HTTP_403_FORBIDDEN

    def test_import_all_optional_fields(self, teacher_client):
        csv_file = make_csv([{
            "text": "meticulous",
            "phonetic": "/məˈtɪkjʊləs/",
            "part_of_speech": "adj",
            "definition_en": "Very careful",
            "definition_vi": "Tỉ mỉ",
            "example_en": "She is meticulous.",
            "example_vi": "Cô ấy rất tỉ mỉ.",
            "level": "C1",
            "image_url": "http://example.com/img.jpg",
        }])
        r = teacher_client.post(IMPORT_URL, {"file": csv_file}, format="multipart")
        assert r.data["imported"] == 1
        w = Word.objects.get(text="meticulous")
        assert w.phonetic == "/məˈtɪkjʊləs/"
        assert w.level == "C1"


# ══════════════════════════════════════════════════════════════════════════════
#  BOOKMARK LIST
# ══════════════════════════════════════════════════════════════════════════════

BOOKMARKS_URL = "/api/v1/vocabulary/bookmarks/"


@pytest.mark.django_db
class TestBookmarkList:
    def test_returns_only_own_bookmarks(self, student_client, student, word, word_b1, teacher):
        Bookmark.objects.create(user=student, word=word)
        # Bookmark của teacher không được trả về
        Bookmark.objects.create(user=teacher, word=word_b1)
        r = student_client.get(BOOKMARKS_URL)
        assert r.status_code == status.HTTP_200_OK
        assert r.data["count"] == 1
        assert r.data["results"][0]["word"]["text"] == "enigma"

    def test_returns_word_detail(self, student_client, student, word):
        Bookmark.objects.create(user=student, word=word)
        r = student_client.get(BOOKMARKS_URL)
        word_data = r.data["results"][0]["word"]
        assert "text" in word_data
        assert "definition_vi" in word_data

    def test_requires_auth(self):
        from rest_framework.test import APIClient
        r = APIClient().get(BOOKMARKS_URL)
        assert r.status_code == status.HTTP_401_UNAUTHORIZED

    def test_empty_list_for_new_user(self, student_client):
        r = student_client.get(BOOKMARKS_URL)
        assert r.data["count"] == 0
