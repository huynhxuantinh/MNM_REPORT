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
    ListeningAnswer,
    ListeningPassage,
    ListeningQuestion,
    ListeningSession,
    Notification,
    PlacementResult,
    ReviewLog,
    Unit,
    UnitActivity,
    UnitLesson,
    UserActivityProgress,
    UserCourseProgress,
    UserStreak,
    UserUnitProgress,
    WritingSubmission,
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
            "listening_transcript",
            "listening_translation_vi",
            "listening_estimated_seconds",
            "listening_tts_lang",
            "listening_tts_rate",
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

    def validate(self, attrs):
        instance = getattr(self, "instance", None)
        skill_tag = attrs.get("skill_tag", getattr(instance, "skill_tag", Lesson.SkillTag.VOCAB))
        transcript = attrs.get(
            "listening_transcript",
            getattr(instance, "listening_transcript", ""),
        )
        is_published = attrs.get("is_published", getattr(instance, "is_published", False))

        if skill_tag == Lesson.SkillTag.LISTENING and not (transcript or "").strip():
            raise serializers.ValidationError(
                {"listening_transcript": "Listening lesson requires a transcript."}
            )

        if skill_tag == Lesson.SkillTag.LISTENING and is_published:
            if instance is None:
                word_count = 0
            else:
                word_count = instance.lesson_words.count()
            if word_count < 3:
                raise serializers.ValidationError(
                    {"is_published": "Listening lesson needs at least 3 lesson words before publishing."}
                )
        return attrs

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
    words_total = serializers.SerializerMethodField()
    words_learned = serializers.SerializerMethodField()
    user_progress = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = (
            "id",
            "title",
            "level",
            "skill_tag",
            "listening_estimated_seconds",
            "is_published",
            "words_total",
            "words_learned",
            "user_progress",
        )
        read_only_fields = fields

    def get_words_total(self, obj) -> int:
        lesson_word_count_map = self.context.get("lesson_word_count_map", {})
        return int(lesson_word_count_map.get(obj.id, 0))

    def get_words_learned(self, obj) -> int:
        lesson_learning_map = self.context.get("lesson_learning_map", {})
        return int(lesson_learning_map.get(obj.id, 0))

    def get_user_progress(self, obj) -> dict | None:
        lesson_progress_map = self.context.get("lesson_progress_map", {})
        progress = lesson_progress_map.get(obj.id)
        if not progress:
            return None
        return LessonProgressSerializer(progress).data


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
            "checkpoint_attempts",
            "checkpoint_last_attempt_at",
            "checkpoint_locked_until",
            "started_at",
            "completed_at",
        )
        read_only_fields = fields


class LearningPathUnitSerializer(serializers.ModelSerializer):
    lessons = UnitLessonPathSerializer(source="unit_lessons", many=True, read_only=True)
    lesson_count = serializers.IntegerField(read_only=True, default=0)
    progress = serializers.SerializerMethodField()
    unlocked = serializers.BooleanField(read_only=True, default=False)
    placement_recommended = serializers.BooleanField(read_only=True, default=False)

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
            "placement_recommended",
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


class UserActivityProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserActivityProgress
        fields = (
            "status",
            "score_pct",
            "xp_earned",
            "attempts_count",
            "started_at",
            "completed_at",
        )
        read_only_fields = fields


class UnitActivityPathSerializer(serializers.ModelSerializer):
    progress = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    unlocked = serializers.BooleanField(read_only=True, default=False)
    content = serializers.SerializerMethodField()
    target = serializers.SerializerMethodField()

    class Meta:
        model = UnitActivity
        fields = (
            "id",
            "activity_type",
            "title",
            "description",
            "order_index",
            "is_required",
            "is_published",
            "estimated_minutes",
            "min_score_to_pass",
            "metadata",
            "unlocked",
            "status",
            "progress",
            "content",
            "target",
        )
        read_only_fields = fields

    def get_progress(self, obj):
        progress_map = self.context.get("activity_progress_map", {})
        progress = progress_map.get(obj.id)
        if not progress:
            return None
        return UserActivityProgressSerializer(progress).data

    def get_status(self, obj) -> str:
        progress_map = self.context.get("activity_progress_map", {})
        progress = progress_map.get(obj.id)
        if progress:
            return progress.status
        return UserActivityProgress.Status.AVAILABLE if getattr(obj, "unlocked", False) else UserActivityProgress.Status.LOCKED

    def get_content(self, obj) -> dict:
        if obj.lesson_id:
            return {
                "kind": "lesson",
                "id": obj.lesson_id,
                "title": obj.lesson.title if obj.lesson else "",
                "skill_tag": obj.lesson.skill_tag if obj.lesson else "",
                "level": obj.lesson.level if obj.lesson else "",
            }
        if obj.listening_passage_id:
            return {
                "kind": "listening_passage",
                "id": obj.listening_passage_id,
                "title": obj.listening_passage.title if obj.listening_passage else "",
                "level": obj.listening_passage.level if obj.listening_passage else "",
                "estimated_seconds": obj.listening_passage.estimated_seconds if obj.listening_passage else 0,
            }
        if obj.quiz_id:
            return {
                "kind": "quiz",
                "id": obj.quiz_id,
                "title": obj.quiz.title if obj.quiz else "",
                "quiz_type": obj.quiz.quiz_type if obj.quiz else "",
            }
        return {"kind": obj.activity_type}

    def get_target(self, obj) -> dict:
        return {
            "start_api": f"/api/v1/learning/activities/{obj.id}/start/",
            "frontend_hint": obj.activity_type,
        }


