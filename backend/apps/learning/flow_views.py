"""Flow-facing learning views (B2C learner journey)."""

from datetime import timedelta
import math
import time

from django.core.cache import cache
from django.db import transaction
from django.db.models import Count
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.vocabulary.models import Word
from .exercise_engine import evaluate_exercise_answer, generate_exercises_from_words, to_client_exercise
from .models import (
    Course,
    ExerciseAttempt,
    ExperimentAssignment,
    LearningEvent,
    LearningSession,
    Lesson,
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
    _compute_recommended_level,
    _count_wrong_attempts_for_word,
    _detect_suspicious_answer,
    _get_awarded_xp,
    _get_or_create_daily_goal,
    _get_consecutive_wrong_streak,
    _get_expected_step_index,
    _get_or_create_streak,
    _get_heart_cost,
    _get_or_create_hearts,
    _get_today_goal_log,
    _normalize_response_ms,
    _placement_cache_key,
    _refill_hearts,
    _extract_unit_words,
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


class LearningPathView(APIView):
    """GET /learning/path/ - Return unit path with lock/unlock state."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        course = (
            Course.objects
            .filter(is_active=True)
            .prefetch_related(
                "units__unit_lessons__lesson",
            )
            .order_by("id")
            .first()
        )
        if not course:
            return Response({"detail": "Chua co khoa hoc kha dung."}, status=status.HTTP_404_NOT_FOUND)

        units = [
            unit for unit in course.units.all()
            if unit.is_published
        ]
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

        for unit in units:
            unit.lesson_count = sum(
                1 for link in unit.unit_lessons.all()
                if link.lesson and link.lesson.is_published
            )
            unit.unlocked = unlocked_map.get(unit.id, False)

        serializer = CoursePathSerializer(
            course,
            context={
                "request": request,
                "progress_map": progress_map,
                "course_progress_map": course_progress_map,
            },
        )
        payload = serializer.data
        payload["units"] = LearningPathUnitSerializer(
            units, many=True, context={"request": request, "progress_map": progress_map}
        ).data
        return Response(payload)


class LearningSessionStartView(APIView):
    """POST /learning/session/start/ - Start a short lesson session."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [LearningSessionStartRateThrottle]

    def post(self, request):
        serializer = LearningSessionStartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lesson = serializer.validated_data["lesson"]

        unit_link = (
            UnitLesson.objects
            .select_related("unit", "unit__course")
            .filter(
                lesson=lesson,
                unit__is_published=True,
                unit__course__is_active=True,
            )
            .order_by("unit__order_index", "order_index")
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
                    "detail": "Ban da het hearts. Vui long doi refill.",
                    "hearts": hearts.current_hearts,
                    "max_hearts": hearts.max_hearts,
                },
                status=HEARTS_MIN_RESPONSE_STATUS,
            )

        lesson_words = (
            Word.objects
            .filter(lessons=lesson)
            .distinct()
        )
        difficulty = _detect_difficulty(request.user)
        max_questions = 6 if difficulty == "easy" else 8
        exercises = _build_exercises_from_bank(lesson, max_questions=max_questions)
        if not exercises:
            global_words = Word.objects.filter(level=lesson.level).exclude(id__in=lesson_words.values("id"))[:100]
            exercises = generate_exercises_from_words(
                lesson_words,
                max_questions=max_questions,
                difficulty=difficulty,
                global_words=global_words,
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
        payload["hearts"] = hearts.current_hearts
        payload["hearts_info"] = _build_hearts_payload(hearts)
        return Response(payload, status=status.HTTP_201_CREATED)


class LearningPlacementStatusView(APIView):
    """GET /learning/placement/status/ - Placement status for onboarding."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        latest = PlacementResult.objects.filter(user=request.user).first()
        return Response(
            {
                "has_completed_placement": latest is not None,
                "recommended_level": latest.recommended_level if latest else None,
                "last_taken_at": latest.created_at if latest else None,
                "score_pct": latest.score_pct if latest else None,
                "should_show_onboarding": latest is None,
            }
        )


class LearningPlacementQuestionsView(APIView):
    """GET /learning/placement/questions/ - Generate placement questions."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = request.query_params.get("count", PLACEMENT_DEFAULT_QUESTION_COUNT)
        existing_questions = cache.get(_placement_cache_key(request.user.id))
        if existing_questions:
            _track_onboarding_step(
                request.user,
                "placement_abandon",
                meta={
                    "reason": "refresh_before_submit",
                    "pending_questions": len(existing_questions),
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
            meta={"question_count": len(safe_questions)},
        )
        return Response(
            {
                "count": len(safe_questions),
                "questions": safe_questions,
                "expires_in_seconds": PLACEMENT_CACHE_TTL_SECONDS,
            }
        )


class LearningPlacementSubmitView(APIView):
    """POST /learning/placement/submit/ - Submit placement answers."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PlacementSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        answers = serializer.validated_data["answers"]
        if len(answers) < PLACEMENT_MIN_SUBMIT_QUESTIONS:
            return Response(
                {"detail": f"Can tra loi it nhat {PLACEMENT_MIN_SUBMIT_QUESTIONS} cau."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        questions = cache.get(_placement_cache_key(request.user.id))
        if not questions:
            return Response(
                {"detail": "Placement da het han. Vui long tai lai bo cau hoi."},
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
                {"detail": "Khong du cau tra loi hop le de cham diem."},
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
        _track_onboarding_step(
            request.user,
            "placement_submit",
            meta={
                "score_pct": score_pct,
                "recommended_level": recommended_level,
                "total_questions": total,
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
            },
        )


class LearningSessionDetailView(APIView):
    """GET /learning/session/{id}/ - Session detail for current learner."""

    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        session = (
            LearningSession.objects
            .select_related("lesson", "unit")
            .filter(id=session_id, user=request.user)
            .first()
        )
        if not session:
            return Response({"detail": "Khong tim thay phien hoc."}, status=status.HTTP_404_NOT_FOUND)
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
        return Response(
            {
                "session": LearningSessionSerializer(session).data,
                "attempts": ExerciseAttemptSerializer(attempts, many=True).data,
                "exercises": safe_exercises,
                "next_step": next_step,
                "hearts": _build_hearts_payload(hearts),
            }
        )


class LearningSessionAnswerView(APIView):
    """POST /learning/session/{id}/answer/ - Submit one exercise answer."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [LearningSessionAnswerBurstThrottle, LearningSessionAnswerSustainedThrottle]

    def post(self, request, session_id):
        session = (
            LearningSession.objects
            .select_related("lesson", "unit")
            .filter(id=session_id, user=request.user)
            .first()
        )
        if not session:
            return Response({"detail": "Khong tim thay phien hoc."}, status=status.HTTP_404_NOT_FOUND)
        if session.status != LearningSession.Status.STARTED:
            return Response({"detail": "Phien hoc da ket thuc."}, status=status.HTTP_400_BAD_REQUEST)

        hearts = _refill_hearts(_get_or_create_hearts(request.user))
        if hearts.current_hearts <= 0:
            return Response(
                {
                    "detail": "Ban da het hearts. Vui long doi refill.",
                    "hearts": hearts.current_hearts,
                    "max_hearts": hearts.max_hearts,
                },
                status=HEARTS_MIN_RESPONSE_STATUS,
            )

        serializer = LearningSessionAnswerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        exercise_map = {item["step_index"]: item for item in (session.exercises or [])}
        exercise = exercise_map.get(data["step_index"])
        if not exercise:
            return Response({"detail": "Buoc bai tap khong hop le."}, status=status.HTTP_400_BAD_REQUEST)

        expected_step = _get_expected_step_index(session)
        if expected_step and data["step_index"] != expected_step:
            return Response(
                {
                    "detail": "Ban can tra loi dung thu tu buoc.",
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
                        "hearts": _build_hearts_payload(hearts),
                    }
                )

            session.total_answered += 1
            if is_correct:
                session.correct_answered += 1
            session.xp_earned += awarded_xp
            session.save(update_fields=["total_answered", "correct_answered", "xp_earned"])

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
            wrong_streak = _get_consecutive_wrong_streak(session)
            show_easy_mode_cta = (
                wrong_streak >= 3
                and session.session_type == LearningSession.SessionType.LESSON
                and session.difficulty != LearningSession.Difficulty.EASY
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
                    "server_eval_ms": eval_ms,
                    "hearts": hearts.current_hearts,
                    "heart_cost": _get_heart_cost(session, is_correct),
                    "suspicious": bool(suspicious_flags),
                    "suspicious_flags": suspicious_flags,
                    "wrong_streak": wrong_streak,
                    "show_easy_mode_cta": show_easy_mode_cta,
                },
                "frustration_guard": {
                    "wrong_streak": wrong_streak,
                    "show_easy_mode_cta": show_easy_mode_cta,
                },
                "hearts": _build_hearts_payload(hearts),
            }
        )


