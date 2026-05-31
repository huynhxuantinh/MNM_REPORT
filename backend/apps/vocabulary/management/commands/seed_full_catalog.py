"""
Seed full catalog for local development.
Run:
  python manage.py seed_full_catalog
  python manage.py seed_full_catalog --clear
"""

from __future__ import annotations

import csv
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.learning.models import Lesson, LessonWord
from apps.vocabulary.models import Word, WordSet, WordSetWord

User = get_user_model()

VALID_LEVELS = {"A1", "A2", "B1", "B2", "C1", "C2", "TOEIC", "IELTS"}
CSV_HEADERS = [
    "text",
    "phonetic",
    "part_of_speech",
    "definition_en",
    "definition_vi",
    "example_en",
    "example_vi",
    "level",
]

WORDSETS = [
    {"name": "A1 - Can ban", "description": "Tu vung can ban cho nguoi moi hoc.", "level": "A1"},
    {"name": "A2 - So cap", "description": "Tu vung giao tiep hang ngay.", "level": "A2"},
    {"name": "B1 - Trung cap", "description": "Mo rong von tu va dien dat.", "level": "B1"},
    {"name": "B2 - Trung cap cao", "description": "Tu vung hoc thuat va phan tich.", "level": "B2"},
    {"name": "TOEIC - Cong so", "description": "Tu vung thuong gap trong moi truong cong so.", "level": "TOEIC"},
    {"name": "C1 - Nang cao", "description": "Tu vung nang cao cho hoc vien da vung.", "level": "C1"},
]

LESSONS = [
    {
        "title": "Bai 1 - Chao hoi co ban",
        "description": "Tu vung chao hoi va gioi thieu.",
        "level": "A1",
        "order_index": 1,
        "words": ["hello", "goodbye", "friend", "family", "school", "yes", "no"],
    },
    {
        "title": "Bai 2 - Cuoc song hang ngay",
        "description": "Tu vung sinh hoat hang ngay.",
        "level": "A1",
        "order_index": 2,
        "words": ["eat", "sleep", "house", "water", "book", "open", "close"],
    },
    {
        "title": "Bai 3 - Di lai va phuong tien",
        "description": "Tu vung ve di chuyen co ban.",
        "level": "A2",
        "order_index": 3,
        "words": ["travel", "bus", "car", "ticket", "airport", "city", "country"],
    },
    {
        "title": "Bai 4 - Giao tiep va cong viec",
        "description": "Tu vung hay dung trong hoc tap va cong viec.",
        "level": "B1",
        "order_index": 4,
        "words": ["communicate", "decision", "information", "develop", "improve", "experience"],
    },
    {
        "title": "Bai 5 - Kinh doanh TOEIC",
        "description": "Cum tu cong so can biet.",
        "level": "TOEIC",
        "order_index": 5,
        "words": ["invoice", "contract", "client", "supplier", "profit", "budget", "deadline"],
    },
]


def _csv_path() -> Path:
    return Path(__file__).resolve().parents[5] / "data" / "words.csv"


def _norm(value: str) -> str:
    return (value or "").strip()