class LearningPathUnitV2Serializer(serializers.ModelSerializer):
    activities = UnitActivityPathSerializer(many=True, read_only=True)
    progress = serializers.SerializerMethodField()
    unlocked = serializers.BooleanField(read_only=True, default=False)
    placement_recommended = serializers.BooleanField(read_only=True, default=False)
    activity_count = serializers.SerializerMethodField()

    class Meta:
        model = Unit
        fields = (
            "id",
            "title",
            "description",
            "order_index",
            "required_lessons_to_unlock",
            "unlocked",
            "placement_recommended",
            "activity_count",
            "progress",
            "activities",
        )
        read_only_fields = fields

    def get_progress(self, obj):
        progress_map = self.context.get("progress_map", {})
        progress = progress_map.get(obj.id)
        if not progress:
            return None
        return UserUnitProgressSerializer(progress).data

    def get_activity_count(self, obj) -> int:
        return len(list(obj.activities.all()))


class CoursePathV2Serializer(serializers.ModelSerializer):
    units = LearningPathUnitV2Serializer(many=True, read_only=True)
    progress = serializers.SerializerMethodField()
    level = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = ("id", "name", "slug", "description", "level", "progress", "units")
        read_only_fields = fields

    def get_progress(self, obj):
        progress_map = self.context.get("course_progress_map", {})
        progress = progress_map.get(obj.id)
        if not progress:
            return None
        return UserCourseProgressSerializer(progress).data

    def get_level(self, obj) -> str:
        text = f"{obj.slug} {obj.name}".upper()
        for level in ("A1", "A2", "B1", "B2", "C1", "C2"):
            if level in text:
                return level
        return ""


class WritingSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WritingSubmission
        fields = (
            "id",
            "activity",
            "prompt",
            "answer_text",
            "word_count",
            "status",
            "feedback",
            "score_pct",
            "submitted_at",
            "reviewed_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class WritingSubmitSerializer(serializers.Serializer):
    answer_text = serializers.CharField(allow_blank=False, trim_whitespace=True, max_length=5000)


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
    lesson_skill_tag = serializers.CharField(source="lesson.skill_tag", read_only=True)
    lesson_listening_transcript = serializers.CharField(source="lesson.listening_transcript", read_only=True)
    lesson_listening_translation_vi = serializers.CharField(source="lesson.listening_translation_vi", read_only=True)
    lesson_listening_estimated_seconds = serializers.IntegerField(source="lesson.listening_estimated_seconds", read_only=True)
    lesson_listening_tts_lang = serializers.CharField(source="lesson.listening_tts_lang", read_only=True)
    lesson_listening_tts_rate = serializers.FloatField(source="lesson.listening_tts_rate", read_only=True)
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
            "unit_activity",
            "lesson_title",
            "lesson_skill_tag",
            "lesson_listening_transcript",
            "lesson_listening_translation_vi",
            "lesson_listening_estimated_seconds",
            "lesson_listening_tts_lang",
            "lesson_listening_tts_rate",
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


class PlacementSkipResponseSerializer(serializers.Serializer):
    already_completed = serializers.BooleanField()
    detail = serializers.CharField()
    recommended_level = serializers.CharField()


class ListeningQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListeningQuestion
        fields = (
            "id",
            "question_type",
            "prompt",
            "choices_json",
            "correct_answer",
            "explanation",
            "order_index",
        )
        read_only_fields = fields


class ListeningQuestionAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListeningQuestion
        fields = (
            "id",
            "passage",
            "question_type",
            "prompt",
            "choices_json",
            "correct_answer",
            "explanation",
            "order_index",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate(self, attrs):
        question_type = attrs.get("question_type") or getattr(self.instance, "question_type", None)
        choices = attrs.get("choices_json", getattr(self.instance, "choices_json", [])) or []
        correct_answer = attrs.get("correct_answer", getattr(self.instance, "correct_answer", {})) or {}

        if question_type in {
            ListeningQuestion.QuestionType.MULTIPLE_CHOICE,
            ListeningQuestion.QuestionType.TRUE_FALSE,
        }:
            if not isinstance(choices, list) or len(choices) < 2:
                raise serializers.ValidationError({"choices_json": "Can it nhat 2 lua chon."})
            option = correct_answer.get("option") if isinstance(correct_answer, dict) else None
            if not option:
                raise serializers.ValidationError({"correct_answer": "Can dap an dung dang option."})
        elif question_type == ListeningQuestion.QuestionType.FILL_BLANK:
            answer_text = correct_answer.get("text") if isinstance(correct_answer, dict) else None
            if not answer_text:
                raise serializers.ValidationError({"correct_answer": "Can dap an dung dang text."})

        return attrs


class ListeningQuestionPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListeningQuestion
        fields = (
            "id",
            "question_type",
            "prompt",
            "choices_json",
            "order_index",
        )
        read_only_fields = fields


class ListeningPassageSerializer(serializers.ModelSerializer):
    question_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = ListeningPassage
        fields = (
            "id",
            "title",
            "topic",
            "level",
            "transcript",
            "translation_vi",
            "estimated_seconds",
            "tts_lang",
            "tts_rate",
            "is_published",
            "question_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class ListeningPassageAdminSerializer(serializers.ModelSerializer):
    question_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = ListeningPassage
        fields = (
            "id",
            "title",
            "topic",
            "level",
            "transcript",
            "translation_vi",
            "estimated_seconds",
            "tts_lang",
            "tts_rate",
            "is_published",
            "question_count",
            "created_by",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "question_count", "created_by", "created_at", "updated_at")

    def validate(self, attrs):
        is_published = attrs.get("is_published")
        if is_published is None and self.instance is not None:
            is_published = self.instance.is_published

        transcript = attrs.get("transcript")
        if transcript is None and self.instance is not None:
            transcript = self.instance.transcript

        if not transcript or not transcript.strip():
            raise serializers.ValidationError({"transcript": "Transcript la bat buoc."})

        if is_published:
            question_count = self.instance.questions.count() if self.instance is not None else 0
            if question_count < 3:
                raise serializers.ValidationError({"is_published": "Can it nhat 3 cau hoi truoc khi public."})

        return attrs


class ListeningPassageDetailSerializer(ListeningPassageSerializer):
    questions = ListeningQuestionPublicSerializer(many=True, read_only=True)

    class Meta(ListeningPassageSerializer.Meta):
        fields = ListeningPassageSerializer.Meta.fields + ("questions",)


class ListeningPassageAdminDetailSerializer(ListeningPassageAdminSerializer):
    questions = ListeningQuestionAdminSerializer(many=True, read_only=True)

    class Meta(ListeningPassageAdminSerializer.Meta):
        fields = ListeningPassageAdminSerializer.Meta.fields + ("questions",)


class ListeningSessionSerializer(serializers.ModelSerializer):
    passage = ListeningPassageSerializer(read_only=True)

    class Meta:
        model = ListeningSession
        fields = (
            "id",
            "status",
            "current_question_index",
            "score",
            "score_pct",
            "started_at",
            "completed_at",
            "updated_at",
            "passage",
            "unit_activity",
        )
        read_only_fields = fields


class ListeningAnswerSerializer(serializers.ModelSerializer):
    question_id = serializers.IntegerField(source="question.id", read_only=True)

    class Meta:
        model = ListeningAnswer
        fields = (
            "id",
            "question_id",
            "submitted_answer",
            "is_correct",
            "answered_at",
        )
        read_only_fields = fields


class ListeningSessionStartSerializer(serializers.Serializer):
    passage_id = serializers.PrimaryKeyRelatedField(
        source="passage", queryset=ListeningPassage.objects.filter(is_published=True)
    )


class ListeningSubmitAnswerSerializer(serializers.Serializer):
    question_id = serializers.PrimaryKeyRelatedField(
        source="question", queryset=ListeningQuestion.objects.all()
    )
    submitted_answer = serializers.JSONField(required=False, default=dict)
