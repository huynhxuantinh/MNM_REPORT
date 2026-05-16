"""
API để gửi lại email xác thực (resend verification email).
"""
import logging
import smtplib
from datetime import timedelta

from django.core.mail import BadHeaderError
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema

from .models import EmailVerificationToken, User
from .serializers import ForgotPasswordSerializer
from .throttles import RegisterRateThrottle
from .utils import generate_token, send_verification_email

logger = logging.getLogger(__name__)
MAIL_SEND_ERRORS = (smtplib.SMTPException, BadHeaderError, TimeoutError, OSError)


@extend_schema(responses=OpenApiTypes.OBJECT)
class ResendVerificationEmailView(APIView):
    """
    POST /api/v1/auth/resend-verification/
    Gửi lại email xác thực cho user chưa kích hoạt.
    Giới hạn 1 lần/phút để tránh spam.
    """

    permission_classes = [AllowAny]
    throttle_classes = [RegisterRateThrottle]

    @extend_schema(request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT)
    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower()

        try:
            user = User.objects.get(email=email, is_active=False, email_verified=False)
        except User.DoesNotExist:
            # Trả về generic message để không reveal user status
            return Response(
                {"detail": "Nếu email tồn tại và chưa được xác thực, bạn sẽ nhận được email trong vài phút."},
                status=status.HTTP_200_OK,
            )

        # Kiểm tra cooldown (đợi ít nhất 60 giây từ lần gửi trước)
        try:
            existing_token = user.email_verification
            time_since_last = timezone.now() - existing_token.created_at
            if time_since_last < timedelta(seconds=60):
                return Response(
                    {"detail": f"Vui lòng đợi {60 - int(time_since_last.total_seconds())} giây trước khi yêu cầu gửi lại."},
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )
            # Xóa token cũ và tạo mới
            existing_token.delete()
        except User.email_verification.RelatedObjectDoesNotExist:
            pass  # Chưa có token, tạo mới

        # Tạo token mới và gửi email
        token = generate_token()
        EmailVerificationToken.objects.create(
            user=user,
            token=token,
            expires_at=timezone.now() + timedelta(hours=24),
        )

        try:
            send_verification_email(user, token)
            logger.info(f"Resent verification email to {user.email}")
        except MAIL_SEND_ERRORS as e:
            logger.error(f"Failed to resend verification email to {user.email}: {str(e)}")
            # Vẫn trả về success để không reveal lỗi

        return Response(
            {"detail": "Nếu email tồn tại và chưa được xác thực, bạn sẽ nhận được email trong vài phút."},
            status=status.HTTP_200_OK,
        )
