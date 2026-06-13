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
    {"name": "A1 - Căn bản", "description": "Từ vựng căn bản cho người mới học.", "level": "A1"},
    {"name": "A2 - Sơ cấp", "description": "Từ vựng giao tiếp hằng ngày.", "level": "A2"},
    {"name": "B1 - Trung cấp", "description": "Mở rộng vốn từ và diễn đạt.", "level": "B1"},
    {"name": "B2 - Trung cấp cao", "description": "Từ vựng học thuật và phân tích.", "level": "B2"},
    {"name": "TOEIC - Công sở", "description": "Từ vựng thường gặp trong môi trường công sở.", "level": "TOEIC"},
    {"name": "C1 - Nâng cao", "description": "Từ vựng nâng cao cho học viên đã vững.", "level": "C1"},
]

LESSONS = [
    {
        "title": "Bài 1 - Chào hỏi cơ bản",
        "description": "Từ vựng chào hỏi và giới thiệu.",
        "level": "A1",
        "order_index": 1,
        "words": ["name", "friend", "family", "school", "good", "happy"],
    },
    {
        "title": "Bài 2 - Cuộc sống hằng ngày",
        "description": "Từ vựng sinh hoạt hằng ngày.",
        "level": "A1",
        "order_index": 2,
        "words": ["eat", "sleep", "house", "water", "book", "open", "close"],
    },
    {
        "title": "Bài 3 - Đi lại và phương tiện",
        "description": "Từ vựng về di chuyển cơ bản.",
        "level": "A2",
        "order_index": 3,
        "words": ["travel", "bus", "car", "ticket", "airport", "city", "country"],
    },
    {
        "title": "Bài 4 - Giao tiếp và công việc",
        "description": "Từ vựng hay dùng trong học tập và công việc.",
        "level": "B1",
        "order_index": 4,
        "words": ["communicate", "decision", "information", "develop", "improve", "experience"],
    },
    {
        "title": "Bài 5 - Kinh doanh TOEIC",
        "description": "Cụm từ công sở cần biết.",
        "level": "TOEIC",
        "order_index": 5,
        "words": ["office", "project", "proposal", "budget", "deadline", "profit"],
    },
]

