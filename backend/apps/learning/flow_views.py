"""Flow-facing learning views (B2C learner journey)."""

from collections import defaultdict
from datetime import timedelta
import time

from django.core.cache import cache
from django.db import transaction
from django.db.models import Count, F
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema

from apps.vocabulary.models import Word
from .exercise_engine import evaluate_exercise_answer, generate_exercises_from_words, to_client_exercise
from .models import (
    Course,
    DailyGoalLog,
    ExerciseAttempt,
    ExperimentAssignment,
    LearningEvent,
    LearningSession,
    Lesson,
    LessonWord,
    LessonProgress,
    Notification,
    PlacementResult,
    ReviewLog,
    Unit,
    UnitLesson,
    UserCourseProgress,
    UserUnitProgress,
)
from .serializers import (
    CoursePathSerializer,
    ExerciseAttemptSerializer,
    LearningPathUnitSerializer,
    LearningCheckpointStartSerializer,
    LearningSessionAnswerSerializer,
    LearningSessionSerializer,
    LearningSessionStartSerializer,
    PlacementSkipResponseSerializer,
    PlacementResultSerializer,
    PlacementSubmitSerializer,
    ReviewAnswerSerializer,
    ReviewLogSerializer,
)
from .experiments import DAILY_GOAL_EXPERIMENT_KEY, HEARTS_EXPERIMENT_KEY, track_experiment_metric
from .shared_flow import (
    HEARTS_MIN_RESPONSE_STATUS,
    PLACEMENT_CACHE_TTL_SECONDS,
    PLACEMENT_DEFAULT_QUESTION_COUNT,
    PLACEMENT_MIN_SUBMIT_QUESTIONS,
    SESSION_RECOVER_STALE_HOURS,
    REVIEW_SESSION_LIMIT,
    STREAK_FREEZE_XP_COST,
    XP_REVIEW_CORRECT,
    XP_REVIEW_WRONG,
    _apply_learning_rewards,
    _build_unlock_map,
    _build_session_summary,
    _build_hearts_payload,
    _build_exercises_from_bank,
    _build_placement_questions,
    _bump_word_to_early_review,
    _create_level_up_notification,
    _consume_heart,
    _detect_difficulty,
    _detect_difficulty_with_context,
    _compute_recommended_level,
    _count_wrong_attempts_for_word,
    _detect_suspicious_answer,
    _get_awarded_xp,
    _get_or_create_daily_goal,
    _get_consecutive_correct_streak,
    _get_consecutive_wrong_streak,
    _get_checkpoint_lock_info,
    _get_expected_step_index,
    _grant_heart_bonus,
    _get_or_create_streak,
    _get_heart_cost,
    _get_or_create_hearts,
    _get_today_goal_log,
    _get_user_recommended_level,
    _user_localdate,
    _normalize_response_ms,
    _placement_cache_key,
    _placement_submit_result_cache_key,
    _refill_hearts,
    _register_checkpoint_result,
    _resolve_recommended_start_unit,
    _extract_unit_words,
    _ensure_session_words_in_review,
    _estimate_session_minutes,
    _is_unit_unlocked,
    _track_learning_event,
    _track_onboarding_step,
    _update_course_progress,
)
from .throttles import (
    LearningCheckpointStartRateThrottle,
    LearningCheckpointSubmitRateThrottle,
    LearningSessionAnswerBurstThrottle,
    LearningSessionAnswerSustainedThrottle,
    LearningSessionFinishRateThrottle,
    LearningSessionQuitRateThrottle,
    LearningSessionStartRateThrottle,
)

ALLOWED_FLOW_SOURCES = {
    "unknown",
    "home_page",
    "learning_page",
    "learning_path",
    "placement_page",
    "placement_result_cta",
    "notification",
    "deep_link",
}
RECOVER_EMPTY_SESSION_GRACE_MINUTES = 15


def _get_primary_active_course():
    return (
        Course.objects
        .filter(is_active=True)
        .prefetch_related("units__unit_lessons__lesson")
        .order_by("id")
        .first()
    )


def _get_filtered_units(course, skill_tag: str | None = None):
    units = [unit for unit in course.units.all() if unit.is_published]
    if skill_tag is None:
        return units

    filtered = []
    for unit in units:
        published_links = [
            link for link in unit.unit_lessons.all()
            if link.lesson and link.lesson.is_published and link.lesson.skill_tag == skill_tag
        ]
        if not published_links:
            continue
        unit.unit_lessons_filtered = published_links
        filtered.append(unit)
    return filtered


def _build_course_path_payload_for_units(request, course, units):
    lesson_ids = []
    for unit in units:
        links = getattr(unit, "unit_lessons_filtered", None) or list(unit.unit_lessons.all())
        for link in links:
            if link.lesson and link.lesson.is_published:
                lesson_ids.append(link.lesson_id)
    lesson_ids = sorted(set(lesson_ids))

    lesson_word_count_map = {
        item["lesson_id"]: int(item["total"])
        for item in (
            LessonWord.objects
            .filter(lesson_id__in=lesson_ids)
            .values("lesson_id")
            .annotate(total=Count("word_id", distinct=True))
        )
    }
    learned_word_map = defaultdict(set)
    sessions = (
        LearningSession.objects
        .filter(
            user=request.user,
            lesson_id__in=lesson_ids,
            session_type=LearningSession.SessionType.LESSON,
        )
        .prefetch_related("attempts")
    )
    for session in sessions:
        attempted_steps = set(session.attempts.values_list("step_index", flat=True))
        if not attempted_steps:
            continue
        for exercise in session.exercises or []:
            step_index = int(exercise.get("step_index") or 0)
            if step_index not in attempted_steps:
                continue
            word_id = int(exercise.get("word_id") or 0)
            if word_id > 0:
                learned_word_map[session.lesson_id].add(word_id)
    lesson_learning_map = {
        lesson_id: len(word_ids)
        for lesson_id, word_ids in learned_word_map.items()
    }
    lesson_progress_map = {
        item.lesson_id: item
        for item in LessonProgress.objects.filter(
            user=request.user,
            lesson_id__in=lesson_ids,
        )
    }

    progress_map = {
        item.unit_id: item
        for item in UserUnitProgress.objects.filter(
            user=request.user, unit_id__in=[unit.id for unit in units]
        )
    }
    course_progress_map = {
        item.course_id: item
        for item in UserCourseProgress.objects.filter(
            user=request.user, course_id=course.id
        )
    }
    unlocked_map = _build_unlock_map(units, progress_map)
    recommended_level = _get_user_recommended_level(request.user)
    recommended_start_unit = _resolve_recommended_start_unit(units, recommended_level)
    recommended_start_unit_id = recommended_start_unit.id if recommended_start_unit else None
    has_any_progress = bool(progress_map) or bool(lesson_progress_map)
    if not has_any_progress and recommended_start_unit:
        for unit in units:
            if unit.order_index <= recommended_start_unit.order_index:
                unlocked_map[unit.id] = True

    for unit in units:
        links = getattr(unit, "unit_lessons_filtered", None) or list(unit.unit_lessons.all())
        unit.lesson_count = sum(
            1 for link in links
            if link.lesson and link.lesson.is_published
        )
        unit.unlocked = unlocked_map.get(unit.id, False)
        unit.placement_recommended = unit.id == recommended_start_unit_id

    serializer = CoursePathSerializer(
        course,
        context={
            "request": request,
            "progress_map": progress_map,
            "course_progress_map": course_progress_map,
            "lesson_word_count_map": lesson_word_count_map,
            "lesson_learning_map": lesson_learning_map,
            "lesson_progress_map": lesson_progress_map,
        },
    )
    payload = serializer.data
    payload["units"] = LearningPathUnitSerializer(
        units,
        many=True,
        context={
            "request": request,
            "progress_map": progress_map,
            "lesson_word_count_map": lesson_word_count_map,
            "lesson_learning_map": lesson_learning_map,
            "lesson_progress_map": lesson_progress_map,
        },
    ).data
    payload["placement"] = {
        "recommended_level": recommended_level,
        "recommended_start_unit_id": recommended_start_unit_id,
    }
    return payload


