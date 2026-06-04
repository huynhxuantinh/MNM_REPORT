"""
Views cho toàn bộ luồng xác thực: đăng ký, login, logout,
quên/reset/đổi mật khẩu, profile cá nhân.
"""
import logging
import smtplib
from datetime import timedelta

from django.conf import settings
from django.core.mail import BadHeaderError
from django.db import transaction
from django.db.models import Count
from django.utils import timezone
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from .permissions import IsAdmin
from .throttles import LoginRateThrottle, PasswordResetRateThrottle, RegisterRateThrottle

from .models import EmailVerificationToken, PasswordResetToken, User
from .serializers import (
    AdminUserSerializer,
    ChangePasswordSerializer,
    ForgotPasswordSerializer,
    LoginSerializer,
    RegisterSerializer,
    ResetPasswordSerializer,
    UserSerializer,
    VerifyEmailSerializer,
)
from .utils import generate_token, send_password_reset_email, send_verification_email

logger = logging.getLogger(__name__)
MAIL_SEND_ERRORS = (smtplib.SMTPException, BadHeaderError, TimeoutError, OSError)


def _set_refresh_cookie(response, refresh_token: str) -> None:
    """Đặt refresh token vào HTTP-only cookie."""
    lifetime = settings.SIMPLE_JWT.get("REFRESH_TOKEN_LIFETIME", timedelta(days=7))
    response.set_cookie(
        "refresh_token",
        refresh_token,
        max_age=int(lifetime.total_seconds()),
        httponly=True,
        secure=not settings.DEBUG,
        samesite="Lax",
        path="/",
    )


def _get_refresh_token_value(request):
    return request.data.get("refresh") or request.COOKIES.get("refresh_token")


@extend_schema(responses=OpenApiTypes.OBJECT)
class RegisterView(APIView):
    """
    POST /api/v1/auth/register/
    Tạo tài khoản mới với is_active=False, gửi email xác thực.
    """

    permission_classes = [AllowAny]
    throttle_classes = [RegisterRateThrottle]


    @extend_schema(request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT)
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            user = serializer.save()
            token = generate_token()
            EmailVerificationToken.objects.create(
                user=user,
                token=token,
                expires_at=timezone.now() + timedelta(hours=24),
            )

        try:
            send_verification_email(user, token)
            logger.info("Verification email sent to %s", user.email)
            return Response(
                {
                    "detail": "Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.",
                    "email_sent": True,
                },
                status=status.HTTP_201_CREATED,
            )
        except MAIL_SEND_ERRORS as e:
            logger.error("Failed to send verification email to %s: %s", user.email, str(e))
            return Response(
                {
                    "detail": (
                        "Tài khoản đã được tạo nhưng email xác thực chưa gửi đi được. "
                        "Vui lòng dùng chức năng gửi lại email xác thực."
                    ),
                    "email_sent": False,
                },
                status=status.HTTP_201_CREATED,
            )


