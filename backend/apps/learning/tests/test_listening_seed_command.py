import pytest
from django.core.management import call_command

from apps.learning.management.commands.seed_listening_demo import PASSAGES
from apps.learning.models import ListeningPassage, ListeningQuestion


pytestmark = pytest.mark.django_db


def test_seed_listening_demo_creates_ten_passages(teacher):
    call_command("seed_listening_demo", clear=True)

    assert ListeningPassage.objects.count() == len(PASSAGES)
    assert ListeningQuestion.objects.count() == sum(len(item["questions"]) for item in PASSAGES)
    assert ListeningPassage.objects.filter(is_published=True).count() == len(PASSAGES)
    assert ListeningPassage.objects.filter(created_by=teacher).count() == len(PASSAGES)


def test_seed_listening_demo_is_idempotent(teacher):
    call_command("seed_listening_demo", clear=True)
    call_command("seed_listening_demo")

    assert ListeningPassage.objects.count() == len(PASSAGES)
    assert ListeningQuestion.objects.count() == sum(len(item["questions"]) for item in PASSAGES)

    family = ListeningPassage.objects.get(title="Family Greeting")
    assert family.questions.count() == 3
