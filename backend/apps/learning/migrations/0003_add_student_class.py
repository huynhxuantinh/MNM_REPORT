"""Thêm model StudentClass – lớp học do giáo viên quản lý."""
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("learning", "0002_lesson_level_add_toeic"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="StudentClass",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=200, verbose_name="Tên lớp")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "teacher",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="classes_taught",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Giáo viên",
                    ),
                ),
                (
                    "students",
                    models.ManyToManyField(
                        blank=True,
                        related_name="classes_enrolled",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Học sinh",
                    ),
                ),
            ],
            options={
                "verbose_name": "Lớp học",
                "verbose_name_plural": "Lớp học",
                "db_table": "student_classes",
                "ordering": ["name"],
            },
        ),
    ]
