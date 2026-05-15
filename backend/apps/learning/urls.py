"""URL patterns for learning module."""
from django.urls import include, path


urlpatterns = [
    path("", include("apps.learning.urls_management")),
    path("", include("apps.learning.urls_flow")),
]
