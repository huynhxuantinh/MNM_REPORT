"""API gui lai email xac thuc (resend verification email)."""

import logging
import smtplib
from datetime import timedelta

from django.core.mail import BadHeaderError
from django.utils import timezone
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import EmailVerificationToken, User
from .serializers import ForgotPasswordSerializer
from .throttles import RegisterRateThrottle, RegisterStrictRateThrottle
from .utils import generate_token, send_verification_email

logger = logging.getLogger(__name__)
MAIL_SEND_ERRORS = (smtplib.SMTPException, BadHeaderError, TimeoutError, OSError)
GENERIC_MSG = "Neu email ton tai va chua duoc xac thuc, ban se nhan duoc email trong vai phut."


@extend_schema(responses=OpenApiTypes.OBJECT)
class ResendVerificationEmailView(APIView):
    """
    POST /api/v1/auth/resend-verification/
    Gui lai email xac thuc cho user chua kich hoat.
    Gioi han cooldown 60 giay de tranh spam.
    """

    permission_classes = [AllowAny]
    throttle_classes = [RegisterRateThrottle, RegisterStrictRateThrottle]

    @extend_schema(request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT)
    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower()

        try:
            user = User.objects.get(email=email, is_active=False, email_verified=False)
        except User.DoesNotExist:
            return Response({"detail": GENERIC_MSG}, status=status.HTTP_200_OK)

        try:
            existing_token = user.email_verification
            time_since_last = timezone.now() - existing_token.created_at
            if time_since_last < timedelta(seconds=60):
                wait_seconds = 60 - int(time_since_last.total_seconds())
                return Response(
                    {"detail": f"Vui long doi {wait_seconds} giay truoc khi yeu cau gui lai."},
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )
            existing_token.delete()
        except User.email_verification.RelatedObjectDoesNotExist:
            pass

        token = generate_token()
        EmailVerificationToken.objects.create(
            user=user,
            token=token,
            expires_at=timezone.now() + timedelta(hours=24),
        )

        try:
            send_verification_email(user, token)
            logger.info("Resent verification email to %s", user.email)
        except MAIL_SEND_ERRORS as exc:
            # Keep generic response to avoid leaking system internals.
            logger.error("Failed to resend verification email to %s: %s", user.email, str(exc))

        return Response({"detail": GENERIC_MSG}, status=status.HTTP_200_OK)
