"""Views cho module quiz."""
import random

from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Quiz, QuizResult
from .serializers import QuizResultSerializer


class QuizGenerateView(APIView):
    """
    GET /api/v1/quiz/generate/?lesson_id=X
    Tạo 10 câu hỏi trắc nghiệm từ bài học, trả về quiz_id để submit kết quả.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.learning.models import Lesson
        from apps.vocabulary.models import Word

        lesson_id = request.query_params.get("lesson_id")
        if not lesson_id:
            return Response({"detail": "Cần lesson_id."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            lesson = Lesson.objects.get(pk=lesson_id, is_published=True)
        except Lesson.DoesNotExist:
            return Response({"detail": "Không tìm thấy bài học."}, status=status.HTTP_404_NOT_FOUND)

        words = [
            {
                "id": lw.word_id,
                "text": lw.word.text,
                "phonetic": lw.word.phonetic,
                "definition_vi": lw.word.definition_vi,
            }
            for lw in lesson.lesson_words.select_related("word").order_by("order_index")
        ]
        if len(words) < 4:
            return Response(
                {"detail": "Bài học cần ít nhất 4 từ để tạo quiz."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Tìm hoặc tạo Quiz object cho bài học này
        quiz = Quiz.objects.filter(
            lesson=lesson, quiz_type=Quiz.QuizType.MULTIPLE_CHOICE
        ).first()
        if not quiz:
            quiz = Quiz.objects.create(
                title=f"Quiz – {lesson.title}",
                quiz_type=Quiz.QuizType.MULTIPLE_CHOICE,
                lesson=lesson,
                created_by=request.user,
            )

        all_defs = [w["definition_vi"] for w in words]
        sample = random.sample(words, min(10, len(words)))
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
            "lesson_title": lesson.title,
            "questions": questions,
        })


class QuizSubmitView(APIView):
    """
    POST /api/v1/quiz/submit/
    Body: { quiz_id, score, total_questions, correct_answers }
    """

    permission_classes = [IsAuthenticated]

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
        return (
            QuizResult.objects.filter(user=self.request.user)
            .select_related("quiz")
            .order_by("-completed_at")
        )
