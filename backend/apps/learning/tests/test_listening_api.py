import pytest

from apps.learning.models import ListeningAnswer, ListeningPassage, ListeningQuestion, ListeningSession


pytestmark = pytest.mark.django_db

LIST_URL = "/api/v1/listening/passages/"
DETAIL_URL = lambda pid: f"/api/v1/listening/passages/{pid}/"
START_URL = "/api/v1/listening/session/start/"
SESSION_URL = lambda sid: f"/api/v1/listening/session/{sid}/"
ANSWER_URL = lambda sid: f"/api/v1/listening/session/{sid}/answer/"
FINISH_URL = lambda sid: f"/api/v1/listening/session/{sid}/finish/"


@pytest.fixture
def listening_passage(teacher):
    passage = ListeningPassage.objects.create(
        title="Family Greeting",
        topic="family",
        level="A1",
        transcript="Anna says hello to her mother and brother in the morning.",
        translation_vi="Anna chao me va anh trai vao buoi sang.",
        estimated_seconds=32,
        is_published=True,
        created_by=teacher,
    )
    ListeningQuestion.objects.create(
        passage=passage,
        question_type=ListeningQuestion.QuestionType.MULTIPLE_CHOICE,
        prompt="Who does Anna greet?",
        choices_json=["Her teacher", "Her mother and brother", "Her classmates", "Her doctor"],
        correct_answer={"option": "Her mother and brother"},
        explanation="The passage says Anna greets her mother and brother.",
        order_index=1,
    )
    ListeningQuestion.objects.create(
        passage=passage,
        question_type=ListeningQuestion.QuestionType.TRUE_FALSE,
        prompt="Anna greets them in the morning.",
        choices_json=["True", "False"],
        correct_answer={"option": "True"},
        explanation="The passage says it happens in the morning.",
        order_index=2,
    )
    return passage


class TestListeningAPI:
    def test_list_published_passages(self, sc, listening_passage, teacher):
        ListeningPassage.objects.create(
            title="Draft Passage",
            topic="school",
            level="A2",
            transcript="Draft only",
            is_published=False,
            created_by=teacher,
        )
        response = sc.get(LIST_URL)
        assert response.status_code == 200
        assert response.data["count"] == 1
        assert response.data["results"][0]["title"] == "Family Greeting"
        assert response.data["results"][0]["question_count"] == 2

    def test_passage_detail_returns_questions(self, sc, listening_passage):
        response = sc.get(DETAIL_URL(listening_passage.id))
        assert response.status_code == 200
        assert response.data["title"] == "Family Greeting"
        assert len(response.data["questions"]) == 2
        assert "correct_answer" not in response.data["questions"][0]

    def test_start_session(self, sc, listening_passage):
        response = sc.post(START_URL, {"passage_id": listening_passage.id}, format="json")
        assert response.status_code == 201
        assert response.data["status"] == "started"
        assert response.data["passage"]["title"] == "Family Greeting"
        assert ListeningSession.objects.filter(id=response.data["id"]).exists()

    def test_submit_answer_updates_score(self, sc, listening_passage):
        start = sc.post(START_URL, {"passage_id": listening_passage.id}, format="json")
        session_id = start.data["id"]
        question = listening_passage.questions.order_by("order_index").first()

        response = sc.post(
            ANSWER_URL(session_id),
            {"question_id": question.id, "submitted_answer": {"option": "Her mother and brother"}},
            format="json",
        )
        assert response.status_code == 200
        assert response.data["feedback"]["is_correct"] is True
        assert response.data["session"]["score"] == 1
        assert ListeningAnswer.objects.filter(session_id=session_id, question=question, is_correct=True).exists()

    def test_finish_session_returns_summary(self, sc, student, listening_passage):
        user = student
        xp_before = user.xp
        start = sc.post(START_URL, {"passage_id": listening_passage.id}, format="json")
        session_id = start.data["id"]
        for question in listening_passage.questions.order_by("order_index"):
            payload = {"question_id": question.id, "submitted_answer": question.correct_answer}
            sc.post(ANSWER_URL(session_id), payload, format="json")

        finish = sc.post(FINISH_URL(session_id))
        assert finish.status_code == 200
        assert finish.data["status"] == "completed"
        assert finish.data["summary"]["total_questions"] == 2
        assert finish.data["summary"]["correct_answers"] == 2
        assert finish.data["score_pct"] == 100.0
        assert finish.data["summary"]["xp_earned"] == 8
        user.refresh_from_db()
        assert user.xp == xp_before + 8
