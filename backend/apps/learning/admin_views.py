"""Admin-only CRUD cho Course / Unit / UnitLesson."""
from django.db.models import Count
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.permissions import IsAdmin
from .models import Course, Lesson, Unit, UnitLesson


# ── Serializers ───────────────────────────────────────────────────────────────

class CourseAdminSerializer(serializers.ModelSerializer):
    unit_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Course
        fields = ("id", "name", "slug", "description", "is_active", "unit_count", "created_at")
        read_only_fields = ("id", "created_at")


class UnitAdminSerializer(serializers.ModelSerializer):
    lesson_count = serializers.IntegerField(read_only=True, default=0)
    course_name  = serializers.CharField(source="course.name", read_only=True)

    class Meta:
        model = Unit
        fields = (
            "id", "course", "course_name", "title", "description",
            "order_index", "required_lessons_to_unlock",
            "is_published", "lesson_count", "created_at",
        )
        read_only_fields = ("id", "course_name", "created_at")


class UnitLessonAdminSerializer(serializers.ModelSerializer):
    lesson_title      = serializers.CharField(source="lesson.title", read_only=True)
    lesson_level      = serializers.CharField(source="lesson.level", read_only=True)
    lesson_word_count = serializers.IntegerField(source="lesson.word_count", read_only=True, default=0)

    class Meta:
        model  = UnitLesson
        fields = ("id", "lesson", "lesson_title", "lesson_level", "lesson_word_count", "order_index")
        read_only_fields = ("id", "lesson_title", "lesson_level", "lesson_word_count")


# ── Views ─────────────────────────────────────────────────────────────────────

class CourseAdminViewSet(viewsets.ModelViewSet):
    """
    GET    /learning/admin/courses/
    POST   /learning/admin/courses/
    PATCH  /learning/admin/courses/{id}/
    DELETE /learning/admin/courses/{id}/
    """
    permission_classes   = [IsAuthenticated, IsAdmin]
    serializer_class     = CourseAdminSerializer
    pagination_class     = None

    def get_queryset(self):
        return Course.objects.annotate(unit_count=Count("units")).order_by("name")


class UnitAdminViewSet(viewsets.ModelViewSet):
    """
    GET    /learning/admin/units/?course_id=X
    POST   /learning/admin/units/
    PATCH  /learning/admin/units/{id}/
    DELETE /learning/admin/units/{id}/
    GET    /learning/admin/units/{id}/lessons/
    POST   /learning/admin/units/{id}/lessons/
    DELETE /learning/admin/units/{id}/lessons/{lesson_id}/
    """
    permission_classes   = [IsAuthenticated, IsAdmin]
    serializer_class     = UnitAdminSerializer
    pagination_class     = None

    def get_queryset(self):
        qs = Unit.objects.select_related("course").annotate(lesson_count=Count("unit_lessons"))
        course_id = self.request.query_params.get("course_id")
        if course_id:
            qs = qs.filter(course_id=course_id)
        return qs.order_by("order_index")

    # GET + POST /units/{id}/lessons/
    @action(detail=True, methods=["get", "post"], url_path="lessons")
    def lessons(self, request, pk=None):
        unit = self.get_object()

        if request.method == "GET":
            qs = UnitLesson.objects.filter(unit=unit).select_related("lesson").order_by("order_index")
            return Response(UnitLessonAdminSerializer(qs, many=True).data)

        # POST — thêm lesson vào unit
        lesson_id   = request.data.get("lesson_id")
        order_index = request.data.get("order_index", 0)
        if not lesson_id:
            return Response({"detail": "lesson_id required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            lesson = Lesson.objects.get(pk=lesson_id)
        except Lesson.DoesNotExist:
            return Response({"detail": "Bài học không tồn tại."}, status=status.HTTP_404_NOT_FOUND)

        _, created = UnitLesson.objects.get_or_create(
            unit=unit, lesson=lesson,
            defaults={"order_index": order_index},
        )
        if not created:
            return Response({"detail": "Bài học đã có trong unit này."}, status=status.HTTP_409_CONFLICT)
        return Response({"detail": "Đã thêm bài học vào unit."}, status=status.HTTP_201_CREATED)

    # DELETE /units/{id}/lessons/{lesson_id}/
    @action(detail=True, methods=["delete"], url_path=r"lessons/(?P<lesson_id>\d+)")
    def remove_lesson(self, request, pk=None, lesson_id=None):
        unit = self.get_object()
        deleted, _ = UnitLesson.objects.filter(unit=unit, lesson_id=lesson_id).delete()
        if not deleted:
            return Response({"detail": "Bài học không có trong unit."}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)
