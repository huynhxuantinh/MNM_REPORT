"""URL patterns cho learning module."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AssignmentViewSet,
    LessonViewSet,
    NotificationViewSet,
    ProfileStatsView,
    ReviewAnswerView,
    ReviewHistoryView,
    ReviewListView,
    ReviewSummaryView,
    StudentClassViewSet,
    TeacherStatsView,
    LeaderboardView,
)

router = DefaultRouter()
router.register("lessons", LessonViewSet, basename="lesson")
router.register("assignments", AssignmentViewSet, basename="assignment")
router.register("notifications", NotificationViewSet, basename="notification")
router.register("classes", StudentClassViewSet, basename="class")

urlpatterns = [
    path("", include(router.urls)),

    # ── Review SRS ───────────────────────────────────────────────
    path("review/", ReviewListView.as_view(), name="review-list"),
    path("review/summary/", ReviewSummaryView.as_view(), name="review-summary"),
    path("review/history/", ReviewHistoryView.as_view(), name="review-history"),
    path("review/<int:word_id>/answer/", ReviewAnswerView.as_view(), name="review-answer"),

    # ── Teacher ──────────────────────────────────────────────────
    path("teacher/stats/", TeacherStatsView.as_view(), name="teacher-stats"),

    # ── Profile ──────────────────────────────────────────────────
    path("profile/stats/", ProfileStatsView.as_view(), name="profile-stats"),
    path("leaderboard/", LeaderboardView.as_view(), name="leaderboard"),
]
