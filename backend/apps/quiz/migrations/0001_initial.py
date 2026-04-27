"""Migration khởi tạo bảng quiz: Quiz, QuizResult."""
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("learning", "0001_initial"),
        ("vocabulary", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Quiz",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("title", models.CharField(max_length=200, verbose_name="Tiêu đề")),
                (
                    "quiz_type",
                    models.CharField(
                        choices=[
                            ("mc", "Trắc nghiệm"),
                            ("fill", "Điền vào chỗ trống"),
                            ("match", "Nối từ"),
                        ],
                        default="mc",
                        max_length=10,
                        verbose_name="Loại kiểm tra",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="quizzes_created",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Người tạo",
                    ),
                ),
                (
                    "lesson",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="quizzes",
                        to="learning.lesson",
                        verbose_name="Bài học",
                    ),
                ),
                (
                    "wordset",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="quizzes",
                        to="vocabulary.wordset",
                        verbose_name="Bộ từ",
                    ),
                ),
            ],
            options={
                "verbose_name": "Bài kiểm tra",
                "verbose_name_plural": "Bài kiểm tra",
                "db_table": "quizzes",
            },
        ),
        migrations.CreateModel(
            name="QuizResult",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("score", models.FloatField(default=0, verbose_name="Điểm (0–100)")),
                ("total_questions", models.IntegerField(default=0, verbose_name="Tổng câu hỏi")),
                ("correct_answers", models.IntegerField(default=0, verbose_name="Số câu đúng")),
                ("completed_at", models.DateTimeField(auto_now_add=True)),
                (
                    "quiz",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="results",
                        to="quiz.quiz",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="quiz_results",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Học sinh",
                    ),
                ),
            ],
            options={
                "verbose_name": "Kết quả kiểm tra",
                "verbose_name_plural": "Kết quả kiểm tra",
                "db_table": "quiz_results",
            },
        ),
    ]
