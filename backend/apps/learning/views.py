"""
Views cho learning module:
- LessonViewSet   : CRUD, start/complete bài học, quản lý từ trong bài
- AssignmentViewSet: giao/thu hồi bài
- ReviewView      : lấy từ đến hạn ôn, submit kết quả SM-2
- NotificationViewSet: danh sách + đánh dấu đã đọc
"""
import hashlib
from datetime import date, timedelta

from django.core.cache import cache
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import generics, mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

LESSON_CACHE_TTL = 5 * 60  # 5 phút
_LESSON_VER_KEY = "lesson_list_ver"


def _lesson_cache_key(user_id: int, params: str) -> str:
    ver = cache.get(_LESSON_VER_KEY, 1)
    raw = f"ll:v{ver}:u{user_id}:{params}"
    return "ll_" + hashlib.md5(raw.encode()).hexdigest()


def _invalidate_lesson_cache() -> None:
    cur = cache.get(_LESSON_VER_KEY, 1)
    cache.set(_LESSON_VER_KEY, cur + 1, timeout=None)

from apps.accounts.models import User
from apps.vocabulary.models import Word
from .models import (
    Assignment, Lesson, LessonProgress, LessonWord,
    Notification, ReviewLog, UserStreak,
)
from .permissions import IsOwnerOrAdmin, IsTeacherOrAdmin
from .serializers import (
    AssignmentCreateSerializer, AssignmentSerializer,
    LessonDetailSerializer, LessonSerializer,
    LessonWordSerializer, NotificationSerializer,
    ReviewAnswerSerializer, ReviewLogSerializer,
    UserStreakSerializer,
)

# XP constants – đúng theo bảng chương 2.6
XP_NEW_WORD = 10
XP_LESSON_BONUS = 20
XP_REVIEW_CORRECT = 5   # q >= 3
XP_REVIEW_WRONG = 2     # q < 3

# Giới hạn từ mỗi phiên ôn (tránh quá tải)
REVIEW_SESSION_LIMIT = 50


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
            message=f"Tuyệt vời! Bạn đã học {streak} ngày liên tiếp! 🔥",
        )


# ══════════════════════════════════════════════════════════════════════════════
#  LESSON
# ══════════════════════════════════════════════════════════════════════════════