LISTENING_LESSONS = [
    {
        "title": "Listening 1 - Family Greeting",
        "description": "Doan nghe ngan ve gia dinh va ban be.",
        "level": "A1",
        "topic": "family",
        "order_index": 101,
        "estimated_seconds": 30,
        "transcript": "Hello, my name is Anna. My family is very kind, and my friend walks with me to school every day.",
        "translation_vi": "Xin chao, ten toi la Anna. Gia dinh toi rat tot bung, va nguoi ban cua toi di bo den truong cung toi moi ngay.",
        "words": ["name", "family", "friend", "school", "walk"],
    },
    {
        "title": "Listening 2 - In The House",
        "description": "Doan nghe ve do vat trong nha.",
        "level": "A1",
        "topic": "home",
        "order_index": 102,
        "estimated_seconds": 28,
        "transcript": "I walk into the house and open the door. A chair is next to the window, and my cat sleeps near it.",
        "translation_vi": "Toi di vao nha va mo canh cua. Mot cai ghe o canh cua so, va con meo cua toi ngu o gan do.",
        "words": ["house", "open", "door", "chair", "window", "sleep"],
    },
    {
        "title": "Listening 3 - Breakfast Time",
        "description": "Doan nghe ngan ve bua sang.",
        "level": "A1",
        "topic": "food",
        "order_index": 103,
        "estimated_seconds": 26,
        "transcript": "Every morning, I eat an apple and drink milk. Then I read a book before I go to class.",
        "translation_vi": "Moi buoi sang, toi an mot qua tao va uong sua. Sau do toi doc sach truoc khi den lop.",
        "words": ["eat", "apple", "milk", "book"],
    },
    {
        "title": "Listening 4 - Play Outside",
        "description": "Doan nghe ve hoat dong ngoai troi.",
        "level": "A1",
        "topic": "daily_life",
        "order_index": 104,
        "estimated_seconds": 29,
        "transcript": "The dog and the cat play in the yard. The children run, talk, and feel happy when they watch them.",
        "translation_vi": "Con cho va con meo choi trong san. Bọn tre chay, noi chuyen va cam thay vui ve khi nhin chung.",
        "words": ["dog", "cat", "play", "run", "talk", "happy"],
    },
    {
        "title": "Listening 5 - A Good Idea",
        "description": "Doan nghe ngan trong lop hoc.",
        "level": "A1",
        "topic": "school",
        "order_index": 105,
        "estimated_seconds": 27,
        "transcript": "Our teacher has a good idea for class. We use a new game, and now all students know the answer.",
        "translation_vi": "Giao vien cua chung toi co mot y tuong hay cho lop hoc. Chung toi dung mot tro choi moi, va bay gio tat ca hoc sinh deu biet cau tra loi.",
        "words": ["good", "idea", "use", "know"],
    },
    {
        "title": "Listening 6 - Around The City",
        "description": "Doan nghe ve di lai trong thanh pho.",
        "level": "A1",
        "topic": "travel",
        "order_index": 106,
        "estimated_seconds": 31,
        "transcript": "My family takes a bus into the city on Sunday. We walk to the park and talk about our plans for the week.",
        "translation_vi": "Gia dinh toi di xe buyt vao thanh pho vao Chu nhat. Chung toi di bo den cong vien va noi ve ke hoach cho tuan moi.",
        "words": ["family", "bus", "city", "walk", "talk"],
    },
    {
        "title": "Listening 7 - Morning At School",
        "description": "Doan nghe A2 ve buoi sang den truong.",
        "level": "A2",
        "topic": "school",
        "order_index": 107,
        "estimated_seconds": 38,
        "transcript": "On Monday morning, the teacher meets every student at the school gate. We talk for a minute before the first lesson begins.",
        "translation_vi": "Vao sang thu Hai, giao vien gap tung hoc sinh o cong truong. Chung toi noi chuyen mot luc truoc khi tiet hoc dau tien bat dau.",
        "words": ["morning", "teacher", "student", "school", "talk"],
    },
    {
        "title": "Listening 8 - Lunch At The Market",
        "description": "Doan nghe A2 ve an trua va mua sam.",
        "level": "A2",
        "topic": "shopping",
        "order_index": 108,
        "estimated_seconds": 40,
        "transcript": "At lunch time, I go to the market with my brother. We buy coffee, check our phone, and choose a small meal for lunch.",
        "translation_vi": "Vao gio an trua, toi di cho voi anh trai. Chung toi mua ca phe, kiem tra dien thoai va chon mot bua nho cho bua trua.",
        "words": ["lunch", "market", "coffee", "phone"],
    },
    {
        "title": "Listening 9 - Travel By Train",
        "description": "Doan nghe A2 ve chuyen di.",
        "level": "A2",
        "topic": "travel",
        "order_index": 109,
        "estimated_seconds": 42,
        "transcript": "We travel to the next city by train because the airport is far away. My father buys the ticket before we leave home.",
        "translation_vi": "Chung toi di den thanh pho ke ben bang tau hoa vi san bay o rat xa. Bo toi mua ve truoc khi ca nha roi nha.",
        "words": ["travel", "city", "train", "airport", "ticket"],
    },
    {
        "title": "Listening 10 - Office Weekend Plan",
        "description": "Doan nghe A2 ve cong viec va ke hoach cuoi tuan.",
        "level": "A2",
        "topic": "work",
        "order_index": 110,
        "estimated_seconds": 44,
        "transcript": "At the office, our team talks about a new project on Friday. We also check the weekend weather before planning a short trip.",
        "translation_vi": "Tai van phong, nhom chung toi noi ve mot du an moi vao thu Sau. Chung toi cung xem thoi tiet cuoi tuan truoc khi len ke hoach cho mot chuyen di ngan.",
        "words": ["office", "project", "weekend", "weather"],
    },
]


def _csv_path() -> Path:
    candidates = [
        Path("/database/seed/words.csv"),
        Path(__file__).resolve().parents[4] / "database" / "seed" / "words.csv",
        Path(__file__).resolve().parents[4].parent / "database" / "seed" / "words.csv",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return candidates[0]


def _norm(value: str) -> str:
    return (value or "").strip()


class Command(BaseCommand):
    help = "Seed full catalog from database/seed/words.csv (development only)"

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
            self._seed_listening_lessons(admin, words)

        self.stdout.write(
            self.style.SUCCESS(
                "\nSeed hoan tat!"
                "\n  Admin:   admin@norostu.com / Admin@2024!"
                "\n  Student: student@norostu.com / Student@2024!"
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
                "full_name": "Quản trị viên",
                "password": "Admin@2024!",
                "role": "admin",
                "is_staff": True,
                "is_superuser": True,
            },
            {
                "email": "student@norostu.com",
                "username": "student",
                "full_name": "Học sinh Nam",
                "password": "Student@2024!",
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

    def _seed_listening_lessons(self, admin, word_map):
        self.stdout.write("Dang tao bai nghe demo...")
        for spec in LISTENING_LESSONS:
            lesson, _ = Lesson.objects.get_or_create(
                title=spec["title"],
                defaults={
                    "description": spec["description"],
                    "topic": spec["topic"],
                    "skill_tag": Lesson.SkillTag.LISTENING,
                    "content_difficulty": Lesson.ContentDifficulty.NORMAL,
                    "listening_transcript": spec["transcript"],
                    "listening_translation_vi": spec["translation_vi"],
                    "listening_estimated_seconds": spec["estimated_seconds"],
                    "listening_tts_lang": "en-US",
                    "listening_tts_rate": 0.9,
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
