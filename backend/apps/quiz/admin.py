"""Django Admin cho module quiz."""
from django.contrib import admin

from .models import Quiz, QuizResult


class QuizResultInline(admin.TabularInline):
    model = QuizResult
    extra = 0
    fields = ("user", "score", "correct_answers", "total_questions", "completed_at")
    readonly_fields = ("completed_at",)
    raw_id_fields = ("user",)


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ("title", "quiz_type", "wordset", "lesson", "created_by", "created_at")
    list_filter = ("quiz_type",)
    search_fields = ("title",)
    autocomplete_fields = ("created_by",)
    readonly_fields = ("created_at",)
    inlines = [QuizResultInline]


@admin.register(QuizResult)
class QuizResultAdmin(admin.ModelAdmin):
    list_display = ("user", "quiz", "score", "correct_answers", "total_questions", "completed_at")
    list_filter = ("quiz",)
    search_fields = ("user__email", "quiz__title")
    raw_id_fields = ("user", "quiz")
    readonly_fields = ("completed_at",)
