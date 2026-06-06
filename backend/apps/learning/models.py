"""
Models cho module học tập: Lesson, ReviewLog (SRS), UserStreak, Notification.
"""
from datetime import timedelta

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

    class SkillTag(models.TextChoices):
        VOCAB = "vocab", "Vocabulary"
        LISTENING = "listening", "Listening"
        GRAMMAR = "grammar", "Grammar"
        MIXED = "mixed", "Mixed"

    class ContentDifficulty(models.TextChoices):
        EASY = "easy", "Easy"
        NORMAL = "normal", "Normal"
        HARD = "hard", "Hard"

    title = models.CharField("Tiêu đề", max_length=200)
    description = models.TextField("Mô tả", blank=True)
    topic = models.CharField("Topic", max_length=100, blank=True)
    skill_tag = models.CharField(
        "Skill tag", max_length=20, choices=SkillTag.choices, default=SkillTag.VOCAB
    )
    content_difficulty = models.CharField(
        "Content difficulty",
        max_length=10,
        choices=ContentDifficulty.choices,
        default=ContentDifficulty.NORMAL,
    )
    listening_transcript = models.TextField("Listening transcript", blank=True)
    listening_translation_vi = models.TextField("Listening translation", blank=True)
    listening_estimated_seconds = models.PositiveIntegerField("Listening duration", default=30)
    listening_tts_lang = models.CharField("Listening TTS language", max_length=16, default="en-US")
    listening_tts_rate = models.FloatField("Listening TTS rate", default=0.9)
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

        today = timezone.localdate()
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
    streak_freezes = models.PositiveIntegerField("So streak freeze", default=0)
    last_freeze_used_on = models.DateField("Ngay dung freeze gan nhat", null=True, blank=True)
    last_freeze_reward_streak = models.PositiveIntegerField("Last rewarded streak", default=0)

    class Meta:
        verbose_name = "Streak học tập"
        verbose_name_plural = "Streak học tập"
        db_table = "user_streaks"

    def __str__(self):
        return f"{self.user} 🔥 {self.current_streak} ngày"

    def update_streak(self) -> None:
        """Gọi mỗi khi user học hoặc ôn ≥ 1 từ trong ngày."""
        today = timezone.localdate()
        if self.last_active_date == today:
            return  # Đã cập nhật hôm nay

        if self.last_active_date == today - timedelta(days=1):
            self.current_streak += 1
        else:
            self.current_streak = 1  # Bỏ ngày → reset

        self.longest_streak = max(self.longest_streak, self.current_streak)
        self.last_active_date = today
        self.save()


class Course(models.Model):
    """Course container for learning path."""

    name = models.CharField("Course name", max_length=200)
    slug = models.SlugField("Slug", max_length=80, unique=True)
    description = models.TextField("Description", blank=True)
    is_active = models.BooleanField("Active", default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Course"
        verbose_name_plural = "Courses"
        db_table = "courses"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Unit(models.Model):
    """Unit in a course."""

    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="units",
        verbose_name="Course",
    )
    title = models.CharField("Title", max_length=200)
    description = models.TextField("Description", blank=True)
    order_index = models.PositiveIntegerField("Order", default=0)
    required_lessons_to_unlock = models.PositiveIntegerField(
        "Required lessons for next unit", default=1
    )
    is_published = models.BooleanField("Published", default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Unit"
        verbose_name_plural = "Units"
        db_table = "units"
        ordering = ["order_index"]
        unique_together = [("course", "order_index")]

    def __str__(self):
        return f"{self.course.name} - Unit {self.order_index}: {self.title}"


class UnitLesson(models.Model):
    """Mapping between unit and lesson."""

    unit = models.ForeignKey(
        Unit,
        on_delete=models.CASCADE,
        related_name="unit_lessons",
        verbose_name="Unit",
    )
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name="unit_links",
        verbose_name="Lesson",
    )
    order_index = models.PositiveIntegerField("Order", default=0)

    class Meta:
        verbose_name = "Unit lesson"
        verbose_name_plural = "Unit lessons"
        db_table = "unit_lessons"
        ordering = ["order_index"]
        unique_together = [("unit", "lesson"), ("unit", "order_index")]

    def __str__(self):
        return f"{self.unit.title} -> {self.lesson.title}"