def _build_session_detail_payload(request, session):
    hearts = _refill_hearts(_get_or_create_hearts(request.user))
    attempts = session.attempts.order_by("step_index")
    answered_steps = {attempt.step_index for attempt in attempts}
    safe_exercises = [to_client_exercise(item) for item in (session.exercises or [])]
    next_step = 1
    for exercise in safe_exercises:
        if exercise["step_index"] not in answered_steps:
            next_step = exercise["step_index"]
            break
    else:
        if safe_exercises:
            next_step = safe_exercises[-1]["step_index"]
    difficulty_hint_event = (
        LearningEvent.objects
        .filter(
            user=request.user,
            session=session,
            event_type=LearningEvent.EventType.EXPERIMENT_METRIC,
            meta__metric_key="difficulty_auto_adjust",
        )
        .order_by("-created_at")
        .first()
    )
    return {
        "session": LearningSessionSerializer(session).data,
        "attempts": ExerciseAttemptSerializer(attempts, many=True).data,
        "exercises": safe_exercises,
        "next_step": next_step,
        "hearts": _build_hearts_payload(hearts),
        "difficulty_hint": (
            {
                "difficulty": (difficulty_hint_event.meta or {}).get("difficulty"),
                "context": (difficulty_hint_event.meta or {}).get("context"),
            }
            if difficulty_hint_event
            else None
        ),
    }


