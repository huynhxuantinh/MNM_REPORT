"""
Models cho module học tập: Lesson, Assignment, ReviewLog (SRS), UserStreak, Notification.
"""
from datetime import date, timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone


class Lesson(models.Model):
    """Bảng Lesson – đơn vị học tập cơ bản do giáo viên thiết kế."""

    class Level(models.TextChoices):
        A1    = "A1",    "A1"
        A2    = "A2",    "A2"
        B1    = "B1",    "B1"
        B2    = "B2",    "B2"
        C1    = "C1",    "C1"
        C2    = "C2",    "C2"
        TOEIC = "TOEIC", "TOEIC"

    title = models.CharField("Tiêu đề", max_length=200)
    description = models.TextField("Mô tả", blank=True)
    level = models.CharField("Cấp độ", max_length=10, choices=Level.choices, blank=True)
    order_index = models.PositiveIntegerField("Thứ tự", default=0)
    is_published = models.BooleanField("Đã công bố", default=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="lessons_created",
        verbose_name="Giáo viên tạo",
    )
    words = models.ManyToManyField(
        "vocabulary.Word",
        through="LessonWord",
        related_name="lessons",
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Bài học"
        verbose_name_plural = "Bài học"
        db_table = "lessons"
        ordering = ["order_index"]

    def __str__(self):
        return f"[{self.level}] {self.title}"


class LessonWord(models.Model):
    """Bảng trung gian Lesson ↔ Word – lưu thứ tự từ trong bài."""

    lesson = models.ForeignKey(
        Lesson, on_delete=models.CASCADE, related_name="lesson_words"
    )
    word = models.ForeignKey("vocabulary.Word", on_delete=models.CASCADE)
    order_index = models.PositiveIntegerField("Thứ tự", default=0)

    class Meta:
        verbose_name = "Từ trong bài học"
        verbose_name_plural = "Từ trong bài học"
        db_table = "lesson_words"
        ordering = ["order_index"]
        unique_together = [("lesson", "word")]

    def __str__(self):
        return f"{self.lesson.title} → {self.word.text}"


class Assignment(models.Model):
    """Bảng Assignment – giáo viên giao bài cho học sinh."""

    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="assignments_given",
        verbose_name="Giáo viên",
    )
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name="assignments",
        verbose_name="Bài học",
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="assignments_received",
        verbose_name="Học sinh",
    )
    due_date = models.DateField("Hạn hoàn thành", null=True, blank=True)
    completed_at = models.DateTimeField("Hoàn thành lúc", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Bài được giao"
        verbose_name_plural = "Bài được giao"
        db_table = "assignments"
        unique_together = [("lesson", "student")]

    def __str__(self):
        return f"{self.teacher} → {self.student}: {self.lesson}"

    @property
    def is_completed(self) -> bool:
        return self.completed_at is not None


class LessonProgress(models.Model):
    """Theo dõi tiến trình học sinh bắt đầu / hoàn thành từng bài."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="lesson_progress",
        verbose_name="Học sinh",
    )
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name="progress",
        verbose_name="Bài học",
    )
    started_at = models.DateTimeField("Bắt đầu lúc", null=True, blank=True)
    completed_at = models.DateTimeField("Hoàn thành lúc", null=True, blank=True)

    class Meta:
        verbose_name = "Tiến trình bài học"
        verbose_name_plural = "Tiến trình bài học"
        db_table = "lesson_progress"
        unique_together = [("user", "lesson")]

    def __str__(self):
        status = "hoàn thành" if self.completed_at else "đang học"
        return f"{self.user} – {self.lesson.title} ({status})"


class ReviewLog(models.Model):
    """Bảng ReviewLog – lưu chỉ số SRS SM-2 cho từng cặp (user, word).

    Composite index trên (user_id, next_review_date) để truy vấn
    "từ đến hạn hôm nay của user X" nhanh (xem bảng index chương 3).
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="review_logs",
        verbose_name="Học sinh",
    )
    word = models.ForeignKey(
        "vocabulary.Word",
        on_delete=models.CASCADE,
        related_name="review_logs",
        verbose_name="Từ vựng",
    )
    easiness_factor = models.FloatField("Hệ số dễ (EF)", default=2.5)
    repetitions = models.IntegerField("Lần lặp liên tiếp đúng", default=0)
    interval_days = models.IntegerField("Khoảng cách ôn (ngày)", default=1)
    last_reviewed = models.DateField("Ôn lần cuối", null=True, blank=True)
    next_review_date = models.DateField("Ngày ôn tiếp theo", null=True, blank=True)
    total_reviews = models.IntegerField("Tổng lần ôn", default=0)
    correct_count = models.IntegerField("Số lần đúng (q≥3)", default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Log ôn tập SRS"
        verbose_name_plural = "Log ôn tập SRS"
        db_table = "review_logs"
        unique_together = [("user", "word")]
        indexes = [
            # Index đơn cho truy vấn toàn hệ thống
            models.Index(fields=["next_review_date"]),
            # Composite index cho truy vấn cá nhân (ưu tiên query này)
            models.Index(fields=["user", "next_review_date"]),
        ]

    def __str__(self):
        return f"{self.user} – {self.word.text} → {self.next_review_date}"

    def apply_sm2(self, quality: int) -> None:
        """Cập nhật chỉ số SM-2 sau khi ôn tập với chất lượng q ∈ {0..5}.

        Nguồn: thuật toán SuperMemo-2 gốc, đặc tả chương 2.5.
        """
        if not 0 <= quality <= 5:
            raise ValueError("quality phải trong khoảng 0–5")

        if quality >= 3:
            if self.repetitions == 0:
                self.interval_days = 1
            elif self.repetitions == 1:
                self.interval_days = 6
            else:
                self.interval_days = round(self.interval_days * self.easiness_factor)
            self.repetitions += 1
            self.correct_count += 1
        else:
            # Trả từ về đầu nếu không nhớ được
            self.repetitions = 0
            self.interval_days = 1

        self.easiness_factor = max(
            1.3,
            self.easiness_factor
            + 0.1
            - (5 - quality) * (0.08 + (5 - quality) * 0.02),
        )

        today = timezone.now().date()
        self.last_reviewed = today
        self.next_review_date = today + timedelta(days=self.interval_days)
        self.total_reviews += 1
        self.save()


class UserStreak(models.Model):
    """Bảng UserStreak – chuỗi ngày học liên tiếp (1 record / user)."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="streak",
        verbose_name="Người dùng",
    )
    current_streak = models.IntegerField("Streak hiện tại", default=0)
    longest_streak = models.IntegerField("Streak dài nhất", default=0)
    last_active_date = models.DateField("Ngày học gần nhất", null=True, blank=True)

    class Meta:
        verbose_name = "Streak học tập"
        verbose_name_plural = "Streak học tập"
        db_table = "user_streaks"

    def __str__(self):
        return f"{self.user} 🔥 {self.current_streak} ngày"

    def update_streak(self) -> None:
        """Gọi mỗi khi user học hoặc ôn ≥ 1 từ trong ngày."""
        today = date.today()
        if self.last_active_date == today:
            return  # Đã cập nhật hôm nay

        if self.last_active_date == today - timedelta(days=1):
            self.current_streak += 1
        else:
            self.current_streak = 1  # Bỏ ngày → reset

        self.longest_streak = max(self.longest_streak, self.current_streak)
        self.last_active_date = today
        self.save()


class StudentClass(models.Model):
    """Lớp học do giáo viên tạo ra để nhóm học sinh và giao bài hàng loạt."""

    name = models.CharField("Tên lớp", max_length=200)
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="classes_taught",
        verbose_name="Giáo viên",
    )
    students = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="classes_enrolled",
        blank=True,
        verbose_name="Học sinh",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Lớp học"
        verbose_name_plural = "Lớp học"
        db_table = "student_classes"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.teacher})"


class Notification(models.Model):
    """Bảng Notification – thông báo trong ứng dụng."""

    class Type(models.TextChoices):
        ASSIGNMENT = "assignment", "Bài được giao"
        LEVEL_UP = "level_up", "Lên cấp"
        STREAK = "streak", "Streak milestone"
        REMINDER = "reminder", "Nhắc nhở ôn tập"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
        verbose_name="Người dùng",
    )
    type = models.CharField("Loại", max_length=50, choices=Type.choices)
    message = models.TextField("Nội dung")
    is_read = models.BooleanField("Đã đọc", default=False)
    # ID tham chiếu linh hoạt (bài học, từ vựng…)
    related_id = models.IntegerField("ID tham chiếu", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Thông báo"
        verbose_name_plural = "Thông báo"
        db_table = "notifications"
        ordering = ["-created_at"]
        indexes = [
            # Đếm unread nhanh (chương 3 – bảng index)
            models.Index(fields=["user", "is_read"]),
        ]

    def __str__(self):
        return f"{self.user} – {self.get_type_display()}: {self.message[:60]}"