class UserUnitProgress(models.Model):
    """Progress of a user for a unit."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="unit_progress",
        verbose_name="User",
    )
    unit = models.ForeignKey(
        Unit,
        on_delete=models.CASCADE,
        related_name="progress",
        verbose_name="Unit",
    )
    completed_lessons = models.PositiveIntegerField("Completed lessons", default=0)
    total_xp_earned = models.PositiveIntegerField("Total XP earned", default=0)
    checkpoint_passed = models.BooleanField("Checkpoint passed", default=False)
    checkpoint_passed_at = models.DateTimeField("Checkpoint passed at", null=True, blank=True)
    started_at = models.DateTimeField("Started at", null=True, blank=True)
    completed_at = models.DateTimeField("Completed at", null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "User unit progress"
        verbose_name_plural = "User unit progress"
        db_table = "user_unit_progress"
        unique_together = [("user", "unit")]
        indexes = [
            models.Index(fields=["user", "unit"]),
        ]

    def __str__(self):
        return f"{self.user} - {self.unit}: {self.completed_lessons}"


class UserCourseProgress(models.Model):
    """Aggregated progress of a user for a course."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="course_progress",
        verbose_name="User",
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="progress",
        verbose_name="Course",
    )
    completed_units = models.PositiveIntegerField("Completed units", default=0)
    total_xp_earned = models.PositiveIntegerField("Total XP earned", default=0)
    last_unit = models.ForeignKey(
        Unit,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
        verbose_name="Last active unit",
    )
    started_at = models.DateTimeField("Started at", null=True, blank=True)
    completed_at = models.DateTimeField("Completed at", null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "User course progress"
        verbose_name_plural = "User course progress"
        db_table = "user_course_progress"
        unique_together = [("user", "course")]
        indexes = [models.Index(fields=["user", "course"])]

    def __str__(self):
        return f"{self.user} - {self.course}: {self.completed_units}"


class LearningSession(models.Model):
    """Short learning session."""

    class Status(models.TextChoices):
        STARTED = "started", "Started"
        COMPLETED = "completed", "Completed"
        ABANDONED = "abandoned", "Abandoned"

    class SessionType(models.TextChoices):
        LESSON = "lesson", "Lesson"
        CHECKPOINT = "checkpoint", "Checkpoint"

    class Difficulty(models.TextChoices):
        EASY = "easy", "Easy"
        NORMAL = "normal", "Normal"
        HARD = "hard", "Hard"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="learning_sessions",
        verbose_name="User",
    )
    unit = models.ForeignKey(
        Unit,
        on_delete=models.CASCADE,
        related_name="sessions",
        verbose_name="Unit",
    )
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name="sessions",
        verbose_name="Lesson",
    )
    status = models.CharField(
        "Status", max_length=16, choices=Status.choices, default=Status.STARTED
    )
    session_type = models.CharField(
        "Session type", max_length=16, choices=SessionType.choices, default=SessionType.LESSON
    )
    difficulty = models.CharField(
        "Difficulty", max_length=10, choices=Difficulty.choices, default=Difficulty.NORMAL
    )
    exercises = models.JSONField("Exercises", default=list, blank=True)
    total_answered = models.PositiveIntegerField("Total answered", default=0)
    correct_answered = models.PositiveIntegerField("Correct answered", default=0)
    xp_earned = models.PositiveIntegerField("XP earned", default=0)
    started_at = models.DateTimeField("Started at", auto_now_add=True)
    completed_at = models.DateTimeField("Completed at", null=True, blank=True)

    class Meta:
        verbose_name = "Learning session"
        verbose_name_plural = "Learning session"
        db_table = "learning_sessions"
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["unit", "lesson"]),
            models.Index(fields=["started_at"]),
        ]

    def __str__(self):
        return f"{self.user} - {self.lesson} ({self.status})"


