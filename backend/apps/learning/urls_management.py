"""URL patterns for teacher/admin/analytics endpoints."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .lesson_views import LessonViewSet
from .management_views import (
    AssignmentViewSet,
    LeaderboardView,
    LeagueCurrentView,
    LearningKPIBaselineView,
    LearningOnboardingFunnelView,
    NotificationViewSet,
    ProfileStatsView,
    StudentClassViewSet,
    TeacherStatsView,
)

router = DefaultRouter()
router.register("lessons", LessonViewSet, basename="lesson")
router.register("assignments", AssignmentViewSet, basename="assignment")
router.register("notifications", NotificationViewSet, basename="notification")
router.register("classes", StudentClassViewSet, basename="class")

urlpatterns = [
    path("", include(router.urls)),
    path("teacher/stats/", TeacherStatsView.as_view(), name="teacher-stats"),
    path("kpi/baseline/", LearningKPIBaselineView.as_view(), name="learning-kpi-baseline"),
    path("kpi/onboarding-funnel/", LearningOnboardingFunnelView.as_view(), name="learning-kpi-onboarding-funnel"),
    path("profile/stats/", ProfileStatsView.as_view(), name="profile-stats"),
    path("leaderboard/", LeaderboardView.as_view(), name="leaderboard"),
    path("league/current/", LeagueCurrentView.as_view(), name="league-current"),
]
