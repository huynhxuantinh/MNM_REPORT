import pytest
from django.core.management import call_command

from apps.learning.exercise_engine import (
    evaluate_exercise_answer,
    generate_exercises_from_words,
    to_client_exercise,
)
from apps.learning.models import Lesson, LessonWord
from apps.vocabulary.models import Word

pytestmark = pytest.mark.django_db


def test_listening_exercise_generated_and_evaluated(teacher):
    w1 = Word.objects.create(
        text="apple",
        definition_vi="qua tao",
        example_en="I eat an apple every day.",
        level="A1",
        created_by=teacher,
    )
    w2 = Word.objects.create(
        text="banana",
        definition_vi="qua chuoi",
        example_en="This banana is yellow.",
        level="A1",
        created_by=teacher,
    )
    exercises = generate_exercises_from_words([w1, w2], max_questions=6, difficulty="normal")
    listen = next((item for item in exercises if item["exercise_type"] == "listen_choose_word"), None)
    assert listen is not None
    assert "audio_text" in to_client_exercise(listen)
    assert evaluate_exercise_answer(listen, {"option": listen["correct_option"]}) is True


def test_normalize_learning_metadata_command_updates_lesson(teacher):
    word = Word.objects.create(
        text="courage",
        definition_vi="long dung cam",
        example_en="She shows courage every day.",
        level="C1",
        created_by=teacher,
    )
    lesson = Lesson.objects.create(
        title="Advanced Speaking",
        description="",
        level="C1",
        skill_tag="",
        content_difficulty="",
        topic="",
        is_published=True,
        created_by=teacher,
    )
    LessonWord.objects.create(lesson=lesson, word=word, order_index=0)

    call_command("normalize_learning_metadata")
    lesson.refresh_from_db()

    assert lesson.topic == "Advanced Speaking"
    assert lesson.skill_tag == Lesson.SkillTag.LISTENING
    assert lesson.content_difficulty == Lesson.ContentDifficulty.HARD