class ListeningPassage(models.Model):
    """Standalone listening passage for the dedicated listening module."""

    title = models.CharField("Title", max_length=200)
    topic = models.CharField("Topic", max_length=100, blank=True)
    level = models.CharField(
        "Level",
        max_length=10,
        choices=Lesson.Level.choices,
        default=Lesson.Level.A1,
    )
    transcript = models.TextField("Transcript")
    translation_vi = models.TextField("Vietnamese translation", blank=True)
    estimated_seconds = models.PositiveIntegerField("Estimated seconds", default=30)
    tts_lang = models.CharField("TTS language", max_length=16, default="en-US")
    tts_rate = models.FloatField("TTS rate", default=0.9)
    is_published = models.BooleanField("Published", default=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="listening_passages_created",
        verbose_name="Created by",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Listening passage"
        verbose_name_plural = "Listening passages"
        db_table = "listening_passages"
        ordering = ["level", "title"]
        indexes = [
            models.Index(fields=["is_published", "level"]),
            models.Index(fields=["topic", "level"]),
        ]

    def __str__(self):
        return f"[{self.level}] {self.title}"


class ListeningQuestion(models.Model):
    """Question attached to one listening passage."""

    class QuestionType(models.TextChoices):
        MULTIPLE_CHOICE = "multiple_choice", "Multiple Choice"
        TRUE_FALSE = "true_false", "True/False"
        FILL_BLANK = "fill_blank", "Fill Blank"

    passage = models.ForeignKey(
        ListeningPassage,
        on_delete=models.CASCADE,
        related_name="questions",
        verbose_name="Passage",
    )
    question_type = models.CharField(
        "Question type",
        max_length=32,
        choices=QuestionType.choices,
        default=QuestionType.MULTIPLE_CHOICE,
    )
    prompt = models.TextField("Prompt")
    choices_json = models.JSONField("Choices", default=list, blank=True)
    correct_answer = models.JSONField("Correct answer", default=dict, blank=True)
    explanation = models.TextField("Explanation", blank=True)
    order_index = models.PositiveIntegerField("Order", default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Listening question"
        verbose_name_plural = "Listening questions"
        db_table = "listening_questions"
        ordering = ["order_index", "id"]
        unique_together = [("passage", "order_index")]
        indexes = [
            models.Index(fields=["passage", "order_index"]),
        ]

    def __str__(self):
        return f"{self.passage.title} - Q{self.order_index}"


class ListeningSession(models.Model):
    """One user attempt for a listening passage."""

    class Status(models.TextChoices):
        STARTED = "started", "Started"
        COMPLETED = "completed", "Completed"
        ABANDONED = "abandoned", "Abandoned"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="listening_sessions",
        verbose_name="User",
    )
    passage = models.ForeignKey(
        ListeningPassage,
        on_delete=models.CASCADE,
        related_name="sessions",
        verbose_name="Passage",
    )
    status = models.CharField(
        "Status", max_length=16, choices=Status.choices, default=Status.STARTED
    )
    current_question_index = models.PositiveIntegerField("Current question index", default=0)
    score = models.PositiveIntegerField("Score", default=0)
    score_pct = models.FloatField("Score percent", default=0)
    started_at = models.DateTimeField("Started at", auto_now_add=True)
    completed_at = models.DateTimeField("Completed at", null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Listening session"
        verbose_name_plural = "Listening sessions"
        db_table = "listening_sessions"
        ordering = ["-started_at"]
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["passage", "status"]),
        ]

    def __str__(self):
        return f"{self.user} - {self.passage} ({self.status})"


class ListeningAnswer(models.Model):
    """One submitted answer inside a listening session."""

    session = models.ForeignKey(
        ListeningSession,
        on_delete=models.CASCADE,
        related_name="answers",
        verbose_name="Session",
    )
    question = models.ForeignKey(
        ListeningQuestion,
        on_delete=models.CASCADE,
        related_name="answers",
        verbose_name="Question",
    )
    submitted_answer = models.JSONField("Submitted answer", default=dict, blank=True)
    is_correct = models.BooleanField("Correct", default=False)
    answered_at = models.DateTimeField("Answered at", auto_now_add=True)

    class Meta:
        verbose_name = "Listening answer"
        verbose_name_plural = "Listening answers"
        db_table = "listening_answers"
        unique_together = [("session", "question")]
        indexes = [
            models.Index(fields=["session", "question"]),
        ]

    def __str__(self):
        return f"Session {self.session_id} - question {self.question_id}"