class LearningSessionFinishView(APIView):
    """POST /learning/session/{id}/finish/ - End session and persist progress."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [LearningSessionFinishRateThrottle]

    def post(self, request, session_id):
        session = (
            LearningSession.objects
            .select_related("unit", "unit__course", "lesson")
            .filter(id=session_id, user=request.user)
            .first()
        )
        if not session:
            return Response({"detail": "Khong tim thay phien hoc."}, status=status.HTTP_404_NOT_FOUND)
        if session.session_type == LearningSession.SessionType.CHECKPOINT:
            return Response(
                {"detail": "Dung endpoint checkpoint submit cho phien nay."},
                status=status.HTTP_400_BAD_REQUEST,
            )

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
            return Response({"detail": "Phien hoc khong hop le de ket thuc."}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        with transaction.atomic():
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

        session_minutes = max(1, math.ceil((now - session.started_at).total_seconds() / 60))
        streak = _apply_learning_rewards(
            request.user,
            xp_earned=session.xp_earned,
            study_minutes=session_minutes,
            when=now,
        )
        summary = _build_session_summary(session)
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
                "user": {
                    "xp": request.user.xp,
                    "level": request.user.level,
                    "streak": streak.current_streak,
                },
            }
        )


class LearningSessionQuitView(APIView):
    """POST /learning/session/{id}/quit/ - Mark started session as abandoned."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [LearningSessionQuitRateThrottle]

    def post(self, request, session_id):
        session = LearningSession.objects.filter(id=session_id, user=request.user).first()
        if not session:
            return Response({"detail": "Khong tim thay phien hoc."}, status=status.HTTP_404_NOT_FOUND)
        if session.status == LearningSession.Status.COMPLETED:
            return Response({"detail": "Phien hoc da hoan thanh."}, status=status.HTTP_400_BAD_REQUEST)
        if session.status == LearningSession.Status.ABANDONED:
            return Response({"detail": "Phien hoc da bo do."}, status=status.HTTP_200_OK)

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


