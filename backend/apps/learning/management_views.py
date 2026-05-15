"""Teacher/admin/analytics-facing views for learning module."""

from datetime import timedelta

from django.db.models import Count, Min
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from .models import (
    Assignment,
    DailyGoalLog,
    LeagueSeason,
    LeagueStanding,
    LearningEvent,
    LearningSession,
    Lesson,
    LessonProgress,
    Notification,
    ReviewLog,
    StudentClass,
    UserStreak,
    UserUnitProgress,
)
from .permissions import IsOwnerOrAdmin, IsTeacherOrAdmin
from .serializers import (
    AssignmentCreateSerializer,
    AssignmentSerializer,
    LessonSerializer,
    NotificationSerializer,
    StudentClassDetailSerializer,
    StudentClassSerializer,
)


def _get_or_create_streak(user) -> UserStreak:
    streak, _ = UserStreak.objects.get_or_create(user=user)
    return streak


class AssignmentViewSet(viewsets.GenericViewSet, mixins.ListModelMixin, mixins.DestroyModelMixin):
    """Teacher/admin assignment management + student assignment listing."""

    serializer_class = AssignmentSerializer
    ordering = ["-created_at"]

    def get_queryset(self):
        user = self.request.user
        if user.role in ("teacher", "admin"):
            return Assignment.objects.select_related("lesson", "student", "teacher").filter(teacher=user)
        return Assignment.objects.select_related("lesson", "student", "teacher").filter(student=user)

    def get_permissions(self):
        if self.action == "create":
            return [IsAuthenticated(), IsTeacherOrAdmin()]
        if self.action == "destroy":
            return [IsAuthenticated(), IsTeacherOrAdmin(), IsOwnerOrAdmin()]
        return [IsAuthenticated()]

    def create(self, request):
        serializer = AssignmentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        lesson = serializer.validated_data["lesson"]
        student_ids = serializer.validated_data["student_ids"]
        due_date = serializer.validated_data.get("due_date")

        students = User.objects.filter(id__in=student_ids, is_active=True)
        if not students.exists():
            raise ValidationError({"student_ids": "Khong tim thay hoc sinh hop le."})

        created_count = 0
        for student in students:
            _, created = Assignment.objects.get_or_create(
                lesson=lesson,
                student=student,
                defaults={"teacher": request.user, "due_date": due_date},
            )
            if created:
                created_count += 1
                Notification.objects.create(
                    user=student,
                    type=Notification.Type.ASSIGNMENT,
                    message=f"Ban duoc giao bai hoc moi: {lesson.title}",
                    related_id=lesson.id,
                )

        return Response(
            {"assigned": created_count, "skipped": len(student_ids) - created_count},
            status=status.HTTP_201_CREATED,
        )