class Exercise(models.Model):
    """Exercise template bank attached to a lesson."""

    class ExerciseType(models.TextChoices):
        MC_MEANING = "mc_meaning", "Multiple Choice Meaning"
        LISTEN_CHOOSE_WORD = "listen_choose_word", "Listen Choose Word"
        FILL_BLANK = "fill_blank", "Fill Blank"
        WORD_ORDER = "word_order", "Word Order"

    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name="exercise_bank",
        verbose_name="Lesson",
    )
    step_index = models.PositiveIntegerField("Step index", default=1)
    exercise_type = models.CharField(
        "Exercise type",
        max_length=40,
        choices=ExerciseType.choices,
        default=ExerciseType.MC_MEANING,
    )
    prompt = models.TextField("Prompt")
    payload = models.JSONField("Payload", default=dict, blank=True)
    is_active = models.BooleanField("Active", default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Exercise template"
        verbose_name_plural = "Exercise templates"
        db_table = "learning_exercises"
        ordering = ["step_index", "id"]
        unique_together = [("lesson", "step_index", "exercise_type")]
        indexes = [
            models.Index(fields=["lesson", "is_active"]),
            models.Index(fields=["lesson", "step_index"]),
        ]

    def __str__(self):
        return f"{self.lesson.title} - {self.exercise_type}#{self.step_index}"


class ExerciseAttempt(models.Model):
    """One answer attempt in a session."""

    session = models.ForeignKey(
        LearningSession,
        on_delete=models.CASCADE,
        related_name="attempts",
        verbose_name="Session",
    )
    step_index = models.PositiveIntegerField("Step index")
    exercise_type = models.CharField("Exercise type", max_length=50, default="mc")
    prompt = models.TextField("Prompt", blank=True)
    submitted_answer = models.JSONField("Submitted answer", default=dict, blank=True)
    is_correct = models.BooleanField("Correct")
    response_ms = models.PositiveIntegerField("Response ms", default=0)
    awarded_xp = models.PositiveIntegerField("Awarded XP", default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Exercise attempt"
        verbose_name_plural = "Exercise attempts"
        db_table = "exercise_attempts"
        indexes = [
            models.Index(fields=["session", "step_index"]),
            models.Index(fields=["created_at"]),
        ]
        unique_together = [("session", "step_index")]

    def __str__(self):
        return f"Session {self.session_id} - step {self.step_index}"


class LearningEvent(models.Model):
    """Analytics event for learning flow."""

    class EventType(models.TextChoices):
        SESSION_START = "session_start", "Session Start"
        ANSWER_SUBMIT = "answer_submit", "Answer Submit"
        SESSION_FINISH = "session_finish", "Session Finish"
        SESSION_QUIT = "session_quit", "Session Quit"
        CHECKPOINT_SUBMIT = "checkpoint_submit", "Checkpoint Submit"
        EXPERIMENT_METRIC = "experiment_metric", "Experiment Metric"
        ONBOARDING_STEP = "onboarding_step", "Onboarding Step"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="learning_events",
        verbose_name="User",
    )
    session = models.ForeignKey(
        LearningSession,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="events",
        verbose_name="Session",
    )
    event_type = models.CharField("Event type", max_length=32, choices=EventType.choices)
    meta = models.JSONField("Event meta", default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Learning event"
        verbose_name_plural = "Learning events"
        db_table = "learning_events"
        indexes = [
            models.Index(fields=["event_type", "created_at"]),
            models.Index(fields=["user", "created_at"]),
            models.Index(fields=["session", "created_at"]),
        ]


class DailyGoal(models.Model):
    """Daily goal settings per user."""

    class GoalMinutes(models.IntegerChoices):
        FIVE = 5, "5 minutes"
        TEN = 10, "10 minutes"
        FIFTEEN = 15, "15 minutes"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="daily_goal",
        verbose_name="User",
    )
    target_minutes = models.PositiveIntegerField(
        "Daily target minutes",
        choices=GoalMinutes.choices,
        default=GoalMinutes.TEN,
    )
    reward_xp = models.PositiveIntegerField("Reward XP", default=15)
    is_active = models.BooleanField("Active", default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Daily goal"
        verbose_name_plural = "Daily goals"
        db_table = "daily_goals"


class DailyGoalLog(models.Model):
    """Per-day progress for daily goal."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="daily_goal_logs",
        verbose_name="User",
    )
    goal = models.ForeignKey(
        DailyGoal,
        on_delete=models.CASCADE,
        related_name="logs",
        verbose_name="Daily goal",
    )
    goal_date = models.DateField("Date")
    studied_minutes = models.PositiveIntegerField("Studied minutes", default=0)
    goal_minutes = models.PositiveIntegerField("Goal minutes", default=10)
    is_achieved = models.BooleanField("Achieved", default=False)
    achieved_at = models.DateTimeField("Achieved at", null=True, blank=True)
    claimed_at = models.DateTimeField("Claimed at", null=True, blank=True)
    reward_xp_awarded = models.PositiveIntegerField("Reward XP awarded", default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Daily goal log"
        verbose_name_plural = "Daily goal logs"
        db_table = "daily_goal_logs"
        unique_together = [("user", "goal_date")]
        indexes = [
            models.Index(fields=["user", "goal_date"]),
            models.Index(fields=["goal_date", "is_achieved"]),
        ]


class UserHearts(models.Model):
    """Lives/hearts with time-based refill."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="hearts",
        verbose_name="User",
    )
    current_hearts = models.PositiveIntegerField("Current hearts", default=10)
    max_hearts = models.PositiveIntegerField("Max hearts", default=10)
    refill_interval_minutes = models.PositiveIntegerField("Refill interval minutes", default=10)
    last_refill_at = models.DateTimeField("Last refill at", default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "User hearts"
        verbose_name_plural = "User hearts"
        db_table = "user_hearts"


class HeartTransaction(models.Model):
    """Heart transaction log."""

    class TxType(models.TextChoices):
        CONSUME = "consume", "Consume"
        REFILL = "refill", "Refill"
        BONUS = "bonus", "Bonus"

    hearts = models.ForeignKey(
        UserHearts,
        on_delete=models.CASCADE,
        related_name="transactions",
        verbose_name="User hearts",
    )
    transaction_type = models.CharField("Type", max_length=16, choices=TxType.choices)
    delta = models.IntegerField("Delta")
    reason = models.CharField("Reason", max_length=120, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Heart transaction"
        verbose_name_plural = "Heart transactions"
        db_table = "heart_transactions"
        indexes = [models.Index(fields=["hearts", "created_at"])]


class PlacementResult(models.Model):
    """Placement test result for onboarding."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="placement_results",
        verbose_name="User",
    )
    recommended_level = models.CharField("Recommended level", max_length=10, blank=True)
    score_pct = models.FloatField("Score percent", default=0)
    total_questions = models.PositiveIntegerField("Total questions", default=0)
    correct_answers = models.PositiveIntegerField("Correct answers", default=0)
    answers = models.JSONField("Answer payload", default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Placement result"
        verbose_name_plural = "Placement results"
        db_table = "placement_results"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "created_at"]),
        ]


class ExperimentConfig(models.Model):
    """Experiment config for A/B test rollout."""

    key = models.CharField("Experiment key", max_length=80, unique=True)
    description = models.CharField("Description", max_length=255, blank=True)
    variants = models.JSONField("Variants", default=list, blank=True)
    is_active = models.BooleanField("Active", default=False)
    started_at = models.DateTimeField("Started at", null=True, blank=True)
    ended_at = models.DateTimeField("Ended at", null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Experiment config"
        verbose_name_plural = "Experiment configs"
        db_table = "learning_experiment_configs"

    def __str__(self):
        return self.key


class ExperimentAssignment(models.Model):
    """Persisted assignment for user -> experiment variant."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="learning_experiment_assignments",
        verbose_name="User",
    )
    experiment = models.ForeignKey(
        ExperimentConfig,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assignments",
        verbose_name="Experiment config",
    )
    experiment_key = models.CharField("Experiment key", max_length=80)
    variant_name = models.CharField("Variant name", max_length=80)
    variant_payload = models.JSONField("Variant payload", default=dict, blank=True)
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Experiment assignment"
        verbose_name_plural = "Experiment assignments"
        db_table = "learning_experiment_assignments"
        unique_together = [("user", "experiment_key")]
        indexes = [
            models.Index(fields=["experiment_key", "variant_name"]),
            models.Index(fields=["user", "experiment_key"]),
        ]


class LeagueSeason(models.Model):
    """Weekly league season."""

    code = models.CharField("Season code", max_length=40, unique=True)
    title = models.CharField("Title", max_length=120)
    start_date = models.DateField("Start date")
    end_date = models.DateField("End date")
    is_active = models.BooleanField("Is active", default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "League season"
        verbose_name_plural = "League seasons"
        db_table = "learning_league_seasons"
        ordering = ["-start_date"]
        indexes = [
            models.Index(fields=["is_active", "start_date"]),
        ]

    def __str__(self):
        return f"{self.title} ({self.start_date} - {self.end_date})"


class LeagueStanding(models.Model):
    """Snapshot standing for one user in a season."""

    season = models.ForeignKey(
        LeagueSeason,
        on_delete=models.CASCADE,
        related_name="standings",
        verbose_name="Season",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="league_standings",
        verbose_name="User",
    )
    rank = models.PositiveIntegerField("Rank", default=0)
    xp_earned = models.PositiveIntegerField("XP earned", default=0)
    sessions_completed = models.PositiveIntegerField("Sessions completed", default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "League standing"
        verbose_name_plural = "League standings"
        db_table = "learning_league_standings"
        unique_together = [("season", "user")]
        ordering = ["rank", "-xp_earned", "-sessions_completed"]
        indexes = [
            models.Index(fields=["season", "rank"]),
            models.Index(fields=["user", "season"]),
        ]


class UserReminderPreference(models.Model):
    """Preferred hour for reminder delivery."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="learning_reminder_pref",
        verbose_name="User",
    )
    preferred_hour = models.PositiveSmallIntegerField("Preferred hour", null=True, blank=True)
    last_activity_at = models.DateTimeField("Last activity at", null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "User reminder preference"
        verbose_name_plural = "User reminder preferences"
        db_table = "user_reminder_preferences"


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

