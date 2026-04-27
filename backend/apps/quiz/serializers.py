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
