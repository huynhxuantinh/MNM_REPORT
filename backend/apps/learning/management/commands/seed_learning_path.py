"""Seed learning path data for Duolingo-like phase 1 flow."""
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.learning.models import Course, Lesson, Unit, UnitLesson


class Command(BaseCommand):
    help = "Seed Course/Unit/UnitLesson for learning path (phase 1)"

    def handle(self, *args, **kwargs):
        lessons = list(
            Lesson.objects.filter(is_published=True).order_by("order_index", "id")
        )
        if not lessons:
            self.stdout.write(self.style.ERROR("No published lessons found. Seed lessons first."))
            return

        with transaction.atomic():
            course, _ = Course.objects.get_or_create(
                slug="english-foundation-a1a2",
                defaults={
                    "name": "English Foundation A1-A2",
                    "description": "Duolingo-style pilot path for A1-A2 learners.",
                    "is_active": True,
                },
            )

            unit1, _ = Unit.objects.get_or_create(
                course=course,
                order_index=1,
                defaults={
                    "title": "Unit 1 - Basics",
                    "description": "Greeting, daily life, and simple objects.",
                    "required_lessons_to_unlock": 2,
                    "is_published": True,
                },
            )
            unit2, _ = Unit.objects.get_or_create(
                course=course,
                order_index=2,
                defaults={
                    "title": "Unit 2 - Daily Routines",
                    "description": "Communication and everyday activities.",
                    "required_lessons_to_unlock": 2,
                    "is_published": True,
                },
            )

            first_unit_lessons = lessons[:3]
            second_unit_lessons = lessons[3:6] if len(lessons) >= 6 else lessons[3:]

            for index, lesson in enumerate(first_unit_lessons, start=1):
                UnitLesson.objects.get_or_create(
                    unit=unit1,
                    lesson=lesson,
                    defaults={"order_index": index},
                )

            for index, lesson in enumerate(second_unit_lessons, start=1):
                UnitLesson.objects.get_or_create(
                    unit=unit2,
                    lesson=lesson,
                    defaults={"order_index": index},
                )

        self.stdout.write(self.style.SUCCESS("Seeded learning path successfully."))
