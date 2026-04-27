"""
Models quản lý từ vựng: Word, WordSet, Bookmark.
"""
from django.conf import settings
from django.db import models


class Word(models.Model):
    """Bảng Word – lưu toàn bộ thông tin ngôn ngữ học của một từ tiếng Anh."""

    class Level(models.TextChoices):
        A1 = "A1", "A1"
        A2 = "A2", "A2"
        B1 = "B1", "B1"
        B2 = "B2", "B2"
        C1 = "C1", "C1"
        C2 = "C2", "C2"
        TOEIC = "TOEIC", "TOEIC"
        IELTS = "IELTS", "IELTS"

    text = models.CharField("Từ tiếng Anh", max_length=200)
    phonetic = models.CharField("Phiên âm IPA", max_length=100, blank=True)
    part_of_speech = models.CharField("Loại từ", max_length=50, blank=True)
    definition_en = models.TextField("Định nghĩa tiếng Anh", blank=True)
    definition_vi = models.TextField("Nghĩa tiếng Việt", blank=True)
    example_en = models.TextField("Câu ví dụ tiếng Anh", blank=True)
    example_vi = models.TextField("Bản dịch câu ví dụ", blank=True)
    level = models.CharField(
        "Cấp độ", max_length=10, choices=Level.choices, blank=True, db_index=True
    )
    image_url = models.CharField("Ảnh minh họa", max_length=500, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="words_created",
        verbose_name="Người tạo",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Từ vựng"
        verbose_name_plural = "Từ vựng"
        db_table = "words"
        indexes = [
            models.Index(fields=["text"]),
        ]

    def __str__(self):
        return f"{self.text} [{self.level}]"


class WordSet(models.Model):
    """Bảng WordSet – bộ từ vựng theo chủ đề hoặc cấp độ."""

    name = models.CharField("Tên bộ từ", max_length=200)
    description = models.TextField("Mô tả", blank=True)
    level = models.CharField("Cấp độ", max_length=10, blank=True)
    is_public = models.BooleanField("Công khai", default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wordsets_created",
        verbose_name="Người tạo",
    )
    words = models.ManyToManyField(
        Word, through="WordSetWord", related_name="wordsets", blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Bộ từ"
        verbose_name_plural = "Bộ từ"
        db_table = "wordsets"

    def __str__(self):
        return self.name


class WordSetWord(models.Model):
    """Bảng trung gian WordSet ↔ Word – lưu thứ tự từ trong bộ."""

    wordset = models.ForeignKey(
        WordSet, on_delete=models.CASCADE, related_name="wordset_words"
    )
    word = models.ForeignKey(Word, on_delete=models.CASCADE)
    order_index = models.PositiveIntegerField("Thứ tự", default=0)

    class Meta:
        verbose_name = "Từ trong bộ"
        verbose_name_plural = "Từ trong bộ"
        db_table = "wordset_words"
        ordering = ["order_index"]
        unique_together = [("wordset", "word")]

    def __str__(self):
        return f"{self.wordset.name} → {self.word.text} (#{self.order_index})"


class Bookmark(models.Model):
    """Bảng Bookmark – học sinh đánh dấu từ khó / yêu thích."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="bookmarks",
        verbose_name="Người dùng",
    )
    word = models.ForeignKey(
        Word, on_delete=models.CASCADE, related_name="bookmarks"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Bookmark"
        verbose_name_plural = "Bookmark"
        db_table = "bookmarks"
        unique_together = [("user", "word")]

    def __str__(self):
        return f"{self.user} ☆ {self.word.text}"