class LearningSessionRecoverView(APIView):
    """GET /learning/session/recover/ - Get latest abandoned session."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        session = (
            LearningSession.objects
            .select_related("lesson", "unit")
            .filter(user=request.user, status=LearningSession.Status.ABANDONED)
            .order_by("-completed_at", "-started_at", "-id")
            .first()
        )
        if not session:
            return Response({"has_recoverable_session": False, "session": None})

        next_step = _get_expected_step_index(session) or 1
        return Response(
            {
                "has_recoverable_session": True,
                "session": LearningSessionSerializer(session).data,
                "next_step_index": next_step,
                "abandoned_at": session.completed_at,
            }
        )


class LearningSessionResumeView(APIView):
    """POST /learning/session/{id}/resume/ - Resume an abandoned session."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [LearningSessionStartRateThrottle]

    def post(self, request, session_id):
        session = (
            LearningSession.objects
            .filter(id=session_id, user=request.user)
            .first()
        )
        if not session:
            return Response({"detail": "Khong tim thay phien hoc."}, status=status.HTTP_404_NOT_FOUND)
        if session.status == LearningSession.Status.COMPLETED:
            return Response({"detail": "Phien hoc da hoan thanh."}, status=status.HTTP_400_BAD_REQUEST)
        if session.status == LearningSession.Status.STARTED:
            return Response({"resumed": False, "session": LearningSessionSerializer(session).data})

        hearts = _refill_hearts(_get_or_create_hearts(request.user))
        if hearts.current_hearts <= 0:
            return Response(
                {
                    "detail": "Ban da het hearts. Vui long doi refill.",
                    "hearts": hearts.current_hearts,
                    "max_hearts": hearts.max_hearts,
                },
                status=HEARTS_MIN_RESPONSE_STATUS,
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
            },
        )
        return Response(
            {
                "resumed": True,
                "session": LearningSessionSerializer(session).data,
                "next_step_index": _get_expected_step_index(session) or 1,
                "hearts": _build_hearts_payload(hearts),
            }
        )