class Command(BaseCommand):
    help = "Seed full catalog from backend/data/words.csv (development only)"

    def add_arguments(self, parser):
        parser.add_argument("--clear", action="store_true", help="Xoa du lieu cu truoc khi seed")

    def handle(self, *args, **options):
        if options["clear"]:
            self._clear_data()

        with transaction.atomic():
            admin = self._seed_users()
            words = self._seed_words(admin)
            self._seed_wordsets(admin, words)
            self._seed_lessons(admin, words)

        self.stdout.write(
            self.style.SUCCESS(
                "\nSeed hoan tat!"
                "\n  Admin:   admin@norostu.com / Admin@123456"
                "\n  Student: student@norostu.com / Student@123456"
                f"\n  Tu vung: {Word.objects.count()}"
                f"\n  Bo tu:   {WordSet.objects.count()}"
                f"\n  Bai hoc: {Lesson.objects.count()}"
            )
        )

    def _clear_data(self):
        self.stdout.write("Dang xoa du lieu cu...")
        WordSetWord.objects.all().delete()
        LessonWord.objects.all().delete()
        WordSet.objects.all().delete()
        Lesson.objects.all().delete()
        Word.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()
        self.stdout.write(self.style.WARNING("Da xoa du lieu cu."))

    def _seed_users(self):
        self.stdout.write("Dang tao users...")
        users = [
            {
                "email": "admin@norostu.com",
                "username": "admin",
                "full_name": "Quan tri vien",
                "password": "Admin@123456",
                "role": "admin",
                "is_staff": True,
                "is_superuser": True,
            },
            {
                "email": "student@norostu.com",
                "username": "student",
                "full_name": "Hoc sinh Nam",
                "password": "Student@123456",
                "role": "user",
                "is_staff": False,
                "is_superuser": False,
            },
        ]

        admin = None
        for data in users:
            user, created = User.objects.get_or_create(
                email=data["email"],
                defaults={
                    "username": data["username"],
                    "full_name": data["full_name"],
                    "role": data["role"],
                    "is_active": True,
                    "email_verified": True,
                    "is_staff": data["is_staff"],
                    "is_superuser": data["is_superuser"],
                },
            )
            if created:
                user.set_password(data["password"])
                user.save(update_fields=["password"])
                self.stdout.write(f"  + Tao user: {user.email}")
            if data["role"] == "admin":
                admin = user
        return admin

    def _seed_words(self, admin):
        self.stdout.write("Dang tao tu vung tu words.csv...")
        csv_file = _csv_path()
        if not csv_file.exists():
            raise FileNotFoundError(f"Khong tim thay file du lieu: {csv_file}")

        word_map = {}
        created_count = 0
        with csv_file.open("r", encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f)
            missing_headers = [h for h in CSV_HEADERS if h not in (reader.fieldnames or [])]
            if missing_headers:
                raise ValueError(f"words.csv thieu cot: {missing_headers}")

            for row in reader:
                text = _norm(row.get("text")).lower()
                if not text:
                    continue
                level = _norm(row.get("level")).upper()
                if level not in VALID_LEVELS:
                    continue

                payload = {
                    "phonetic": _norm(row.get("phonetic")),
                    "part_of_speech": _norm(row.get("part_of_speech")),
                    "definition_en": _norm(row.get("definition_en")),
                    "definition_vi": _norm(row.get("definition_vi")),
                    "example_en": _norm(row.get("example_en")),
                    "example_vi": _norm(row.get("example_vi")),
                    "level": level,
                    "created_by": admin,
                }
                word, created = Word.objects.get_or_create(text=text, defaults=payload)
                if created:
                    created_count += 1
                word_map[text] = word

        self.stdout.write(f"  + Tao moi {created_count} tu")
        return word_map

    def _seed_wordsets(self, admin, word_map):
        self.stdout.write("Dang tao bo tu...")
        for spec in WORDSETS:
            ws, _ = WordSet.objects.get_or_create(
                name=spec["name"],
                defaults={
                    "description": spec["description"],
                    "level": spec["level"],
                    "created_by": admin,
                    "is_public": True,
                },
            )

            level_words = [
                word for word in word_map.values() if (word.level or "").upper() == spec["level"]
            ][:40]
            for idx, word in enumerate(level_words):
                WordSetWord.objects.get_or_create(
                    wordset=ws,
                    word=word,
                    defaults={"order_index": idx},
                )

    def _seed_lessons(self, admin, word_map):
        self.stdout.write("Dang tao bai hoc...")
        for spec in LESSONS:
            lesson, _ = Lesson.objects.get_or_create(
                title=spec["title"],
                defaults={
                    "description": spec["description"],
                    "level": spec["level"],
                    "order_index": spec["order_index"],
                    "is_published": True,
                    "created_by": admin,
                },
            )
            for idx, text in enumerate(spec["words"]):
                word = word_map.get(text.lower())
                if not word:
                    continue
                LessonWord.objects.get_or_create(
                    lesson=lesson,
                    word=word,
                    defaults={"order_index": idx},
                )
