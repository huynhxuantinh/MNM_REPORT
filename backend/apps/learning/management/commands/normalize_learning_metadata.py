"""Normalize lesson metadata (topic/skill_tag/content_difficulty)."""
from django.core.management.base import BaseCommand

from apps.learning.models import Lesson


class Command(BaseCommand):
    help = "Normalize learning lesson metadata for phase 4C."

    def handle(self, *args, **options):
        updated = 0
        for lesson in Lesson.objects.all().prefetch_related("lesson_words__word"):
            patch = {}
            if not lesson.skill_tag:
                has_examples = any((lw.word.example_en or "").strip() for lw in lesson.lesson_words.all())
                patch["skill_tag"] = Lesson.SkillTag.LISTENING if has_examples else Lesson.SkillTag.VOCAB
            if not lesson.content_difficulty:
                level = (lesson.level or "").upper()
                if level in {"A1", "A2"}:
                    patch["content_difficulty"] = Lesson.ContentDifficulty.EASY
                elif level in {"B2", "C1", "C2", "TOEIC"}:
                    patch["content_difficulty"] = Lesson.ContentDifficulty.HARD
                else:
                    patch["content_difficulty"] = Lesson.ContentDifficulty.NORMAL
            if not lesson.topic:
                patch["topic"] = lesson.title[:100]
            if patch:
                for key, value in patch.items():
                    setattr(lesson, key, value)
                lesson.save(update_fields=[*patch.keys(), "updated_at"])
                updated += 1

        self.stdout.write(self.style.SUCCESS(f"Normalized metadata for {updated} lessons"))
