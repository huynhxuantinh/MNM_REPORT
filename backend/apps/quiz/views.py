"""Views cho module quiz."""
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Quiz, QuizResult
from .serializers import QuizSerializer, QuizResultSerializer


class QuizViewSet(viewsets.ModelViewSet):
    """
    GET  /api/v1/quiz/sessions/       — Lịch sử quiz của user
    POST /api/v1/quiz/sessions/       — Tạo phiên quiz mới
    GET  /api/v1/quiz/sessions/{id}/  — Chi tiết kết quả
    """

    permission_classes = [IsAuthenticated]
    serializer_class = QuizResultSerializer

    def get_queryset(self):
        return QuizResult.objects.filter(user=self.request.user).select_related("quiz").order_by("-completed_at")

    def create(self, request, *args, **kwargs):
        serializer = QuizSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save(created_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
