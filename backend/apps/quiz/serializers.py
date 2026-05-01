"""Serializers cho module quiz."""
from rest_framework import serializers
from .models import Quiz, QuizResult


class QuizSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quiz
        fields = ["id", "title", "quiz_type", "wordset", "lesson", "created_at"]
        read_only_fields = ["id", "created_at"]


class QuizResultSerializer(serializers.ModelSerializer):
    quiz_title = serializers.CharField(source="quiz.title", read_only=True)

    class Meta:
        model = QuizResult
        fields = ["id", "quiz", "quiz_title", "score", "total_questions", "correct_answers", "completed_at"]
        read_only_fields = ["id", "completed_at"]


class AdminQuizResultSerializer(serializers.ModelSerializer):
    quiz_title = serializers.CharField(source="quiz.title", read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)
    user_name  = serializers.CharField(source="user.full_name", read_only=True)

    class Meta:
        model = QuizResult
        fields = [
            "id", "user", "user_email", "user_name",
            "quiz", "quiz_title",
            "score", "total_questions", "correct_answers", "completed_at",
        ]
        read_only_fields = ["id", "completed_at"]
