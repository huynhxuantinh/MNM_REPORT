"""Shared constants and helper functions for learner flow logic."""

import random
from datetime import timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.db import transaction
from django.db.models import Min, Q, Sum
from django.utils import timezone
from rest_framework import status

from apps.vocabulary.models import Word
from .experiments import (
    DAILY_GOAL_EXPERIMENT_KEY,
    HEARTS_EXPERIMENT_KEY,
    apply_daily_goal_experiment,
    apply_hearts_experiment,
    track_experiment_metric,
)
from .models import (
    Course,
    DailyGoal,
    DailyGoalLog,
    Exercise,
    ExerciseAttempt,
    HeartTransaction,
    LearningEvent,
    LearningSession,
    Lesson,
    Notification,
    ReviewLog,
    Unit,
    UserCourseProgress,
    UserHearts,
    UserReminderPreference,
    UserStreak,
    UserUnitProgress,
    UserActivityProgress,
    UnitActivity,
)

# XP constants - based on chapter 2.6 table
XP_NEW_WORD = 10
XP_LESSON_BONUS = 20
XP_REVIEW_CORRECT = 5   # q >= 3
XP_REVIEW_WRONG = 2     # q < 3

# Giới hạn từ mới mỗi phiên ôn (tránh quá tải)
REVIEW_SESSION_LIMIT = 50
HEARTS_DEFAULT_MAX = 10
HEARTS_DEFAULT_REFILL_INTERVAL_MINUTES = 10
HEARTS_MIN_RESPONSE_STATUS = status.HTTP_429_TOO_MANY_REQUESTS
STREAK_FREEZE_XP_COST = 50
ANTI_CHEAT_MIN_RESPONSE_MS = 80
ANTI_CHEAT_MAX_RESPONSE_MS = 30 * 60 * 1000
PLACEMENT_DEFAULT_QUESTION_COUNT = 12
PLACEMENT_MIN_SUBMIT_QUESTIONS = 5
PLACEMENT_CACHE_TTL_SECONDS = 30 * 60
PLACEMENT_LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"]
SESSION_RECOVER_STALE_HOURS = 24
CHECKPOINT_BASE_COOLDOWN_MINUTES = 10


def _get_user_timezone(user):
    tz_name = getattr(user, "timezone", "") or "Asia/Ho_Chi_Minh"
    try:
        return ZoneInfo(tz_name)
    except ZoneInfoNotFoundError:
        return ZoneInfo("Asia/Ho_Chi_Minh")


def _user_localdate(user, when=None):
    when = when or timezone.now()
    return timezone.localtime(when, _get_user_timezone(user)).date()


def _user_localtime(user, when=None):
    when = when or timezone.now()
    return timezone.localtime(when, _get_user_timezone(user))


def _get_user_recommended_level(user) -> str:
    result = user.placement_results.order_by("-created_at").first()
    return (result.recommended_level if result else "A1") or "A1"


def _level_rank(level: str) -> int:
    try:
        return PLACEMENT_LEVEL_ORDER.index((level or "A1").upper())
    except ValueError:
        return 0


def _get_or_create_streak(user) -> UserStreak:
    streak, _ = UserStreak.objects.get_or_create(user=user)
    return streak


def _create_level_up_notification(user, new_level: int) -> None:
    Notification.objects.create(
        user=user,
        type=Notification.Type.LEVEL_UP,
        message=f"Chúc mừng! Bạn đã đạt Level {new_level}.",
    )


def _create_streak_notification(user, streak: int) -> None:
    milestones = {7, 30, 100}
    if streak in milestones:
        Notification.objects.create(
            user=user,
            type=Notification.Type.STREAK,
            message=f"Tuyệt vời! Bạn đã học {streak} ngày liên tiếp!",
        )


def _count_completed_unit_activities(unit, activity_progress_map):
    if not activity_progress_map:
        return 0
    activities = getattr(unit, "activities", None)
    if activities is None:
        return 0
    return sum(
        1
        for activity in activities.all()
        if activity.is_published
        and activity.is_required
        and (progress := activity_progress_map.get(activity.id))
        and progress.status == UserActivityProgress.Status.COMPLETED
    )


