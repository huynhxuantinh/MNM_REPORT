"""Learner/admin-facing views for learning module."""

import hashlib
from datetime import datetime, timedelta

from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from django.core.cache import cache
from django.utils import timezone
from django.db.models import Count
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.accounts.permissions import IsAdmin
from .throttles import LearningAnalyticsReadRateThrottle
from .models import (
    DailyGoalLog,
    LeagueSeason,
    LeagueStanding,
    LearningEvent,
    LearningSession,
    LessonProgress,
    ListeningAnswer,
    ListeningSession,
    Notification,
    ReviewLog,
    UserStreak,
)
from .serializers import NotificationSerializer
from .shared_flow import _get_or_create_streak

LEADERBOARD_CACHE_TTL_SECONDS = 120
LEAGUE_CACHE_TTL_SECONDS = 60
KPI_CACHE_TTL_SECONDS = 300


def _leaderboard_cache_key() -> str:
    top_rows = list(
        User.objects.filter(role=User.Role.USER, is_active=True)
        .order_by("-xp", "id")
        .values_list("id", "xp", "updated_at")[:50]
    )
    raw = "|".join(
        f"{user_id}:{xp}:{updated_at.isoformat() if updated_at else 'none'}"
        for user_id, xp, updated_at in top_rows
    )
    digest = hashlib.md5(raw.encode()).hexdigest()
    return f"learning:leaderboard:top50:v2:{digest}"

@extend_schema(responses=OpenApiTypes.OBJECT)
class ProfileStatsView(APIView):
    """GET /learning/profile/stats/ - Per-user learning stats."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Sum
        from apps.vocabulary.models import Bookmark

        user = request.user
        logs = ReviewLog.objects.filter(user=user)

        # One ReviewLog per (user, word): "total_words_studied" means words present in SRS.
        total_words_studied = logs.count()
        words_reviewed = logs.filter(total_reviews__gt=0).count()
        total_review_attempts = logs.aggregate(s=Sum("total_reviews"))["s"] or 0
        correct_answers = logs.aggregate(s=Sum("correct_count"))["s"] or 0
        accuracy_pct = (
            round(correct_answers / total_review_attempts * 100)
            if total_review_attempts > 0
            else 0
        )

        streak_obj = _get_or_create_streak(user)
        bookmarks = Bookmark.objects.filter(user=user).count()
        lessons_completed = LessonProgress.objects.filter(user=user, completed_at__isnull=False).count()
        listening_sessions_completed = ListeningSession.objects.filter(
            user=user,
            status=ListeningSession.Status.COMPLETED,
        ).count()
        listening_answers = ListeningAnswer.objects.filter(session__user=user)
        listening_questions_answered = listening_answers.count()
        listening_correct_answers = listening_answers.filter(is_correct=True).count()
        listening_accuracy_pct = (
            round(listening_correct_answers / listening_questions_answered * 100)
            if listening_questions_answered > 0
            else 0
        )

        return Response(
            {
                "total_words_studied": total_words_studied,
                "words_reviewed": words_reviewed,
                # Keep backward compatible key for existing frontend.
                "total_review_sessions": total_review_attempts,
                "total_review_attempts": total_review_attempts,
                "correct_answers": correct_answers,
                "accuracy_pct": accuracy_pct,
                "best_streak": streak_obj.longest_streak,
                "current_streak": streak_obj.current_streak,
                "bookmarks": bookmarks,
                "lessons_completed": lessons_completed,
                "listening_sessions_completed": listening_sessions_completed,
                "listening_questions_answered": listening_questions_answered,
                "listening_correct_answers": listening_correct_answers,
                "listening_accuracy_pct": listening_accuracy_pct,
            }
        )


class NotificationViewSet(viewsets.GenericViewSet, mixins.ListModelMixin):
    """Notifications list/read/read-all."""

    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    ordering = ["-created_at"]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Notification.objects.none()
        return Notification.objects.filter(user=self.request.user).order_by("-created_at")

    @action(detail=True, methods=["put"], url_path="read")
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        if notif.user_id != request.user.id:
            raise PermissionDenied
        notif.is_read = True
        notif.save(update_fields=["is_read"])
        return Response({"detail": "Da danh dau da doc."})

    @action(detail=False, methods=["put"], url_path="read-all")
    def read_all(self, request):
        updated = Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"updated": updated})


@extend_schema(responses=OpenApiTypes.OBJECT)
class LeaderboardView(APIView):
    """GET /learning/leaderboard/ - Top 50 users by XP."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [LearningAnalyticsReadRateThrottle]

    def get(self, request):
        cache_key = _leaderboard_cache_key()
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        users = list(User.objects.filter(role=User.Role.USER, is_active=True).order_by("-xp", "id")[:50])
        streak_map = {s.user_id: s.current_streak for s in UserStreak.objects.filter(user__in=users)}
        data = [
            {
                "id": u.id,
                "full_name": u.full_name,
                "username": u.username,
                "avatar_url": u.avatar_url or None,
                "level": u.level,
                "xp": u.xp,
                "streak": streak_map.get(u.id, 0),
            }
            for u in users
        ]
        cache.set(cache_key, data, timeout=LEADERBOARD_CACHE_TTL_SECONDS)
        return Response(data)