class LessonViewSet(viewsets.ModelViewSet):
    """
    list:    GET  /lessons/
    create:  POST /lessons/           (teacher/admin)
    retrieve: GET  /lessons/{id}/      (kèm words + progress của user)
    update:  PUT  /lessons/{id}/      (owner/admin)
    destroy: DELETE /lessons/{id}/    (owner/admin)
    add_word: POST /lessons/{id}/words/
    remove_word: DELETE /lessons/{id}/words/{word_id}/
    start:   POST /lessons/{id}/start/
    complete: POST /lessons/{id}/complete/
    """

    search_fields = ["title", "description"]
    ordering_fields = ["order_index", "created_at", "level"]
    ordering = ["order_index"]

    def get_queryset(self):
        user = self.request.user
        qs = Lesson.objects.select_related("created_by").annotate(
            word_count=Count("words", distinct=True)
        )
        if user.role == "user":
            qs = qs.filter(is_published=True)
        elif user.role == "teacher":
            qs = qs.filter(Q(is_published=True) | Q(created_by=user))
        # Prefetch nested words chỉ khi cần detail, tránh over-fetch trên list
        if getattr(self, "action", None) == "retrieve":
            qs = qs.prefetch_related("lesson_words__word")
        return qs

    def get_serializer_class(self):
        return LessonDetailSerializer if self.action == "retrieve" else LessonSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve", "start", "complete"):
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsTeacherOrAdmin(), IsOwnerOrAdmin()]

    def list(self, request, *args, **kwargs):
        """Cache danh sách Lesson per-user 5 phút."""
        key = _lesson_cache_key(request.user.id, request.query_params.urlencode())
        cached = cache.get(key)
        if cached is not None:
            return Response(cached)
        response = super().list(request, *args, **kwargs)
        cache.set(key, response.data, LESSON_CACHE_TTL)
        return response

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
        _invalidate_lesson_cache()

    def perform_update(self, serializer):
        serializer.save()
        _invalidate_lesson_cache()

    def perform_destroy(self, instance):
        instance.delete()
        _invalidate_lesson_cache()

    # ── Thêm từ vào bài ───────────────────────────────────────────────────

    @action(detail=True, methods=["post"], url_path="words",
            permission_classes=[IsAuthenticated, IsTeacherOrAdmin])
    def add_word(self, request, pk=None):
        lesson = self.get_object()
        serializer = LessonWordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        word = serializer.validated_data["word"]
        order_index = serializer.validated_data.get("order_index", 0)
        _, created = LessonWord.objects.get_or_create(
            lesson=lesson, word=word, defaults={"order_index": order_index}
        )
        if not created:
            return Response({"detail": "Từ đã có trong bài."}, status=status.HTTP_409_CONFLICT)
        _invalidate_lesson_cache()
        return Response({"detail": "Đã thêm từ vào bài."}, status=status.HTTP_201_CREATED)

    # ── Gỡ từ khỏi bài ───────────────────────────────────────────────────

    @action(detail=True, methods=["delete"], url_path=r"words/(?P<word_id>\d+)",
            permission_classes=[IsAuthenticated, IsTeacherOrAdmin])
    def remove_word(self, request, pk=None, word_id=None):
        lesson = self.get_object()
        deleted, _ = LessonWord.objects.filter(lesson=lesson, word_id=word_id).delete()
        if not deleted:
            return Response({"detail": "Không tìm thấy từ trong bài."}, status=status.HTTP_404_NOT_FOUND)
        _invalidate_lesson_cache()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # ── Bắt đầu bài học ──────────────────────────────────────────────────

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def start(self, request, pk=None):
        """Ghi nhận thời điểm học sinh bắt đầu học bài."""
        lesson = self.get_object()
        progress, created = LessonProgress.objects.get_or_create(
            user=request.user, lesson=lesson,
            defaults={"started_at": timezone.now()},
        )
        if not created and not progress.started_at:
            progress.started_at = timezone.now()
            progress.save(update_fields=["started_at"])
        return Response({"detail": "Đã bắt đầu bài học.", "started_at": progress.started_at})

    # ── Hoàn thành bài học + khởi tạo SRS ───────────────────────────────

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def complete(self, request, pk=None):
        """
        Đánh dấu hoàn thành bài học.
        - Tạo ReviewLog cho mỗi từ mới (chưa có trong SRS của user).
        - +10 XP / từ mới, +20 XP bonus.
        - Cập nhật Streak.
        """
        lesson = self.get_object()
        user = request.user

        # Đảm bảo có progress record
        progress, _ = LessonProgress.objects.get_or_create(
            user=user, lesson=lesson,
            defaults={"started_at": timezone.now()},
        )
        if progress.completed_at:
            return Response(
                {"detail": "Bài học này đã hoàn thành trước đó."},
                status=status.HTTP_200_OK,
            )

        # Chỉ lấy id, không fetch toàn bộ Word object
        word_ids = list(lesson.words.values_list("id", flat=True))
        existing_word_ids = set(
            ReviewLog.objects.filter(user=user, word_id__in=word_ids).values_list("word_id", flat=True)
        )

        new_logs = []
        new_word_count = 0
        tomorrow = date.today() + timedelta(days=1)

        for word_id in word_ids:
            if word_id not in existing_word_ids:
                new_logs.append(ReviewLog(
                    user=user, word_id=word_id,
                    next_review_date=tomorrow,
                ))
                new_word_count += 1

        ReviewLog.objects.bulk_create(new_logs, ignore_conflicts=True)

        # Đánh dấu hoàn thành
        progress.completed_at = timezone.now()
        if not progress.started_at:
            progress.started_at = progress.completed_at
        progress.save(update_fields=["completed_at", "started_at"])

        # Cộng XP
        xp_earned = new_word_count * XP_NEW_WORD + XP_LESSON_BONUS
        leveled_up = user.add_xp(xp_earned)
        if leveled_up:
            _create_level_up_notification(user, user.level)

        # Cập nhật Streak
        streak = _get_or_create_streak(user)
        streak.update_streak()
        _create_streak_notification(user, streak.current_streak)

        return Response({
            "new_words": new_word_count,
            "xp_earned": xp_earned,
            "total_xp": user.xp,
            "level": user.level,
            "streak": streak.current_streak,
        })


# ══════════════════════════════════════════════════════════════════════════════
#  ASSIGNMENT
# ══════════════════════════════════════════════════════════════════════════════

class AssignmentViewSet(viewsets.GenericViewSet,
                        mixins.ListModelMixin,
                        mixins.DestroyModelMixin):
    """
    list:   GET  /assignments/   student: bài được giao; teacher: bài đã giao
    create: POST /assignments/   teacher/admin (bulk: nhiều học sinh)
    destroy: DELETE /assignments/{id}/
    """

    serializer_class = AssignmentSerializer
    ordering = ["-created_at"]

    def get_queryset(self):
        user = self.request.user
        if user.role in ("teacher", "admin"):
            return Assignment.objects.select_related(
                "lesson", "student", "teacher"
            ).filter(teacher=user)
        return Assignment.objects.select_related(
            "lesson", "student", "teacher"
        ).filter(student=user)

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
            raise ValidationError({"student_ids": "Không tìm thấy học sinh hợp lệ."})

        created_count = 0
        for student in students:
            _, created = Assignment.objects.get_or_create(
                lesson=lesson, student=student,
                defaults={"teacher": request.user, "due_date": due_date},
            )
            if created:
                created_count += 1
                Notification.objects.create(
                    user=student,
                    type=Notification.Type.ASSIGNMENT,
                    message=f"Bạn được giao bài học mới: {lesson.title}",
                    related_id=lesson.id,
                )

        return Response(
            {"assigned": created_count, "skipped": len(student_ids) - created_count},
            status=status.HTTP_201_CREATED,
        )