def _build_unlock_map(units, progress_map, activity_progress_map=None):
    unlocked_map = {}
    previous_unit = None
    for index, unit in enumerate(units):
        if index == 0 or unit.required_lessons_to_unlock == 0:
            unlocked_map[unit.id] = True
            previous_unit = unit
            continue

        prev_progress = progress_map.get(previous_unit.id)
        prev_completed = 0
        prev_checkpoint_passed = False
        if prev_progress:
            prev_completed = prev_progress.completed_lessons
            prev_checkpoint_passed = prev_progress.checkpoint_passed
        published_lesson_count = previous_unit.unit_lessons.filter(lesson__is_published=True).count()
        required_to_unlock = previous_unit.required_lessons_to_unlock
        if published_lesson_count > 0:
            required_to_unlock = min(required_to_unlock, published_lesson_count)
        else:
            prev_completed = max(prev_completed, _count_completed_unit_activities(previous_unit, activity_progress_map))
        unlocked_map[unit.id] = (
            prev_checkpoint_passed or prev_completed >= required_to_unlock
        )
        previous_unit = unit
    return unlocked_map


def _resolve_recommended_start_unit(units, recommended_level: str):
    target_rank = _level_rank(recommended_level)
    best_unit = None
    best_rank = None
    for unit in units:
        lesson_levels = []
        links = getattr(unit, "unit_lessons_filtered", None) or list(unit.unit_lessons.all())
        for link in links:
            lesson = getattr(link, "lesson", None)
            if lesson and lesson.is_published and lesson.level:
                lesson_levels.append(_level_rank(lesson.level))
        
        # V2 support: check activities if unit_lessons are empty
        if not lesson_levels:
            activities = getattr(unit, "activities", None)
            if activities is not None:
                for activity in activities.all():
                    if activity.is_published and activity.lesson_id and activity.lesson.level:
                        lesson_levels.append(_level_rank(activity.lesson.level))
                    elif activity.is_published and activity.listening_passage_id and activity.listening_passage.level:
                        lesson_levels.append(_level_rank(activity.listening_passage.level))
        
        if not lesson_levels:
            continue
        unit_rank = min(lesson_levels)
        if unit_rank >= target_rank and (best_rank is None or unit_rank < best_rank):
            best_unit = unit
            best_rank = unit_rank
    return best_unit


def _build_placement_context(user, units) -> dict:
    recommended_level = _get_user_recommended_level(user)
    start_unit = _resolve_recommended_start_unit(units, recommended_level)
    return {
        "recommended_level": recommended_level,
        "recommended_start_unit_id": start_unit.id if start_unit else None,
    }


def _is_unit_unlocked(user, target_unit: Unit) -> bool:
    units = list(
        Unit.objects.filter(course=target_unit.course, is_published=True).order_by("order_index")
    )
    unit_ids = [unit.id for unit in units]
    progress_map = {
        progress.unit_id: progress
        for progress in UserUnitProgress.objects.filter(
            user=user, unit_id__in=unit_ids
        )
    }
    activity_ids = list(
        UnitActivity.objects.filter(
            unit_id__in=unit_ids,
            is_published=True,
        ).values_list("id", flat=True)
    )
    activity_progress_map = {
        progress.activity_id: progress
        for progress in UserActivityProgress.objects.filter(
            user=user,
            activity_id__in=activity_ids,
        )
    }
    return _build_unlock_map(units, progress_map, activity_progress_map).get(target_unit.id, False)


