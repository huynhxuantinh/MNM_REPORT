"""Dedicated listening module API views."""

from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdmin
from .models import ListeningAnswer, ListeningPassage, ListeningQuestion, ListeningSession
from .serializers import (
    ListeningAnswerSerializer,
    ListeningPassageAdminDetailSerializer,
    ListeningPassageAdminSerializer,
    ListeningPassageDetailSerializer,
    ListeningPassageSerializer,
    ListeningQuestionAdminSerializer,
    ListeningSessionSerializer,
    ListeningSessionStartSerializer,
    ListeningSubmitAnswerSerializer,
)


def _serialize_listening_session(session: ListeningSession) -> dict:
    passage = session.passage
    passage_data = ListeningPassageDetailSerializer(passage).data
    answers = ListeningAnswerSerializer(session.answers.select_related("question").order_by("question__order_index"), many=True).data
    payload = ListeningSessionSerializer(session).data
    payload["passage"] = passage_data
    payload["answers"] = answers
    return payload


def _is_answer_correct(question: ListeningQuestion, submitted_answer) -> bool:
    expected = question.correct_answer
    if question.question_type in {
        ListeningQuestion.QuestionType.MULTIPLE_CHOICE,
        ListeningQuestion.QuestionType.TRUE_FALSE,
    }:
        if isinstance(submitted_answer, dict):
            value = submitted_answer.get("option")
        else:
            value = submitted_answer
        target = expected.get("option") if isinstance(expected, dict) else expected
        return str(value).strip().lower() == str(target).strip().lower()

    if question.question_type == ListeningQuestion.QuestionType.FILL_BLANK:
        if isinstance(submitted_answer, dict):
            value = submitted_answer.get("text", "")
        else:
            value = submitted_answer
        target = expected.get("text") if isinstance(expected, dict) else expected
        return str(value).strip().lower() == str(target).strip().lower()

    return False


class ListeningPassageListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        passages = (
            ListeningPassage.objects
            .filter(is_published=True)
            .annotate(question_count=Count("questions"))
            .order_by("level", "title")
        )
        serializer = ListeningPassageSerializer(passages, many=True)
        return Response({"results": serializer.data, "count": passages.count()})


class ListeningPassageAdminViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsAdmin]
    serializer_class = ListeningPassageAdminSerializer

    def get_queryset(self):
        queryset = ListeningPassage.objects.annotate(question_count=Count("questions")).order_by("-updated_at", "-id")
        search = (self.request.query_params.get("search") or "").strip()
        level = (self.request.query_params.get("level") or "").strip()
        published = (self.request.query_params.get("is_published") or "").strip().lower()

        if search:
            queryset = queryset.filter(Q(title__icontains=search) | Q(topic__icontains=search))
        if level:
            queryset = queryset.filter(level=level)
        if published in {"true", "false"}:
            queryset = queryset.filter(is_published=(published == "true"))
        return queryset

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ListeningPassageAdminDetailSerializer
        return ListeningPassageAdminSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ListeningQuestionAdminViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsAdmin]
    serializer_class = ListeningQuestionAdminSerializer

    def get_queryset(self):
        queryset = ListeningQuestion.objects.select_related("passage").order_by("passage_id", "order_index", "id")
        passage_id = self.request.query_params.get("passage_id")
        if passage_id:
            queryset = queryset.filter(passage_id=passage_id)
        return queryset


class ListeningPassageDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, passage_id: int):
        passage = get_object_or_404(
            ListeningPassage.objects.annotate(question_count=Count("questions")),
            id=passage_id,
            is_published=True,
        )
        serializer = ListeningPassageDetailSerializer(passage)
        return Response(serializer.data)


class ListeningSessionStartView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ListeningSessionStartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        passage = serializer.validated_data["passage"]

        question_count = passage.questions.count()
        if question_count < 1:
            return Response(
                {"detail": "Listening passage has no questions yet."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        session = ListeningSession.objects.create(
            user=request.user,
            passage=passage,
            status=ListeningSession.Status.STARTED,
            current_question_index=1,
        )
        return Response(_serialize_listening_session(session), status=status.HTTP_201_CREATED)


class ListeningSessionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id: int):
        session = get_object_or_404(
            ListeningSession.objects.select_related("passage"),
            id=session_id,
            user=request.user,
        )
        return Response(_serialize_listening_session(session))


class ListeningSessionAnswerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id: int):
        session = get_object_or_404(
            ListeningSession.objects.select_related("passage"),
            id=session_id,
            user=request.user,
        )
        if session.status != ListeningSession.Status.STARTED:
            return Response(
                {"detail": "Listening session is not active."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ListeningSubmitAnswerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        question = serializer.validated_data["question"]
        if question.passage_id != session.passage_id:
            return Response(
                {"detail": "Question does not belong to this listening passage."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        submitted_answer = serializer.validated_data["submitted_answer"]
        is_correct = _is_answer_correct(question, submitted_answer)
        answer, _ = ListeningAnswer.objects.update_or_create(
            session=session,
            question=question,
            defaults={
                "submitted_answer": submitted_answer,
                "is_correct": is_correct,
            },
        )

        answered_count = session.answers.count()
        session.current_question_index = min(answered_count + 1, session.passage.questions.count())
        session.score = session.answers.filter(is_correct=True).count()
        total_questions = max(session.passage.questions.count(), 1)
        session.score_pct = round((session.score / total_questions) * 100, 2)
        session.save(update_fields=["current_question_index", "score", "score_pct", "updated_at"])

        return Response(
            {
                "answer": ListeningAnswerSerializer(answer).data,
                "session": ListeningSessionSerializer(session).data,
                "feedback": {
                    "is_correct": is_correct,
                    "explanation": question.explanation,
                },
            }
        )


class ListeningSessionFinishView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id: int):
        session = get_object_or_404(
            ListeningSession.objects.select_related("passage"),
            id=session_id,
            user=request.user,
        )
        if session.status == ListeningSession.Status.COMPLETED:
            return Response(_serialize_listening_session(session))

        total_questions = max(session.passage.questions.count(), 1)
        answered_questions = session.answers.count()
        score = session.answers.filter(is_correct=True).count()
        session.status = ListeningSession.Status.COMPLETED
        session.score = score
        session.score_pct = round((score / total_questions) * 100, 2)
        from django.utils import timezone
        session.completed_at = timezone.now()
        session.save(update_fields=["status", "score", "score_pct", "completed_at", "updated_at"])
        xp_earned = (score * 3 + 2) if answered_questions > 0 else 0
        leveled_up = False
        if xp_earned > 0:
            leveled_up = request.user.add_xp(xp_earned)

        payload = _serialize_listening_session(session)
        payload["summary"] = {
            "total_questions": total_questions,
            "answered_questions": answered_questions,
            "correct_answers": score,
            "score_pct": session.score_pct,
            "xp_earned": xp_earned,
            "total_xp": request.user.xp,
            "level": request.user.level,
            "leveled_up": leveled_up,
        }
        return Response(payload)


__all__ = [
    "ListeningPassageListView",
    "ListeningPassageAdminViewSet",
    "ListeningPassageDetailView",
    "ListeningQuestionAdminViewSet",
    "ListeningSessionStartView",
    "ListeningSessionDetailView",
    "ListeningSessionAnswerView",
    "ListeningSessionFinishView",
]
