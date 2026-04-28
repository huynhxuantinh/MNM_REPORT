"""Thêm TOEIC vào choices của Lesson.level."""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("learning", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="lesson",
            name="level",
            field=models.CharField(
                blank=True,
                choices=[
                    ("A1", "A1"),
                    ("A2", "A2"),
                    ("B1", "B1"),
                    ("B2", "B2"),
                    ("C1", "C1"),
                    ("C2", "C2"),
                    ("TOEIC", "TOEIC"),
                ],
                max_length=10,
                verbose_name="Cấp độ",
            ),
        ),
    ]
