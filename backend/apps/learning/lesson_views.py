"""Lesson CRUD and lesson progress endpoints."""

import hashlib
from datetime import timedelta

from django.core.cache import cache
from django.db.models import Count, Max, Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .filters import LessonFilter
from .models import Lesson, LessonProgress, LessonWord, ReviewLog
from apps.accounts.permissions import IsAdmin
from .permissions import IsOwnerOrAdmin
from .serializers import LessonDetailSerializer, LessonSerializer, LessonWordSerializer
from .shared_flow import XP_LESSON_BONUS, XP_NEW_WORD, _apply_learning_rewards

LESSON_CACHE_TTL = 5 * 60
_LESSON_VER_KEY = "lesson_list_ver"


def _lesson_cache_key(user_id: int, params: str, stamp: str) -> str:
    ver = cache.get(_LESSON_VER_KEY, 1)
    raw = f"ll:v{ver}:u{user_id}:{params}:s{stamp}"
    return "ll_" + hashlib.md5(raw.encode()).hexdigest()


def _lesson_cache_stamp() -> str:
    meta = Lesson.objects.aggregate(total=Count("id"), latest=Max("updated_at"))
    latest = meta["latest"]
    latest_iso = latest.isoformat() if latest else "none"
    return f"{meta['total']}:{latest_iso}"


def _invalidate_lesson_cache() -> None:
    cur = cache.get(_LESSON_VER_KEY, 1)
    cache.set(_LESSON_VER_KEY, cur + 1, timeout=None)


class LessonViewSet(viewsets.ModelViewSet):
    """
    list: GET /lessons/
    create: POST /lessons/ (admin only)
    retrieve: GET /lessons/{id}/
    update: PUT/PATCH /lessons/{id}/ (owner/admin)
    destroy: DELETE /lessons/{id}/ (owner/admin)
    add_word: POST /lessons/{id}/words/
    remove_word: DELETE /lessons/{id}/words/{word_id}/
    start: POST /lessons/{id}/start/
    complete: POST /lessons/{id}/complete/
    """

    filterset_class = LessonFilter
    search_fields = ["title", "description"]
    ordering_fields = ["order_index", "created_at", "level"]
    ordering = ["order_index"]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Lesson.objects.none()
        user = self.request.user
        qs = Lesson.objects.select_related("created_by").annotate(
            word_count=Count("words", distinct=True)
        )
        if user.role == "user":
            qs = qs.filter(is_published=True)
        if getattr(self, "action", None) == "retrieve":
            qs = qs.prefetch_related("lesson_words__word")
        return qs

    def get_serializer_class(self):
        return LessonDetailSerializer if self.action == "retrieve" else LessonSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve", "start", "complete"):
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdmin(), IsOwnerOrAdmin()]

    def list(self, request, *args, **kwargs):
        stamp = _lesson_cache_stamp()
        key = _lesson_cache_key(request.user.id, request.query_params.urlencode(), stamp)
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

    @action(
        detail=True,
        methods=["post"],
        url_path="words",
        permission_classes=[IsAuthenticated, IsAdmin],
    )
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
            return Response({"detail": "Word already exists in this lesson."}, status=status.HTTP_409_CONFLICT)
        _invalidate_lesson_cache()
        return Response({"detail": "Word added to lesson."}, status=status.HTTP_201_CREATED)

    @action(
        detail=True,
        methods=["delete"],
        url_path=r"words/(?P<word_id>\d+)",
        permission_classes=[IsAuthenticated, IsAdmin],
    )
    def remove_word(self, request, pk=None, word_id=None):
        lesson = self.get_object()
        deleted, _ = LessonWord.objects.filter(lesson=lesson, word_id=word_id).delete()
        if not deleted:
            return Response({"detail": "Word not found in lesson."}, status=status.HTTP_404_NOT_FOUND)
        _invalidate_lesson_cache()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def start(self, request, pk=None):
        lesson = self.get_object()
        progress, created = LessonProgress.objects.get_or_create(
            user=request.user,
            lesson=lesson,
            defaults={"started_at": timezone.now()},
        )
        if not created and not progress.started_at:
            progress.started_at = timezone.now()
            progress.save(update_fields=["started_at"])
        return Response({"detail": "Lesson started.", "started_at": progress.started_at})

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def complete(self, request, pk=None):
        lesson = self.get_object()
        user = request.user

        progress, _ = LessonProgress.objects.get_or_create(
            user=user,
            lesson=lesson,
            defaults={"started_at": timezone.now()},
        )
        if progress.completed_at:
            return Response(
                {"detail": "Bai hoc nay \u0111\u00e3 ho\u00e0n th\u00e0nh truoc do."},
                status=status.HTTP_200_OK,
            )

        word_ids = list(lesson.words.values_list("id", flat=True))
        existing_word_ids = set(
            ReviewLog.objects.filter(user=user, word_id__in=word_ids).values_list("word_id", flat=True)
        )

        tomorrow = timezone.localdate() + timedelta(days=1)
        new_logs = []
        for word_id in word_ids:
            if word_id not in existing_word_ids:
                new_logs.append(
                    ReviewLog(
                        user=user,
                        word_id=word_id,
                        next_review_date=tomorrow,
                    )
                )
        ReviewLog.objects.bulk_create(new_logs, ignore_conflicts=True)

        progress.completed_at = timezone.now()
        if not progress.started_at:
            progress.started_at = progress.completed_at
        progress.save(update_fields=["completed_at", "started_at"])

        new_word_count = len(new_logs)
        xp_earned = new_word_count * XP_NEW_WORD + XP_LESSON_BONUS
        streak = _apply_learning_rewards(user, xp_earned=xp_earned, study_minutes=1)

        return Response(
            {
                "new_words": new_word_count,
                "xp_earned": xp_earned,
                "total_xp": user.xp,
                "level": user.level,
                "streak": streak.current_streak,
            }
        )


__all__ = ["LessonViewSet"]
