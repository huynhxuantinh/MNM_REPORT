import pytest
from django.db import IntegrityError, transaction

from apps.learning.models import (
    ListeningAnswer,
    ListeningPassage,
    ListeningQuestion,
    ListeningSession,
)


pytestmark = pytest.mark.django_db


@pytest.fixture
def listening_passage(teacher):
    return ListeningPassage.objects.create(
        title="Morning Routine",
        topic="daily_life",
        level="A1",
        transcript="Anna gets up at six and takes a bus to school.",
        translation_vi="Anna thuc day luc sau gio va di xe buyt den truong.",
        estimated_seconds=35,
        tts_lang="en-US",
        tts_rate=0.9,
        is_published=True,
        created_by=teacher,
    )


@pytest.fixture
def listening_question(listening_passage):
    return ListeningQuestion.objects.create(
        passage=listening_passage,
        question_type=ListeningQuestion.QuestionType.MULTIPLE_CHOICE,
        prompt="What time does Anna get up?",
        choices_json=["At five", "At six", "At seven", "At eight"],
        correct_answer={"option": "At six"},
        explanation="The passage says Anna gets up at six.",
        order_index=1,
    )


def test_create_listening_passage_defaults(listening_passage):
    assert listening_passage.level == "A1"
    assert listening_passage.estimated_seconds == 35
    assert listening_passage.tts_lang == "en-US"
    assert listening_passage.is_published is True


def test_question_belongs_to_passage(listening_passage, listening_question):
    assert listening_question.passage == listening_passage
    assert listening_passage.questions.count() == 1
    assert listening_passage.questions.first().prompt == "What time does Anna get up?"


def test_question_order_must_be_unique_per_passage(listening_passage, listening_question):
    with pytest.raises(IntegrityError):
        with transaction.atomic():
            ListeningQuestion.objects.create(
                passage=listening_passage,
                question_type=ListeningQuestion.QuestionType.TRUE_FALSE,
                prompt="Anna goes to school by bus.",
                choices_json=["True", "False"],
                correct_answer={"option": "True"},
                order_index=1,
            )


def test_listening_session_and_answer_relationship(student, listening_passage, listening_question):
    session = ListeningSession.objects.create(
        user=student,
        passage=listening_passage,
        status=ListeningSession.Status.STARTED,
    )
    answer = ListeningAnswer.objects.create(
        session=session,
        question=listening_question,
        submitted_answer={"option": "At six"},
        is_correct=True,
    )

    assert session.answers.count() == 1
    assert session.answers.first() == answer
    assert answer.question == listening_question
    assert answer.is_correct is True


def test_answer_must_be_unique_per_question_in_session(student, listening_passage, listening_question):
    session = ListeningSession.objects.create(user=student, passage=listening_passage)
    ListeningAnswer.objects.create(
        session=session,
        question=listening_question,
        submitted_answer={"option": "At six"},
        is_correct=True,
    )

    with pytest.raises(IntegrityError):
        with transaction.atomic():
            ListeningAnswer.objects.create(
                session=session,
                question=listening_question,
                submitted_answer={"option": "At five"},
                is_correct=False,
            )
