"""Views cho module quiz."""
import random

from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Quiz, QuizResult
from .serializers import QuizResultSerializer, AdminQuizResultSerializer


class QuizGenerateView(APIView):
    """
    GET /api/v1/quiz/generate/?lesson_id=X
    Tạo 10 câu hỏi trắc nghiệm từ bài học, trả về quiz_id để submit kết quả.
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request):
        from apps.learning.models import Lesson
        from apps.vocabulary.models import Word, WordSet

        lesson_id = request.query_params.get("lesson_id")
        wordset_id = request.query_params.get("wordset_id")
        quiz_type = request.query_params.get("type", "mc")

        if not lesson_id and not wordset_id:
            return Response({"detail": "Cần lesson_id hoặc wordset_id."}, status=status.HTTP_400_BAD_REQUEST)

        title = ""
        words = []
        source_obj = None

        if lesson_id:
            try:
                source_obj = Lesson.objects.get(pk=lesson_id, is_published=True)
                title = source_obj.title
                words = [
                    {
                        "id": lw.word_id,
                        "text": lw.word.text,
                        "phonetic": lw.word.phonetic,
                        "definition_vi": lw.word.definition_vi,
                    }
                    for lw in source_obj.lesson_words.select_related("word").order_by("order_index")
                ]
            except Lesson.DoesNotExist:
                return Response({"detail": "Không tìm thấy bài học."}, status=status.HTTP_404_NOT_FOUND)
        elif wordset_id:
            try:
                source_obj = WordSet.objects.get(pk=wordset_id)
                title = source_obj.name
                words = [
                    {
                        "id": wsw.word_id,
                        "text": wsw.word.text,
                        "phonetic": wsw.word.phonetic,
                        "definition_vi": wsw.word.definition_vi,
                    }
                    for wsw in source_obj.wordset_words.select_related("word").order_by("order_index")
                ]
            except WordSet.DoesNotExist:
                return Response({"detail": "Không tìm thấy bộ từ."}, status=status.HTTP_404_NOT_FOUND)

        if len(words) < 4:
            return Response(
                {"detail": "Nguồn cần ít nhất 4 từ để tạo quiz."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        q_type_enum = Quiz.QuizType.MATCHING if quiz_type == "match" else Quiz.QuizType.MULTIPLE_CHOICE

        # Tìm hoặc tạo Quiz object
        filter_kwargs = {"quiz_type": q_type_enum}
        if lesson_id:
            filter_kwargs["lesson"] = source_obj
        else:
            filter_kwargs["wordset"] = source_obj

        quiz = Quiz.objects.filter(**filter_kwargs).first()
        if not quiz:
            create_kwargs = {
                "title": f"Quiz – {title}",
                "quiz_type": q_type_enum,
                "created_by": request.user,
            }
            if lesson_id:
                create_kwargs["lesson"] = source_obj
            else:
                create_kwargs["wordset"] = source_obj
            quiz = Quiz.objects.create(**create_kwargs)

        sample_size = min(10 if quiz_type == "mc" else 8, len(words))
        sample = random.sample(words, sample_size)
        
        if quiz_type == "match":
            questions = sample
        else:
            all_defs = [w["definition_vi"] for w in words]
            questions = []
            for w in sample:
                others = [d for d in all_defs if d != w["definition_vi"]]
                wrong = random.sample(others, min(3, len(others)))
                options = wrong + [w["definition_vi"]]
                random.shuffle(options)
                questions.append({
                    "word_id": w["id"],
                    "word_text": w["text"],
                    "phonetic": w["phonetic"] or "",
                    "options": options,
                    "correct_index": options.index(w["definition_vi"]),
                })

        return Response({
            "quiz_id": quiz.id,
            "quiz_type": quiz_type,
            "source_title": title,
            # Backward-compatible aliases for older clients/tests.
            "lesson_title": title if lesson_id else None,
            "wordset_title": title if wordset_id else None,
            "questions": questions,
        })


class QuizSubmitView(APIView):
    """
    POST /api/v1/quiz/submit/
    Body: { quiz_id, score, total_questions, correct_answers }
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(request=OpenApiTypes.OBJECT, responses=QuizResultSerializer)
    def post(self, request):
        quiz_id = request.data.get("quiz_id")
        if not quiz_id:
            return Response({"detail": "Cần quiz_id."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            quiz = Quiz.objects.get(pk=quiz_id)
        except Quiz.DoesNotExist:
            return Response({"detail": "Quiz không tồn tại."}, status=status.HTTP_404_NOT_FOUND)

        result = QuizResult.objects.create(
            user=request.user,
            quiz=quiz,
            score=request.data.get("score", 0),
            total_questions=request.data.get("total_questions", 0),
            correct_answers=request.data.get("correct_answers", 0),
        )
        return Response(QuizResultSerializer(result).data, status=status.HTTP_201_CREATED)


class QuizViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/v1/quiz/sessions/       — Lịch sử quiz của user
    GET /api/v1/quiz/sessions/{id}/  — Chi tiết kết quả
    """

    permission_classes = [IsAuthenticated]
    serializer_class = QuizResultSerializer

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return QuizResult.objects.none()
        return (
            QuizResult.objects.filter(user=self.request.user)
            .select_related("quiz")
            .order_by("-completed_at")
        )


class AdminQuizResultListView(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/v1/quiz/admin/results/      — Tất cả kết quả quiz (admin only)
    GET /api/v1/quiz/admin/results/{id}/ — Chi tiết 1 kết quả
    Filter: ?search=email/name  ?quiz=id  ?page=N
    """

    from apps.accounts.permissions import IsAdmin as _IsAdmin
    permission_classes = [IsAuthenticated, _IsAdmin]
    serializer_class = AdminQuizResultSerializer

    def get_queryset(self):
        from django.db.models import Q
        qs = (
            QuizResult.objects.all()
            .select_related("quiz", "user")
            .order_by("-completed_at")
        )
        search = self.request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(user__email__icontains=search) | Q(user__full_name__icontains=search)
            )
        quiz_id = self.request.query_params.get("quiz")
        if quiz_id:
            qs = qs.filter(quiz_id=quiz_id)
        return qs
