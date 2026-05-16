"""Serializers for learning module."""
from rest_framework import serializers

from apps.vocabulary.models import Word
from apps.vocabulary.serializers import WordListSerializer
from .models import (
    Course,
    ExerciseAttempt,
    LearningSession,
    Lesson,
    LessonProgress,
    LessonWord,
    Notification,
    PlacementResult,
    ReviewLog,
    Unit,
    UnitLesson,
    UserCourseProgress,
    UserStreak,
    UserUnitProgress,
)


class LessonWordSerializer(serializers.ModelSerializer):
    word = WordListSerializer(read_only=True)
    word_id = serializers.PrimaryKeyRelatedField(
        source="word", write_only=True, queryset=Word.objects.all()
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
            "id",
            "title",
            "description",
            "topic",
            "skill_tag",
            "content_difficulty",
            "level",
            "order_index",
            "is_published",
            "word_count",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_by", "created_at", "updated_at")

    def get_created_by_name(self, obj) -> str | None:
        if obj.created_by:
            return obj.created_by.full_name or obj.created_by.username
        return None


class LessonDetailSerializer(LessonSerializer):
    words = LessonWordSerializer(source="lesson_words", many=True, read_only=True)
    user_progress = serializers.SerializerMethodField()

    class Meta(LessonSerializer.Meta):
        fields = LessonSerializer.Meta.fields + ("words", "user_progress")

    def get_user_progress(self, obj) -> dict | None:
        request = self.context.get("request")
        if not request:
            return None
        progress = LessonProgress.objects.filter(user=request.user, lesson=obj).first()
        if not progress:
            return None
        return LessonProgressSerializer(progress).data


class LessonProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonProgress
        fields = ("id", "lesson", "started_at", "completed_at")
        read_only_fields = ("id", "lesson", "started_at", "completed_at")


# Learning path + session (Duolingo-like)
class LearningPathLessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = ("id", "title", "level", "is_published")
        read_only_fields = fields


class UnitLessonPathSerializer(serializers.ModelSerializer):
    lesson = LearningPathLessonSerializer(read_only=True)

    class Meta:
        model = UnitLesson
        fields = ("order_index", "lesson")
        read_only_fields = fields


class UserUnitProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserUnitProgress
        fields = (
            "completed_lessons",
            "total_xp_earned",
            "checkpoint_passed",
            "checkpoint_passed_at",
            "started_at",
            "completed_at",
        )
        read_only_fields = fields


class LearningPathUnitSerializer(serializers.ModelSerializer):
    lessons = UnitLessonPathSerializer(source="unit_lessons", many=True, read_only=True)
    lesson_count = serializers.IntegerField(read_only=True, default=0)
    progress = serializers.SerializerMethodField()
    unlocked = serializers.BooleanField(read_only=True, default=False)

    class Meta:
        model = Unit
        fields = (
            "id",
            "title",
            "description",
            "order_index",
            "required_lessons_to_unlock",
            "lesson_count",
            "unlocked",
            "progress",
            "lessons",
        )
        read_only_fields = fields

    def get_progress(self, obj):
        progress_map = self.context.get("progress_map", {})
        progress = progress_map.get(obj.id)
        if not progress:
            return None
        return UserUnitProgressSerializer(progress).data


class CoursePathSerializer(serializers.ModelSerializer):
    progress = serializers.SerializerMethodField()
    units = LearningPathUnitSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = ("id", "name", "slug", "description", "progress", "units")
        read_only_fields = fields

    def get_progress(self, obj):
        progress_map = self.context.get("course_progress_map", {})
        progress = progress_map.get(obj.id)
        if not progress:
            return None
        return UserCourseProgressSerializer(progress).data


class UserCourseProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserCourseProgress
        fields = (
            "completed_units",
            "total_xp_earned",
            "last_unit",
            "started_at",
            "completed_at",
        )
        read_only_fields = fields


class LearningSessionSerializer(serializers.ModelSerializer):
    lesson_title = serializers.CharField(source="lesson.title", read_only=True)
    unit_title = serializers.CharField(source="unit.title", read_only=True)

    class Meta:
        model = LearningSession
        fields = (
            "id",
            "status",
            "session_type",
            "difficulty",
            "unit",
            "unit_title",
            "lesson",
            "lesson_title",
            "total_answered",
            "correct_answered",
            "xp_earned",
            "started_at",
            "completed_at",
        )
        read_only_fields = fields


class LearningSessionStartSerializer(serializers.Serializer):
    lesson_id = serializers.PrimaryKeyRelatedField(
        source="lesson", queryset=Lesson.objects.filter(is_published=True)
    )


class LearningSessionAnswerSerializer(serializers.Serializer):
    step_index = serializers.IntegerField(min_value=1)
    submitted_answer = serializers.JSONField(required=False, default=dict)
    response_ms = serializers.IntegerField(min_value=0, default=0)


class LearningCheckpointStartSerializer(serializers.Serializer):
    unit_id = serializers.PrimaryKeyRelatedField(source="unit", queryset=Unit.objects.filter(is_published=True))


class ExerciseAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExerciseAttempt
        fields = (
            "id",
            "step_index",
            "exercise_type",
            "prompt",
            "submitted_answer",
            "is_correct",
            "response_ms",
            "awarded_xp",
            "created_at",
        )
        read_only_fields = fields


class ReviewWordSerializer(WordListSerializer):
    class Meta(WordListSerializer.Meta):
        fields = WordListSerializer.Meta.fields + (
            "definition_en",
            "example_en",
            "example_vi",
        )


class ReviewLogSerializer(serializers.ModelSerializer):
    word = ReviewWordSerializer(read_only=True)

    class Meta:
        model = ReviewLog
        fields = (
            "id",
            "word",
            "easiness_factor",
            "repetitions",
            "interval_days",
            "last_reviewed",
            "next_review_date",
            "total_reviews",
            "correct_count",
        )
        read_only_fields = fields


class ReviewAnswerSerializer(serializers.Serializer):
    quality = serializers.IntegerField(min_value=0, max_value=5)


class UserStreakSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserStreak
        fields = ("current_streak", "longest_streak", "last_active_date")
        read_only_fields = fields


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ("id", "type", "message", "is_read", "related_id", "created_at")
        read_only_fields = fields


class PlacementAnswerSerializer(serializers.Serializer):
    question_id = serializers.IntegerField(min_value=1)
    option = serializers.CharField(allow_blank=True, max_length=500)


class PlacementSubmitSerializer(serializers.Serializer):
    answers = PlacementAnswerSerializer(many=True, min_length=1)


class PlacementResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlacementResult
        fields = (
            "id",
            "recommended_level",
            "score_pct",
            "total_questions",
            "correct_answers",
            "created_at",
        )
        read_only_fields = fields