@extend_schema(responses=OpenApiTypes.OBJECT)
class LeagueCurrentView(APIView):
    """GET /learning/league/current/ - Active league snapshot leaderboard."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [LearningAnalyticsReadRateThrottle]

    def get(self, request):
        season = LeagueSeason.objects.filter(is_active=True).order_by("-start_date").first()
        if not season:
            return Response({"season": None, "leaderboard": [], "me": None})

        top_cache_key = f"learning:league:season:{season.id}:top50:v1"
        cached_top = cache.get(top_cache_key)
        if cached_top is None:
            standings = list(
                LeagueStanding.objects.filter(season=season)
                .select_related("user")
                .order_by("rank", "-xp_earned", "-sessions_completed", "user_id")[:50]
            )
            streak_map = {
                s.user_id: s.current_streak
                for s in UserStreak.objects.filter(user_id__in=[row.user_id for row in standings])
            }
            cached_top = [
                {
                    "rank": row.rank,
                    "user_id": row.user_id,
                    "full_name": row.user.full_name,
                    "username": row.user.username,
                    "avatar_url": row.user.avatar_url or None,
                    "level": row.user.level,
                    "streak": streak_map.get(row.user_id, 0),
                    "xp_earned": row.xp_earned,
                    "sessions_completed": row.sessions_completed,
                }
                for row in standings
            ]
            cache.set(top_cache_key, cached_top, timeout=LEAGUE_CACHE_TTL_SECONDS)
        mine = LeagueStanding.objects.filter(season=season, user=request.user).select_related("user").first()

        return Response(
            {
                "season": {
                    "code": season.code,
                    "title": season.title,
                    "start_date": season.start_date,
                    "end_date": season.end_date,
                },
                "leaderboard": cached_top,
                "me": (
                    {
                        "rank": mine.rank,
                        "user_id": mine.user_id,
                        "xp_earned": mine.xp_earned,
                        "sessions_completed": mine.sessions_completed,
                    }
                    if mine
                    else None
                ),
            }
        )


def _parse_range_days(request):
    raw = (request.query_params.get("range") or "7d").strip().lower()
    return 28 if raw == "28d" else 7


def _cohort_retention_pct(days: int) -> float | None:
    today = timezone.localdate()
    cohort_date = today - timedelta(days=days)
    cohort_users = list(
        User.objects.filter(
            role=User.Role.USER,
            created_at__date=cohort_date,
            is_active=True,
        ).values_list("id", flat=True)
    )
    if not cohort_users:
        return None

    target_date_start = timezone.make_aware(
        datetime.combine(cohort_date + timedelta(days=days), datetime.min.time())
    )
    target_date_end = target_date_start + timedelta(days=1)
    retained_count = LearningEvent.objects.filter(
        user_id__in=cohort_users,
        created_at__gte=target_date_start,
        created_at__lt=target_date_end,
    ).values("user_id").distinct().count()
    return round((retained_count / len(cohort_users)) * 100, 2)


@extend_schema(responses=OpenApiTypes.OBJECT)
class KpiBaselineView(APIView):
    """GET /learning/kpi/baseline/?range=7d|28d - KPI snapshot for admin."""

    permission_classes = [IsAuthenticated, IsAdmin]
    throttle_classes = [LearningAnalyticsReadRateThrottle]

    def get(self, request):
        range_days = _parse_range_days(request)
        cache_key = f"learning:kpi:baseline:range:{range_days}:v1"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        now = timezone.now()
        start = now - timedelta(days=range_days)

        dau = (
            LearningEvent.objects.filter(created_at__gte=start)
            .values("created_at__date", "user_id")
            .distinct()
            .count()
        )
        active_users = (
            LearningEvent.objects.filter(created_at__gte=start)
            .values("user_id")
            .distinct()
            .count()
        )
        completed_sessions = LearningSession.objects.filter(
            status=LearningSession.Status.COMPLETED,
            completed_at__gte=start,
        ).count()
        started_sessions = LearningSession.objects.filter(
            started_at__gte=start,
            session_type=LearningSession.SessionType.LESSON,
        ).count()

        placement_enters = LearningEvent.objects.filter(
            event_type=LearningEvent.EventType.ONBOARDING_STEP,
            meta__step="placement_enter",
            created_at__gte=start,
        ).count()
        placement_submits = LearningEvent.objects.filter(
            event_type=LearningEvent.EventType.ONBOARDING_STEP,
            meta__step="placement_submit",
            created_at__gte=start,
        ).count()
        first_lesson_starts = LearningEvent.objects.filter(
            event_type=LearningEvent.EventType.ONBOARDING_STEP,
            meta__step="first_lesson_start",
            created_at__gte=start,
        ).count()

        goal_claim_users = DailyGoalLog.objects.filter(
            claimed_at__gte=start,
        ).values("user_id").distinct().count()
        goal_active_users = DailyGoalLog.objects.filter(
            goal_date__gte=timezone.localdate() - timedelta(days=range_days - 1),
        ).values("user_id").distinct().count()

        sessions_per_dau = round(completed_sessions / dau, 2) if dau > 0 else 0
        completion_rate = round((completed_sessions / started_sessions) * 100, 2) if started_sessions > 0 else 0
        placement_submit_rate = round((placement_submits / placement_enters) * 100, 2) if placement_enters > 0 else 0
        first_lesson_start_rate = round((first_lesson_starts / placement_submits) * 100, 2) if placement_submits > 0 else 0
        daily_goal_claim_rate = round((goal_claim_users / goal_active_users) * 100, 2) if goal_active_users > 0 else 0

        payload = {
            "range_days": range_days,
            "window_start": start.date(),
            "window_end": now.date(),
            "active_users": active_users,
            "sessions_completed": completed_sessions,
            "sessions_started": started_sessions,
            "sessions_per_dau": sessions_per_dau,
            "session_completion_rate": completion_rate,
            "placement_submit_rate": placement_submit_rate,
            "first_lesson_start_rate": first_lesson_start_rate,
            "daily_goal_claim_rate": daily_goal_claim_rate,
            "retention": {
                "d1": _cohort_retention_pct(1),
                "d7": _cohort_retention_pct(7),
                "w4": _cohort_retention_pct(28),
            },
        }
        cache.set(cache_key, payload, timeout=KPI_CACHE_TTL_SECONDS)
        return Response(payload)


@extend_schema(responses=OpenApiTypes.OBJECT)
class OnboardingFunnelKpiView(APIView):
    """GET /learning/kpi/onboarding-funnel/?range=7d|28d - Onboarding funnel counts."""

    permission_classes = [IsAuthenticated, IsAdmin]
    throttle_classes = [LearningAnalyticsReadRateThrottle]

    def get(self, request):
        range_days = _parse_range_days(request)
        cache_key = f"learning:kpi:funnel:range:{range_days}:v1"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        start = timezone.now() - timedelta(days=range_days)

        events = (
            LearningEvent.objects.filter(
                event_type=LearningEvent.EventType.ONBOARDING_STEP,
                created_at__gte=start,
                meta__step__in=[
                    "placement_enter",
                    "placement_abandon",
                    "placement_submit",
                    "first_lesson_start",
                ],
            )
            .values("meta__step")
            .annotate(count=Count("id"))
        )
        counts = {item["meta__step"]: item["count"] for item in events}

        placement_enter = counts.get("placement_enter", 0)
        placement_submit = counts.get("placement_submit", 0)
        first_lesson_start = counts.get("first_lesson_start", 0)
        placement_abandon = counts.get("placement_abandon", 0)

        payload = {
            "range_days": range_days,
            "counts": {
                "placement_enter": placement_enter,
                "placement_abandon": placement_abandon,
                "placement_submit": placement_submit,
                "first_lesson_start": first_lesson_start,
            },
            "rates": {
                "placement_submit_rate": round((placement_submit / placement_enter) * 100, 2)
                if placement_enter > 0
                else 0,
                "first_lesson_start_rate": round((first_lesson_start / placement_submit) * 100, 2)
                if placement_submit > 0
                else 0,
            },
        }
        cache.set(cache_key, payload, timeout=KPI_CACHE_TTL_SECONDS)
        return Response(payload)


__all__ = [
    "NotificationViewSet",
    "ProfileStatsView",
    "LeaderboardView",
    "LeagueCurrentView",
    "KpiBaselineView",
    "OnboardingFunnelKpiView",
]
