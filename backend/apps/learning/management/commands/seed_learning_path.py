"""Seed deterministic learning path data for the self-learning flow."""
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.learning.models import Course, Lesson, Unit, UnitLesson


COURSE_SLUG = "english-foundation-a1a2"
COURSE_DEFAULTS = {
    "name": "English Foundation A1-A2",
    "description": "Duolingo-style pilot path for A1-A2 learners.",
    "is_active": True,
}


class Command(BaseCommand):
    help = "Seed Course/Unit/UnitLesson for learning path (phase 1)"

    def handle(self, *args, **kwargs):
        lessons = list(
            Lesson.objects.filter(is_published=True).order_by("order_index", "id")
        )
        if not lessons:
            self.stdout.write(
                self.style.ERROR("No published lessons found. Seed lessons first.")
            )
            return

        unit_specs = [
            {
                "order_index": 1,
                "title": "Unit 1 - Basics",
                "description": "Greeting, daily life, and simple objects.",
                "required_lessons_to_unlock": 2,
                "is_published": True,
                "lessons": lessons[:3],
            },
            {
                "order_index": 2,
                "title": "Unit 2 - Daily Routines",
                "description": "Communication and everyday activities.",
                "required_lessons_to_unlock": 2,
                "is_published": True,
                "lessons": lessons[3:6] if len(lessons) >= 6 else lessons[3:],
            },
        ]

        with transaction.atomic():
            course, _ = Course.objects.update_or_create(
                slug=COURSE_SLUG,
                defaults=COURSE_DEFAULTS,
            )

            units = []
            for spec in unit_specs:
                unit, _ = Unit.objects.update_or_create(
                    course=course,
                    order_index=spec["order_index"],
                    defaults={
                        "title": spec["title"],
                        "description": spec["description"],
                        "required_lessons_to_unlock": spec["required_lessons_to_unlock"],
                        "is_published": spec["is_published"],
                    },
                )
                units.append((unit, spec["lessons"]))

            UnitLesson.objects.filter(unit__course=course).delete()

            created_links = 0
            for unit, mapped_lessons in units:
                for index, lesson in enumerate(mapped_lessons, start=1):
                    UnitLesson.objects.create(
                        unit=unit,
                        lesson=lesson,
                        order_index=index,
                    )
                    created_links += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded learning path successfully. Units: {len(units)}, links: {created_links}"
            )
        )
