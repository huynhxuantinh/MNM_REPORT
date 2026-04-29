"""Serializers cho learning module."""
from rest_framework import serializers

from apps.vocabulary.serializers import WordListSerializer
from .models import Assignment, Lesson, LessonProgress, LessonWord, Notification, ReviewLog, StudentClass, UserStreak


# ── Lesson ─────────────────────────────────────────────────────────────────

class LessonWordSerializer(serializers.ModelSerializer):
    word = WordListSerializer(read_only=True)
    word_id = serializers.PrimaryKeyRelatedField(
        source="word", write_only=True,
        queryset=__import__("apps.vocabulary.models", fromlist=["Word"]).Word.objects.all(),
    )

    class Meta:
        model = LessonWord
        fields = ("id", "word", "word_id", "order_index")


class LessonSerializer(serializers.ModelSerializer):
    word_count = serializers.IntegerField(read_only=True, default=0)
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = (
            "id", "title", "description", "level", "order_index",
            "is_published", "word_count", "created_by", "created_by_name",
            "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_by", "created_at", "updated_at")

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.full_name or obj.created_by.username
        return None


class LessonDetailSerializer(LessonSerializer):
    words = LessonWordSerializer(source="lesson_words", many=True, read_only=True)
    user_progress = serializers.SerializerMethodField()

    class Meta(LessonSerializer.Meta):
        fields = LessonSerializer.Meta.fields + ("words", "user_progress")

    def get_user_progress(self, obj):
        request = self.context.get("request")
        if not request:
            return None
        progress = LessonProgress.objects.filter(user=request.user, lesson=obj).first()
        if not progress:
            return None
        return LessonProgressSerializer(progress).data


# ── Assignment ─────────────────────────────────────────────────────────────

class AssignmentSerializer(serializers.ModelSerializer):
    lesson_title = serializers.CharField(source="lesson.title", read_only=True)
    student_email = serializers.CharField(source="student.email", read_only=True)
    teacher_email = serializers.CharField(source="teacher.email", read_only=True)
    is_completed = serializers.BooleanField(read_only=True)

    class Meta:
        model = Assignment
        fields = (
            "id", "lesson", "lesson_title",
            "student", "student_email",
            "teacher", "teacher_email",
            "due_date", "completed_at", "is_completed", "created_at",
        )
        read_only_fields = ("id", "teacher", "completed_at", "created_at")


class AssignmentCreateSerializer(serializers.Serializer):
    """Giao bài cho nhiều học sinh cùng lúc."""

    lesson_id = serializers.PrimaryKeyRelatedField(
        queryset=Lesson.objects.filter(is_published=True), source="lesson"
    )
    student_ids = serializers.ListField(
        child=serializers.IntegerField(), min_length=1
    )
    due_date = serializers.DateField(required=False, allow_null=True)


# ── LessonProgress ─────────────────────────────────────────────────────────

class LessonProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonProgress
        fields = ("id", "lesson", "started_at", "completed_at")
        read_only_fields = ("id", "lesson", "started_at", "completed_at")


# ── ReviewLog ──────────────────────────────────────────────────────────────

class ReviewWordSerializer(WordListSerializer):
    """WordListSerializer mở rộng thêm ví dụ – dùng riêng cho trang ôn tập."""

    class Meta(WordListSerializer.Meta):
        fields = WordListSerializer.Meta.fields + (
            "definition_en", "example_en", "example_vi",
        )


class ReviewLogSerializer(serializers.ModelSerializer):
    word = ReviewWordSerializer(read_only=True)

    class Meta:
        model = ReviewLog
        fields = (
            "id", "word", "easiness_factor", "repetitions", "interval_days",
            "last_reviewed", "next_review_date", "total_reviews", "correct_count",
        )
        read_only_fields = fields


class ReviewAnswerSerializer(serializers.Serializer):
    quality = serializers.IntegerField(min_value=0, max_value=5)


# ── UserStreak ─────────────────────────────────────────────────────────────

class UserStreakSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserStreak
        fields = ("current_streak", "longest_streak", "last_active_date")
        read_only_fields = fields


# ── StudentClass ───────────────────────────────────────────────────────────

class StudentClassSerializer(serializers.ModelSerializer):
    student_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = StudentClass
        fields = ("id", "name", "teacher", "student_count", "created_at")
        read_only_fields = ("id", "teacher", "created_at")


class StudentClassDetailSerializer(StudentClassSerializer):
    students = serializers.SerializerMethodField()

    class Meta(StudentClassSerializer.Meta):
        fields = StudentClassSerializer.Meta.fields + ("students",)

    def get_students(self, obj):
        return list(
            obj.students.all().values("id", "username", "full_name", "email", "xp", "level")
        )


# ── Notification ───────────────────────────────────────────────────────────

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ("id", "type", "message", "is_read", "related_id", "created_at")
        read_only_fields = fields
