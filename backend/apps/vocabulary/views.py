"""
Views cho vocabulary module:
- WordViewSet: CRUD, search, filter, CSV import, bookmark toggle
- WordSetViewSet: CRUD, thêm/gỡ từ
- BookmarkListView: danh sách từ đã bookmark của user
"""
import csv
import hashlib
import io

from django.core.cache import cache
from django.db.models import Count, Exists, Max, OuterRef, Q
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

WORDSET_CACHE_TTL = 5 * 60  # 5 phút
_WORDSET_VER_KEY = "wordset_list_ver"


def _wordset_cache_key(user_id: int, params: str, stamp: str) -> str:
    ver = cache.get(_WORDSET_VER_KEY, 1)
    raw = f"wsl:v{ver}:u{user_id}:{params}:s{stamp}"
    return "wsl_" + hashlib.md5(raw.encode()).hexdigest()


def _wordset_cache_stamp() -> str:
    meta = WordSet.objects.aggregate(total=Count("id"), latest=Max("updated_at"))
    latest = meta["latest"]
    latest_iso = latest.isoformat() if latest else "none"
    return f"{meta['total']}:{latest_iso}"


def _invalidate_wordset_cache() -> None:
    cur = cache.get(_WORDSET_VER_KEY, 1)
    cache.set(_WORDSET_VER_KEY, cur + 1, timeout=None)

from .filters import WordFilter, WordSetFilter
from .models import Bookmark, Word, WordSet, WordSetWord
from apps.accounts.permissions import IsAdmin as IsTeacherOrAdmin
from .permissions import IsOwnerOrAdmin
from .serializers import (
    AddWordToSetSerializer,
    BookmarkSerializer,
    WordImportSerializer,
    WordListSerializer,
    WordSerializer,
    WordSetDetailSerializer,
    WordSetImportSerializer,
    WordSetSerializer,
)

# Tập hợp level hợp lệ – dùng trong CSV import
_VALID_LEVELS = {c.value for c in Word.Level}


class WordViewSet(viewsets.ModelViewSet):
    """
    list:   GET  /words/?search=apple&level=B1&part_of_speech=noun
    create: POST /words/
    retrieve: GET /words/{id}/
    update: PUT  /words/{id}/
    partial_update: PATCH /words/{id}/
    destroy: DELETE /words/{id}/
    bookmark: POST /words/{id}/bookmark/
    import_csv: POST /words/import/
    """

    filterset_class = WordFilter
    search_fields = ["text", "definition_vi", "example_en", "example_vi"]
    ordering_fields = ["text", "level", "created_at"]
    ordering = ["text"]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Word.objects.none()
        # Annotate _bookmarked_by_user bằng Exists subquery để tránh N+1
        # trong WordListSerializer.get_is_bookmarked
        bookmarked_sq = Bookmark.objects.filter(
            user=self.request.user, word=OuterRef("pk")
        )
        return Word.objects.select_related("created_by").annotate(
            _bookmarked_by_user=Exists(bookmarked_sq)
        )

    def get_serializer_class(self):
        if self.action == "list":
            return WordListSerializer
        return WordSerializer

    def get_permissions(self):
        """Student chỉ đọc; admin mới được CUD."""
        if self.action in ("list", "retrieve"):
            return [IsAuthenticated()]
        if self.action == "bookmark":
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsTeacherOrAdmin(), IsOwnerOrAdmin()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        obj = self.get_object()
        if (
            obj.created_by_id != self.request.user.id
            and self.request.user.role != "admin"
            and not self.request.user.is_staff
        ):
            raise PermissionDenied("Bạn không thể sửa từ của người khác.")
        serializer.save()

    def perform_destroy(self, instance):
        if (
            instance.created_by_id != self.request.user.id
            and self.request.user.role != "admin"
            and not self.request.user.is_staff
        ):
            raise PermissionDenied("Bạn không thể xóa từ của người khác.")
        instance.delete()

    # ── Bookmark toggle ────────────────────────────────────────────

    @action(detail=True, methods=["post"], url_path="bookmark",
            permission_classes=[IsAuthenticated])
    def bookmark(self, request, pk=None):
        """Toggle bookmark: thêm nếu chưa có, xóa nếu đã có."""
        word = self.get_object()
        bookmark, created = Bookmark.objects.get_or_create(
            user=request.user, word=word
        )
        if not created:
            bookmark.delete()
            return Response({"bookmarked": False})
        # +1 XP khi bookmark lần đầu
        request.user.add_xp(1)
        return Response({"bookmarked": True}, status=status.HTTP_201_CREATED)

    # ── CSV Import ─────────────────────────────────────────────────

    @action(
        detail=False,
        methods=["post"],
        url_path="import",
        parser_classes=[MultiPartParser],
        permission_classes=[IsAuthenticated, IsTeacherOrAdmin],
    )
    def import_csv(self, request):
        """
        Upload file CSV để import hàng loạt.
        Header bắt buộc: text
        Header tuỳ chọn: phonetic, part_of_speech, definition_en,
                         definition_vi, example_en, example_vi, level, image_url
        """
        serializer = WordImportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        raw = serializer.validated_data["file"].read().decode("utf-8-sig").lstrip("﻿")
        reader = csv.DictReader(io.StringIO(raw))

        to_create = []
        errors = []

        for row_num, raw_row in enumerate(reader, start=2):
            # Normalize keys: strip whitespace, lowercase
            row = {k.strip().lower(): (v or "").strip() for k, v in raw_row.items() if k}

            if not row.get("text"):
                errors.append({"row": row_num, "error": "Trường 'text' bắt buộc."})
                continue

            level = row.get("level", "").upper()
            if level and level not in _VALID_LEVELS:
                errors.append({
                    "row": row_num,
                    "error": f"Cấp độ '{level}' không hợp lệ. Hợp lệ: {sorted(_VALID_LEVELS)}",
                })
                continue

            to_create.append(Word(
                text=row["text"],
                phonetic=row.get("phonetic", ""),
                part_of_speech=row.get("part_of_speech", ""),
                definition_en=row.get("definition_en", ""),
                definition_vi=row.get("definition_vi", ""),
                example_en=row.get("example_en", ""),
                example_vi=row.get("example_vi", ""),
                level=level,
                image_url=row.get("image_url", ""),
                created_by=request.user,
            ))

        # ignore_conflicts=True: bỏ qua nếu unique constraint bị vi phạm
        created = Word.objects.bulk_create(to_create, ignore_conflicts=True)

        return Response(
            {
                "imported": len(created),
                "skipped": len(to_create) - len(created),
                "errors": errors,
            },
            status=status.HTTP_201_CREATED,
        )