class StudentClassViewSet(viewsets.ModelViewSet):
    """Teacher-managed student classes with bulk lesson assignment."""

    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def get_queryset(self):
        return StudentClass.objects.filter(teacher=self.request.user).annotate(
            student_count=Count("students", distinct=True)
        )

    def get_serializer_class(self):
        if self.action == "retrieve":
            return StudentClassDetailSerializer
        return StudentClassSerializer

    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user)

    @action(detail=True, methods=["post"])
    def add_students(self, request, pk=None):
        klass = self.get_object()
        student_ids = request.data.get("student_ids", [])
        students = User.objects.filter(id__in=student_ids, is_active=True)
        klass.students.add(*students)
        return Response({"added": students.count()})

    @action(detail=True, methods=["post"])
    def remove_student(self, request, pk=None):
        klass = self.get_object()
        student_id = request.data.get("student_id")
        try:
            student = klass.students.get(id=student_id)
            klass.students.remove(student)
            return Response({"removed": True})
        except Exception:
            return Response({"removed": False}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"])
    def assign_lesson(self, request, pk=None):
        klass = self.get_object()
        lesson_id = request.data.get("lesson_id")
        due_date = request.data.get("due_date")

        try:
            lesson = Lesson.objects.get(id=lesson_id, is_published=True)
        except Lesson.DoesNotExist:
            return Response(
                {"detail": "Bai hoc khong ton tai hoac chua cong bo."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        students = klass.students.filter(is_active=True)
        if not students.exists():
            return Response({"detail": "Lop chua co hoc sinh nao."}, status=status.HTTP_400_BAD_REQUEST)

        created_count = 0
        for student in students:
            _, created = Assignment.objects.get_or_create(
                lesson=lesson,
                student=student,
                defaults={"teacher": request.user, "due_date": due_date or None},
            )
            if created:
                created_count += 1
                Notification.objects.create(
                    user=student,
                    type=Notification.Type.ASSIGNMENT,
                    message=f"Ban duoc giao bai hoc moi: {lesson.title}",
                    related_id=lesson.id,
                )

        return Response(
            {
                "assigned": created_count,
                "skipped": students.count() - created_count,
                "class_name": klass.name,
                "lesson_title": lesson.title,
            }
        )


class ProfileStatsView(APIView):
    """GET /learning/profile/stats/ - Per-user learning stats."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Sum
        from apps.vocabulary.models import Bookmark

        user = request.user
        logs = ReviewLog.objects.filter(user=user)

        total_words_studied = logs.count()
        total_review_sessions = logs.aggregate(s=Sum("total_reviews"))["s"] or 0
        correct_answers = logs.aggregate(s=Sum("correct_count"))["s"] or 0
        accuracy_pct = round(correct_answers / total_review_sessions * 100) if total_review_sessions > 0 else 0

        streak_obj = _get_or_create_streak(user)
        bookmarks = Bookmark.objects.filter(user=user).count()
        lessons_completed = LessonProgress.objects.filter(user=user, completed_at__isnull=False).count()

        return Response(
            {
                "total_words_studied": total_words_studied,
                "total_review_sessions": total_review_sessions,
                "correct_answers": correct_answers,
                "accuracy_pct": accuracy_pct,
                "best_streak": streak_obj.longest_streak,
                "current_streak": streak_obj.current_streak,
                "bookmarks": bookmarks,
                "lessons_completed": lessons_completed,
            }
        )


class LearningKPIBaselineView(APIView):
    """GET /learning/kpi/baseline/?days=7 - Teacher/admin KPI baseline."""

    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def get(self, request):
        days = min(max(int(request.query_params.get("days", 7)), 1), 90)
        today = timezone.localdate()
        start_date = today - timedelta(days=days - 1)

        events = LearningEvent.objects.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=today,
        )
        dau = events.values("user_id").distinct().count()

        sessions_started_qs = LearningSession.objects.filter(
            started_at__date__gte=start_date,
            started_at__date__lte=today,
        )
        sessions_started = sessions_started_qs.count()

        completed_sessions = list(
            LearningSession.objects.filter(
                status=LearningSession.Status.COMPLETED,
                completed_at__date__gte=start_date,
                completed_at__date__lte=today,
            ).only("started_at", "completed_at")
        )
        avg_session_minutes = 0.0
        if completed_sessions:
            durations = [
                max(0.0, (item.completed_at - item.started_at).total_seconds() / 60)
                for item in completed_sessions
                if item.completed_at and item.started_at
            ]
            if durations:
                avg_session_minutes = round(sum(durations) / len(durations), 2)

        sessions_per_dau = round(sessions_started / dau, 2) if dau else 0.0
        session_completion_rate = (
            round((len(completed_sessions) / sessions_started) * 100, 2)
            if sessions_started
            else 0.0
        )

        checkpoint_submit_qs = events.filter(event_type=LearningEvent.EventType.CHECKPOINT_SUBMIT)
        checkpoint_total = checkpoint_submit_qs.count()
        checkpoint_passed = checkpoint_submit_qs.filter(meta__passed=True).count()
        checkpoint_pass_rate = round((checkpoint_passed / checkpoint_total) * 100, 2) if checkpoint_total else 0.0

        unit_progress_qs = UserUnitProgress.objects.filter(
            started_at__date__gte=start_date,
            started_at__date__lte=today,
        )
        unit_started = unit_progress_qs.count()
        unit_completed = unit_progress_qs.filter(completed_at__isnull=False).count()
        unit_completion_rate = round((unit_completed / unit_started) * 100, 2) if unit_started else 0.0

        goal_logs_qs = DailyGoalLog.objects.filter(goal_date__gte=start_date, goal_date__lte=today)
        goal_total = goal_logs_qs.count()
        goal_achieved = goal_logs_qs.filter(is_achieved=True).count()
        daily_goal_achievement_rate = round((goal_achieved / goal_total) * 100, 2) if goal_total else 0.0

        yesterday = today - timedelta(days=1)
        active_today = set(LearningEvent.objects.filter(created_at__date=today).values_list("user_id", flat=True))
        active_yesterday = set(
            LearningEvent.objects.filter(created_at__date=yesterday).values_list("user_id", flat=True)
        )
        streak_continuation_rate = (
            round((len(active_today & active_yesterday) / len(active_yesterday)) * 100, 2)
            if active_yesterday
            else 0.0
        )

        event_days_by_user = {}
        for row in LearningEvent.objects.values("user_id", "created_at__date").distinct():
            event_days_by_user.setdefault(row["user_id"], set()).add(row["created_at__date"])
        first_event_dates = list(LearningEvent.objects.values("user_id").annotate(first_date=Min("created_at__date")))
        d1_den = d1_num = d7_den = d7_num = w4_den = w4_num = 0
        for row in first_event_dates:
            first_date = row["first_date"]
            user_id = row["user_id"]
            if not first_date:
                continue
            user_days = event_days_by_user.get(user_id, set())
            if start_date <= first_date <= today - timedelta(days=1):
                d1_den += 1
                if first_date + timedelta(days=1) in user_days:
                    d1_num += 1
            if start_date <= first_date <= today - timedelta(days=7):
                d7_den += 1
                if first_date + timedelta(days=7) in user_days:
                    d7_num += 1
            if start_date <= first_date <= today - timedelta(days=28):
                w4_den += 1
                if first_date + timedelta(days=28) in user_days:
                    w4_num += 1
        d1_retention_rate = round((d1_num / d1_den) * 100, 2) if d1_den else 0.0
        d7_retention_rate = round((d7_num / d7_den) * 100, 2) if d7_den else 0.0
        w4_retention_rate = round((w4_num / w4_den) * 100, 2) if w4_den else 0.0

        return Response(
            {
                "range": {"start_date": str(start_date), "end_date": str(today), "days": days},
                "kpis": {
                    "dau": dau,
                    "sessions_started": sessions_started,
                    "sessions_per_dau": sessions_per_dau,
                    "avg_session_minutes": avg_session_minutes,
                    "session_completion_rate": session_completion_rate,
                    "checkpoint_pass_rate": checkpoint_pass_rate,
                    "unit_completion_rate": unit_completion_rate,
                    "daily_goal_achievement_rate": daily_goal_achievement_rate,
                    "streak_continuation_rate": streak_continuation_rate,
                    "d1_retention_rate": d1_retention_rate,
                    "d7_retention_rate": d7_retention_rate,
                    "w4_retention_rate": w4_retention_rate,
                },
            }
        )


class LearningOnboardingFunnelView(APIView):
    """GET /learning/kpi/onboarding-funnel/?days=28 - Onboarding funnel KPI."""

    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def get(self, request):
        days = min(max(int(request.query_params.get("days", 28)), 1), 180)
        today = timezone.localdate()
        start_date = today - timedelta(days=days - 1)
        events = LearningEvent.objects.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=today,
            event_type=LearningEvent.EventType.ONBOARDING_STEP,
        )

        def _users_for_step(step: str) -> set[int]:
            return set(events.filter(meta__step=step).values_list("user_id", flat=True).distinct())

        entered = _users_for_step("placement_enter")
        submitted = _users_for_step("placement_submit")
        first_lesson = _users_for_step("first_lesson_start")
        abandoned = _users_for_step("placement_abandon")

        entered_count = len(entered)
        submitted_count = len(submitted)
        first_lesson_count = len(first_lesson)
        abandoned_count = len(abandoned)

        submit_conversion = round((submitted_count / entered_count) * 100, 2) if entered_count else 0.0
        first_lesson_conversion = round((first_lesson_count / submitted_count) * 100, 2) if submitted_count else 0.0
        full_conversion = round((first_lesson_count / entered_count) * 100, 2) if entered_count else 0.0
        abandon_rate = round((abandoned_count / entered_count) * 100, 2) if entered_count else 0.0

        return Response(
            {
                "range": {"start_date": str(start_date), "end_date": str(today), "days": days},
                "funnel": {
                    "placement_enter_users": entered_count,
                    "placement_submit_users": submitted_count,
                    "first_lesson_start_users": first_lesson_count,
                    "placement_abandon_users": abandoned_count,
                    "submit_conversion_rate": submit_conversion,
                    "first_lesson_conversion_rate": first_lesson_conversion,
                    "full_conversion_rate": full_conversion,
                    "placement_abandon_rate": abandon_rate,
                },
            }
        )


class TeacherStatsView(APIView):
    """GET /learning/teacher/stats/ - Teacher dashboard stats."""

    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def get(self, request):
        user = request.user
        lessons_qs = Lesson.objects.filter(created_by=user).annotate(word_count=Count("words", distinct=True))
        assignments_qs = Assignment.objects.filter(teacher=user).select_related("lesson", "student")
        return Response(
            {
                "lesson_count": lessons_qs.count(),
                "assignment_count": assignments_qs.count(),
                "student_count": assignments_qs.values("student").distinct().count(),
                "recent_lessons": LessonSerializer(lessons_qs.order_by("-created_at")[:5], many=True).data,
                "recent_assignments": AssignmentSerializer(
                    assignments_qs.order_by("-created_at")[:5], many=True
                ).data,
            }
        )


class NotificationViewSet(viewsets.GenericViewSet, mixins.ListModelMixin):
    """Notifications list/read/read-all."""

    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    ordering = ["-created_at"]

    def get_queryset(self):
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


class LeaderboardView(APIView):
    """GET /learning/leaderboard/ - Top 50 users by XP."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        users = list(User.objects.filter(role="user").order_by("-xp")[:50])
        streak_map = {s.user_id: s.current_streak for s in UserStreak.objects.filter(user__in=users)}
        data = [
            {
                "id": u.id,
                "full_name": u.full_name,
                "avatar_url": u.avatar_url or None,
                "level": u.level,
                "xp": u.xp,
                "streak": streak_map.get(u.id, 0),
            }
            for u in users
        ]
        return Response(data)


class LeagueCurrentView(APIView):
    """GET /learning/league/current/ - Active league snapshot leaderboard."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        season = LeagueSeason.objects.filter(is_active=True).order_by("-start_date").first()
        if not season:
            return Response({"season": None, "leaderboard": [], "me": None})

        standings = list(
            LeagueStanding.objects.filter(season=season)
            .select_related("user")
            .order_by("rank", "-xp_earned", "-sessions_completed", "user_id")[:50]
        )
        leaderboard = [
            {
                "rank": row.rank,
                "user_id": row.user_id,
                "full_name": row.user.full_name,
                "avatar_url": row.user.avatar_url or None,
                "xp_earned": row.xp_earned,
                "sessions_completed": row.sessions_completed,
            }
            for row in standings
        ]
        mine = LeagueStanding.objects.filter(season=season, user=request.user).select_related("user").first()

        return Response(
            {
                "season": {
                    "code": season.code,
                    "title": season.title,
                    "start_date": season.start_date,
                    "end_date": season.end_date,
                },
                "leaderboard": leaderboard,
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


__all__ = [
    "AssignmentViewSet",
    "NotificationViewSet",
    "StudentClassViewSet",
    "TeacherStatsView",
    "LearningKPIBaselineView",
    "LearningOnboardingFunnelView",
    "ProfileStatsView",
    "LeaderboardView",
    "LeagueCurrentView",
]