# ══════════════════════════════════════════════════════════════════════════════
#  REVIEW SRS
# ══════════════════════════════════════════════════════════════════════════════

class ReviewListView(APIView):
    """GET /review/ – Lấy tối đa 50 từ đến hạn ôn hôm nay."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()
        logs = list(
            ReviewLog.objects
            .filter(user=request.user, next_review_date__lte=today)
            .select_related("word")
            .order_by("next_review_date")[:REVIEW_SESSION_LIMIT]
        )
        return Response({
            "count": len(logs),
            "words": ReviewLogSerializer(logs, many=True).data,
        })


class ReviewAnswerView(APIView):
    """POST /review/{word_id}/answer/ – Gửi kết quả ôn tập, cập nhật SM-2."""

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
                {"detail": "Từ này chưa được thêm vào danh sách ôn tập."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Áp dụng SM-2 (gọi method trên model, tự save)
        log.apply_sm2(quality)

        # Cộng XP
        xp = XP_REVIEW_CORRECT if quality >= 3 else XP_REVIEW_WRONG
        leveled_up = request.user.add_xp(xp)
        if leveled_up:
            _create_level_up_notification(request.user, request.user.level)

        # Cập nhật Streak
        streak = _get_or_create_streak(request.user)
        streak.update_streak()
        _create_streak_notification(request.user, streak.current_streak)

        return Response({
            "word_id": word_id,
            "quality": quality,
            "interval_days": log.interval_days,
            "next_review_date": log.next_review_date,
            "easiness_factor": round(log.easiness_factor, 4),
            "xp_earned": xp,
            "total_xp": request.user.xp,
            "level": request.user.level,
        })


class ReviewSummaryView(APIView):
    """GET /review/summary/ – Thống kê phiên ôn tập hôm nay."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()
        # Evaluate once, tránh 3 queries riêng biệt
        today_logs = list(
            ReviewLog.objects
            .filter(user=request.user, last_reviewed=today)
            .only("repetitions")
        )
        reviewed_today = len(today_logs)
        correct_today = sum(1 for log in today_logs if log.repetitions > 0)

        streak = _get_or_create_streak(request.user)
        return Response({
            "reviewed_today": reviewed_today,
            "correct_today": correct_today,
            "streak": streak.current_streak,
            "total_xp": request.user.xp,
            "level": request.user.level,
            "due_tomorrow": ReviewLog.objects.filter(
                user=request.user,
                next_review_date=today + timedelta(days=1),
            ).count(),
        })


class ReviewHistoryView(APIView):
    """GET /review/history/?days=30 – Số từ đã ôn mỗi ngày trong N ngày qua."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        days = min(max(int(request.query_params.get("days", 30)), 7), 90)
        today = date.today()
        start = today - timedelta(days=days - 1)

        # Aggregate theo ngày ôn cuối
        logs = (
            ReviewLog.objects
            .filter(user=request.user, last_reviewed__gte=start)
            .values("last_reviewed")
            .annotate(count=Count("id"))
            .order_by("last_reviewed")
        )
        history_map = {str(row["last_reviewed"]): row["count"] for row in logs}

        # Trả về đủ N ngày, ngày không có ôn = 0
        result = []
        for i in range(days):
            d = start + timedelta(days=i)
            result.append({"date": str(d), "count": history_map.get(str(d), 0)})

        return Response(result)


# ══════════════════════════════════════════════════════════════════════════════
#  NOTIFICATION
# ══════════════════════════════════════════════════════════════════════════════

class NotificationViewSet(viewsets.GenericViewSet, mixins.ListModelMixin):
    """
    list:    GET /notifications/
    mark_read: PUT /notifications/{id}/read/
    read_all:  PUT /notifications/read-all/
    """

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
        return Response({"detail": "Đã đánh dấu đã đọc."})

    @action(detail=False, methods=["put"], url_path="read-all")
    def read_all(self, request):
        updated = Notification.objects.filter(
            user=request.user, is_read=False
        ).update(is_read=True)
        return Response({"updated": updated})
