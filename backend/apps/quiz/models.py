"""
Models cho module kiểm tra (Quiz). Chương 3 chưa định nghĩa chi tiết –
placeholder để sau này mở rộng.
"""
from django.conf import settings
from django.db import models


class Quiz(models.Model):
    """Bài kiểm tra ngắn dựa trên một WordSet hoặc Lesson."""

    class QuizType(models.TextChoices):
        MULTIPLE_CHOICE = "mc", "Trắc nghiệm"
        FILL_IN = "fill", "Điền vào chỗ trống"
        MATCHING = "match", "Nối từ"

    title = models.CharField("Tiêu đề", max_length=200)
    quiz_type = models.CharField(
        "Loại kiểm tra", max_length=10, choices=QuizType.choices, default=QuizType.MULTIPLE_CHOICE
    )
    wordset = models.ForeignKey(
        "vocabulary.WordSet",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="quizzes",
        verbose_name="Bộ từ",
    )
    lesson = models.ForeignKey(
        "learning.Lesson",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="quizzes",
        verbose_name="Bài học",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="quizzes_created",
        verbose_name="Người tạo",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Bài kiểm tra"
        verbose_name_plural = "Bài kiểm tra"
        db_table = "quizzes"

    def __str__(self):
        return self.title


class QuizResult(models.Model):
    """Kết quả làm bài kiểm tra của học sinh."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="quiz_results",
        verbose_name="Học sinh",
    )
    quiz = models.ForeignKey(
        Quiz, on_delete=models.CASCADE, related_name="results"
    )
    score = models.FloatField("Điểm (0–100)", default=0)
    total_questions = models.IntegerField("Tổng câu hỏi", default=0)
    correct_answers = models.IntegerField("Số câu đúng", default=0)
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Kết quả kiểm tra"
        verbose_name_plural = "Kết quả kiểm tra"
        db_table = "quiz_results"

    def __str__(self):
        return f"{self.user} – {self.quiz.title}: {self.score:.1f}/100"
