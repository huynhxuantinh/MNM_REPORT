"""Django Admin cho module vocabulary."""
from django.contrib import admin

from .models import Bookmark, Word, WordSet, WordSetWord


class WordSetWordInline(admin.TabularInline):
    """Inline quản lý từ trong bộ từ."""
    model = WordSetWord
    extra = 0
    fields = ("word", "order_index")
    autocomplete_fields = ("word",)
    ordering = ("order_index",)


@admin.register(Word)
class WordAdmin(admin.ModelAdmin):
    """Quản lý từ vựng với tìm kiếm và lọc nhanh."""

    list_display = (
        "text", "phonetic", "part_of_speech", "level",
        "has_image", "created_by", "created_at",
    )
    list_filter = ("level", "part_of_speech")
    search_fields = ("text", "definition_vi", "definition_en", "example_en")
    autocomplete_fields = ("created_by",)
    readonly_fields = ("created_at", "updated_at")
    ordering = ("text",)

    fieldsets = (
        ("Thông tin cơ bản", {"fields": ("text", "phonetic", "part_of_speech", "level")}),
        ("Định nghĩa", {"fields": ("definition_en", "definition_vi")}),
        ("Ví dụ", {"fields": ("example_en", "example_vi")}),
        ("Khác", {"fields": ("image_url", "created_by", "created_at", "updated_at")}),
    )

    @admin.display(description="Có ảnh", boolean=True)
    def has_image(self, obj):
        return bool(obj.image_url)


@admin.register(WordSet)
class WordSetAdmin(admin.ModelAdmin):
    """Quản lý bộ từ kèm danh sách từ inline."""

    list_display = ("name", "level", "is_public", "word_count", "created_by", "created_at")
    list_filter = ("is_public", "level")
    search_fields = ("name", "description")
    autocomplete_fields = ("created_by",)
    readonly_fields = ("created_at", "updated_at")
    inlines = [WordSetWordInline]

    @admin.display(description="Số từ")
    def word_count(self, obj):
        return obj.words.count()


@admin.register(Bookmark)
class BookmarkAdmin(admin.ModelAdmin):
    list_display = ("user", "word", "created_at")
    search_fields = ("user__email", "word__text")
    readonly_fields = ("created_at",)
    raw_id_fields = ("user", "word")
