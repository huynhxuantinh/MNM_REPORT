"""
Tests cho WordSet API:
  CRUD, filter, add/remove words, permissions.

Chạy: pytest apps/vocabulary/tests/test_wordset.py -v
"""
import pytest
from rest_framework import status

from apps.vocabulary.models import WordSet, WordSetWord

SETS_URL = "/api/v1/vocabulary/sets/"


# ══════════════════════════════════════════════════════════════════════════════
#  LIST & FILTER
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.django_db
class TestWordSetList:
    def test_student_sees_public_sets(self, student_client, wordset):
        r = student_client.get(SETS_URL)
        assert r.status_code == status.HTTP_200_OK
        assert r.data["count"] >= 1

    def test_student_cannot_see_private_sets_of_others(
        self, student_client, private_wordset
    ):
        r = student_client.get(SETS_URL)
        ids = [s["id"] for s in r.data["results"]]
        assert private_wordset.id not in ids

    def test_teacher_sees_all_own_sets(self, teacher_client, private_wordset):
        r = teacher_client.get(SETS_URL)
        ids = [s["id"] for s in r.data["results"]]
        assert private_wordset.id in ids

    def test_filter_by_is_public_true(self, student_client, wordset, private_wordset):
        r = student_client.get(SETS_URL, {"is_public": "true"})
        for item in r.data["results"]:
            assert item["is_public"] is True

    def test_filter_by_level(self, student_client, wordset):
        r = student_client.get(SETS_URL, {"level": "B2"})
        assert any(s["id"] == wordset.id for s in r.data["results"])

    def test_search_by_name(self, student_client, wordset):
        r = student_client.get(SETS_URL, {"search": "Test Set"})
        assert r.data["count"] >= 1

    def test_includes_word_count(self, student_client, wordset):
        r = student_client.get(SETS_URL)
        item = next(s for s in r.data["results"] if s["id"] == wordset.id)
        assert item["word_count"] == 2

    def test_unauthenticated_returns_401(self):
        from rest_framework.test import APIClient
        r = APIClient().get(SETS_URL)
        assert r.status_code == status.HTTP_401_UNAUTHORIZED


# ══════════════════════════════════════════════════════════════════════════════
#  RETRIEVE
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.django_db
class TestWordSetRetrieve:
    def test_detail_includes_words(self, student_client, wordset):
        r = student_client.get(f"{SETS_URL}{wordset.id}/")
        assert r.status_code == status.HTTP_200_OK
        assert "words" in r.data
        assert len(r.data["words"]) == 2

    def test_words_ordered_by_order_index(self, student_client, wordset):
        r = student_client.get(f"{SETS_URL}{wordset.id}/")
        indices = [w["order_index"] for w in r.data["words"]]
        assert indices == sorted(indices)

    def test_nonexistent_set_returns_404(self, student_client):
        r = student_client.get(f"{SETS_URL}9999/")
        assert r.status_code == status.HTTP_404_NOT_FOUND

    def test_student_cannot_access_private_set_of_others(
        self, student_client, private_wordset
    ):
        r = student_client.get(f"{SETS_URL}{private_wordset.id}/")
        assert r.status_code == status.HTTP_404_NOT_FOUND


# ══════════════════════════════════════════════════════════════════════════════
#  CREATE
# ══════════════════════════════════════════════════════════════════════════════

VALID_SET_DATA = {
    "name": "New WordSet",
    "description": "Mô tả bộ từ",
    "level": "B1",
    "is_public": True,
}


@pytest.mark.django_db
class TestWordSetCreate:
    def test_teacher_can_create(self, teacher_client):
        r = teacher_client.post(SETS_URL, VALID_SET_DATA)
        assert r.status_code == status.HTTP_201_CREATED
        assert r.data["name"] == "New WordSet"

    def test_admin_can_create(self, admin_client):
        r = admin_client.post(SETS_URL, VALID_SET_DATA)
        assert r.status_code == status.HTTP_201_CREATED

    def test_student_cannot_create(self, student_client):
        r = student_client.post(SETS_URL, VALID_SET_DATA)
        assert r.status_code == status.HTTP_403_FORBIDDEN

    def test_created_by_set_to_teacher(self, teacher_client, teacher):
        r = teacher_client.post(SETS_URL, VALID_SET_DATA)
        assert r.data["created_by"] == teacher.id

    def test_missing_name_returns_400(self, teacher_client):
        r = teacher_client.post(SETS_URL, {"description": "no name"})
        assert r.status_code == status.HTTP_400_BAD_REQUEST


# ══════════════════════════════════════════════════════════════════════════════
#  UPDATE
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.django_db
class TestWordSetUpdate:
    def test_owner_can_update(self, teacher_client, wordset):
        r = teacher_client.patch(f"{SETS_URL}{wordset.id}/", {"name": "Updated Name"})
        assert r.status_code == status.HTTP_200_OK
        wordset.refresh_from_db()
        assert wordset.name == "Updated Name"

    def test_admin_can_update_any(self, admin_client, wordset):
        r = admin_client.patch(f"{SETS_URL}{wordset.id}/", {"name": "Admin Updated"})
        assert r.status_code == status.HTTP_200_OK

    def test_student_cannot_update(self, student_client, wordset):
        r = student_client.patch(f"{SETS_URL}{wordset.id}/", {"name": "Hack"})
        assert r.status_code == status.HTTP_403_FORBIDDEN

    def test_can_toggle_public_private(self, teacher_client, wordset):
        r = teacher_client.patch(f"{SETS_URL}{wordset.id}/", {"is_public": False})
        assert r.status_code == status.HTTP_200_OK
        wordset.refresh_from_db()
        assert wordset.is_public is False


