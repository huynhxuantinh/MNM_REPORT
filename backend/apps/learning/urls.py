"""URL patterns for learning module."""
from django.urls import include, path


urlpatterns = [
    path("", include("apps.learning.api.urls_management")),
    path("", include("apps.learning.api.urls_flow")),
]
