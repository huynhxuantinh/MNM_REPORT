"""Django Admin cho module learning."""
from django.contrib import admin
from django.utils.html import format_html

from .models import (
    Lesson, LessonProgress, LessonWord,
    Notification, ReviewLog, UserStreak,
)


class LessonWordInline(admin.TabularInline):
    """Inline danh sách từ trong bài học."""
    model = LessonWord
    extra = 0
    fields = ("word", "order_index")
    autocomplete_fields = ("word",)
    ordering = ("order_index",)


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    """Quản lý bài học kèm danh sách từ inline."""

    list_display = (
        "title", "level", "order_index", "is_published",
        "word_count", "created_by", "created_at",
    )
    list_filter = ("is_published", "level")
    search_fields = ("title", "description")
    autocomplete_fields = ("created_by",)
    readonly_fields = ("created_at", "updated_at")
    inlines = [LessonWordInline]
    actions = ["publish_lessons", "unpublish_lessons"]

    @admin.display(description="Số từ")
    def word_count(self, obj):
        return obj.words.count()

    @admin.action(description="Công bố bài học đã chọn")
    def publish_lessons(self, request, queryset):
        updated = queryset.update(is_published=True)
        self.message_user(request, f"Đã công bố {updated} bài học.")

    @admin.action(description="Ẩn bài học đã chọn")
    def unpublish_lessons(self, request, queryset):
        updated = queryset.update(is_published=False)
        self.message_user(request, f"Đã ẩn {updated} bài học.")


@admin.register(LessonProgress)
class LessonProgressAdmin(admin.ModelAdmin):
    list_display = ("user", "lesson", "started_at", "completed_at")
    search_fields = ("user__email", "lesson__title")
    raw_id_fields = ("user", "lesson")


@admin.register(ReviewLog)
class ReviewLogAdmin(admin.ModelAdmin):
    """Theo dõi tiến trình SRS – hữu ích để debug thuật toán SM-2."""

    list_display = (
        "user", "word", "repetitions", "interval_days",
        "easiness_factor", "next_review_date", "accuracy",
    )
    list_filter = ("next_review_date",)
    search_fields = ("user__email", "word__text")
    raw_id_fields = ("user", "word")
    readonly_fields = ("created_at", "updated_at")
    ordering = ("next_review_date",)

    @admin.display(description="Độ chính xác")
    def accuracy(self, obj):
        if obj.total_reviews == 0:
            return "—"
        pct = obj.correct_count / obj.total_reviews * 100
        color = "#388e3c" if pct >= 80 else "#f57c00" if pct >= 50 else "#d32f2f"
        return format_html(
            '<span style="color:{};font-weight:bold">{:.0f}%</span>', color, pct
        )


@admin.register(UserStreak)
class UserStreakAdmin(admin.ModelAdmin):
    list_display = ("user", "current_streak", "longest_streak", "last_active_date")
    search_fields = ("user__email",)
    raw_id_fields = ("user",)
    ordering = ("-current_streak",)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("user", "type", "message_short", "is_read", "created_at")
    list_filter = ("type", "is_read")
    search_fields = ("user__email", "message")
    raw_id_fields = ("user",)
    readonly_fields = ("created_at",)
    actions = ["mark_read"]

    @admin.display(description="Nội dung")
    def message_short(self, obj):
        return obj.message[:80] + "…" if len(obj.message) > 80 else obj.message

    @admin.action(description="Đánh dấu đã đọc")
    def mark_read(self, request, queryset):
        updated = queryset.update(is_read=True)
        self.message_user(request, f"Đã đánh dấu đọc {updated} thông báo.")
