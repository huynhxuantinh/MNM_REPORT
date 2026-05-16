"""Fixtures dùng chung cho tất cả test trong module accounts."""
import pytest
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient

from apps.accounts.models import EmailVerificationToken, PasswordResetToken, User


# ── Client ─────────────────────────────────────────────────────────────────

@pytest.fixture
def client():
    return APIClient()


# ── Users ──────────────────────────────────────────────────────────────────

@pytest.fixture
def active_user(db):
    """Tài khoản đã xác thực email, có thể đăng nhập."""
    return User.objects.create_user(
        username="testuser",
        email="test@example.com",
        password="TestPass123!",
        full_name="Test User",
        is_active=True,
        email_verified=True,
    )


@pytest.fixture
def inactive_user(db):
    """Tài khoản vừa đăng ký, chưa xác thực email."""
    user = User.objects.create_user(
        username="inactive",
        email="inactive@example.com",
        password="TestPass123!",
        is_active=False,
        email_verified=False,
    )
    EmailVerificationToken.objects.create(
        user=user,
        token="valid-verify-token",
        expires_at=timezone.now() + timedelta(hours=24),
    )
    return user


@pytest.fixture
def staff_user(db):
    return User.objects.create_user(
        username="staff",
        email="staff@example.com",
        password="TestPass123!",
        role=User.Role.USER,
        is_active=True,
        email_verified=True,
    )


# ── Helpers ────────────────────────────────────────────────────────────────

@pytest.fixture
def auth_client(client, active_user):
    """APIClient đã đăng nhập sẵn dưới danh nghĩa active_user."""
    response = client.post(
        "/api/v1/auth/login/",
        {"email": active_user.email, "password": "TestPass123!"},
    )
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
    client._refresh_token = response.cookies.get("refresh_token").value
    return client


@pytest.fixture
def reset_token(db, active_user):
    """Token reset mật khẩu hợp lệ cho active_user."""
    return PasswordResetToken.objects.create(
        user=active_user,
        token="valid-reset-token",
        expires_at=timezone.now() + timedelta(hours=1),
    )
