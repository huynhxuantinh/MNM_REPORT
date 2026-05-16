"""URL patterns for learner/admin endpoints."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .lesson_views import LessonViewSet
from .management_views import (
    KpiBaselineView,
    LeaderboardView,
    LeagueCurrentView,
    NotificationViewSet,
    OnboardingFunnelKpiView,
    ProfileStatsView,
)

router = DefaultRouter()
router.register("lessons", LessonViewSet, basename="lesson")
router.register("notifications", NotificationViewSet, basename="notification")

urlpatterns = [
    path("", include(router.urls)),
    path("profile/stats/", ProfileStatsView.as_view(), name="profile-stats"),
    path("leaderboard/", LeaderboardView.as_view(), name="leaderboard"),
    path("league/current/", LeagueCurrentView.as_view(), name="league-current"),
    path("kpi/baseline/", KpiBaselineView.as_view(), name="kpi-baseline"),
    path("kpi/onboarding-funnel/", OnboardingFunnelKpiView.as_view(), name="kpi-onboarding-funnel"),
]
