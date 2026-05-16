"""URL patterns cho module accounts."""
from django.urls import path

from .views import (
    AdminStatsView,
    AdminUserListView,
    AdminUserUpdateView,
    ChangePasswordView,
    CookieTokenRefreshView,
    ForgotPasswordView,
    LoginView,
    LogoutView,
    MeView,
    RegisterView,
    ResetPasswordView,
    VerifyEmailView,
)
from .views_resend_email import ResendVerificationEmailView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("verify-email/", VerifyEmailView.as_view(), name="auth-verify-email"),
    path("resend-verification/", ResendVerificationEmailView.as_view(), name="auth-resend-verification"),

    path("login/", LoginView.as_view(), name="auth-login"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("token/refresh/", CookieTokenRefreshView.as_view(), name="auth-token-refresh"),

    path("forgot-password/", ForgotPasswordView.as_view(), name="auth-forgot-password"),
    path("reset-password/", ResetPasswordView.as_view(), name="auth-reset-password"),
    path("change-password/", ChangePasswordView.as_view(), name="auth-change-password"),

    path("me/", MeView.as_view(), name="auth-me"),

    path("admin/users/", AdminUserListView.as_view(), name="admin-users"),
    path("admin/users/<int:pk>/", AdminUserUpdateView.as_view(), name="admin-user-update"),
    path("admin/stats/", AdminStatsView.as_view(), name="admin-stats"),
]
