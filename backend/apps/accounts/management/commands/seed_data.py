"""Management command: tạo dữ liệu mẫu ban đầu.

Tạo:
  - 3 tài khoản mẫu: 1 admin, 1 teacher, 1 user
  - 5 bài học mẫu được công bố, mỗi bài có từ 10-15 từ vựng phù hợp cấp độ

Command này idempotent: chạy nhiều lần không tạo trùng (dùng get_or_create).
"""
from django.core.management.base import BaseCommand
from django.db import transaction


SAMPLE_USERS = [
    {
        "email": "admin@mnm-english.com",
        "username": "admin_mnm",
        "full_name": "Admin MNM",
        "password": "Admin@2024!",
        "role": "admin",
        "is_staff": True,
        "is_superuser": True,
        "is_active": True,
        "email_verified": True,
    },
    {
        "email": "teacher@mnm-english.com",
        "username": "teacher_mnm",
        "full_name": "Nguyễn Thị Lan",
        "password": "Teacher@2024!",
        "role": "teacher",
        "is_staff": False,
        "is_superuser": False,
        "is_active": True,
        "email_verified": True,
    },
    {
        "email": "student@mnm-english.com",
        "username": "student_mnm",
        "full_name": "Trần Văn Minh",
        "password": "Student@2024!",
        "role": "user",
        "is_staff": False,
        "is_superuser": False,
        "is_active": True,
        "email_verified": True,
    },
]

# Cấu hình 5 bài học: (title, description, level, danh_sach_tu)
SAMPLE_LESSONS = [
    {
        "title": "Chào hỏi cơ bản",
        "description": "Học các từ vựng thiết yếu để chào hỏi và tự giới thiệu bằng tiếng Anh.",
        "level": "A1",
        "order_index": 1,
        "words": ["name", "friend", "good", "happy", "family", "morning", "evening",
                  "smile", "talk", "meet", "voice", "young", "old", "help", "sorry"],
    },
    {
        "title": "Cuộc sống hàng ngày",
        "description": "Từ vựng về các hoạt động và đồ vật thường gặp trong cuộc sống hàng ngày.",
        "level": "A1",
        "order_index": 2,
        "words": ["eat", "drink", "sleep", "walk", "run", "book", "house", "table",
                  "chair", "door", "window", "kitchen", "bathroom", "bedroom", "clock"],
    },
    {
        "title": "Đi lại và phương tiện",
        "description": "Từ vựng về các phương tiện giao thông và từ chỉ hướng đi.",
        "level": "A2",
        "order_index": 3,
        "words": ["bus", "train", "airport", "station", "road", "street", "direction",
                  "map", "travel", "arrive", "leave", "ticket", "drive", "fly", "near"],
    },
    {
        "title": "Trường học và học tập",
        "description": "Từ vựng liên quan đến môi trường học đường và quá trình học tập.",
        "level": "A2",
        "order_index": 4,
        "words": ["school", "teacher", "student", "class", "lesson", "study", "learn",
                  "read", "write", "question", "answer", "explain", "understand", "desk", "course"],
    },
    {
        "title": "Kỹ năng giao tiếp tiếng Anh",
        "description": "Từ vựng cần thiết để giao tiếp, diễn đạt ý kiến và thảo luận bằng tiếng Anh.",
        "level": "B1",
        "order_index": 5,
        "words": ["communicate", "express", "discuss", "describe", "suggest", "opinion",
                  "improve", "concentrate", "participate", "confident", "challenge",
                  "opportunity", "skill", "progress", "encourage"],
    },
]


class Command(BaseCommand):
    help = "Tạo dữ liệu mẫu: 3 tài khoản và 5 bài học với từ vựng thực."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset-passwords",
            action="store_true",
            default=False,
            help="Đặt lại mật khẩu cho tài khoản mẫu đã tồn tại",
        )

    def handle(self, *args, **options):
        from django.contrib.auth import get_user_model
        from apps.vocabulary.models import Word
        from apps.learning.models import Lesson, LessonWord

        User = get_user_model()

        with transaction.atomic():
            # ── 1. Tạo tài khoản mẫu ─────────────────────────────────
            users = {}
            for entry in SAMPLE_USERS:
                password = entry["password"]
                email = entry["email"]
                role = entry["role"]
                user_fields = {k: v for k, v in entry.items() if k != "password"}

                user, created = User.objects.get_or_create(
                    email=email,
                    defaults=user_fields,
                )

                if created:
                    user.set_password(password)
                    user.save()
                    self.stdout.write(f"  ✓ Tạo tài khoản: {email} (role={user.role})")
                elif options["reset_passwords"]:
                    for field, value in user_fields.items():
                        setattr(user, field, value)
                    user.set_password(password)
                    user.save()
                    self.stdout.write(f"  ↺ Cập nhật tài khoản: {email}")
                else:
                    self.stdout.write(f"  – Bỏ qua (đã tồn tại): {email}")

                users[role] = User.objects.get(email=email)

            teacher = users.get("teacher")
            if not teacher:
                # Fallback nếu teacher chưa tạo được
                teacher = User.objects.filter(role="teacher").first() or \
                          User.objects.filter(is_superuser=True).first()

            # ── 2. Tạo bài học mẫu ───────────────────────────────────
            for entry in SAMPLE_LESSONS:
                word_texts = entry["words"]
                lesson_fields = {k: v for k, v in entry.items() if k != "words"}

                lesson, created = Lesson.objects.get_or_create(
                    title=lesson_fields["title"],
                    defaults={
                        **lesson_fields,
                        "is_published": True,
                        "created_by": teacher,
                    },
                )

                if created:
                    self.stdout.write(f"  ✓ Tạo bài học: [{lesson.level}] {lesson.title}")
                else:
                    self.stdout.write(f"  – Bỏ qua (đã tồn tại): {lesson.title}")

                # Gán từ vựng vào bài học (idempotent)
                added = 0
                for idx, text in enumerate(word_texts):
                    word = Word.objects.filter(text__iexact=text).first()
                    if not word:
                        self.stderr.write(
                            f"    ⚠ Từ '{text}' không tìm thấy trong database, bỏ qua."
                        )
                        continue
                    _, word_created = LessonWord.objects.get_or_create(
                        lesson=lesson,
                        word=word,
                        defaults={"order_index": idx + 1},
                    )
                    if word_created:
                        added += 1

                if added:
                    self.stdout.write(f"    → Thêm {added} từ vào bài học")

        self.stdout.write(self.style.SUCCESS(
            "\nSeed data hoàn tất! Tài khoản mẫu:\n"
            "  admin@mnm-english.com   / Admin@2024!\n"
            "  teacher@mnm-english.com / Teacher@2024!\n"
            "  student@mnm-english.com / Student@2024!\n"
            "\nLưu ý: Chạy lệnh này sau khi đã import từ vựng:\n"
            "  python manage.py import_words data/words.csv\n"
            "  python manage.py seed_data"
        ))