def _detect_difficulty_with_context(user) -> tuple[str, dict]:
    sessions = list(
        LearningSession.objects
        .filter(
            user=user,
            status=LearningSession.Status.COMPLETED,
            session_type=LearningSession.SessionType.LESSON,
        )
        .order_by("-completed_at", "-id")[:3]
    )
    if not sessions:
        return "normal", {
            "recent_session_count": 0,
            "avg_accuracy_pct": None,
            "avg_response_ms": None,
            "recent_wrong_streak": 0,
            "reason": "no_recent_sessions",
        }

    session_ids = [session.id for session in sessions]
    attempts = list(
        ExerciseAttempt.objects
        .filter(session_id__in=session_ids)
        .only("session_id", "is_correct", "response_ms", "created_at")
        .order_by("-created_at")
    )
    if not attempts:
        return "normal", {
            "recent_session_count": len(sessions),
            "avg_accuracy_pct": 0,
            "avg_response_ms": None,
            "recent_wrong_streak": 0,
            "reason": "no_attempts_in_recent_sessions",
        }

    total = len(attempts)
    correct = sum(1 for item in attempts if item.is_correct)
    accuracy = correct / total if total > 0 else 0
    avg_response_ms = int(sum(item.response_ms for item in attempts) / total) if total > 0 else 0
    recent_wrong_streak = 0
    for item in attempts:
        if item.is_correct:
            break
        recent_wrong_streak += 1

    if recent_wrong_streak >= 3 or accuracy < 0.45:
        difficulty = "easy"
        reason = "low_accuracy_or_wrong_streak"
    elif accuracy > 0.75 and avg_response_ms <= 4500:
        difficulty = "hard"
        reason = "high_accuracy_and_fast_response"
    else:
        difficulty = "normal"
        reason = "balanced_recent_performance"

    return difficulty, {
        "recent_session_count": len(sessions),
        "avg_accuracy_pct": round(accuracy * 100, 2),
        "avg_response_ms": avg_response_ms,
        "recent_wrong_streak": recent_wrong_streak,
        "reason": reason,
    }


def _detect_difficulty(user) -> str:
    difficulty, _ = _detect_difficulty_with_context(user)
    return difficulty


def _build_exercises_from_bank(lesson: Lesson, max_questions: int) -> list[dict]:
    templates = list(
        Exercise.objects.filter(lesson=lesson, is_active=True)
        .order_by("step_index", "id")
    )
    if not templates:
        return []

    exercises = []
    step = 1
    for item in templates[: max(1, max_questions)]:
        payload = item.payload if isinstance(item.payload, dict) else {}
        exercise = {
            "step_index": step,
            "exercise_type": item.exercise_type,
            "prompt": item.prompt,
        }
        for key in (
            "choices",
            "correct_option",
            "audio_text",
            "correct_text",
            "tokens",
            "correct_tokens",
            "word_id",
        ):
            if key in payload:
                exercise[key] = payload[key]
        exercises.append(exercise)
        step += 1
    return exercises


def _update_course_progress(user, course: Course, now=None) -> UserCourseProgress:
    now = now or timezone.now()
    progress, _ = UserCourseProgress.objects.get_or_create(
        user=user,
        course=course,
    )

    unit_progress_qs = UserUnitProgress.objects.filter(user=user, unit__course=course).select_related("unit")
    total_units = Unit.objects.filter(course=course, is_published=True).count()
    completed_units = unit_progress_qs.filter(checkpoint_passed=True).count()
    total_xp = unit_progress_qs.aggregate(s=Sum("total_xp_earned"))["s"] or 0
    last_progress = (
        unit_progress_qs.filter(started_at__isnull=False)
        .order_by("-unit__order_index")
        .first()
    )
    earliest_started = (
        unit_progress_qs.filter(started_at__isnull=False)
        .aggregate(v=Min("started_at"))["v"]
    )

    progress.completed_units = completed_units
    progress.total_xp_earned = max(0, int(total_xp))
    progress.last_unit = last_progress.unit if last_progress else progress.last_unit
    if earliest_started and not progress.started_at:
        progress.started_at = earliest_started
    if total_units > 0 and completed_units >= total_units:
        progress.completed_at = progress.completed_at or now
    else:
        progress.completed_at = None
    progress.save(
        update_fields=[
            "completed_units",
            "total_xp_earned",
            "last_unit",
            "started_at",
            "completed_at",
            "updated_at",
        ]
    )
    return progress


def _get_or_create_hearts(user) -> UserHearts:
    hearts, _ = UserHearts.objects.get_or_create(
        user=user,
        defaults={
            "current_hearts": HEARTS_DEFAULT_MAX,
            "max_hearts": HEARTS_DEFAULT_MAX,
            "refill_interval_minutes": HEARTS_DEFAULT_REFILL_INTERVAL_MINUTES,
        },
    )
    apply_hearts_experiment(user, hearts)
    return hearts


