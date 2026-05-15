import pytest
from django.core.cache import cache

from apps.vocabulary.models import Word
from apps.learning.models import PlacementResult

pytestmark = pytest.mark.django_db

STATUS_URL = "/api/v1/learning/placement/status/"
QUESTIONS_URL = "/api/v1/learning/placement/questions/"
SUBMIT_URL = "/api/v1/learning/placement/submit/"


def _seed_words(teacher, total=10):
    levels = ["A1", "A2", "B1", "B2", "C1"]
    for idx in range(total):
        Word.objects.create(
            text=f"placement_word_{idx}",
            level=levels[idx % len(levels)],
            definition_vi=f"nghia_{idx}",
            created_by=teacher,
        )


def test_placement_questions_returns_safe_payload(sc, teacher):
    _seed_words(teacher, total=8)
    response = sc.get(QUESTIONS_URL)
    assert response.status_code == 200
    assert response.data["count"] >= 6
    assert len(response.data["questions"]) == response.data["count"]
    first = response.data["questions"][0]
    assert "correct_option" not in first
    assert {"question_id", "word_id", "word_text", "prompt", "choices"} <= set(first.keys())


def test_placement_submit_creates_result_and_status_completed(sc, student, teacher):
    _seed_words(teacher, total=10)
    questions_resp = sc.get(QUESTIONS_URL)
    assert questions_resp.status_code == 200

    cached = cache.get(f"placement_q:u{student.id}")
    assert cached
    answers = [
        {"question_id": item["question_id"], "option": item["correct_option"]}
        for item in cached
    ]
    submit = sc.post(SUBMIT_URL, {"answers": answers}, format="json")
    assert submit.status_code == 200
    assert submit.data["result"]["recommended_level"]
    assert submit.data["result"]["total_questions"] == len(cached)
    assert submit.data["result"]["correct_answers"] == len(cached)
    assert PlacementResult.objects.filter(user=student).exists()

    status_resp = sc.get(STATUS_URL)
    assert status_resp.status_code == 200
    assert status_resp.data["has_completed_placement"] is True
    assert status_resp.data["should_show_onboarding"] is False


def test_placement_submit_requires_min_answers(sc, teacher):
    _seed_words(teacher, total=8)
    sc.get(QUESTIONS_URL)
    payload = {"answers": [{"question_id": 1, "option": "x"}]}
    response = sc.post(SUBMIT_URL, payload, format="json")
    assert response.status_code == 400