def _start_lesson_session(request, default_source: str, required_skill_tag: str | None = None):
    start_source = _resolve_client_source(request, default=default_source)
    serializer = LearningSessionStartSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    lesson = serializer.validated_data["lesson"]

    if required_skill_tag and lesson.skill_tag != required_skill_tag:
        return Response({"detail": "Lesson này không đúng loại nội dung yêu cầu."}, status=status.HTTP_400_BAD_REQUEST)

    unit_link = (
        UnitLesson.objects
        .select_related("unit", "unit__course")
        .filter(
            lesson=lesson,
            unit__is_published=True,
            unit__course__is_active=True,
        )
        .order_by("unit__course_id", "unit__order_index", "order_index")
        .first()
    )
    if not unit_link:
        return Response(
            {"detail": "Bai hoc chua duoc gan vao unit cong khai."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not _is_unit_unlocked(request.user, unit_link.unit):
        return Response({"detail": "Unit nay chua mo khoa."}, status=status.HTTP_403_FORBIDDEN)

    hearts = _refill_hearts(_get_or_create_hearts(request.user))
    if hearts.current_hearts <= 0:
        return Response(
            {
                "detail": "Bạn đã hết hearts. Vui lòng đợi refill.",
                "hearts": _build_hearts_payload(hearts),
            },
            status=HEARTS_MIN_RESPONSE_STATUS,
        )

    lesson_words = Word.objects.filter(lessons=lesson).distinct()
    difficulty, difficulty_context = _detect_difficulty_with_context(request.user)
    max_questions = 6 if difficulty == "easy" else 8
    exercises = _build_exercises_from_bank(lesson, max_questions=max_questions)
    if not exercises:
        global_words = Word.objects.filter(level=lesson.level).exclude(id__in=lesson_words.values("id"))[:100]
        exercises = generate_exercises_from_words(
            lesson_words,
            max_questions=max_questions,
            difficulty=difficulty,
            global_words=global_words,
            lesson=lesson,
        )
    if not exercises:
        return Response(
            {"detail": "Bai hoc chua co du lieu de sinh bai tap."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    session = LearningSession.objects.create(
        user=request.user,
        unit=unit_link.unit,
        lesson=lesson,
        session_type=LearningSession.SessionType.LESSON,
        difficulty=difficulty,
        exercises=exercises,
    )
    has_previous_lesson_session = LearningSession.objects.filter(
        user=request.user,
        session_type=LearningSession.SessionType.LESSON,
    ).exclude(id=session.id).exists()
    if not has_previous_lesson_session:
        _track_onboarding_step(
            request.user,
            "first_lesson_start",
            meta={
                "lesson_id": lesson.id,
                "unit_id": unit_link.unit_id,
                "session_id": session.id,
                "onboarding_source": start_source,
            },
        )
    _track_learning_event(
        request.user,
        LearningEvent.EventType.SESSION_START,
        session=session,
        meta={
            "session_type": session.session_type,
            "difficulty": session.difficulty,
            "exercise_count": len(exercises),
            "unit_id": session.unit_id,
            "lesson_id": session.lesson_id,
            "start_source": start_source,
        },
    )
    _track_learning_event(
        request.user,
        LearningEvent.EventType.EXPERIMENT_METRIC,
        session=session,
        meta={
            "metric_key": "difficulty_auto_adjust",
            "difficulty": difficulty,
            "context": difficulty_context,
            "start_source": start_source,
        },
    )

    unit_progress, _ = UserUnitProgress.objects.get_or_create(
        user=request.user,
        unit=unit_link.unit,
    )
    if not unit_progress.started_at:
        unit_progress.started_at = timezone.now()
        unit_progress.save(update_fields=["started_at", "updated_at"])

    payload = LearningSessionSerializer(session).data
    payload["exercise_count"] = len(exercises)
    payload["difficulty"] = difficulty
    payload["difficulty_context"] = difficulty_context
    payload["hearts"] = hearts.current_hearts
    payload["hearts_info"] = _build_hearts_payload(hearts)
    return Response(payload, status=status.HTTP_201_CREATED)


def _retune_remaining_session_exercises(session: LearningSession, target_difficulty: str) -> bool:
    if (
        session.session_type != LearningSession.SessionType.LESSON
        or not session.lesson_id
        or session.difficulty == target_difficulty
    ):
        return False

    exercises = list(session.exercises or [])
    if not exercises:
        session.difficulty = target_difficulty
        session.save(update_fields=["difficulty"])
        return True

    answered_steps = set(session.attempts.values_list("step_index", flat=True))
    unanswered_steps = [int(item.get("step_index") or 0) for item in exercises if int(item.get("step_index") or 0) not in answered_steps]
    if not unanswered_steps:
        session.difficulty = target_difficulty
        session.save(update_fields=["difficulty"])
        return True

    lesson_words = list(Word.objects.filter(lessons=session.lesson).distinct())
    if not lesson_words:
        session.difficulty = target_difficulty
        session.save(update_fields=["difficulty"])
        return True

    answered_keys = {
        (
            str(item.get("exercise_type") or ""),
            int(item.get("word_id") or 0),
        )
        for item in exercises
        if int(item.get("step_index") or 0) in answered_steps
    }
    word_ids = [word.id for word in lesson_words]
    global_words = Word.objects.filter(level=session.lesson.level).exclude(id__in=word_ids)[:100]
    generated = generate_exercises_from_words(
        lesson_words,
        max_questions=max(len(exercises), len(unanswered_steps) + len(answered_steps)),
        difficulty="adaptive" if target_difficulty == LearningSession.Difficulty.HARD else target_difficulty,
        global_words=global_words,
        lesson=session.lesson,
    )

    candidate_tail = []
    seen_keys = set(answered_keys)
    for item in generated:
        key = (str(item.get("exercise_type") or ""), int(item.get("word_id") or 0))
        if key in seen_keys:
            continue
        seen_keys.add(key)
        candidate_tail.append(item)
        if len(candidate_tail) >= len(unanswered_steps):
            break

    original_unanswered = [item for item in exercises if int(item.get("step_index") or 0) in unanswered_steps]
    if len(candidate_tail) < len(unanswered_steps):
        candidate_tail.extend(original_unanswered[len(candidate_tail):])

    answer_map = {int(item.get("step_index") or 0): item for item in exercises}
    for index, step_index in enumerate(unanswered_steps):
        replacement = dict(candidate_tail[index])
        replacement["step_index"] = step_index
        answer_map[step_index] = replacement

    rebuilt = [answer_map[int(item.get("step_index") or 0)] for item in exercises]
    session.exercises = rebuilt
    session.difficulty = target_difficulty
    session.save(update_fields=["exercises", "difficulty"])
    return True


def _maybe_auto_adjust_session_difficulty(session: LearningSession, correct_streak: int, wrong_streak: int) -> dict | None:
    target_difficulty = None
    context = None
    if wrong_streak >= 3 and session.difficulty != LearningSession.Difficulty.EASY:
        target_difficulty = LearningSession.Difficulty.EASY
        context = "in_session_wrong_streak"
    elif correct_streak >= 3 and session.difficulty == LearningSession.Difficulty.EASY:
        target_difficulty = LearningSession.Difficulty.NORMAL
        context = "in_session_correct_streak_recover"
    elif correct_streak >= 5 and session.difficulty == LearningSession.Difficulty.NORMAL:
        target_difficulty = LearningSession.Difficulty.HARD
        context = "in_session_high_confidence"

    if not target_difficulty:
        return None
    changed = _retune_remaining_session_exercises(session, target_difficulty)
    if not changed:
        return None
    return {"difficulty": target_difficulty, "context": context}


def _resolve_client_source(request, default: str = "unknown") -> str:
    source = request.query_params.get("source")
    if not source and hasattr(request, "data"):
        source = request.data.get("source")
    source = str(source or default).strip().lower()
    return source if source in ALLOWED_FLOW_SOURCES else default


def _session_last_activity_at(session: LearningSession):
    latest_attempt = (
        session.attempts.order_by("-created_at").only("created_at").first()
        if session.id
        else None
    )
    return latest_attempt.created_at if latest_attempt else session.started_at


def _is_recoverable_started_session(session: LearningSession) -> bool:
    """
    A started session is recoverable only when user has real progress.
    This prevents false "continue session" banners for empty started sessions.
    """
    if not session or session.status != LearningSession.Status.STARTED:
        return False
    # No attempt -> no meaningful progress to recover.
    if not session.attempts.exists():
        return False
    total_steps = len(session.exercises or [])
    if total_steps <= 0:
        return False
    # Already answered all but still STARTED -> treat as non-recoverable.
    if session.total_answered >= total_steps:
        return False
    return True


def _get_latest_recoverable_started_session(user) -> LearningSession | None:
    started_sessions = (
        LearningSession.objects
        .select_related("lesson", "unit")
        .filter(user=user, status=LearningSession.Status.STARTED)
        .order_by("-started_at", "-id")
    )
    for session in started_sessions:
        if _is_recoverable_started_session(session):
            return session
    return None


def _expire_empty_started_sessions(user) -> int:
    """
    Auto-abandon started sessions that never received any answer attempt
    and are older than a short grace period.
    """
    now = timezone.now()
    cutoff = now - timedelta(minutes=RECOVER_EMPTY_SESSION_GRACE_MINUTES)
    stale_count = 0
    started_sessions = (
        LearningSession.objects
        .filter(user=user, status=LearningSession.Status.STARTED)
        .order_by("-started_at", "-id")
    )
    for session in started_sessions:
        if session.attempts.exists():
            continue
        if session.started_at and session.started_at > cutoff:
            continue
        session.status = LearningSession.Status.ABANDONED
        session.completed_at = now
        session.save(update_fields=["status", "completed_at"])
        _track_learning_event(
            user,
            LearningEvent.EventType.SESSION_QUIT,
            session=session,
            meta={
                "reason": "auto_expire_empty_started_session",
                "stale_minutes_threshold": RECOVER_EMPTY_SESSION_GRACE_MINUTES,
            },
        )
        stale_count += 1
    return stale_count


def _expire_stale_started_sessions(user) -> int:
    now = timezone.now()
    cutoff = now - timedelta(hours=SESSION_RECOVER_STALE_HOURS)
    stale_count = 0
    started_sessions = (
        LearningSession.objects
        .filter(user=user, status=LearningSession.Status.STARTED)
        .order_by("-started_at", "-id")
    )
    for session in started_sessions:
        last_activity_at = _session_last_activity_at(session)
        if not last_activity_at or last_activity_at > cutoff:
            continue
        session.status = LearningSession.Status.ABANDONED
        session.completed_at = now
        session.save(update_fields=["status", "completed_at"])
        _track_learning_event(
            user,
            LearningEvent.EventType.SESSION_QUIT,
            session=session,
            meta={
                "reason": "auto_expire_stale_started_session",
                "last_activity_at": last_activity_at.isoformat(),
                "stale_hours_threshold": SESSION_RECOVER_STALE_HOURS,
            },
        )
        stale_count += 1
    return stale_count


@extend_schema(responses=OpenApiTypes.OBJECT)
class LearningPathView(APIView):
    """GET /learning/path/ - Return unit path with lock/unlock state."""

    permission_classes = [IsAuthenticated]

    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request):
        course = _get_primary_active_course()
        if not course:
            return Response({"detail": "Chua co khoa hoc kha dung."}, status=status.HTTP_404_NOT_FOUND)
        units = _get_filtered_units(course)
        return Response(_build_course_path_payload_for_units(request, course, units))


@extend_schema(responses=OpenApiTypes.OBJECT)
class ListeningPathView(APIView):
    """GET /learning/listening/ - Return listening-only unit path."""

    permission_classes = [IsAuthenticated]

    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request):
        course = _get_primary_active_course()
        if not course:
            return Response({"detail": "Chua co khoa hoc kha dung."}, status=status.HTTP_404_NOT_FOUND)
        units = _get_filtered_units(course, skill_tag=Lesson.SkillTag.LISTENING)
        return Response(_build_course_path_payload_for_units(request, course, units))


@extend_schema(responses=OpenApiTypes.OBJECT)
class LearningSessionStartView(APIView):
    """POST /learning/session/start/ - Start a short lesson session."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [LearningSessionStartRateThrottle]

    @extend_schema(request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT)
    def post(self, request):
        return _start_lesson_session(request, default_source="learning_page")


@extend_schema(responses=OpenApiTypes.OBJECT)
class ListeningSessionStartView(APIView):
    """POST /learning/listening/session/start/ - Start a listening session."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [LearningSessionStartRateThrottle]

    @extend_schema(request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT)
    def post(self, request):
        return _start_lesson_session(
            request,
            default_source="listening_page",
            required_skill_tag=Lesson.SkillTag.LISTENING,
        )


@extend_schema(responses=OpenApiTypes.OBJECT)
class LearningPlacementStatusView(APIView):
    """GET /learning/placement/status/ - Placement status for onboarding."""

    permission_classes = [IsAuthenticated]

    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request):
        stale_auto_abandoned = _expire_stale_started_sessions(request.user)
        empty_auto_abandoned = _expire_empty_started_sessions(request.user)
        recoverable_session = _get_latest_recoverable_started_session(request.user)
        latest = PlacementResult.objects.filter(user=request.user).first()
        has_started_first_lesson = LearningEvent.objects.filter(
            user=request.user,
            event_type=LearningEvent.EventType.ONBOARDING_STEP,
            meta__step="first_lesson_start",
        ).exists()
        has_pending_draft = bool(cache.get(_placement_cache_key(request.user.id)))
        has_any_progress = (
            LearningSession.objects.filter(user=request.user).exists()
            or UserUnitProgress.objects.filter(user=request.user).exists()
        )
        if recoverable_session:
            next_action = "continue_session"
        elif latest is None:
            next_action = "resume_placement" if has_pending_draft else "start_placement"
        elif not has_started_first_lesson:
            next_action = "start_first_lesson"
        else:
            next_action = "continue_learning_path"
        return Response(
            {
                "has_completed_placement": latest is not None,
                "recommended_level": latest.recommended_level if latest else None,
                "last_taken_at": latest.created_at if latest else None,
                "score_pct": latest.score_pct if latest else None,
                "should_show_onboarding": latest is None and not has_any_progress,
                "placement": {
                    "completed": latest is not None,
                    "recommended_level": latest.recommended_level if latest else None,
                    "last_taken_at": latest.created_at if latest else None,
                    "score_pct": latest.score_pct if latest else None,
                },
                "onboarding": {
                    "next_action": next_action,
                    "has_recoverable_session": bool(recoverable_session),
                    "recoverable_session_id": recoverable_session.id if recoverable_session else None,
                    "has_pending_placement_draft": has_pending_draft,
                    "has_started_first_lesson": has_started_first_lesson,
                    "stale_sessions_auto_abandoned": stale_auto_abandoned,
                    "empty_sessions_auto_abandoned": empty_auto_abandoned,
                },
            }
        )


@extend_schema(responses=OpenApiTypes.OBJECT)
class LearningPlacementQuestionsView(APIView):
    """GET /learning/placement/questions/ - Generate placement questions."""

    permission_classes = [IsAuthenticated]

    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request):
        source = _resolve_client_source(request, default="placement_page")
        count = request.query_params.get("count", PLACEMENT_DEFAULT_QUESTION_COUNT)
        existing_questions = cache.get(_placement_cache_key(request.user.id))
        if existing_questions:
            _track_onboarding_step(
                request.user,
                "placement_abandon",
                meta={
                    "reason": "refresh_before_submit",
                    "pending_questions": len(existing_questions),
                    "source": source,
                },
            )
        questions = _build_placement_questions(count=count)
        if not questions:
            return Response({"detail": "Chua co du du lieu tu vung de tao placement."}, status=status.HTTP_400_BAD_REQUEST)
        cache.set(_placement_cache_key(request.user.id), questions, timeout=PLACEMENT_CACHE_TTL_SECONDS)
        safe_questions = [
            {
                "question_id": item["question_id"],
                "word_id": item["word_id"],
                "word_text": item["word_text"],
                "prompt": item["prompt"],
                "choices": item["choices"],
            }
            for item in questions
        ]
        _track_onboarding_step(
            request.user,
            "placement_enter",
            meta={"question_count": len(safe_questions), "source": source},
        )
        return Response(
            {
                "count": len(safe_questions),
                "questions": safe_questions,
                "expires_in_seconds": PLACEMENT_CACHE_TTL_SECONDS,
            }
        )


