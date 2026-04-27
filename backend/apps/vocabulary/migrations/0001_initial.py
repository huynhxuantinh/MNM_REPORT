"""Migration khởi tạo bảng vocabulary: Word, WordSet, WordSetWord, Bookmark."""
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Word",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("text", models.CharField(max_length=200, verbose_name="Từ tiếng Anh")),
                ("phonetic", models.CharField(blank=True, max_length=100, verbose_name="Phiên âm IPA")),
                ("part_of_speech", models.CharField(blank=True, max_length=50, verbose_name="Loại từ")),
                ("definition_en", models.TextField(blank=True, verbose_name="Định nghĩa tiếng Anh")),
                ("definition_vi", models.TextField(blank=True, verbose_name="Nghĩa tiếng Việt")),
                ("example_en", models.TextField(blank=True, verbose_name="Câu ví dụ tiếng Anh")),
                ("example_vi", models.TextField(blank=True, verbose_name="Bản dịch câu ví dụ")),
                (
                    "level",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("A1", "A1"), ("A2", "A2"), ("B1", "B1"), ("B2", "B2"),
                            ("C1", "C1"), ("C2", "C2"), ("TOEIC", "TOEIC"), ("IELTS", "IELTS"),
                        ],
                        db_index=True,
                        max_length=10,
                        verbose_name="Cấp độ",
                    ),
                ),
                ("image_url", models.CharField(blank=True, max_length=500, verbose_name="Ảnh minh họa")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="words_created",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Người tạo",
                    ),
                ),
            ],
            options={
                "verbose_name": "Từ vựng",
                "verbose_name_plural": "Từ vựng",
                "db_table": "words",
            },
        ),
        migrations.AddIndex(
            model_name="word",
            index=models.Index(fields=["text"], name="words_text_idx"),
        ),
        migrations.CreateModel(
            name="WordSet",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("name", models.CharField(max_length=200, verbose_name="Tên bộ từ")),
                ("description", models.TextField(blank=True, verbose_name="Mô tả")),
                ("level", models.CharField(blank=True, max_length=10, verbose_name="Cấp độ")),
                ("is_public", models.BooleanField(default=True, verbose_name="Công khai")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="wordsets_created",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Người tạo",
                    ),
                ),
            ],
            options={
                "verbose_name": "Bộ từ",
                "verbose_name_plural": "Bộ từ",
                "db_table": "wordsets",
            },
        ),
        migrations.CreateModel(
            name="WordSetWord",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("order_index", models.PositiveIntegerField(default=0, verbose_name="Thứ tự")),
                (
                    "word",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="vocabulary.word"
                    ),
                ),
                (
                    "wordset",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="wordset_words",
                        to="vocabulary.wordset",
                    ),
                ),
            ],
            options={
                "verbose_name": "Từ trong bộ",
                "verbose_name_plural": "Từ trong bộ",
                "db_table": "wordset_words",
                "ordering": ["order_index"],
            },
        ),
        migrations.AlterUniqueTogether(
            name="wordsetword",
            unique_together={("wordset", "word")},
        ),
        migrations.AddField(
            model_name="wordset",
            name="words",
            field=models.ManyToManyField(
                blank=True,
                related_name="wordsets",
                through="vocabulary.WordSetWord",
                to="vocabulary.word",
            ),
        ),
        migrations.CreateModel(
            name="Bookmark",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="bookmarks",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Người dùng",
                    ),
                ),
                (
                    "word",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="bookmarks",
                        to="vocabulary.word",
                    ),
                ),
            ],
            options={
                "verbose_name": "Bookmark",
                "verbose_name_plural": "Bookmark",
                "db_table": "bookmarks",
            },
        ),
        migrations.AlterUniqueTogether(
            name="bookmark",
            unique_together={("user", "word")},
        ),
    ]
