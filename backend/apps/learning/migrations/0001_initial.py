"""Migration khởi tạo: Lesson, LessonWord, Assignment, LessonProgress,
ReviewLog (với composite index SM-2), UserStreak, Notification."""
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("vocabulary", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # ── Lesson ────────────────────────────────────────────────────
        migrations.CreateModel(
            name="Lesson",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("title", models.CharField(max_length=200, verbose_name="Tiêu đề")),
                ("description", models.TextField(blank=True, verbose_name="Mô tả")),
                (
                    "level",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("A1", "A1"), ("A2", "A2"), ("B1", "B1"),
                            ("B2", "B2"), ("C1", "C1"), ("C2", "C2"),
                        ],
                        max_length=10,
                        verbose_name="Cấp độ",
                    ),
                ),
                ("order_index", models.PositiveIntegerField(default=0, verbose_name="Thứ tự")),
                ("is_published", models.BooleanField(default=False, verbose_name="Đã công bố")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="lessons_created",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Giáo viên tạo",
                    ),
                ),
            ],
            options={
                "verbose_name": "Bài học",
                "verbose_name_plural": "Bài học",
                "db_table": "lessons",
                "ordering": ["order_index"],
            },
        ),
        # ── LessonWord (M2M through) ──────────────────────────────────
        migrations.CreateModel(
            name="LessonWord",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("order_index", models.PositiveIntegerField(default=0, verbose_name="Thứ tự")),
                (
                    "lesson",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="lesson_words",
                        to="learning.lesson",
                    ),
                ),
                (
                    "word",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="vocabulary.word"
                    ),
                ),
            ],
            options={
                "verbose_name": "Từ trong bài học",
                "verbose_name_plural": "Từ trong bài học",
                "db_table": "lesson_words",
                "ordering": ["order_index"],
            },
        ),
        migrations.AlterUniqueTogether(name="lessonword", unique_together={("lesson", "word")}),
        migrations.AddField(
            model_name="lesson",
            name="words",
            field=models.ManyToManyField(
                blank=True,
                related_name="lessons",
                through="learning.LessonWord",
                to="vocabulary.word",
            ),
        ),
        # ── Assignment ────────────────────────────────────────────────
        migrations.CreateModel(
            name="Assignment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("due_date", models.DateField(blank=True, null=True, verbose_name="Hạn hoàn thành")),
                ("completed_at", models.DateTimeField(blank=True, null=True, verbose_name="Hoàn thành lúc")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "lesson",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="assignments",
                        to="learning.lesson",
                        verbose_name="Bài học",
                    ),
                ),
                (
                    "student",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="assignments_received",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Học sinh",
                    ),
                ),
                (
                    "teacher",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="assignments_given",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Giáo viên",
                    ),
                ),
            ],
            options={
                "verbose_name": "Bài được giao",
                "verbose_name_plural": "Bài được giao",
                "db_table": "assignments",
            },
        ),
        migrations.AlterUniqueTogether(name="assignment", unique_together={("lesson", "student")}),
        # ── LessonProgress ────────────────────────────────────────────
        migrations.CreateModel(
            name="LessonProgress",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("started_at", models.DateTimeField(blank=True, null=True, verbose_name="Bắt đầu lúc")),
                ("completed_at", models.DateTimeField(blank=True, null=True, verbose_name="Hoàn thành lúc")),
                (
                    "lesson",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="progress",
                        to="learning.lesson",
                        verbose_name="Bài học",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="lesson_progress",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Học sinh",
                    ),
                ),
            ],
            options={
                "verbose_name": "Tiến trình bài học",
                "verbose_name_plural": "Tiến trình bài học",
                "db_table": "lesson_progress",
            },
        ),
        migrations.AlterUniqueTogether(name="lessonprogress", unique_together={("user", "lesson")}),
        # ── ReviewLog (SM-2) ──────────────────────────────────────────
        migrations.CreateModel(
            name="ReviewLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("easiness_factor", models.FloatField(default=2.5, verbose_name="Hệ số dễ (EF)")),
                ("repetitions", models.IntegerField(default=0, verbose_name="Lần lặp liên tiếp đúng")),
                ("interval_days", models.IntegerField(default=1, verbose_name="Khoảng cách ôn (ngày)")),
                ("last_reviewed", models.DateField(blank=True, null=True, verbose_name="Ôn lần cuối")),
                ("next_review_date", models.DateField(blank=True, null=True, verbose_name="Ngày ôn tiếp theo")),
                ("total_reviews", models.IntegerField(default=0, verbose_name="Tổng lần ôn")),
                ("correct_count", models.IntegerField(default=0, verbose_name="Số lần đúng (q≥3)")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="review_logs",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Học sinh",
                    ),
                ),
                (
                    "word",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="review_logs",
                        to="vocabulary.word",
                        verbose_name="Từ vựng",
                    ),
                ),
            ],
            options={
                "verbose_name": "Log ôn tập SRS",
                "verbose_name_plural": "Log ôn tập SRS",
                "db_table": "review_logs",
            },
        ),
        migrations.AlterUniqueTogether(name="reviewlog", unique_together={("user", "word")}),
        migrations.AddIndex(
            model_name="reviewlog",
            index=models.Index(fields=["next_review_date"], name="review_next_date_idx"),
        ),
        migrations.AddIndex(
            model_name="reviewlog",
            index=models.Index(fields=["user", "next_review_date"], name="review_user_date_idx"),
        ),
        # ── UserStreak ────────────────────────────────────────────────
        migrations.CreateModel(
            name="UserStreak",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("current_streak", models.IntegerField(default=0, verbose_name="Streak hiện tại")),
                ("longest_streak", models.IntegerField(default=0, verbose_name="Streak dài nhất")),
                ("last_active_date", models.DateField(blank=True, null=True, verbose_name="Ngày học gần nhất")),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="streak",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Người dùng",
                    ),
                ),
            ],
            options={
                "verbose_name": "Streak học tập",
                "verbose_name_plural": "Streak học tập",
                "db_table": "user_streaks",
            },
        ),
        # ── Notification ──────────────────────────────────────────────
        migrations.CreateModel(
            name="Notification",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                (
                    "type",
                    models.CharField(
                        choices=[
                            ("assignment", "Bài được giao"),
                            ("level_up", "Lên cấp"),
                            ("streak", "Streak milestone"),
                            ("reminder", "Nhắc nhở ôn tập"),
                        ],
                        max_length=50,
                        verbose_name="Loại",
                    ),
                ),
                ("message", models.TextField(verbose_name="Nội dung")),
                ("is_read", models.BooleanField(default=False, verbose_name="Đã đọc")),
                ("related_id", models.IntegerField(blank=True, null=True, verbose_name="ID tham chiếu")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="notifications",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Người dùng",
                    ),
                ),
            ],
            options={
                "verbose_name": "Thông báo",
                "verbose_name_plural": "Thông báo",
                "db_table": "notifications",
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="notification",
            index=models.Index(fields=["user", "is_read"], name="notif_user_read_idx"),
        ),
    ]
