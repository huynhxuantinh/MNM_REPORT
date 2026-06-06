"""URL patterns for the dedicated listening module."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .listening_views import (
    ListeningPassageAdminViewSet,
    ListeningPassageDetailView,
    ListeningPassageListView,
    ListeningQuestionAdminViewSet,
    ListeningSessionAnswerView,
    ListeningSessionDetailView,
    ListeningSessionFinishView,
    ListeningSessionStartView,
)

router = DefaultRouter()
router.register("admin/passages", ListeningPassageAdminViewSet, basename="admin-listening-passage")
router.register("admin/questions", ListeningQuestionAdminViewSet, basename="admin-listening-question")

urlpatterns = [
    path("", include(router.urls)),
    path("passages/", ListeningPassageListView.as_view(), name="listening-passage-list"),
    path("passages/<int:passage_id>/", ListeningPassageDetailView.as_view(), name="listening-passage-detail"),
    path("session/start/", ListeningSessionStartView.as_view(), name="listening-session-start-v2"),
    path("session/<int:session_id>/", ListeningSessionDetailView.as_view(), name="listening-session-detail-v2"),
    path("session/<int:session_id>/answer/", ListeningSessionAnswerView.as_view(), name="listening-session-answer-v2"),
    path("session/<int:session_id>/finish/", ListeningSessionFinishView.as_view(), name="listening-session-finish-v2"),
]