class LearningSessionSwitchEasyView(APIView):
    """POST /learning/session/{id}/switch-easy/ - Switch started lesson session to easy."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [LearningSessionAnswerSustainedThrottle]

    def post(self, request, session_id):
        session = (
            LearningSession.objects
            .filter(id=session_id, user=request.user)
            .first()
        )
        if not session:
            return Response({"detail": "Khong tim thay phien hoc."}, status=status.HTTP_404_NOT_FOUND)
        if session.session_type != LearningSession.SessionType.LESSON:
            return Response({"detail": "Chi ho tro switch easy cho lesson session."}, status=status.HTTP_400_BAD_REQUEST)
        if session.status != LearningSession.Status.STARTED:
            return Response({"detail": "Chi switch easy khi session dang started."}, status=status.HTTP_400_BAD_REQUEST)
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


class LearningCheckpointStartView(APIView):
    """POST /learning/checkpoint/start/ - Start checkpoint for one unlocked unit."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [LearningCheckpointStartRateThrottle]

    def post(self, request):
        serializer = LearningCheckpointStartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        unit = serializer.validated_data["unit"]
        hearts = _refill_hearts(_get_or_create_hearts(request.user))
        if hearts.current_hearts <= 0:
            return Response(
                {
                    "detail": "Ban da het hearts. Vui long doi refill.",
                    "hearts": hearts.current_hearts,
                    "max_hearts": hearts.max_hearts,
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
                {"detail": "Can hoan thanh toan bo bai hoc trong unit truoc khi lam checkpoint."},
                status=status.HTTP_400_BAD_REQUEST,
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
        return Response(payload, status=status.HTTP_201_CREATED)


class LearningCheckpointSubmitView(APIView):
    """POST /learning/checkpoint/{id}/submit/ - Score checkpoint and unlock next unit."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [LearningCheckpointSubmitRateThrottle]

    def post(self, request, session_id):
        session = (
            LearningSession.objects
            .select_related("unit", "unit__course")
            .filter(id=session_id, user=request.user)
            .first()
        )
        if not session:
            return Response({"detail": "Khong tim thay checkpoint session."}, status=status.HTTP_404_NOT_FOUND)
        if session.session_type != LearningSession.SessionType.CHECKPOINT:
            return Response({"detail": "Session nay khong phai checkpoint."}, status=status.HTTP_400_BAD_REQUEST)

        total_questions = len(session.exercises or [])
        if total_questions == 0:
            return Response({"detail": "Checkpoint khong co cau hoi."}, status=status.HTTP_400_BAD_REQUEST)
        if session.total_answered < total_questions:
            return Response(
                {"detail": "Ban chua hoan thanh toan bo cau hoi checkpoint."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        score_pct = round((session.correct_answered / total_questions) * 100, 2)
        passed = score_pct >= 70.0

        now = timezone.now()
        with transaction.atomic():
            if session.status != LearningSession.Status.COMPLETED:
                session.status = LearningSession.Status.COMPLETED
                session.completed_at = now
                session.save(update_fields=["status", "completed_at"])

            unit_progress, _ = UserUnitProgress.objects.get_or_create(
                user=request.user,
                unit=session.unit,
                defaults={"started_at": session.started_at},
            )
            if passed:
                unit_progress.checkpoint_passed = True
                unit_progress.checkpoint_passed_at = now
                unit_progress.save(update_fields=["checkpoint_passed", "checkpoint_passed_at", "updated_at"])
            course_progress = _update_course_progress(request.user, session.unit.course, now=now)

        if passed:
            session_minutes = max(1, math.ceil((now - session.started_at).total_seconds() / 60))
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
                "unlocked_next_unit": unlocked_next_unit,
                "next_unit_id": next_unit.id if next_unit else None,
            }
        )


class DailyGoalView(APIView):
    """GET /learning/daily-goal/ - Retrieve daily goal progress + hearts."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        goal = _get_or_create_daily_goal(request.user)
        log = _get_today_goal_log(request.user, goal)
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


class DailyGoalClaimView(APIView):
    """POST /learning/daily-goal/claim/ - Claim XP reward for today's goal."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        goal = _get_or_create_daily_goal(request.user)
        log = _get_today_goal_log(request.user, goal)

        if not goal.is_active:
            return Response({"detail": "Daily goal is disabled."}, status=status.HTTP_400_BAD_REQUEST)
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

        now = timezone.now()
        log.claimed_at = now
        log.reward_xp_awarded = goal.reward_xp
        log.save(update_fields=["claimed_at", "reward_xp_awarded", "updated_at"])
        leveled_up = request.user.add_xp(goal.reward_xp)
        if leveled_up:
            _create_level_up_notification(request.user, request.user.level)
        Notification.objects.create(
            user=request.user,
            type=Notification.Type.REMINDER,
            message=f"Ban da nhan {goal.reward_xp} XP tu daily goal hom nay.",
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


class StreakFreezeClaimView(APIView):
    """POST /learning/streak-freeze/claim/ - Exchange XP for one streak freeze."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        streak = _get_or_create_streak(request.user)
        if streak.streak_freezes >= 5:
            return Response(
                {"detail": "Ban da dat gioi han streak freeze (5)."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if request.user.xp < STREAK_FREEZE_XP_COST:
            return Response(
                {
                    "detail": "Khong du XP de doi streak freeze.",
                    "required_xp": STREAK_FREEZE_XP_COST,
                    "current_xp": request.user.xp,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        request.user.xp -= STREAK_FREEZE_XP_COST
        request.user.level = request.user._calculate_level(request.user.xp)
        request.user.save(update_fields=["xp", "level", "updated_at"])

        streak.streak_freezes += 1
        streak.save(update_fields=["streak_freezes"])

        return Response(
            {
                "freeze_count": streak.streak_freezes,
                "spent_xp": STREAK_FREEZE_XP_COST,
                "xp": request.user.xp,
                "level": request.user.level,
            }
        )


class ReviewListView(APIView):
    """GET /review/ - List up to REVIEW_SESSION_LIMIT words due today."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.localdate()
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


class ReviewAnswerView(APIView):
    """POST /review/{word_id}/answer/ - Submit review answer and apply SM-2."""

    permission_classes = [IsAuthenticated]

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
        _apply_learning_rewards(request.user, xp_earned=xp, study_minutes=1)

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
            }
        )


class ReviewSummaryView(APIView):
    """GET /review/summary/ - Today's review summary."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.localdate()
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


class ReviewHistoryView(APIView):
    """GET /review/history/?days=30 - Reviewed words count per day."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        days = min(max(int(request.query_params.get("days", 30)), 7), 90)
        today = timezone.localdate()
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
    "LearningPlacementStatusView",
    "LearningPlacementQuestionsView",
    "LearningPlacementSubmitView",
    "LearningSessionStartView",
    "LearningSessionRecoverView",
    "LearningSessionResumeView",
    "LearningSessionSwitchEasyView",
    "LearningSessionDetailView",
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
