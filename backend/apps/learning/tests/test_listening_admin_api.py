import pytest

from apps.learning.models import ListeningPassage, ListeningQuestion


pytestmark = pytest.mark.django_db

PASSAGES_URL = "/api/v1/listening/admin/passages/"
PASSAGE_URL = lambda pid: f"/api/v1/listening/admin/passages/{pid}/"
QUESTIONS_URL = "/api/v1/listening/admin/questions/"
QUESTION_URL = lambda qid: f"/api/v1/listening/admin/questions/{qid}/"


@pytest.fixture
def passage(teacher):
    passage = ListeningPassage.objects.create(
        title="Morning Routine",
        topic="daily_life",
        level="A1",
        transcript="Tom wakes up at six and eats breakfast with his family.",
        translation_vi="Tom thuc day luc sau gio va an sang cung gia dinh.",
        estimated_seconds=35,
        created_by=teacher,
    )
    ListeningQuestion.objects.create(
        passage=passage,
        question_type=ListeningQuestion.QuestionType.MULTIPLE_CHOICE,
        prompt="What time does Tom wake up?",
        choices_json=["At five", "At six", "At seven"],
        correct_answer={"option": "At six"},
        order_index=1,
    )
    ListeningQuestion.objects.create(
        passage=passage,
        question_type=ListeningQuestion.QuestionType.TRUE_FALSE,
        prompt="Tom eats breakfast with his family.",
        choices_json=["True", "False"],
        correct_answer={"option": "True"},
        order_index=2,
    )
    return passage


class TestListeningAdminAPI:
    def test_admin_can_list_passages(self, tc, passage):
        response = tc.get(PASSAGES_URL)
        assert response.status_code == 200
        assert response.data["count"] == 1
        assert response.data["results"][0]["title"] == "Morning Routine"
        assert response.data["results"][0]["question_count"] == 2

    def test_admin_can_create_passage(self, tc):
        response = tc.post(
            PASSAGES_URL,
            {
                "title": "Bus Trip",
                "topic": "travel",
                "level": "A2",
                "transcript": "Mai takes a bus to the city center after class.",
                "translation_vi": "Mai di xe buyt vao trung tam thanh pho sau gio hoc.",
                "estimated_seconds": 40,
                "tts_lang": "en-US",
                "tts_rate": 0.9,
                "is_published": False,
            },
            format="json",
        )
        assert response.status_code == 201
        assert ListeningPassage.objects.filter(title="Bus Trip").exists()

    def test_admin_cannot_publish_without_three_questions(self, tc, passage):
        response = tc.patch(PASSAGE_URL(passage.id), {"is_published": True}, format="json")
        assert response.status_code == 400
        assert "is_published" in response.data

    def test_admin_can_manage_questions(self, tc, passage):
        create = tc.post(
            QUESTIONS_URL,
            {
                "passage": passage.id,
                "question_type": "fill_blank",
                "prompt": "Tom wakes up at ____.",
                "choices_json": [],
                "correct_answer": {"text": "six"},
                "explanation": "The passage says he wakes up at six.",
                "order_index": 3,
            },
            format="json",
        )
        assert create.status_code == 201
        question_id = create.data["id"]

        patch = tc.patch(
            QUESTION_URL(question_id),
            {"prompt": "Tom gets up at ____."},
            format="json",
        )
        assert patch.status_code == 200
        assert patch.data["prompt"] == "Tom gets up at ____."

        response = tc.get(QUESTIONS_URL, {"passage_id": passage.id})
        assert response.status_code == 200
        assert response.data["count"] == 3

        delete = tc.delete(QUESTION_URL(question_id))
        assert delete.status_code == 204
        assert not ListeningQuestion.objects.filter(id=question_id).exists()