def _refill_hearts(hearts: UserHearts, now=None) -> UserHearts:
    now = now or timezone.now()
    if hearts.max_hearts <= 0:
        hearts.max_hearts = HEARTS_DEFAULT_MAX
    if hearts.current_hearts >= hearts.max_hearts:
        if hearts.last_refill_at is None:
            hearts.last_refill_at = now
            hearts.save(update_fields=["last_refill_at", "updated_at"])
        return hearts

    if hearts.last_refill_at is None:
        hearts.last_refill_at = now
        hearts.save(update_fields=["last_refill_at", "updated_at"])
        return hearts

    interval_seconds = max(60, hearts.refill_interval_minutes * 60)
    elapsed_seconds = (now - hearts.last_refill_at).total_seconds()
    refill_units = int(elapsed_seconds // interval_seconds)
    if refill_units <= 0:
        return hearts

    refill_amount = min(refill_units, hearts.max_hearts - hearts.current_hearts)
    if refill_amount <= 0:
        return hearts

    hearts.current_hearts += refill_amount
    hearts.last_refill_at = hearts.last_refill_at + timedelta(seconds=interval_seconds * refill_units)
    hearts.save(update_fields=["current_hearts", "last_refill_at", "updated_at"])
    HeartTransaction.objects.create(
        hearts=hearts,
        transaction_type=HeartTransaction.TxType.REFILL,
        delta=refill_amount,
        reason="time_refill",
    )
    return hearts


def _consume_heart(user, reason: str, cost: int = 1) -> UserHearts:
    _get_or_create_hearts(user)  # đảm bảo row tồn tại trước khi lock
    with transaction.atomic():
        hearts = UserHearts.objects.select_for_update().get(user=user)
        apply_hearts_experiment(user, hearts)
        hearts = _refill_hearts(hearts)
        if hearts.current_hearts <= 0 or cost <= 0:
            return hearts
        actual_cost = min(cost, hearts.current_hearts)
        hearts.current_hearts -= actual_cost
        hearts.save(update_fields=["current_hearts", "updated_at"])
        HeartTransaction.objects.create(
            hearts=hearts,
            transaction_type=HeartTransaction.TxType.CONSUME,
            delta=-actual_cost,
            reason=reason[:120],
        )
        track_experiment_metric(
            user,
            HEARTS_EXPERIMENT_KEY,
            metric_key="heart_consume",
            metric_value=actual_cost,
            meta={"reason": reason[:120]},
        )
        return hearts


def _grant_heart_bonus(user, reason: str, amount: int = 1) -> tuple[UserHearts, int]:
    _get_or_create_hearts(user)  # đảm bảo row tồn tại trước khi lock
    with transaction.atomic():
        hearts = UserHearts.objects.select_for_update().get(user=user)
        apply_hearts_experiment(user, hearts)
        hearts = _refill_hearts(hearts)
        if amount <= 0 or hearts.current_hearts >= hearts.max_hearts:
            return hearts, 0
        granted = min(amount, hearts.max_hearts - hearts.current_hearts)
        if granted <= 0:
            return hearts, 0
        hearts.current_hearts += granted
        hearts.save(update_fields=["current_hearts", "updated_at"])
        HeartTransaction.objects.create(
            hearts=hearts,
            transaction_type=HeartTransaction.TxType.BONUS,
            delta=granted,
            reason=reason[:120],
        )
        track_experiment_metric(
            user,
            HEARTS_EXPERIMENT_KEY,
            metric_key="heart_bonus",
            metric_value=granted,
            meta={"reason": reason[:120]},
        )
        return hearts, granted


def _get_or_create_daily_goal(user) -> DailyGoal:
    goal, _ = DailyGoal.objects.get_or_create(user=user)
    apply_daily_goal_experiment(user, goal)
    return goal


def _get_today_goal_log(user, goal: DailyGoal, now=None) -> DailyGoalLog:
    log, _ = DailyGoalLog.objects.get_or_create(
        user=user,
        goal=goal,
        goal_date=_user_localdate(user, when=now),
        defaults={"goal_minutes": goal.target_minutes},
    )
    return log


def _add_study_minutes(user, minutes: int) -> DailyGoalLog | None:
    if minutes <= 0:
        return None
    goal = _get_or_create_daily_goal(user)
    if not goal.is_active:
        return None
    now = timezone.now()
    with transaction.atomic():
        log = _get_today_goal_log(user, goal, now=now)
        log = DailyGoalLog.objects.select_for_update().get(pk=log.pk)
        log.goal_minutes = goal.target_minutes
        log.studied_minutes += minutes
        fields = ["goal_minutes", "studied_minutes", "updated_at"]
        if not log.is_achieved and log.studied_minutes >= log.goal_minutes:
            log.is_achieved = True
            log.achieved_at = now
            fields.extend(["is_achieved", "achieved_at"])
        log.save(update_fields=fields)
    return log


def _update_streak_with_freeze(streak: UserStreak, now=None) -> None:
    today = _user_localdate(streak.user, when=now)
    if streak.last_active_date == today:
        return

    used_freeze = False
    if streak.last_active_date == today - timedelta(days=1):
        streak.current_streak += 1
    elif (
        streak.last_active_date == today - timedelta(days=2)
        and streak.streak_freezes > 0
        and streak.last_freeze_used_on != today
    ):
        streak.current_streak += 1
        streak.streak_freezes -= 1
        streak.last_freeze_used_on = today
        used_freeze = True
    else:
        streak.current_streak = 1

    streak.longest_streak = max(streak.longest_streak, streak.current_streak)
    rewarded_freeze = False
    if (
        streak.current_streak > 0
        and streak.current_streak % 7 == 0
        and streak.current_streak > streak.last_freeze_reward_streak
    ):
        streak.streak_freezes += 1
        streak.last_freeze_reward_streak = streak.current_streak
        rewarded_freeze = True
    streak.last_active_date = today
    update_fields = ["current_streak", "longest_streak", "last_active_date"]
    if used_freeze:
        update_fields.extend(["streak_freezes", "last_freeze_used_on"])
    if rewarded_freeze:
        update_fields.extend(["streak_freezes", "last_freeze_reward_streak"])
    streak.save(update_fields=update_fields)


def _record_user_activity(user, when=None) -> None:
    when = when or timezone.now()
    pref, _ = UserReminderPreference.objects.get_or_create(user=user)
    local = _user_localtime(user, when=when)
    pref.preferred_hour = local.hour
    pref.last_activity_at = when
    pref.save(update_fields=["preferred_hour", "last_activity_at", "updated_at"])


def _apply_learning_rewards(user, xp_earned: int, study_minutes: int, when=None) -> UserStreak:
    """Single path to update xp/level/streak/study minutes after a learning activity."""
    leveled_up = user.add_xp(max(0, int(xp_earned)))
    if leveled_up:
        _create_level_up_notification(user, user.level)
    streak = _get_or_create_streak(user)
    _update_streak_with_freeze(streak, now=when)
    _record_user_activity(user, when=when)
    _add_study_minutes(user, max(0, int(study_minutes)))
    _create_streak_notification(user, streak.current_streak)
    return streak


def _build_hearts_payload(hearts: UserHearts) -> dict:
    now = timezone.now()
    if hearts.current_hearts >= hearts.max_hearts:
        next_refill_seconds = 0
    else:
        last_refill_at = hearts.last_refill_at or now
        elapsed = max(0, int((now - last_refill_at).total_seconds()))
        interval = max(60, hearts.refill_interval_minutes * 60)
        next_refill_seconds = max(0, interval - (elapsed % interval))
    return {
        "current": hearts.current_hearts,
        "max": hearts.max_hearts,
        "refill_interval_minutes": hearts.refill_interval_minutes,
        "next_refill_seconds": next_refill_seconds,
    }


def _track_learning_event(user, event_type: str, session=None, meta=None) -> None:
    LearningEvent.objects.create(
        user=user,
        session=session,
        event_type=event_type,
        meta=meta or {},
    )


def _track_onboarding_step(user, step: str, meta=None) -> None:
    payload = {"step": step}
    if meta:
        payload.update(meta)
    _track_learning_event(
        user,
        LearningEvent.EventType.ONBOARDING_STEP,
        meta=payload,
    )


def _get_heart_cost(session: LearningSession, is_correct: bool) -> int:
    if is_correct:
        return 0
    if session.session_type == LearningSession.SessionType.CHECKPOINT:
        return 0
    return 1


def _get_awarded_xp(session: LearningSession, is_correct: bool) -> int:
    if not is_correct:
        return 0 if session.session_type == LearningSession.SessionType.CHECKPOINT else 1
    if session.session_type == LearningSession.SessionType.CHECKPOINT:
        return 12
    if session.difficulty == LearningSession.Difficulty.EASY:
        return 8
    if session.difficulty == LearningSession.Difficulty.HARD:
        return 12
    return 10


def _normalize_response_ms(response_ms: int) -> int:
    return max(0, min(int(response_ms or 0), ANTI_CHEAT_MAX_RESPONSE_MS))


def _detect_suspicious_answer(response_ms: int) -> list[str]:
    flags = []
    if response_ms < ANTI_CHEAT_MIN_RESPONSE_MS:
        flags.append("too_fast_response")
    return flags


def _get_expected_step_index(session: LearningSession) -> int | None:
    step_indexes = sorted(
        {
            int(item.get("step_index") or 0)
            for item in (session.exercises or [])
            if int(item.get("step_index") or 0) > 0
        }
    )
    if not step_indexes:
        return None
    answered_steps = set(session.attempts.values_list("step_index", flat=True))
    for step_index in step_indexes:
        if step_index not in answered_steps:
            return step_index
    return step_indexes[-1]


def _placement_cache_key(user_id: int) -> str:
    return f"placement_q:u{user_id}"


def _placement_submit_result_cache_key(user_id: int) -> str:
    return f"placement_submit:u{user_id}"


def _placement_word_meaning(word: Word) -> str:
    return (word.definition_vi or word.definition_en or word.text or "").strip()


def _compute_recommended_level(level_stats: dict[str, dict[str, int]]) -> str:
    recommended = "A1"
    for level in PLACEMENT_LEVEL_ORDER:
        stats = level_stats.get(level) or {"total": 0, "correct": 0}
        if stats["total"] <= 0:
            continue
        accuracy = stats["correct"] / stats["total"]
        if accuracy >= 0.6:
            recommended = level
        else:
            break
    return recommended


def _build_placement_questions(count: int = PLACEMENT_DEFAULT_QUESTION_COUNT) -> list[dict]:
    count = max(6, min(int(count or PLACEMENT_DEFAULT_QUESTION_COUNT), 30))
    all_words = list(
        Word.objects.exclude(text="")
        .only("id", "text", "definition_vi", "definition_en", "level")
        .order_by("id")
    )
    if not all_words:
        return []

    level_buckets: dict[str, list[Word]] = {level: [] for level in PLACEMENT_LEVEL_ORDER}
    for word in all_words:
        level = (word.level or "").upper()
        if level in level_buckets:
            level_buckets[level].append(word)

    selected: list[Word] = []
    target_per_level = max(1, count // len(PLACEMENT_LEVEL_ORDER))
    for level in PLACEMENT_LEVEL_ORDER:
        bucket = level_buckets.get(level) or []
        if not bucket:
            continue
        random.shuffle(bucket)
        selected.extend(bucket[:target_per_level])
        if len(selected) >= count:
            break

    if len(selected) < count:
        pool = [word for word in all_words if word.id not in {item.id for item in selected}]
        random.shuffle(pool)
        selected.extend(pool[: count - len(selected)])
    selected = selected[:count]

    meaning_pool = []
    for word in all_words:
        meaning = _placement_word_meaning(word)
        if meaning:
            meaning_pool.append(meaning)
    meaning_pool = list(dict.fromkeys(meaning_pool))

    questions: list[dict] = []
    for idx, word in enumerate(selected, start=1):
        correct = _placement_word_meaning(word)
        if not correct:
            continue
        distractors = [item for item in meaning_pool if item != correct]
        random.shuffle(distractors)
        choices = [correct] + distractors[:3]
        while len(choices) < 4:
            choices.append(f"Nghĩa gần đúng {len(choices)}")
        random.shuffle(choices)
        questions.append(
            {
                "question_id": idx,
                "word_id": word.id,
                "word_text": word.text,
                "word_level": (word.level or "A1").upper(),
                "prompt": f'Chọn nghĩa đúng của "{word.text}"',
                "choices": choices,
                "correct_option": correct,
            }
        )
    return questions


def _extract_unit_words(unit: Unit):
    return (
        Word.objects
        .filter(Q(lessons__unit_links__unit=unit) | Q(lessons__unit_activities__unit=unit))
        .distinct()
    )


def _bump_word_to_early_review(user, word_id: int) -> None:
    if not word_id:
        return
    today = _user_localdate(user)
    log, _ = ReviewLog.objects.get_or_create(
        user=user,
        word_id=word_id,
        defaults={"next_review_date": today},
    )
    if log.next_review_date is None or log.next_review_date > today:
        log.next_review_date = today
        log.save(update_fields=["next_review_date", "updated_at"])


def _ensure_session_words_in_review(user, session: LearningSession) -> list[int]:
    word_ids = sorted(
        {
            int(item.get("word_id") or 0)
            for item in (session.exercises or [])
            if int(item.get("word_id") or 0) > 0
        }
    )
    if not word_ids:
        return []
    today = _user_localdate(user)
    tomorrow = today + timedelta(days=1)
    existing_word_ids = set(
        ReviewLog.objects.filter(user=user, word_id__in=word_ids).values_list("word_id", flat=True)
    )
    new_logs = [
        ReviewLog(
            user=user,
            word_id=word_id,
            repetitions=0,
            interval_days=1,
            easiness_factor=2.5,
            next_review_date=tomorrow,
        )
        for word_id in word_ids
        if word_id not in existing_word_ids
    ]
    if new_logs:
        ReviewLog.objects.bulk_create(new_logs, ignore_conflicts=True)
    return word_ids


def _get_checkpoint_lock_info(progress: UserUnitProgress | None, now=None) -> dict:
    now = now or timezone.now()
    if not progress or not progress.checkpoint_locked_until or progress.checkpoint_locked_until <= now:
        return {"locked": False, "remaining_seconds": 0}
    remaining_seconds = max(0, int((progress.checkpoint_locked_until - now).total_seconds()))
    return {"locked": True, "remaining_seconds": remaining_seconds}


def _register_checkpoint_result(progress: UserUnitProgress, passed: bool, now=None) -> None:
    now = now or timezone.now()
    progress.checkpoint_last_attempt_at = now
    if passed:
        progress.checkpoint_passed = True
        progress.checkpoint_passed_at = now
        progress.checkpoint_attempts = 0
        progress.checkpoint_locked_until = None
        progress.save(
            update_fields=[
                "checkpoint_passed",
                "checkpoint_passed_at",
                "checkpoint_attempts",
                "checkpoint_last_attempt_at",
                "checkpoint_locked_until",
                "updated_at",
            ]
        )
        return

    next_attempt_count = progress.checkpoint_attempts + 1
    cooldown_minutes = CHECKPOINT_BASE_COOLDOWN_MINUTES * min(next_attempt_count, 3)
    progress.checkpoint_attempts = next_attempt_count
    progress.checkpoint_locked_until = now + timedelta(minutes=cooldown_minutes)
    progress.save(
        update_fields=[
            "checkpoint_attempts",
            "checkpoint_last_attempt_at",
            "checkpoint_locked_until",
            "updated_at",
        ]
    )


def _build_session_summary(session: LearningSession) -> dict:
    attempts = list(
        session.attempts.order_by("step_index").values(
            "step_index", "exercise_type", "is_correct", "awarded_xp"
        )
    )
    if not attempts:
        return {
            "accuracy_pct": 0,
            "accuracy_by_type": {},
            "review_word_ids": [],
            "review_words": [],
            "total_xp_from_attempts": 0,
        }

    by_type = {}
    total_correct = 0
    total_xp = 0
    wrong_word_ids = set()
    exercise_map = {item["step_index"]: item for item in (session.exercises or [])}
    for attempt in attempts:
        ex_type = attempt["exercise_type"]
        bucket = by_type.setdefault(ex_type, {"total": 0, "correct": 0})
        bucket["total"] += 1
        if attempt["is_correct"]:
            bucket["correct"] += 1
            total_correct += 1
        else:
            exercise = exercise_map.get(attempt["step_index"]) or {}
            word_id = int(exercise.get("word_id") or 0)
            if word_id:
                wrong_word_ids.add(word_id)
        total_xp += attempt["awarded_xp"]

    accuracy_by_type = {
        key: {
            "total": value["total"],
            "correct": value["correct"],
            "accuracy_pct": round((value["correct"] / value["total"]) * 100, 2) if value["total"] else 0,
        }
        for key, value in by_type.items()
    }
    review_words = list(
        Word.objects
        .filter(id__in=list(wrong_word_ids))
        .values("id", "text", "definition_vi", "definition_en")
    )
    return {
        "accuracy_pct": round((total_correct / len(attempts)) * 100, 2),
        "accuracy_by_type": accuracy_by_type,
        "review_word_ids": sorted(list(wrong_word_ids)),
        "review_words": review_words,
        "total_xp_from_attempts": total_xp,
    }


def _count_wrong_attempts_for_word(session: LearningSession, word_id: int) -> int:
    if not word_id:
        return 0
    exercise_map = {item["step_index"]: item for item in (session.exercises or [])}
    wrong_count = 0
    for attempt in session.attempts.all().values("step_index", "is_correct"):
        if attempt["is_correct"]:
            continue
        exercise = exercise_map.get(attempt["step_index"]) or {}
        if int(exercise.get("word_id") or 0) == int(word_id):
            wrong_count += 1
    return wrong_count


def _get_consecutive_wrong_streak(session: LearningSession) -> int:
    streak = 0
    for is_correct in session.attempts.order_by("-created_at").values_list("is_correct", flat=True):
        if is_correct:
            break
        streak += 1
    return streak


def _get_consecutive_correct_streak(session: LearningSession) -> int:
    streak = 0
    for is_correct in session.attempts.order_by("-created_at").values_list("is_correct", flat=True):
        if not is_correct:
            break
        streak += 1
    return streak


def _estimate_session_minutes(session: LearningSession, now=None, max_minutes: int = 45) -> int:
    """
    Estimate effective study minutes from real answer time (response_ms),
    fallback to wall-clock only when no attempts exist.
    """
    response_values = list(
        session.attempts.values_list("response_ms", flat=True)
    )
    total_ms = sum(_normalize_response_ms(value) for value in response_values)
    if total_ms > 0:
        estimated = int((total_ms + 59999) // 60000)  # ceil(ms / 60000)
        return max(1, min(max_minutes, estimated))

    if session.started_at:
        now = now or timezone.now()
        wall_minutes = int(((now - session.started_at).total_seconds() + 59) // 60)
        return max(1, min(max_minutes, wall_minutes))
    return 1



__all__ = [
    "XP_NEW_WORD",
    "XP_LESSON_BONUS",
    "XP_REVIEW_CORRECT",
    "XP_REVIEW_WRONG",
    "REVIEW_SESSION_LIMIT",
    "HEARTS_MIN_RESPONSE_STATUS",
    "STREAK_FREEZE_XP_COST",
    "PLACEMENT_DEFAULT_QUESTION_COUNT",
    "PLACEMENT_MIN_SUBMIT_QUESTIONS",
    "PLACEMENT_CACHE_TTL_SECONDS",
    "SESSION_RECOVER_STALE_HOURS",
    "_get_or_create_streak",
    "_create_level_up_notification",
    "_build_unlock_map",
    "_build_placement_context",
    "_is_unit_unlocked",
    "_detect_difficulty",
    "_detect_difficulty_with_context",
    "_build_exercises_from_bank",
    "_update_course_progress",
    "_get_or_create_hearts",
    "_refill_hearts",
    "_consume_heart",
    "_grant_heart_bonus",
    "_get_or_create_daily_goal",
    "_get_today_goal_log",
    "_get_user_recommended_level",
    "_get_user_timezone",
    "_user_localdate",
    "_user_localtime",
    "_apply_learning_rewards",
    "_build_hearts_payload",
    "_track_learning_event",
    "_track_onboarding_step",
    "_get_heart_cost",
    "_get_awarded_xp",
    "_normalize_response_ms",
    "_detect_suspicious_answer",
    "_get_expected_step_index",
    "_placement_cache_key",
    "_placement_submit_result_cache_key",
    "_compute_recommended_level",
    "_build_placement_questions",
    "_extract_unit_words",
    "_bump_word_to_early_review",
    "_ensure_session_words_in_review",
    "_get_checkpoint_lock_info",
    "_register_checkpoint_result",
    "_resolve_recommended_start_unit",
    "_build_session_summary",
    "_count_wrong_attempts_for_word",
    "_get_consecutive_wrong_streak",
    "_get_consecutive_correct_streak",
    "_estimate_session_minutes",
]

