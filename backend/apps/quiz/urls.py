"""URL patterns cho module quiz."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import QuizGenerateView, QuizSubmitView, QuizViewSet, AdminQuizResultListView

router = DefaultRouter()
router.register(r"sessions", QuizViewSet, basename="quiz")
router.register(r"admin/results", AdminQuizResultListView, basename="admin-quiz-results")

urlpatterns = [
    path("", include(router.urls)),
    path("generate/", QuizGenerateView.as_view(), name="quiz-generate"),
    path("submit/", QuizSubmitView.as_view(), name="quiz-submit"),
]
