import pytest

from apps.learning.models import ListeningAnswer, ListeningPassage, ListeningQuestion, ListeningSession


pytestmark = pytest.mark.django_db


def test_profile_stats_include_listening_metrics(sc, student, teacher):
    passage = ListeningPassage.objects.create(
        title="City Bus",
        topic="travel",
        level="A1",
        transcript="Lan takes the city bus to school every morning.",
        translation_vi="Lan di xe buyt den truong moi sang.",
        estimated_seconds=28,
        is_published=True,
        created_by=teacher,
    )
    question_one = ListeningQuestion.objects.create(
        passage=passage,
        question_type=ListeningQuestion.QuestionType.MULTIPLE_CHOICE,
        prompt="What does Lan take?",
        choices_json=["A bus", "A train", "A bike"],
        correct_answer={"option": "A bus"},
        order_index=1,
    )
    question_two = ListeningQuestion.objects.create(
        passage=passage,
        question_type=ListeningQuestion.QuestionType.TRUE_FALSE,
        prompt="Lan goes in the evening.",
        choices_json=["True", "False"],
        correct_answer={"option": "False"},
        order_index=2,
    )
    session = ListeningSession.objects.create(
        user=student,
        passage=passage,
        status=ListeningSession.Status.COMPLETED,
        score=1,
        score_pct=50,
    )
    ListeningAnswer.objects.create(
        session=session,
        question=question_one,
        submitted_answer={"option": "A bus"},
        is_correct=True,
    )
    ListeningAnswer.objects.create(
        session=session,
        question=question_two,
        submitted_answer={"option": "True"},
        is_correct=False,
    )

    response = sc.get("/api/v1/learning/profile/stats/")

    assert response.status_code == 200
    assert response.data["listening_sessions_completed"] == 1
    assert response.data["listening_questions_answered"] == 2
    assert response.data["listening_correct_answers"] == 1
    assert response.data["listening_accuracy_pct"] == 50