@extend_schema(responses=OpenApiTypes.OBJECT)
class VerifyEmailView(APIView):
    """
    POST /api/v1/auth/verify-email/
    Kích hoạt tài khoản bằng token trong email.
    """

    permission_classes = [AllowAny]

    @extend_schema(request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT)
    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token_value = serializer.validated_data["token"]

        try:
            token_obj = EmailVerificationToken.objects.select_related("user").get(
                token=token_value
            )
        except EmailVerificationToken.DoesNotExist:
            # Có thể user đã verify trước đó (token đã bị xóa)
            # Hoặc token thật sự không hợp lệ
            return Response(
                {"detail": "Token không hợp lệ hoặc đã được sử dụng. Nếu bạn đã xác thực email trước đó, hãy đăng nhập bình thường."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if timezone.now() > token_obj.expires_at:
            token_obj.delete()
            return Response(
                {"detail": "Token đã hết hạn. Vui lòng đăng ký lại."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = token_obj.user
        user.is_active = True
        user.email_verified = True
        user.save(update_fields=["is_active", "email_verified"])
        token_obj.delete()

        return Response({"detail": "Email đã được xác thực. Bạn có thể đăng nhập."})


@extend_schema(responses=OpenApiTypes.OBJECT)
class LoginView(APIView):
    """
    POST /api/v1/auth/login/
    Trả về { access, user } — refresh token được đặt vào HTTP-only cookie.
    """

    permission_classes = [AllowAny]
    throttle_classes = [LoginRateThrottle]

    @extend_schema(request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT)
    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        refresh = RefreshToken.for_user(user)
        response = Response(
            {
                "access": str(refresh.access_token),
                "user": UserSerializer(user).data,
            }
        )
        _set_refresh_cookie(response, str(refresh))
        return response


@extend_schema(responses=OpenApiTypes.OBJECT)
class LogoutView(APIView):
    """
    POST /api/v1/auth/logout/
    Blacklist refresh token từ cookie và xóa cookie.
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT)
    def post(self, request):
        refresh_value = _get_refresh_token_value(request)
        if refresh_value:
            try:
                RefreshToken(refresh_value).blacklist()
            except TokenError:
                response = Response(
                    {"detail": "Refresh token không hợp lệ."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
                response.delete_cookie("refresh_token", path="/")
                return response

        response = Response({"detail": "Đăng xuất thành công."})
        response.delete_cookie("refresh_token", path="/")
        return response


@extend_schema(responses=OpenApiTypes.OBJECT)
class CookieTokenRefreshView(APIView):
    """
    POST /api/v1/auth/token/refresh/
    Lấy access token mới từ refresh token trong HTTP-only cookie.
    Tự động xoay refresh token nếu ROTATE_REFRESH_TOKENS = True.
    """

    permission_classes = [AllowAny]

    @extend_schema(request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT)
    def post(self, request):
        refresh_value = _get_refresh_token_value(request)
        if not refresh_value:
            return Response(
                {"detail": "Không tìm thấy refresh token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = TokenRefreshSerializer(data={"refresh": refresh_value})
        try:
            is_valid = serializer.is_valid()
        except TokenError:
            is_valid = False

        if not is_valid:
            return Response(
                {"detail": "Token không hợp lệ hoặc đã hết hạn."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        response = Response({"access": serializer.validated_data["access"]})

        # Nếu rotation xảy ra, server trả về refresh mới — cập nhật cookie
        new_refresh = serializer.validated_data.get("refresh")
        if new_refresh:
            _set_refresh_cookie(response, new_refresh)

        return response


@extend_schema(responses=OpenApiTypes.OBJECT)
class ForgotPasswordView(APIView):
    """
    POST /api/v1/auth/forgot-password/
    Gửi email reset mật khẩu. Luôn trả 200 để không tiết lộ email tồn tại hay không.
    """

    permission_classes = [AllowAny]
    throttle_classes = [PasswordResetRateThrottle]

    _GENERIC_MSG = "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn trong vài phút."

    @extend_schema(request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT)
    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower()

        try:
            user = User.objects.get(email=email, is_active=True, email_verified=True)
        except User.DoesNotExist:
            return Response({"detail": self._GENERIC_MSG})

        # Xoá các token reset cũ chưa dùng của user này
        PasswordResetToken.objects.filter(user=user, is_used=False).delete()

        token = generate_token()
        PasswordResetToken.objects.create(
            user=user,
            token=token,
            expires_at=timezone.now() + timedelta(hours=1),
        )

        try:
            send_password_reset_email(user, token)
            logger.info(f"Password reset email sent to {user.email}")
        except MAIL_SEND_ERRORS as e:
            logger.error(f"Failed to send password reset email to {user.email}: {str(e)}")
            # Vẫn trả về success để không reveal user exists

        return Response({"detail": self._GENERIC_MSG})


@extend_schema(responses=OpenApiTypes.OBJECT)
class ResetPasswordView(APIView):
    """
    POST /api/v1/auth/reset-password/
    Đặt mật khẩu mới bằng token từ email.
    """

    permission_classes = [AllowAny]
    throttle_classes = [PasswordResetRateThrottle]

    @extend_schema(request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT)
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token_value = serializer.validated_data["token"]
        new_password = serializer.validated_data["password"]

        try:
            token_obj = PasswordResetToken.objects.select_related("user").get(
                token=token_value, is_used=False
            )
        except PasswordResetToken.DoesNotExist:
            return Response(
                {"detail": "Token không hợp lệ hoặc đã được sử dụng."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if timezone.now() > token_obj.expires_at:
            return Response(
                {"detail": "Token đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu lần nữa."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = token_obj.user
        user.set_password(new_password)
        user.save(update_fields=["password"])

        token_obj.is_used = True
        token_obj.save(update_fields=["is_used"])

        return Response(
            {"detail": "Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập lại."}
        )


@extend_schema(responses=OpenApiTypes.OBJECT)
class ChangePasswordView(APIView):
    """
    PUT /api/v1/auth/change-password/
    Đổi mật khẩu khi đã đăng nhập – yêu cầu mật khẩu cũ.
    Sau khi đổi, tất cả session khác sẽ bị đăng xuất (refresh token cũ bị blacklist).
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT)
    def put(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        user = request.user
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])

        # Blacklist tất cả outstanding tokens còn hiệu lực để force logout ở các thiết bị khác
        outstanding = OutstandingToken.objects.filter(user=user, expires_at__gt=timezone.now())
        BlacklistedToken.objects.bulk_create(
            [BlacklistedToken(token=t) for t in outstanding],
            ignore_conflicts=True,
        )

        return Response({
            "detail": "Mật khẩu đã được thay đổi. Vui lòng đăng nhập lại trên tất cả các thiết bị."
        })


@extend_schema(responses=OpenApiTypes.OBJECT)
class MeView(APIView):
    """
    GET  /api/v1/auth/me/ – Lấy thông tin cá nhân
    PUT  /api/v1/auth/me/ – Cập nhật profile (full_name, avatar_url, notification_enabled)
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request):
        return Response(UserSerializer(request.user).data)

    @extend_schema(request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT)
    def put(self, request):
        serializer = UserSerializer(
            request.user, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# ══════════════════════════════════════════════════════════════════════════════
#  ADMIN
# ══════════════════════════════════════════════════════════════════════════════

class AdminUserListView(generics.ListAPIView):
    """GET /api/v1/auth/admin/users/ – Danh sách tất cả người dùng."""

    permission_classes = [IsAdmin]
    serializer_class = AdminUserSerializer

    def get_queryset(self):
        from django.db.models import Q
        qs = User.objects.all().order_by("-created_at")
        role = self.request.query_params.get("role")
        if role:
            qs = qs.filter(role=role)
        search = self.request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(email__icontains=search)
                | Q(full_name__icontains=search)
                | Q(username__icontains=search)
            )
        return qs

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        if isinstance(response.data, dict):
            response.data["current_user_id"] = request.user.id
        return response


class AdminUserUpdateView(generics.UpdateAPIView):
    """PATCH /api/v1/auth/admin/users/{id}/ – Cập nhật role / is_active."""

    permission_classes = [IsAdmin]
    serializer_class = AdminUserSerializer

    def get_queryset(self):
        return User.objects.all()

    def update(self, request, *args, **kwargs):
        target_user = self.get_object()
        if target_user.id == request.user.id:
            if "role" in request.data:
                return Response(
                    {"detail": "Bạn không thể tự thay đổi quyền của chính mình."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if "is_active" in request.data and request.data.get("is_active") in (False, "false", "False", 0, "0"):
                return Response(
                    {"detail": "Bạn không thể tự vô hiệu hóa tài khoản của chính mình."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        kwargs["partial"] = True
        return super().update(request, *args, **kwargs)


@extend_schema(responses=OpenApiTypes.OBJECT)
class AdminStatsView(APIView):
    """GET /api/v1/auth/admin/stats/ – Thống kê hệ thống."""

    permission_classes = [IsAdmin]

    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request):
        from django.utils import timezone
        from datetime import timedelta
        from apps.vocabulary.models import Word, WordSet
        from apps.learning.models import Lesson, ReviewLog
        from apps.quiz.models import QuizResult

        today = timezone.now().date()
        week_ago = timezone.now() - timedelta(days=7)

        return Response({
            "total_users":         User.objects.count(),
            "students":            User.objects.filter(role="user").count(),
            "admins":              User.objects.filter(role="admin").count(),
            "active_users":        User.objects.filter(is_active=True).count(),
            "inactive_users":      User.objects.filter(is_active=False).count(),
            "new_users_this_week": User.objects.filter(date_joined__gte=week_ago).count(),
            "total_words":         Word.objects.count(),
            "total_wordsets":      WordSet.objects.count(),
            "total_lessons":       Lesson.objects.count(),
            "published_lessons":   Lesson.objects.filter(is_published=True).count(),
            "total_reviews":       ReviewLog.objects.count(),
            "reviews_today":       ReviewLog.objects.filter(last_reviewed=today).count(),
            "total_quiz_results":  QuizResult.objects.count(),
        })