@extend_schema(responses=OpenApiTypes.OBJECT)
class LearningPlacementSubmitView(APIView):
    """POST /learning/placement/submit/ - Submit placement answers."""

    permission_classes = [IsAuthenticated]

    @extend_schema(request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT)
    def post(self, request):
        source = _resolve_client_source(request, default="placement_page")
        serializer = PlacementSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        answers = serializer.validated_data["answers"]
        if len(answers) < PLACEMENT_MIN_SUBMIT_QUESTIONS:
            return Response(
                {"detail": f"Can tra loi it nhat {PLACEMENT_MIN_SUBMIT_QUESTIONS} cau."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user_model = type(request.user)
        with transaction.atomic():
            user_model.objects.select_for_update().get(pk=request.user.pk)
            questions = cache.get(_placement_cache_key(request.user.id))
            if not questions:
                recent_result_id = cache.get(_placement_submit_result_cache_key(request.user.id))
                if recent_result_id:
                    recent_result = PlacementResult.objects.filter(
                        id=recent_result_id,
                        user=request.user,
                    ).first()
                    if recent_result:
                        level_stats: dict[str, dict[str, int]] = {}
                        for item in recent_result.answers or []:
                            level = (item.get("word_level") or "A1").upper()
                            bucket = level_stats.setdefault(level, {"total": 0, "correct": 0})
                            bucket["total"] += 1
                            if item.get("is_correct"):
                                bucket["correct"] += 1
                        return Response(
                            {
                                "result": PlacementResultSerializer(recent_result).data,
                                "level_stats": {
                                    level: {
                                        "total": stats["total"],
                                        "correct": stats["correct"],
                                        "accuracy_pct": round((stats["correct"] / stats["total"]) * 100, 2)
                                        if stats["total"]
                                        else 0.0,
                                    }
                                    for level, stats in level_stats.items()
                                },
                                "already_submitted": True,
                            }
                        )
                return Response(
                    {"detail": "Placement đã hết hạn. Vui lòng tải lại bộ câu hỏi."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            question_map = {item["question_id"]: item for item in questions}
            correct_count = 0
            total = 0
            level_stats: dict[str, dict[str, int]] = {}
            answer_details = []
            for answer in answers:
                q = question_map.get(answer["question_id"])
                if not q:
                    continue
                selected = (answer["option"] or "").strip().lower()
                correct_option = (q.get("correct_option") or "").strip().lower()
                is_correct = selected == correct_option and bool(correct_option)
                level = (q.get("word_level") or "A1").upper()
                bucket = level_stats.setdefault(level, {"total": 0, "correct": 0})
                bucket["total"] += 1
                if is_correct:
                    bucket["correct"] += 1
                    correct_count += 1
                total += 1
                answer_details.append(
                    {
                        "question_id": q["question_id"],
                        "word_id": q["word_id"],
                        "selected_option": answer["option"],
                        "is_correct": is_correct,
                        "word_level": level,
                    }
                )

            if total < PLACEMENT_MIN_SUBMIT_QUESTIONS:
                return Response(
                    {"detail": "Không đủ câu trả lời hợp lệ để chấm điểm."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            score_pct = round((correct_count / total) * 100, 2)
            recommended_level = _compute_recommended_level(level_stats)
            result = PlacementResult.objects.create(
                user=request.user,
                recommended_level=recommended_level,
                score_pct=score_pct,
                total_questions=total,
                correct_answers=correct_count,
                answers=answer_details,
            )
            cache.delete(_placement_cache_key(request.user.id))
            cache.set(_placement_submit_result_cache_key(request.user.id), result.id, timeout=60)
        _track_onboarding_step(
            request.user,
            "placement_submit",
            meta={
                "score_pct": score_pct,
                "recommended_level": recommended_level,
                "total_questions": total,
                "source": source,
            },
        )

        return Response(
            {
                "result": PlacementResultSerializer(result).data,
                "level_stats": {
                    level: {
                        "total": stats["total"],
                        "correct": stats["correct"],
                        "accuracy_pct": round((stats["correct"] / stats["total"]) * 100, 2)
                        if stats["total"]
                        else 0,
                    }
                    for level, stats in level_stats.items()
                },
                "onboarding": {
                    "next_action": "start_first_lesson",
                    "source": source,
                },
            },
        )


@extend_schema(responses=OpenApiTypes.OBJECT)
class LearningPlacementSkipView(APIView):
    """POST /learning/placement/skip/ - Bỏ qua placement, bắt đầu từ A1."""

    permission_classes = [IsAuthenticated]

    @extend_schema(request=None, responses=PlacementSkipResponseSerializer)
    def post(self, request):
        existing = PlacementResult.objects.filter(user=request.user).first()
        if existing:
            return Response(
                {
                    "already_completed": True,
                    "detail": "Đã có kết quả placement.",
                    "recommended_level": existing.recommended_level,
                },
                status=status.HTTP_200_OK,
            )
        PlacementResult.objects.create(
            user=request.user,
            recommended_level="A1",
            score_pct=0,
            total_questions=0,
            correct_answers=0,
            answers=[],
        )
        _track_onboarding_step(request.user, "placement_skip", meta={"recommended_level": "A1"})
        return Response(
            {
                "already_completed": False,
                "detail": "Đã bỏ qua placement. Bắt đầu từ A1.",
                "recommended_level": "A1",
            }
        )


@extend_schema(responses=OpenApiTypes.OBJECT)
class LearningSessionDetailView(APIView):
    """GET /learning/session/{id}/ - Session detail for current learner."""

    permission_classes = [IsAuthenticated]

    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request, session_id):
        session = (
            LearningSession.objects
            .select_related("lesson", "unit")
            .filter(id=session_id, user=request.user)
            .first()
        )
        if not session:
            return Response({"detail": "Không tìm thấy phiên học."}, status=status.HTTP_404_NOT_FOUND)
        return Response(_build_session_detail_payload(request, session))


@extend_schema(responses=OpenApiTypes.OBJECT)
class ListeningSessionDetailView(APIView):
    """GET /learning/listening/session/{id}/ - Listening session detail for current learner."""

    permission_classes = [IsAuthenticated]

    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request, session_id):
        session = (
            LearningSession.objects
            .select_related("lesson", "unit")
            .filter(
                id=session_id,
                user=request.user,
                lesson__skill_tag=Lesson.SkillTag.LISTENING,
            )
            .first()
        )
        if not session:
            return Response({"detail": "Không tìm thấy phiên luyện nghe."}, status=status.HTTP_404_NOT_FOUND)
        return Response(_build_session_detail_payload(request, session))


@extend_schema(responses=OpenApiTypes.OBJECT)
class LearningSessionAnswerView(APIView):
    """POST /learning/session/{id}/answer/ - Submit one exercise answer."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [LearningSessionAnswerBurstThrottle, LearningSessionAnswerSustainedThrottle]

    @extend_schema(request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT)
    def post(self, request, session_id):
        session = (
            LearningSession.objects
            .select_related("lesson", "unit")
            .filter(id=session_id, user=request.user)
            .first()
        )
        if not session:
            return Response({"detail": "Không tìm thấy phiên học."}, status=status.HTTP_404_NOT_FOUND)
        if session.status != LearningSession.Status.STARTED:
            return Response({"detail": "Phiên học đã kết thúc."}, status=status.HTTP_400_BAD_REQUEST)

        hearts = _refill_hearts(_get_or_create_hearts(request.user))
        if hearts.current_hearts <= 0:
            return Response(
                {
                    "detail": "Bạn đã hết hearts. Vui lòng đợi refill.",
                    "hearts": _build_hearts_payload(hearts),
                },
                status=HEARTS_MIN_RESPONSE_STATUS,
            )

        serializer = LearningSessionAnswerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        exercise_map = {item["step_index"]: item for item in (session.exercises or [])}
        exercise = exercise_map.get(data["step_index"])
        if not exercise:
            return Response({"detail": "Bước bài tập không hợp lệ."}, status=status.HTTP_400_BAD_REQUEST)

        expected_step = _get_expected_step_index(session)
        if expected_step and data["step_index"] != expected_step:
            return Response(
                {
                    "detail": "Bạn cần trả lời đúng thứ tự bước.",
                    "expected_step_index": expected_step,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        response_ms = _normalize_response_ms(data["response_ms"])
        suspicious_flags = _detect_suspicious_answer(response_ms)

        eval_started = time.perf_counter()
        is_correct = evaluate_exercise_answer(exercise, data["submitted_answer"])
        eval_ms = round((time.perf_counter() - eval_started) * 1000, 2)
        awarded_xp = _get_awarded_xp(session, is_correct)
        if suspicious_flags and awarded_xp > 0:
            awarded_xp = 0
        word_id = int(exercise.get("word_id") or 0)

        with transaction.atomic():
            attempt, created = ExerciseAttempt.objects.get_or_create(
                session=session,
                step_index=data["step_index"],
                defaults={
                    "exercise_type": exercise["exercise_type"],
                    "prompt": exercise["prompt"],
                    "submitted_answer": data["submitted_answer"],
                    "is_correct": is_correct,
                    "response_ms": data["response_ms"],
                    "awarded_xp": awarded_xp,
                },
            )

            if not created:
                return Response(
                    {
                        "idempotent": True,
                        "attempt": ExerciseAttemptSerializer(attempt).data,
                        "session": LearningSessionSerializer(session).data,
                        "feedback": {
                            "is_correct": attempt.is_correct,
                            "awarded_xp": attempt.awarded_xp,
                            "exercise_type": attempt.exercise_type,
                            "hearts": hearts.current_hearts,
                        },
                        "hearts": _build_hearts_payload(hearts),
                    }
                )

            LearningSession.objects.filter(pk=session.pk).update(
                total_answered=F("total_answered") + 1,
                correct_answered=F("correct_answered") + (1 if is_correct else 0),
                xp_earned=F("xp_earned") + awarded_xp,
            )
            session.refresh_from_db(fields=["total_answered", "correct_answered", "xp_earned"])

            if not is_correct:
                heart_cost = _get_heart_cost(session, is_correct)
                hearts = _consume_heart(
                    request.user,
                    reason=f"wrong_answer_step_{data['step_index']}",
                    cost=heart_cost,
                )
            if not is_correct and word_id:
                wrong_for_word = _count_wrong_attempts_for_word(session, word_id)
                if wrong_for_word >= 2:
                    _bump_word_to_early_review(request.user, word_id)
            _track_learning_event(
                request.user,
                LearningEvent.EventType.ANSWER_SUBMIT,
                session=session,
                meta={
                    "step_index": data["step_index"],
                    "is_correct": is_correct,
                    "awarded_xp": awarded_xp,
                    "response_ms": response_ms,
                    "suspicious": bool(suspicious_flags),
                    "suspicious_flags": suspicious_flags,
                },
            )
            correct_streak = _get_consecutive_correct_streak(session)
            heart_bonus = 0
            if (
                is_correct
                and session.session_type == LearningSession.SessionType.LESSON
                and correct_streak > 0
                and correct_streak % 5 == 0
            ):
                hearts, heart_bonus = _grant_heart_bonus(
                    request.user,
                    reason=f"correct_streak_{correct_streak}",
                    amount=1,
                )
            wrong_streak = _get_consecutive_wrong_streak(session)
            show_easy_mode_cta = (
                wrong_streak >= 3
                and session.session_type == LearningSession.SessionType.LESSON
                and session.difficulty != LearningSession.Difficulty.EASY
            )

            difficulty_adjustment = _maybe_auto_adjust_session_difficulty(
                session,
                correct_streak=correct_streak,
                wrong_streak=wrong_streak,
            )
            if difficulty_adjustment:
                _track_learning_event(
                    request.user,
                    LearningEvent.EventType.EXPERIMENT_METRIC,
                    session=session,
                    meta={
                        "metric_key": "difficulty_auto_adjust",
                        "difficulty": difficulty_adjustment["difficulty"],
                        "context": difficulty_adjustment["context"],
                        "step_index": data["step_index"],
                    },
                )
        return Response(
            {
                "idempotent": False,
                "attempt": ExerciseAttemptSerializer(attempt).data,
                "session": LearningSessionSerializer(session).data,
                "feedback": {
                    "is_correct": is_correct,
                    "awarded_xp": awarded_xp,
                    "exercise_type": exercise["exercise_type"],
                    "difficulty": session.difficulty,
                    "difficulty_adjustment": difficulty_adjustment,
                    "server_eval_ms": eval_ms,
                    "hearts": hearts.current_hearts,
                    "heart_cost": _get_heart_cost(session, is_correct),
                    "suspicious": bool(suspicious_flags),
                    "suspicious_flags": suspicious_flags,
                    "correct_streak": correct_streak,
                    "wrong_streak": wrong_streak,
                    "heart_bonus": heart_bonus,
                    "show_easy_mode_cta": show_easy_mode_cta,
                },
                "frustration_guard": {
                    "wrong_streak": wrong_streak,
                    "show_easy_mode_cta": show_easy_mode_cta,
                },
                "hearts": _build_hearts_payload(hearts),
            }
        )


@extend_schema(responses=OpenApiTypes.OBJECT)
class LearningSessionFinishView(APIView):
    """POST /learning/session/{id}/finish/ - End session and persist progress."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [LearningSessionFinishRateThrottle]

    @extend_schema(request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT)
    def post(self, request, session_id):
        session = (
            LearningSession.objects
            .select_related("unit", "unit__course", "lesson")
            .filter(id=session_id, user=request.user)
            .first()
        )
        if not session:
            return Response({"detail": "Không tìm thấy phiên học."}, status=status.HTTP_404_NOT_FOUND)
        if session.session_type == LearningSession.SessionType.CHECKPOINT:
            return Response(
                {"detail": "Dùng endpoint checkpoint submit cho phiên này."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = timezone.now()
        with transaction.atomic():
            session = (
                LearningSession.objects
                .select_for_update()
                .select_related("unit", "unit__course", "lesson")
                .filter(id=session_id, user=request.user)
                .first()
            )
            if not session:
                return Response({"detail": "Không tìm thấy phiên học."}, status=status.HTTP_404_NOT_FOUND)
            if session.status == LearningSession.Status.COMPLETED:
                summary = _build_session_summary(session)
                return Response(
                    {
                        "already_completed": True,
                        "session": LearningSessionSerializer(session).data,
                        "summary": summary,
                    }
                )
            if session.status != LearningSession.Status.STARTED:
                return Response({"detail": "Phiên học không hợp lệ để kết thúc."}, status=status.HTTP_400_BAD_REQUEST)
            session.status = LearningSession.Status.COMPLETED
            session.completed_at = now
            session.save(update_fields=["status", "completed_at"])

            lesson_progress, _ = LessonProgress.objects.get_or_create(
                user=request.user,
                lesson=session.lesson,
                defaults={"started_at": session.started_at, "completed_at": now},
            )
            lesson_progress_updates = []
            if not lesson_progress.started_at:
                lesson_progress.started_at = session.started_at
                lesson_progress_updates.append("started_at")
            if not lesson_progress.completed_at:
                lesson_progress.completed_at = now
                lesson_progress_updates.append("completed_at")
            if lesson_progress_updates:
                lesson_progress.save(update_fields=lesson_progress_updates)
            seeded_review_word_ids = _ensure_session_words_in_review(request.user, session)

            unit_progress, _ = UserUnitProgress.objects.get_or_create(
                user=request.user,
                unit=session.unit,
                defaults={"started_at": session.started_at},
            )
            unit_progress.started_at = unit_progress.started_at or session.started_at
            completed_lessons = (
                LessonProgress.objects
                .filter(
                    user=request.user,
                    lesson__unit_links__unit=session.unit,
                    completed_at__isnull=False,
                )
                .distinct()
                .count()
            )
            total_lessons = UnitLesson.objects.filter(
                unit=session.unit,
                lesson__is_published=True,
            ).count()
            unit_progress.completed_lessons = completed_lessons
            unit_progress.total_xp_earned += session.xp_earned
            if total_lessons > 0 and completed_lessons >= total_lessons:
                unit_progress.completed_at = unit_progress.completed_at or now
            unit_progress.save(
                update_fields=[
                    "started_at",
                    "completed_lessons",
                    "total_xp_earned",
                    "completed_at",
                    "updated_at",
                ]
            )
            course_progress = _update_course_progress(request.user, session.unit.course, now=now)

        session_minutes = _estimate_session_minutes(session, now=now, max_minutes=45)
        streak = _apply_learning_rewards(
            request.user,
            xp_earned=session.xp_earned,
            study_minutes=session_minutes,
            when=now,
        )
        summary = _build_session_summary(session)
        hearts = _refill_hearts(_get_or_create_hearts(request.user))
        finish_heart_bonus = 0
        if (
            session.session_type == LearningSession.SessionType.LESSON
            and session.total_answered > 0
            and summary["accuracy_pct"] >= 80
        ):
            hearts, finish_heart_bonus = _grant_heart_bonus(
                request.user,
                reason="finish_accuracy_80",
                amount=1,
            )
        _track_learning_event(
            request.user,
            LearningEvent.EventType.SESSION_FINISH,
            session=session,
            meta={
                "accuracy_pct": summary["accuracy_pct"],
                "total_answered": session.total_answered,
                "correct_answered": session.correct_answered,
                "xp_earned": session.xp_earned,
            },
        )

        return Response(
            {
                "already_completed": False,
                "session": LearningSessionSerializer(session).data,
                "summary": summary,
                "unit_progress": {
                    "completed_lessons": unit_progress.completed_lessons,
                    "total_xp_earned": unit_progress.total_xp_earned,
                    "completed_at": unit_progress.completed_at,
                },
                "course_progress": {
                    "completed_units": course_progress.completed_units,
                    "total_xp_earned": course_progress.total_xp_earned,
                    "last_unit_id": course_progress.last_unit_id,
                    "completed_at": course_progress.completed_at,
                },
                "review_seeded_word_ids": seeded_review_word_ids,
                "user": {
                    "xp": request.user.xp,
                    "level": request.user.level,
                    "streak": streak.current_streak,
                },
                "hearts": _build_hearts_payload(hearts),
                "heart_bonus": {
                    "granted": finish_heart_bonus,
                    "reason": "finish_accuracy_80" if finish_heart_bonus > 0 else None,
                },
            }
        )


@extend_schema(responses=OpenApiTypes.OBJECT)
class LearningSessionQuitView(APIView):
    """POST /learning/session/{id}/quit/ - Mark started session as abandoned."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [LearningSessionQuitRateThrottle]

    @extend_schema(request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT)
    def post(self, request, session_id):
        session = LearningSession.objects.filter(id=session_id, user=request.user).first()
        if not session:
            return Response({"detail": "Không tìm thấy phiên học."}, status=status.HTTP_404_NOT_FOUND)
        if session.status == LearningSession.Status.COMPLETED:
            return Response({"detail": "Phiên học đã hoàn thành."}, status=status.HTTP_400_BAD_REQUEST)
        if session.status == LearningSession.Status.ABANDONED:
            return Response({"detail": "Phiên học đã bỏ dở."}, status=status.HTTP_200_OK)

        session.status = LearningSession.Status.ABANDONED
        session.completed_at = timezone.now()
        session.save(update_fields=["status", "completed_at"])
        _track_learning_event(
            request.user,
            LearningEvent.EventType.SESSION_QUIT,
            session=session,
            meta={
                "total_answered": session.total_answered,
                "xp_earned": session.xp_earned,
                "reason": str(request.data.get("reason", ""))[:120],
            },
        )
        return Response({"status": session.status, "session_id": session.id})


@extend_schema(responses=OpenApiTypes.OBJECT)
class LearningSessionRecoverView(APIView):
    """GET /learning/session/recover/ - Get latest active started session."""

    permission_classes = [IsAuthenticated]

    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request):
        stale_auto_abandoned = _expire_stale_started_sessions(request.user)
        empty_auto_abandoned = _expire_empty_started_sessions(request.user)
        session = _get_latest_recoverable_started_session(request.user)
        if not session:
            return Response(
                {
                    "has_recoverable_session": False,
                    "session": None,
                    "next_step_index": None,
                    "last_activity_at": None,
                    "recover_context": {
                        "reason": "no_started_session",
                        "stale_sessions_auto_abandoned": stale_auto_abandoned,
                        "empty_sessions_auto_abandoned": empty_auto_abandoned,
                        "stale_hours_threshold": SESSION_RECOVER_STALE_HOURS,
                    },
                }
            )

        next_step = _get_expected_step_index(session) or 1
        last_activity_at = _session_last_activity_at(session)
        return Response(
            {
                "has_recoverable_session": True,
                "session": LearningSessionSerializer(session).data,
                "next_step_index": next_step,
                "last_activity_at": last_activity_at,
                "recover_context": {
                    "reason": "active_started_session",
                    "stale_sessions_auto_abandoned": stale_auto_abandoned,
                    "empty_sessions_auto_abandoned": empty_auto_abandoned,
                    "stale_hours_threshold": SESSION_RECOVER_STALE_HOURS,
                },
            }
        )


@extend_schema(responses=OpenApiTypes.OBJECT)
class LearningSessionResumeView(APIView):
    """POST /learning/session/{id}/resume/ - Resume an abandoned session."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [LearningSessionStartRateThrottle]

    @extend_schema(request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT)
    def post(self, request, session_id):
        resume_source = _resolve_client_source(request, default="learning_page")
        session = (
            LearningSession.objects
            .filter(id=session_id, user=request.user)
            .first()
        )
        if not session:
            return Response({"detail": "Không tìm thấy phiên học."}, status=status.HTTP_404_NOT_FOUND)
        if session.status == LearningSession.Status.COMPLETED:
            return Response({"detail": "Phiên học đã hoàn thành."}, status=status.HTTP_400_BAD_REQUEST)
        if session.status == LearningSession.Status.STARTED:
            hearts = _refill_hearts(_get_or_create_hearts(request.user))
            _track_learning_event(
                request.user,
                LearningEvent.EventType.SESSION_START,
                session=session,
                meta={
                    "session_type": session.session_type,
                    "difficulty": session.difficulty,
                    "exercise_count": len(session.exercises or []),
                    "unit_id": session.unit_id,
                    "lesson_id": session.lesson_id,
                    "resumed": True,
                    "resumed_from_status": LearningSession.Status.STARTED,
                    "resume_source": resume_source,
                },
            )
            return Response(
                {
                    "resumed": True,
                    "already_started": True,
                    "session": LearningSessionSerializer(session).data,
                    "next_step_index": _get_expected_step_index(session) or 1,
                    "hearts": _build_hearts_payload(hearts),
                }
            )

        if session.session_type == LearningSession.SessionType.CHECKPOINT:
            return Response(
                {"detail": "Checkpoint đã dừng phải bắt đầu lại từ đầu."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        hearts = _refill_hearts(_get_or_create_hearts(request.user))
        if hearts.current_hearts <= 0:
            return Response(
                {
                    "detail": "Bạn đã hết hearts. Vui lòng đợi refill.",
                    "hearts": _build_hearts_payload(hearts),
                },
                status=HEARTS_MIN_RESPONSE_STATUS,
            )

        if session.completed_at and session.completed_at < timezone.now() - timedelta(hours=SESSION_RECOVER_STALE_HOURS):
            return Response(
                {
                    "detail": "Phiên học bỏ dở đã quá hạn để tiếp tục.",
                    "stale_hours_threshold": SESSION_RECOVER_STALE_HOURS,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        session.status = LearningSession.Status.STARTED
        session.completed_at = None
        session.save(update_fields=["status", "completed_at"])
        _track_learning_event(
            request.user,
            LearningEvent.EventType.SESSION_START,
            session=session,
            meta={
                "session_type": session.session_type,
                "difficulty": session.difficulty,
                "exercise_count": len(session.exercises or []),
                "unit_id": session.unit_id,
                "lesson_id": session.lesson_id,
                "resumed": True,
                "resumed_from_status": LearningSession.Status.ABANDONED,
                "resume_source": resume_source,
            },
        )
        return Response(
            {
                "resumed": True,
                "already_started": False,
                "session": LearningSessionSerializer(session).data,
                "next_step_index": _get_expected_step_index(session) or 1,
                "hearts": _build_hearts_payload(hearts),
            }
        )


@extend_schema(responses=OpenApiTypes.OBJECT)
class LearningSessionSwitchEasyView(APIView):
    """POST /learning/session/{id}/switch-easy/ - Switch started lesson session to easy."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [LearningSessionAnswerSustainedThrottle]

    @extend_schema(request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT)
    def post(self, request, session_id):
        session = (
            LearningSession.objects
            .filter(id=session_id, user=request.user)
            .first()
        )
        if not session:
            return Response({"detail": "Không tìm thấy phiên học."}, status=status.HTTP_404_NOT_FOUND)
        if session.session_type != LearningSession.SessionType.LESSON:
            return Response({"detail": "Chi ho tro switch easy cho lesson session."}, status=status.HTTP_400_BAD_REQUEST)
        if session.status != LearningSession.Status.STARTED:
            return Response({"detail": "Chỉ switch easy khi session đang started."}, status=status.HTTP_400_BAD_REQUEST)
        if session.difficulty == LearningSession.Difficulty.EASY:
            return Response(
                {
                    "switched": False,
                    "difficulty": session.difficulty,
                    "session": LearningSessionSerializer(session).data,
                }
            )

        session.difficulty = LearningSession.Difficulty.EASY
        session.save(update_fields=["difficulty"])
        _track_learning_event(
            request.user,
            LearningEvent.EventType.EXPERIMENT_METRIC,
            session=session,
            meta={"metric_key": "switch_easy_mode", "source": "frustration_guard"},
        )
        return Response(
            {
                "switched": True,
                "difficulty": session.difficulty,
                "session": LearningSessionSerializer(session).data,
            }
        )


@extend_schema(responses=OpenApiTypes.OBJECT)
class LearningCheckpointStartView(APIView):
    """POST /learning/checkpoint/start/ - Start checkpoint for one unlocked unit."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [LearningCheckpointStartRateThrottle]

    @extend_schema(request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT)
    def post(self, request):
        serializer = LearningCheckpointStartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        unit = serializer.validated_data["unit"]
        hearts = _refill_hearts(_get_or_create_hearts(request.user))
        if hearts.current_hearts <= 0:
            return Response(
                {
                    "detail": "Bạn đã hết hearts. Vui lòng đợi refill.",
                    "hearts": _build_hearts_payload(hearts),
                },
                status=HEARTS_MIN_RESPONSE_STATUS,
            )

        if not _is_unit_unlocked(request.user, unit):
            return Response({"detail": "Unit nay chua mo khoa."}, status=status.HTTP_403_FORBIDDEN)

        total_lessons = UnitLesson.objects.filter(unit=unit, lesson__is_published=True).count()
        unit_progress = UserUnitProgress.objects.filter(user=request.user, unit=unit).first()
        completed_lessons = unit_progress.completed_lessons if unit_progress else 0
        if completed_lessons < total_lessons:
            return Response(
                {"detail": "Cần hoàn thành toàn bộ bài học trong unit trước khi làm checkpoint."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        lock_info = _get_checkpoint_lock_info(unit_progress)
        if lock_info["locked"]:
            return Response(
                {
                    "detail": "Checkpoint đang tạm khóa sau lần thử thất bại.",
                    "checkpoint_locked_until": unit_progress.checkpoint_locked_until,
                    "retry_after_seconds": lock_info["remaining_seconds"],
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        words = _extract_unit_words(unit)
        unit_levels = list(
            Lesson.objects.filter(unit_links__unit=unit, is_published=True)
            .exclude(level="")
            .values_list("level", flat=True)
            .distinct()
        )
        global_words = Word.objects.filter(level__in=unit_levels)[:200] if unit_levels else None
        exercises = generate_exercises_from_words(
            words,
            max_questions=12,
            difficulty="hard",
            global_words=global_words,
        )
        if not exercises:
            return Response(
                {"detail": "Unit chua du du lieu de tao checkpoint."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        first_lesson = (
            Lesson.objects.filter(unit_links__unit=unit, is_published=True)
            .order_by("unit_links__order_index")
            .first()
        )
        if not first_lesson:
            return Response({"detail": "Unit chua co lesson hop le."}, status=status.HTTP_400_BAD_REQUEST)

        session = LearningSession.objects.create(
            user=request.user,
            unit=unit,
            lesson=first_lesson,
            session_type=LearningSession.SessionType.CHECKPOINT,
            difficulty=LearningSession.Difficulty.HARD,
            exercises=exercises,
        )
        _track_learning_event(
            request.user,
            LearningEvent.EventType.SESSION_START,
            session=session,
            meta={
                "session_type": session.session_type,
                "difficulty": session.difficulty,
                "exercise_count": len(exercises),
                "unit_id": session.unit_id,
                "lesson_id": session.lesson_id,
            },
        )
        payload = LearningSessionSerializer(session).data
        payload["exercise_count"] = len(exercises)
        payload["hearts"] = hearts.current_hearts
        payload["hearts_info"] = _build_hearts_payload(hearts)
        payload["difficulty"] = LearningSession.Difficulty.HARD
        payload["difficulty_context"] = None
        return Response(payload, status=status.HTTP_201_CREATED)


@extend_schema(responses=OpenApiTypes.OBJECT)
class LearningCheckpointSubmitView(APIView):
    """POST /learning/checkpoint/{id}/submit/ - Score checkpoint and unlock next unit."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [LearningCheckpointSubmitRateThrottle]

    @extend_schema(request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT)
    def post(self, request, session_id):
        session = (
            LearningSession.objects
            .select_related("unit", "unit__course")
            .filter(id=session_id, user=request.user)
            .first()
        )
        if not session:
            return Response({"detail": "Không tìm thấy checkpoint session."}, status=status.HTTP_404_NOT_FOUND)
        if session.session_type != LearningSession.SessionType.CHECKPOINT:
            return Response({"detail": "Session này không phải checkpoint."}, status=status.HTTP_400_BAD_REQUEST)

        total_questions = len(session.exercises or [])
        if total_questions == 0:
            return Response({"detail": "Checkpoint không có câu hỏi."}, status=status.HTTP_400_BAD_REQUEST)
        if session.total_answered < total_questions:
            return Response(
                {"detail": "Bạn chưa hoàn thành toàn bộ câu hỏi checkpoint."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        score_pct = round((session.correct_answered / total_questions) * 100, 2)
        passed = score_pct >= 70.0

        now = timezone.now()
        with transaction.atomic():
            session = (
                LearningSession.objects
                .select_for_update()
                .select_related("unit", "unit__course")
                .filter(pk=session.pk, user=request.user)
                .first()
            )
            if session.status != LearningSession.Status.COMPLETED:
                session.status = LearningSession.Status.COMPLETED
                session.completed_at = now
                session.save(update_fields=["status", "completed_at"])

            unit_progress, _ = UserUnitProgress.objects.get_or_create(
                user=request.user,
                unit=session.unit,
                defaults={"started_at": session.started_at},
            )
            _register_checkpoint_result(unit_progress, passed=passed, now=now)
            course_progress = _update_course_progress(request.user, session.unit.course, now=now)

        if passed:
            session_minutes = _estimate_session_minutes(session, now=now, max_minutes=45)
            _apply_learning_rewards(
                request.user,
                xp_earned=session.xp_earned,
                study_minutes=session_minutes,
                when=now,
            )

        next_unit = (
            Unit.objects
            .filter(course=session.unit.course, order_index__gt=session.unit.order_index, is_published=True)
            .order_by("order_index")
            .first()
        )
        unlocked_next_unit = False
        if next_unit:
            unlocked_next_unit = _is_unit_unlocked(request.user, next_unit)
        summary = _build_session_summary(session)
        _track_learning_event(
            request.user,
            LearningEvent.EventType.CHECKPOINT_SUBMIT,
            session=session,
            meta={
                "passed": passed,
                "score_pct": score_pct,
                "required_score_pct": 70,
            },
        )

        return Response(
            {
                "passed": passed,
                "score_pct": score_pct,
                "required_score_pct": 70,
                "session": LearningSessionSerializer(session).data,
                "summary": summary,
                "course_progress": {
                    "completed_units": course_progress.completed_units,
                    "total_xp_earned": course_progress.total_xp_earned,
                    "last_unit_id": course_progress.last_unit_id,
                    "completed_at": course_progress.completed_at,
                },
                "checkpoint_lock": {
                    "attempts": unit_progress.checkpoint_attempts,
                    "locked_until": unit_progress.checkpoint_locked_until,
                },
                "unlocked_next_unit": unlocked_next_unit,
                "next_unit_id": next_unit.id if next_unit else None,
            }
        )


@extend_schema(responses=OpenApiTypes.OBJECT)
class DailyGoalView(APIView):
    """GET /learning/daily-goal/ - Retrieve daily goal progress + hearts."""

    permission_classes = [IsAuthenticated]

    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request):
        goal = _get_or_create_daily_goal(request.user)
        now = timezone.now()
        log = _get_today_goal_log(request.user, goal, now=now)
        hearts = _refill_hearts(_get_or_create_hearts(request.user))
        streak = _get_or_create_streak(request.user)
        assignments = {
            item.experiment_key: item
            for item in ExperimentAssignment.objects.filter(
                user=request.user,
                experiment_key__in=[DAILY_GOAL_EXPERIMENT_KEY, HEARTS_EXPERIMENT_KEY],
            )
        }
        return Response(
            {
                "target_minutes": goal.target_minutes,
                "reward_xp": goal.reward_xp,
                "is_active": goal.is_active,
                "today": {
                    "date": str(log.goal_date),
                    "studied_minutes": log.studied_minutes,
                    "goal_minutes": log.goal_minutes,
                    "is_achieved": log.is_achieved,
                    "claimed_at": log.claimed_at,
                    "reward_xp_awarded": log.reward_xp_awarded,
                },
                "hearts": {
                    "current": hearts.current_hearts,
                    "max": hearts.max_hearts,
                    "refill_interval_minutes": hearts.refill_interval_minutes,
                    "last_refill_at": hearts.last_refill_at,
                },
                "streak": {
                    "current": streak.current_streak,
                    "longest": streak.longest_streak,
                    "freeze_count": streak.streak_freezes,
                },
                "experiments": {
                    "daily_goal": assignments.get(DAILY_GOAL_EXPERIMENT_KEY).variant_name
                    if assignments.get(DAILY_GOAL_EXPERIMENT_KEY)
                    else None,
                    "hearts": assignments.get(HEARTS_EXPERIMENT_KEY).variant_name
                    if assignments.get(HEARTS_EXPERIMENT_KEY)
                    else None,
                },
            }
        )


@extend_schema(responses=OpenApiTypes.OBJECT)
class DailyGoalClaimView(APIView):
    """POST /learning/daily-goal/claim/ - Claim XP reward for today's goal."""

    permission_classes = [IsAuthenticated]

    @extend_schema(request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT)
    def post(self, request):
        goal = _get_or_create_daily_goal(request.user)

        if not goal.is_active:
            return Response({"detail": "Daily goal is disabled."}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        with transaction.atomic():
            log = _get_today_goal_log(request.user, goal, now=now)
            log = DailyGoalLog.objects.select_for_update().get(pk=log.pk)
            if not log.is_achieved:
                return Response(
                    {"detail": "You have not reached today's daily goal yet."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if log.claimed_at:
                return Response(
                    {
                        "already_claimed": True,
                        "claimed_at": log.claimed_at,
                        "xp": request.user.xp,
                        "level": request.user.level,
                    }
                )
            log.claimed_at = now
            log.reward_xp_awarded = goal.reward_xp
            log.save(update_fields=["claimed_at", "reward_xp_awarded", "updated_at"])

        leveled_up = request.user.add_xp(goal.reward_xp)
        if leveled_up:
            _create_level_up_notification(request.user, request.user.level)
        Notification.objects.create(
            user=request.user,
            type=Notification.Type.REMINDER,
            message=f"Bạn đã nhận {goal.reward_xp} XP từ daily goal hôm nay.",
        )
        track_experiment_metric(
            request.user,
            DAILY_GOAL_EXPERIMENT_KEY,
            metric_key="daily_goal_claim",
            metric_value=goal.reward_xp,
            meta={"goal_minutes": goal.target_minutes},
        )
        return Response(
            {
                "already_claimed": False,
                "claimed_at": now,
                "reward_xp": goal.reward_xp,
                "xp": request.user.xp,
                "level": request.user.level,
            }
        )


@extend_schema(responses=OpenApiTypes.OBJECT)
class StreakFreezeClaimView(APIView):
    """POST /learning/streak-freeze/claim/ - Exchange XP for one streak freeze."""

    permission_classes = [IsAuthenticated]

    @extend_schema(request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT)
    def post(self, request):
        user_model = type(request.user)
        with transaction.atomic():
            user = user_model.objects.select_for_update().get(pk=request.user.pk)
            streak = _get_or_create_streak(user)
            streak = type(streak).objects.select_for_update().get(pk=streak.pk)
            if streak.streak_freezes >= 5:
                return Response(
                    {"detail": "Bạn đã đạt giới hạn streak freeze (5)."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if user.xp < STREAK_FREEZE_XP_COST:
                return Response(
                    {
                        "detail": "Không đủ XP để đổi streak freeze.",
                        "required_xp": STREAK_FREEZE_XP_COST,
                        "current_xp": user.xp,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user.xp -= STREAK_FREEZE_XP_COST
            user.level = user._calculate_level(user.xp)
            user.save(update_fields=["xp", "level", "updated_at"])

            streak.streak_freezes += 1
            streak.save(update_fields=["streak_freezes"])

        return Response(
            {
                "freeze_count": streak.streak_freezes,
                "spent_xp": STREAK_FREEZE_XP_COST,
                "xp": user.xp,
                "level": user.level,
            }
        )


@extend_schema(responses=OpenApiTypes.OBJECT)
class ReviewListView(APIView):
    """GET /review/ - List up to REVIEW_SESSION_LIMIT words due today."""

    permission_classes = [IsAuthenticated]

    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request):
        today = _user_localdate(request.user)
        logs = list(
            ReviewLog.objects
            .filter(user=request.user, next_review_date__lte=today)
            .select_related("word")
            .order_by("next_review_date")[:REVIEW_SESSION_LIMIT]
        )
        return Response(
            {
                "count": len(logs),
                "words": ReviewLogSerializer(logs, many=True).data,
            }
        )


@extend_schema(responses=OpenApiTypes.OBJECT)
class ReviewAnswerView(APIView):
    """POST /review/{word_id}/answer/ - Submit review answer and apply SM-2."""

    permission_classes = [IsAuthenticated]

    @extend_schema(request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT)
    def post(self, request, word_id):
        serializer = ReviewAnswerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        quality = serializer.validated_data["quality"]

        try:
            log = ReviewLog.objects.select_related("word").get(
                user=request.user, word_id=word_id
            )
        except ReviewLog.DoesNotExist:
            return Response(
                {"detail": "Word is not in your review list."},
                status=status.HTTP_404_NOT_FOUND,
            )

        log.apply_sm2(quality)

        xp = XP_REVIEW_CORRECT if quality >= 3 else XP_REVIEW_WRONG
        streak = _apply_learning_rewards(request.user, xp_earned=xp, study_minutes=1)
        request.user.refresh_from_db(fields=["xp", "level"])

        return Response(
            {
                "word_id": word_id,
                "quality": quality,
                "interval_days": log.interval_days,
                "next_review_date": log.next_review_date,
                "easiness_factor": round(log.easiness_factor, 4),
                "xp_earned": xp,
                "total_xp": request.user.xp,
                "level": request.user.level,
                "streak": streak.current_streak,
            }
        )


@extend_schema(responses=OpenApiTypes.OBJECT)
class ReviewSummaryView(APIView):
    """GET /review/summary/ - Today's review summary."""

    permission_classes = [IsAuthenticated]

    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request):
        today = _user_localdate(request.user)
        today_logs = list(
            ReviewLog.objects
            .filter(user=request.user, last_reviewed=today)
            .only("repetitions")
        )
        reviewed_today = len(today_logs)
        correct_today = sum(1 for log in today_logs if log.repetitions > 0)

        due_today = ReviewLog.objects.filter(
            user=request.user,
            next_review_date__lte=today,
        ).exclude(last_reviewed=today).count()

        streak = _get_or_create_streak(request.user)
        return Response(
            {
                "reviewed_today": reviewed_today,
                "correct_today": correct_today,
                "due_today": due_today,
                "streak": streak.current_streak,
                "total_xp": request.user.xp,
                "level": request.user.level,
                "due_tomorrow": ReviewLog.objects.filter(
                    user=request.user,
                    next_review_date=today + timedelta(days=1),
                ).count(),
            }
        )


@extend_schema(responses=OpenApiTypes.OBJECT)
class ReviewHistoryView(APIView):
    """GET /review/history/?days=30 - Reviewed words count per day."""

    permission_classes = [IsAuthenticated]

    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request):
        days = min(max(int(request.query_params.get("days", 30)), 7), 90)
        today = _user_localdate(request.user)
        start = today - timedelta(days=days - 1)

        logs = (
            ReviewLog.objects
            .filter(user=request.user, last_reviewed__gte=start)
            .values("last_reviewed")
            .annotate(count=Count("id"))
            .order_by("last_reviewed")
        )
        history_map = {str(row["last_reviewed"]): row["count"] for row in logs}

        result = []
        for i in range(days):
            d = start + timedelta(days=i)
            result.append({"date": str(d), "count": history_map.get(str(d), 0)})

        return Response(result)


__all__ = [
    "LearningPathView",
    "ListeningPathView",
    "LearningPlacementStatusView",
    "LearningPlacementQuestionsView",
    "LearningPlacementSubmitView",
    "LearningSessionStartView",
    "ListeningSessionStartView",
    "LearningSessionRecoverView",
    "LearningSessionResumeView",
    "LearningSessionSwitchEasyView",
    "LearningSessionDetailView",
    "ListeningSessionDetailView",
    "LearningSessionAnswerView",
    "LearningSessionFinishView",
    "LearningSessionQuitView",
    "LearningCheckpointStartView",
    "LearningCheckpointSubmitView",
    "DailyGoalView",
    "DailyGoalClaimView",
    "StreakFreezeClaimView",
    "ReviewListView",
    "ReviewSummaryView",
    "ReviewHistoryView",
    "ReviewAnswerView",
]
