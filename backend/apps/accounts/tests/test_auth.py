"""
Unit tests cho toàn bộ Auth module.

Chạy: pytest apps/accounts/tests/test_auth.py -v
"""
import pytest
from django.core import mail
from django.utils import timezone
from datetime import timedelta
from rest_framework import status

from apps.accounts.models import EmailVerificationToken, PasswordResetToken, User


# ══════════════════════════════════════════════════════════════════════════════
#  ĐĂNG KÝ  –  POST /api/v1/auth/register/
# ══════════════════════════════════════════════════════════════════════════════

REGISTER_URL = "/api/v1/auth/register/"

VALID_REGISTER_DATA = {
    "username": "newuser",
    "email": "newuser@example.com",
    "full_name": "Nguyễn Văn A",
    "password": "StrongPass123!",
    "password_confirm": "StrongPass123!",
}


@pytest.mark.django_db
class TestRegister:
    def test_success_returns_201(self, client):
        response = client.post(REGISTER_URL, VALID_REGISTER_DATA)
        assert response.status_code == status.HTTP_201_CREATED

    def test_success_creates_inactive_user(self, client):
        client.post(REGISTER_URL, VALID_REGISTER_DATA)
        user = User.objects.get(email="newuser@example.com")
        assert not user.is_active
        assert not user.email_verified

    def test_success_creates_verification_token(self, client):
        client.post(REGISTER_URL, VALID_REGISTER_DATA)
        user = User.objects.get(email="newuser@example.com")
        assert EmailVerificationToken.objects.filter(user=user).exists()

    def test_success_sends_verification_email(self, client):
        client.post(REGISTER_URL, VALID_REGISTER_DATA)
        assert len(mail.outbox) == 1
        assert "newuser@example.com" in mail.outbox[0].to

    def test_duplicate_email_returns_400(self, client, active_user):
        data = {**VALID_REGISTER_DATA, "email": active_user.email, "username": "other"}
        response = client.post(REGISTER_URL, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_duplicate_username_returns_400(self, client, active_user):
        data = {**VALID_REGISTER_DATA, "username": active_user.username}
        response = client.post(REGISTER_URL, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_password_mismatch_returns_400(self, client):
        data = {**VALID_REGISTER_DATA, "password_confirm": "WrongPass!"}
        response = client.post(REGISTER_URL, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_weak_password_returns_400(self, client):
        data = {**VALID_REGISTER_DATA, "password": "123", "password_confirm": "123"}
        response = client.post(REGISTER_URL, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_missing_email_returns_400(self, client):
        data = {k: v for k, v in VALID_REGISTER_DATA.items() if k != "email"}
        response = client.post(REGISTER_URL, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_email_stored_lowercase(self, client):
        data = {**VALID_REGISTER_DATA, "email": "NewUser@Example.COM"}
        client.post(REGISTER_URL, data)
        assert User.objects.filter(email="newuser@example.com").exists()


# ══════════════════════════════════════════════════════════════════════════════
#  XÁC THỰC EMAIL  –  POST /api/v1/auth/verify-email/
# ══════════════════════════════════════════════════════════════════════════════

VERIFY_URL = "/api/v1/auth/verify-email/"


@pytest.mark.django_db
class TestVerifyEmail:
    def test_success_activates_user(self, client, inactive_user):
        client.post(VERIFY_URL, {"token": "valid-verify-token"})
        inactive_user.refresh_from_db()
        assert inactive_user.is_active
        assert inactive_user.email_verified

    def test_success_deletes_token(self, client, inactive_user):
        client.post(VERIFY_URL, {"token": "valid-verify-token"})
        assert not EmailVerificationToken.objects.filter(user=inactive_user).exists()

    def test_success_returns_200(self, client, inactive_user):
        response = client.post(VERIFY_URL, {"token": "valid-verify-token"})
        assert response.status_code == status.HTTP_200_OK

    def test_invalid_token_returns_400(self, client):
        response = client.post(VERIFY_URL, {"token": "nonexistent-token"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_expired_token_returns_400(self, client, inactive_user):
        token_obj = EmailVerificationToken.objects.get(user=inactive_user)
        token_obj.expires_at = timezone.now() - timedelta(minutes=1)
        token_obj.save()
        response = client.post(VERIFY_URL, {"token": "valid-verify-token"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_expired_token_is_deleted(self, client, inactive_user):
        token_obj = EmailVerificationToken.objects.get(user=inactive_user)
        token_obj.expires_at = timezone.now() - timedelta(minutes=1)
        token_obj.save()
        client.post(VERIFY_URL, {"token": "valid-verify-token"})
        assert not EmailVerificationToken.objects.filter(user=inactive_user).exists()


# ══════════════════════════════════════════════════════════════════════════════
#  ĐĂNG NHẬP  –  POST /api/v1/auth/login/
# ══════════════════════════════════════════════════════════════════════════════

LOGIN_URL = "/api/v1/auth/login/"


@pytest.mark.django_db
class TestLogin:
    def test_success_returns_tokens(self, client, active_user):
        response = client.post(LOGIN_URL, {"email": active_user.email, "password": "TestPass123!"})
        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data
        assert "refresh" in response.data

    def test_success_returns_user_data(self, client, active_user):
        response = client.post(LOGIN_URL, {"email": active_user.email, "password": "TestPass123!"})
        assert response.data["user"]["email"] == active_user.email
        assert "password" not in response.data["user"]

    def test_wrong_password_returns_400(self, client, active_user):
        response = client.post(LOGIN_URL, {"email": active_user.email, "password": "WrongPass!"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_wrong_email_returns_400(self, client):
        response = client.post(LOGIN_URL, {"email": "nobody@example.com", "password": "TestPass123!"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_inactive_account_returns_400(self, client, inactive_user):
        response = client.post(LOGIN_URL, {"email": inactive_user.email, "password": "TestPass123!"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_missing_email_returns_400(self, client):
        response = client.post(LOGIN_URL, {"password": "TestPass123!"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_email_case_insensitive(self, client, active_user):
        response = client.post(LOGIN_URL, {"email": active_user.email.upper(), "password": "TestPass123!"})
        assert response.status_code == status.HTTP_200_OK


# ══════════════════════════════════════════════════════════════════════════════
#  ĐĂNG XUẤT  –  POST /api/v1/auth/logout/
# ══════════════════════════════════════════════════════════════════════════════

LOGOUT_URL = "/api/v1/auth/logout/"


@pytest.mark.django_db
class TestLogout:
    def test_success_returns_200(self, auth_client):
        response = auth_client.post(LOGOUT_URL, {"refresh": auth_client._refresh_token})
        assert response.status_code == status.HTTP_200_OK

    def test_requires_authentication(self, client):
        response = client.post(LOGOUT_URL, {"refresh": "sometoken"})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_invalid_refresh_token_returns_400(self, auth_client):
        response = auth_client.post(LOGOUT_URL, {"refresh": "invalid-garbage-token"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_blacklisted_token_cannot_be_reused(self, auth_client, client, active_user):
        refresh = auth_client._refresh_token
        auth_client.post(LOGOUT_URL, {"refresh": refresh})
        # Sau khi logout, dùng lại refresh token không được
        response = client.post("/api/v1/auth/token/refresh/", {"refresh": refresh})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ══════════════════════════════════════════════════════════════════════════════
#  REFRESH TOKEN  –  POST /api/v1/auth/token/refresh/
# ══════════════════════════════════════════════════════════════════════════════

REFRESH_URL = "/api/v1/auth/token/refresh/"


@pytest.mark.django_db
class TestTokenRefresh:
    def test_success_returns_new_access_token(self, client, active_user):
        login = client.post(LOGIN_URL, {"email": active_user.email, "password": "TestPass123!"})
        response = client.post(REFRESH_URL, {"refresh": login.data["refresh"]})
        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data

    def test_invalid_token_returns_401(self, client):
        response = client.post(REFRESH_URL, {"refresh": "invalid-token"})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_missing_token_returns_400(self, client):
        response = client.post(REFRESH_URL, {})
        assert response.status_code == status.HTTP_400_BAD_REQUEST


# ══════════════════════════════════════════════════════════════════════════════
#  QUÊN MẬT KHẨU  –  POST /api/v1/auth/forgot-password/
# ══════════════════════════════════════════════════════════════════════════════

FORGOT_URL = "/api/v1/auth/forgot-password/"


@pytest.mark.django_db
class TestForgotPassword:
    def test_existing_email_creates_token(self, client, active_user):
        client.post(FORGOT_URL, {"email": active_user.email})
        assert PasswordResetToken.objects.filter(user=active_user, is_used=False).exists()

    def test_existing_email_sends_email(self, client, active_user):
        client.post(FORGOT_URL, {"email": active_user.email})
        assert len(mail.outbox) == 1
        assert active_user.email in mail.outbox[0].to

    def test_nonexistent_email_returns_200(self, client):
        # Không tiết lộ email có tồn tại hay không
        response = client.post(FORGOT_URL, {"email": "nobody@example.com"})
        assert response.status_code == status.HTTP_200_OK

    def test_nonexistent_email_no_token_created(self, client):
        client.post(FORGOT_URL, {"email": "nobody@example.com"})
        assert not PasswordResetToken.objects.exists()

    def test_second_request_replaces_old_token(self, client, active_user):
        client.post(FORGOT_URL, {"email": active_user.email})
        client.post(FORGOT_URL, {"email": active_user.email})
        # Chỉ có 1 token chưa dùng tại một thời điểm
        assert PasswordResetToken.objects.filter(user=active_user, is_used=False).count() == 1

    def test_inactive_user_no_email_sent(self, client, inactive_user):
        client.post(FORGOT_URL, {"email": inactive_user.email})
        assert len(mail.outbox) == 0


# ══════════════════════════════════════════════════════════════════════════════
#  ĐẶT LẠI MẬT KHẨU  –  POST /api/v1/auth/reset-password/
# ══════════════════════════════════════════════════════════════════════════════

RESET_URL = "/api/v1/auth/reset-password/"

VALID_RESET_DATA = {
    "token": "valid-reset-token",
    "password": "NewStrongPass456!",
    "password_confirm": "NewStrongPass456!",
}


@pytest.mark.django_db
class TestResetPassword:
    def test_success_returns_200(self, client, active_user, reset_token):
        response = client.post(RESET_URL, VALID_RESET_DATA)
        assert response.status_code == status.HTTP_200_OK

    def test_success_changes_password(self, client, active_user, reset_token):
        client.post(RESET_URL, VALID_RESET_DATA)
        active_user.refresh_from_db()
        assert active_user.check_password("NewStrongPass456!")

    def test_success_marks_token_used(self, client, active_user, reset_token):
        client.post(RESET_URL, VALID_RESET_DATA)
        reset_token.refresh_from_db()
        assert reset_token.is_used

    def test_invalid_token_returns_400(self, client):
        data = {**VALID_RESET_DATA, "token": "nonexistent"}
        response = client.post(RESET_URL, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_expired_token_returns_400(self, client, active_user):
        PasswordResetToken.objects.create(
            user=active_user,
            token="expired-token",
            expires_at=timezone.now() - timedelta(minutes=1),
        )
        data = {**VALID_RESET_DATA, "token": "expired-token"}
        response = client.post(RESET_URL, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_already_used_token_returns_400(self, client, active_user):
        PasswordResetToken.objects.create(
            user=active_user,
            token="used-token",
            expires_at=timezone.now() + timedelta(hours=1),
            is_used=True,
        )
        data = {**VALID_RESET_DATA, "token": "used-token"}
        response = client.post(RESET_URL, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_password_mismatch_returns_400(self, client, active_user, reset_token):
        data = {**VALID_RESET_DATA, "password_confirm": "WrongConfirm!"}
        response = client.post(RESET_URL, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_weak_new_password_returns_400(self, client, active_user, reset_token):
        data = {**VALID_RESET_DATA, "password": "123", "password_confirm": "123"}
        response = client.post(RESET_URL, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_old_password_no_longer_works_after_reset(self, client, active_user, reset_token):
        client.post(RESET_URL, VALID_RESET_DATA)
        active_user.refresh_from_db()
        assert not active_user.check_password("TestPass123!")


# ══════════════════════════════════════════════════════════════════════════════
#  ĐỔI MẬT KHẨU  –  PUT /api/v1/auth/change-password/
# ══════════════════════════════════════════════════════════════════════════════

CHANGE_URL = "/api/v1/auth/change-password/"

VALID_CHANGE_DATA = {
    "old_password": "TestPass123!",
    "new_password": "NewStrongPass456!",
    "new_password_confirm": "NewStrongPass456!",
}


@pytest.mark.django_db
class TestChangePassword:
    def test_success_returns_200(self, auth_client):
        response = auth_client.put(CHANGE_URL, VALID_CHANGE_DATA)
        assert response.status_code == status.HTTP_200_OK

    def test_success_changes_password(self, auth_client, active_user):
        auth_client.put(CHANGE_URL, VALID_CHANGE_DATA)
        active_user.refresh_from_db()
        assert active_user.check_password("NewStrongPass456!")

    def test_old_password_no_longer_works(self, auth_client, active_user):
        auth_client.put(CHANGE_URL, VALID_CHANGE_DATA)
        active_user.refresh_from_db()
        assert not active_user.check_password("TestPass123!")

    def test_wrong_old_password_returns_400(self, auth_client):
        data = {**VALID_CHANGE_DATA, "old_password": "WrongOldPass!"}
        response = auth_client.put(CHANGE_URL, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_new_password_mismatch_returns_400(self, auth_client):
        data = {**VALID_CHANGE_DATA, "new_password_confirm": "WrongConfirm!"}
        response = auth_client.put(CHANGE_URL, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_weak_new_password_returns_400(self, auth_client):
        data = {**VALID_CHANGE_DATA, "new_password": "123", "new_password_confirm": "123"}
        response = auth_client.put(CHANGE_URL, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_requires_authentication(self, client):
        response = client.put(CHANGE_URL, VALID_CHANGE_DATA)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ══════════════════════════════════════════════════════════════════════════════
#  PROFILE  –  GET/PUT /api/v1/auth/me/
# ══════════════════════════════════════════════════════════════════════════════

ME_URL = "/api/v1/auth/me/"


@pytest.mark.django_db
class TestMe:
    def test_get_returns_user_data(self, auth_client, active_user):
        response = auth_client.get(ME_URL)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["email"] == active_user.email
        assert response.data["username"] == active_user.username

    def test_get_does_not_return_password(self, auth_client):
        response = auth_client.get(ME_URL)
        assert "password" not in response.data

    def test_update_full_name(self, auth_client, active_user):
        auth_client.put(ME_URL, {"full_name": "Trần Thị B"})
        active_user.refresh_from_db()
        assert active_user.full_name == "Trần Thị B"

    def test_update_returns_200(self, auth_client):
        response = auth_client.put(ME_URL, {"full_name": "Lê Văn C"})
        assert response.status_code == status.HTTP_200_OK

    def test_cannot_change_role_via_me(self, auth_client, active_user):
        auth_client.put(ME_URL, {"role": "admin"})
        active_user.refresh_from_db()
        assert active_user.role == User.Role.USER

    def test_cannot_change_email_via_me(self, auth_client, active_user):
        auth_client.put(ME_URL, {"email": "hacker@evil.com"})
        active_user.refresh_from_db()
        assert active_user.email == "test@example.com"

    def test_requires_authentication(self, client):
        response = client.get(ME_URL)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ══════════════════════════════════════════════════════════════════════════════
#  ADMIN ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

ADMIN_USERS_URL = "/api/v1/auth/admin/users/"
ADMIN_STATS_URL = "/api/v1/auth/admin/stats/"


@pytest.mark.django_db
class TestAdminPermissions:
    """Kiểm tra quyền truy cập admin endpoints."""

    def _make_admin_client(self, client, db):
        admin = User.objects.create_user(
            username="adminuser", email="admin@example.com",
            password="AdminPass123!", role=User.Role.ADMIN,
            is_active=True, email_verified=True,
        )
        r = client.post("/api/v1/auth/login/", {"email": admin.email, "password": "AdminPass123!"})
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {r.data['access']}")
        return client, admin

    def test_admin_can_list_users(self, client, db):
        ac, _ = self._make_admin_client(client, db)
        r = ac.get(ADMIN_USERS_URL)
        assert r.status_code == 200

    def test_admin_can_get_stats(self, client, db):
        ac, _ = self._make_admin_client(client, db)
        r = ac.get(ADMIN_STATS_URL)
        assert r.status_code == 200
        for field in ("total_users", "students", "teachers", "total_words", "total_lessons"):
            assert field in r.data

    def test_student_cannot_access_admin_users(self, auth_client):
        r = auth_client.get(ADMIN_USERS_URL)
        assert r.status_code == 403

    def test_student_cannot_access_admin_stats(self, auth_client):
        r = auth_client.get(ADMIN_STATS_URL)
        assert r.status_code == 403

    def test_teacher_cannot_access_admin_users(self, client, teacher_user):
        r = client.post("/api/v1/auth/login/", {"email": teacher_user.email, "password": "TestPass123!"})
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {r.data['access']}")
        assert client.get(ADMIN_USERS_URL).status_code == 403

    def test_unauthenticated_denied(self, client):
        assert client.get(ADMIN_USERS_URL).status_code == 401
        assert client.get(ADMIN_STATS_URL).status_code == 401
