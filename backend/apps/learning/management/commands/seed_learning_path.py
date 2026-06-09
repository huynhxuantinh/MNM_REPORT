"""Seed deterministic learning path data for the self-learning flow."""
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.learning.models import Course, Lesson, Unit, UnitLesson


PRIMARY_COURSE_SLUG = "english-foundation"
FALLBACK_COURSE_SLUG = "english-foundation-a1a2"
COURSE_DEFAULTS = {
    "name": "English Foundation A1-A2",
    "description": "Duolingo-style pilot path for A1-A2 learners.",
    "is_active": True,
}
LISTENING_UNIT_TITLE = "Unit 6 - Listening Lab"
CORE_UNIT_SPECS = [
    {
        "order_index": 1,
        "title": "Unit 1 - Basics",
        "description": "Greeting, daily life, and simple objects.",
        "required_lessons_to_unlock": 2,
        "is_published": True,
        "lesson_slice": (0, 3),
    },
    {
        "order_index": 2,
        "title": "Unit 2 - Daily Routines",
        "description": "Communication and everyday activities.",
        "required_lessons_to_unlock": 2,
        "is_published": True,
        "lesson_slice": (3, 6),
    },
]


class Command(BaseCommand):
    help = "Seed Course/Unit/UnitLesson for learning path (phase 1)"

    def _get_target_course(self):
        course = Course.objects.filter(slug=PRIMARY_COURSE_SLUG).first()
        if course:
            return course, False

        course = Course.objects.filter(slug=FALLBACK_COURSE_SLUG).first()
        if course:
            return course, False

        course = Course.objects.create(
            slug=FALLBACK_COURSE_SLUG,
            **COURSE_DEFAULTS,
        )
        return course, True

    def _sync_listening_unit(self, course, listening_lessons):
        existing_order = (
            course.units.exclude(title=LISTENING_UNIT_TITLE)
            .order_by("-order_index")
            .values_list("order_index", flat=True)
            .first()
            or 0
        )
        order_index = max(existing_order + 1, 1)
        listening_unit, _ = Unit.objects.update_or_create(
            course=course,
            title=LISTENING_UNIT_TITLE,
            defaults={
                "order_index": order_index,
                "description": "Short listening passages with browser TTS support.",
                "required_lessons_to_unlock": 0,
                "is_published": True,
            },
        )
        UnitLesson.objects.filter(unit=listening_unit).delete()
        for index, lesson in enumerate(listening_lessons[:10], start=1):
            UnitLesson.objects.create(
                unit=listening_unit,
                lesson=lesson,
                order_index=index,
            )
        return listening_unit, min(len(listening_lessons), 10)

    def handle(self, *args, **kwargs):
        lessons = list(
            Lesson.objects.filter(is_published=True).order_by("order_index", "id")
        )
        if not lessons:
            self.stdout.write(
                self.style.ERROR("No published lessons found. Seed lessons first.")
            )
            return

        core_lessons = [lesson for lesson in lessons if lesson.skill_tag != Lesson.SkillTag.LISTENING]
        listening_lessons = [lesson for lesson in lessons if lesson.skill_tag == Lesson.SkillTag.LISTENING]

        with transaction.atomic():
            course, created = self._get_target_course()
            course.is_active = True
            if not course.name:
                course.name = COURSE_DEFAULTS["name"]
            if not course.description:
                course.description = COURSE_DEFAULTS["description"]
            course.save(update_fields=["is_active", "name", "description"])
            if course.slug == PRIMARY_COURSE_SLUG:
                Course.objects.filter(slug=FALLBACK_COURSE_SLUG).exclude(id=course.id).update(is_active=False)

            created_links = 0

            # Always sync core units and their UnitLesson links.
            # This is idempotent: update_or_create the unit rows, then
            # delete + recreate UnitLesson links so stale FK references
            # (left after seed_full_catalog --clear deleted Lesson rows)
            # are always cleaned up.
            units = []
            for spec in CORE_UNIT_SPECS:
                start, end = spec["lesson_slice"]
                mapped_lessons = core_lessons[start:end]
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
                units.append((unit, mapped_lessons))

            # Wipe and recreate only the core-unit lesson links (not the listening unit)
            core_unit_ids = [u.id for u, _ in units]
            UnitLesson.objects.filter(unit_id__in=core_unit_ids).delete()
            for unit, mapped_lessons in units:
                for index, lesson in enumerate(mapped_lessons, start=1):
                    UnitLesson.objects.create(
                        unit=unit,
                        lesson=lesson,
                        order_index=index,
                    )
                    created_links += 1

            if listening_lessons:
                _, listening_links = self._sync_listening_unit(course, listening_lessons)
                created_links += listening_links

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded learning path successfully. Course: {course.slug}, links: {created_links}"
            )
        )