class WordSetViewSet(viewsets.ModelViewSet):
    """
    list:   GET  /sets/?level=B1&is_public=true
    create: POST /sets/
    retrieve: GET /sets/{id}/  → kèm danh sách từ
    update: PUT  /sets/{id}/
    destroy: DELETE /sets/{id}/
    words: POST /sets/{id}/words/         → thêm từ
    remove_word: DELETE /sets/{id}/words/{word_id}/ → gỡ từ
    """

    filterset_class = WordSetFilter
    search_fields = ["name", "description"]
    ordering_fields = ["name", "created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return WordSet.objects.none()
        user = self.request.user
        qs = WordSet.objects.select_related("created_by").annotate(
            word_count=Count("words", distinct=True)
        )
        if user.role == "user":
            qs = qs.filter(Q(is_public=True) | Q(created_by=user))
        # Prefetch words chỉ khi cần detail, tránh over-fetch trên list
        if getattr(self, "action", None) == "retrieve":
            qs = qs.prefetch_related("wordset_words__word")
        return qs

    def get_serializer_class(self):
        if self.action == "retrieve":
            return WordSetDetailSerializer
        return WordSetSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsTeacherOrAdmin(), IsOwnerOrAdmin()]

    def list(self, request, *args, **kwargs):
        """Cache danh sách WordSet per-user 5 phút."""
        stamp = _wordset_cache_stamp()
        key = _wordset_cache_key(
            request.user.id,
            request.query_params.urlencode(),
            stamp,
        )
        cached = cache.get(key)
        if cached is not None:
            return Response(cached)
        response = super().list(request, *args, **kwargs)
        cache.set(key, response.data, WORDSET_CACHE_TTL)
        return response

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
        _invalidate_wordset_cache()

    def perform_update(self, serializer):
        serializer.save()
        _invalidate_wordset_cache()

    def perform_destroy(self, instance):
        instance.delete()
        _invalidate_wordset_cache()

    # ── Thêm từ vào bộ ────────────────────────────────────────────

    @action(
        detail=True,
        methods=["post"],
        url_path="words",
        permission_classes=[IsAuthenticated, IsTeacherOrAdmin],
    )
    def add_word(self, request, pk=None):
        """POST /sets/{id}/words/ – thêm 1 từ vào bộ từ."""
        wordset = self.get_object()
        serializer = AddWordToSetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        word = serializer.validated_data["word_id"]
        order_index = serializer.validated_data["order_index"]

        _, created = WordSetWord.objects.get_or_create(
            wordset=wordset,
            word=word,
            defaults={"order_index": order_index},
        )
        if not created:
            return Response(
                {"detail": "Từ này đã có trong bộ từ."},
                status=status.HTTP_409_CONFLICT,
            )
        _invalidate_wordset_cache()
        return Response(
            {"detail": "Đã thêm từ vào bộ từ."},
            status=status.HTTP_201_CREATED,
        )

    # ── CSV Import → tạo bộ từ mới ────────────────────────────────

    @action(
        detail=False,
        methods=["post"],
        url_path="import",
        parser_classes=[MultiPartParser],
        permission_classes=[IsAuthenticated, IsTeacherOrAdmin],
    )
    def import_csv(self, request):
        """
        POST /sets/import/ – Upload CSV để tạo bộ từ mới.
        Form fields: name (bắt buộc), description, level, is_public
        File field:  file (CSV, header: text + tuỳ chọn giống /words/import/)
        """
        serializer = WordSetImportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        raw = data["file"].read().decode("utf-8-sig").lstrip("\ufeff")
        reader = csv.DictReader(io.StringIO(raw))

        wordset = WordSet.objects.create(
            name=data["name"],
            description=data.get("description", ""),
            level=data.get("level", ""),
            is_public=data.get("is_public", True),
            created_by=request.user,
        )

        to_create_words = []
        errors = []
        rows = []

        for row_num, raw_row in enumerate(reader, start=2):
            row = {k.strip().lower(): (v or "").strip() for k, v in raw_row.items() if k}
            if not row.get("text"):
                errors.append({"row": row_num, "error": "Trường 'text' bắt buộc."})
                continue
            level = row.get("level", "").upper()
            if level and level not in _VALID_LEVELS:
                errors.append({"row": row_num, "error": f"Level '{level}' không hợp lệ."})
                continue
            rows.append(row)
            to_create_words.append(Word(
                text=row["text"],
                phonetic=row.get("phonetic", ""),
                part_of_speech=row.get("part_of_speech", ""),
                definition_en=row.get("definition_en", ""),
                definition_vi=row.get("definition_vi", ""),
                example_en=row.get("example_en", ""),
                example_vi=row.get("example_vi", ""),
                level=level,
                image_url=row.get("image_url", ""),
                created_by=request.user,
            ))

        # Upsert words (bỏ qua nếu đã tồn tại)
        Word.objects.bulk_create(to_create_words, ignore_conflicts=True)

        # Lấy lại word objects (kể cả đã tồn tại trước)
        texts = [r["text"] for r in rows]
        word_map = {w.text: w for w in Word.objects.filter(text__in=texts)}

        set_words = [
            WordSetWord(wordset=wordset, word=word_map[r["text"]], order_index=idx)
            for idx, r in enumerate(rows)
            if r["text"] in word_map
        ]
        WordSetWord.objects.bulk_create(set_words, ignore_conflicts=True)
        _invalidate_wordset_cache()

        return Response({
            "id": wordset.id,
            "name": wordset.name,
            "imported": len(set_words),
            "skipped": len(to_create_words) - len(set_words),
            "errors": errors,
        }, status=status.HTTP_201_CREATED)

    # ── Gỡ từ khỏi bộ ─────────────────────────────────────────────

    @action(
        detail=True,
        methods=["delete"],
        url_path=r"words/(?P<word_id>\d+)",
        permission_classes=[IsAuthenticated, IsTeacherOrAdmin],
    )
    def remove_word(self, request, pk=None, word_id=None):
        """DELETE /sets/{id}/words/{word_id}/ – gỡ 1 từ khỏi bộ từ."""
        wordset = self.get_object()
        deleted, _ = WordSetWord.objects.filter(
            wordset=wordset, word_id=word_id
        ).delete()
        if not deleted:
            return Response(
                {"detail": "Không tìm thấy từ trong bộ từ."},
                status=status.HTTP_404_NOT_FOUND,
            )
        _invalidate_wordset_cache()
        return Response(status=status.HTTP_204_NO_CONTENT)


class BookmarkListView(generics.ListAPIView):
    """GET /api/v1/vocabulary/bookmarks/ – Danh sách từ đã bookmark của user."""

    serializer_class = BookmarkSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Bookmark.objects.none()
        return (
            Bookmark.objects.filter(user=self.request.user)
            .select_related("word")
            .order_by("-created_at")
        )
