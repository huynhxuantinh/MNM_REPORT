"""URL patterns cho vocabulary module."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import BookmarkListView, WordSetViewSet, WordViewSet

router = DefaultRouter()
router.register("words", WordViewSet, basename="word")
router.register("sets", WordSetViewSet, basename="wordset")

urlpatterns = [
    path("", include(router.urls)),
    path("bookmarks/", BookmarkListView.as_view(), name="bookmark-list"),
]