# ══════════════════════════════════════════════════════════════════════════════
#  DELETE
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.django_db
class TestWordSetDelete:
    def test_owner_can_delete(self, teacher_client, wordset):
        r = teacher_client.delete(f"{SETS_URL}{wordset.id}/")
        assert r.status_code == status.HTTP_204_NO_CONTENT
        assert not WordSet.objects.filter(id=wordset.id).exists()

    def test_admin_can_delete_any(self, admin_client, wordset):
        r = admin_client.delete(f"{SETS_URL}{wordset.id}/")
        assert r.status_code == status.HTTP_204_NO_CONTENT

    def test_student_cannot_delete(self, student_client, wordset):
        r = student_client.delete(f"{SETS_URL}{wordset.id}/")
        assert r.status_code == status.HTTP_403_FORBIDDEN


# ══════════════════════════════════════════════════════════════════════════════
#  THÊM TỪ VÀO BỘ
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.django_db
class TestAddWordToSet:
    def test_add_word_success(self, teacher_client, teacher, wordset, db):
        from apps.vocabulary.models import Word
        new_word = Word.objects.create(text="novel", level="B1", created_by=teacher)
        r = teacher_client.post(
            f"{SETS_URL}{wordset.id}/words/",
            {"word_id": new_word.id, "order_index": 5},
        )
        assert r.status_code == status.HTTP_201_CREATED
        assert WordSetWord.objects.filter(wordset=wordset, word=new_word).exists()

    def test_add_duplicate_word_returns_409(self, teacher_client, wordset, word):
        r = teacher_client.post(
            f"{SETS_URL}{wordset.id}/words/",
            {"word_id": word.id, "order_index": 0},
        )
        assert r.status_code == status.HTTP_409_CONFLICT

    def test_add_nonexistent_word_returns_400(self, teacher_client, wordset):
        r = teacher_client.post(
            f"{SETS_URL}{wordset.id}/words/",
            {"word_id": 9999},
        )
        assert r.status_code == status.HTTP_400_BAD_REQUEST

    def test_student_cannot_add_word(self, student_client, wordset, word_b1):
        r = student_client.post(
            f"{SETS_URL}{wordset.id}/words/",
            {"word_id": word_b1.id},
        )
        assert r.status_code == status.HTTP_403_FORBIDDEN


# ══════════════════════════════════════════════════════════════════════════════
#  GỠ TỪ KHỎI BỘ
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.django_db
class TestRemoveWordFromSet:
    def test_remove_word_success(self, teacher_client, wordset, word):
        r = teacher_client.delete(f"{SETS_URL}{wordset.id}/words/{word.id}/")
        assert r.status_code == status.HTTP_204_NO_CONTENT
        assert not WordSetWord.objects.filter(wordset=wordset, word=word).exists()

    def test_remove_nonexistent_word_returns_404(self, teacher_client, wordset):
        r = teacher_client.delete(f"{SETS_URL}{wordset.id}/words/9999/")
        assert r.status_code == status.HTTP_404_NOT_FOUND

    def test_student_cannot_remove_word(self, student_client, wordset, word):
        r = student_client.delete(f"{SETS_URL}{wordset.id}/words/{word.id}/")
        assert r.status_code == status.HTTP_403_FORBIDDEN

    def test_set_word_count_decreases_after_remove(self, teacher_client, wordset, word):
        count_before = WordSetWord.objects.filter(wordset=wordset).count()
        teacher_client.delete(f"{SETS_URL}{wordset.id}/words/{word.id}/")
        assert WordSetWord.objects.filter(wordset=wordset).count() == count_before - 1


@pytest.mark.django_db
class TestWordSetImportCsv:
    IMPORT_URL = f"{SETS_URL}import/"

    def test_teacher_can_import_wordset_csv(self, teacher_client):
        from .conftest import make_csv

        csv_file = make_csv(
            [
                {"text": "zeal", "definition_vi": "Nhiệt huyết", "level": "B2"},
                {"text": "calm", "definition_vi": "Bình tĩnh", "level": "A2"},
            ]
        )
        response = teacher_client.post(
            self.IMPORT_URL,
            {
                "name": "Imported Set",
                "description": "from csv",
                "level": "B1",
                "is_public": True,
                "file": csv_file,
            },
            format="multipart",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["imported"] == 2
        ws = WordSet.objects.get(id=response.data["id"])
        assert ws.wordset_words.count() == 2

    def test_import_csv_collects_row_errors(self, teacher_client):
        from .conftest import make_csv

        csv_file = make_csv(
            [
                {"text": "valid", "definition_vi": "Hợp lệ", "level": "A1"},
                {"text": "", "definition_vi": "Thiếu text", "level": "A1"},
                {"text": "wrong-level", "definition_vi": "Sai level", "level": "ZZ"},
            ]
        )
        response = teacher_client.post(
            self.IMPORT_URL,
            {"name": "Set with errors", "file": csv_file},
            format="multipart",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["imported"] == 1
        assert len(response.data["errors"]) == 2

    def test_student_cannot_import_wordset_csv(self, student_client):
        from .conftest import make_csv

        csv_file = make_csv([{"text": "apple", "level": "A1"}])
        response = student_client.post(
            self.IMPORT_URL,
            {"name": "Denied", "file": csv_file},
            format="multipart",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
