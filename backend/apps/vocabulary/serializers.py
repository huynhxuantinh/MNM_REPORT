"""
Serializers cho vocabulary module.
"""
from rest_framework import serializers

from .models import Bookmark, Word, WordSet, WordSetWord


# ── Word ───────────────────────────────────────────────────────────────────

class WordListSerializer(serializers.ModelSerializer):
    """Nhẹ – dùng trong danh sách và nested."""

    is_bookmarked = serializers.SerializerMethodField()

    class Meta:
        model = Word
        fields = (
            "id", "text", "phonetic", "part_of_speech",
            "definition_vi", "level", "image_url", "is_bookmarked",
        )

    def get_is_bookmarked(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            # Dùng prefetch cache nếu đã annotate, tránh N+1
            if hasattr(obj, "_bookmarked_by_user"):
                return obj._bookmarked_by_user
            return obj.bookmarks.filter(user=request.user).exists()
        return False


class WordSerializer(serializers.ModelSerializer):
    """Đầy đủ – dùng cho create / retrieve / update."""

    is_bookmarked = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Word
        fields = (
            "id", "text", "phonetic", "part_of_speech",
            "definition_en", "definition_vi",
            "example_en", "example_vi",
            "level", "image_url",
            "is_bookmarked", "created_by", "created_by_name",
            "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_by", "created_at", "updated_at")

    def get_is_bookmarked(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.bookmarks.filter(user=request.user).exists()
        return False

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.full_name or obj.created_by.username
        return None


# ── WordSet ────────────────────────────────────────────────────────────────

class WordSetWordSerializer(serializers.ModelSerializer):
    """Từ trong bộ, kèm thứ tự."""

    word = WordListSerializer(read_only=True)
    word_id = serializers.PrimaryKeyRelatedField(
        queryset=Word.objects.all(),
        write_only=True,
        source="word",
    )

    class Meta:
        model = WordSetWord
        fields = ("id", "word", "word_id", "order_index")


class WordSetSerializer(serializers.ModelSerializer):
    """Gọn – dùng trong list và create."""

    # word_count được inject từ annotate() trong queryset
    word_count = serializers.IntegerField(read_only=True, default=0)
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = WordSet
        fields = (
            "id", "name", "description", "level", "is_public",
            "word_count", "created_by", "created_by_name",
            "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_by", "created_at", "updated_at")

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.full_name or obj.created_by.username
        return None


class WordSetDetailSerializer(WordSetSerializer):
    """Chi tiết – kèm toàn bộ từ trong bộ."""

    words = WordSetWordSerializer(
        source="wordset_words", many=True, read_only=True
    )

    class Meta(WordSetSerializer.Meta):
        fields = WordSetSerializer.Meta.fields + ("words",)


# ── Bookmark ───────────────────────────────────────────────────────────────

class BookmarkSerializer(serializers.ModelSerializer):
    word = WordListSerializer(read_only=True)

    class Meta:
        model = Bookmark
        fields = ("id", "word", "created_at")


# ── CSV Import ─────────────────────────────────────────────────────────────

class WordImportSerializer(serializers.Serializer):
    """Nhận file CSV upload cho bulk import."""

    file = serializers.FileField(
        help_text="CSV header: text,phonetic,part_of_speech,"
                  "definition_en,definition_vi,example_en,example_vi,level,image_url"
    )

    def validate_file(self, value):
        if not value.name.lower().endswith(".csv"):
            raise serializers.ValidationError("Chỉ chấp nhận file .csv.")
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("File không được vượt quá 5 MB.")
        return value


# ── WordSet word management ────────────────────────────────────────────────

class AddWordToSetSerializer(serializers.Serializer):
    word_id = serializers.PrimaryKeyRelatedField(queryset=Word.objects.all())
    order_index = serializers.IntegerField(min_value=0, default=0)
