"""
Celery tasks cho module learning.

Lịch chạy (cấu hình trong settings.CELERY_BEAT_SCHEDULE):
  send_review_reminders  — 20:00 mỗi ngày, nhắc học sinh ôn từ đến hạn
  send_assignment_digest — 08:00 mỗi ngày, nhắc bài sắp đến hạn
"""
from __future__ import annotations

from datetime import date, timedelta

from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings


@shared_task(name="learning.send_review_reminders")
def send_review_reminders() -> dict:
    """
    Tìm học sinh có từ đến hạn ôn hôm nay nhưng chưa ôn,
    tạo thông báo in-app và gửi email nhắc nhở.
    """
    from apps.accounts.models import User
    from apps.learning.models import Notification, ReviewLog

    today = date.today()

    # Học sinh có ReviewLog đến hạn hôm nay
    due_user_ids = (
        ReviewLog.objects
        .filter(next_review_date__lte=today)
        .values_list("user_id", flat=True)
        .distinct()
    )

    # Loại ra học sinh đã ôn hôm nay
    already_reviewed_ids = (
        ReviewLog.objects
        .filter(last_reviewed=today)
        .values_list("user_id", flat=True)
        .distinct()
    )

    pending_ids = set(due_user_ids) - set(already_reviewed_ids)
    if not pending_ids:
        return {"sent": 0}

    users = User.objects.filter(id__in=pending_ids, is_active=True)
    sent = 0

    for user in users:
        due_count = ReviewLog.objects.filter(
            user=user, next_review_date__lte=today
        ).count()

        # Thông báo in-app
        Notification.objects.create(
            user=user,
            type=Notification.Type.REMINDER,
            message=f"Bạn có {due_count} từ cần ôn tập hôm nay. Đừng bỏ lỡ streak của bạn!",
        )

        # Email (chỉ gửi nếu user có email)
        if user.email:
            try:
                send_mail(
                    subject="[MNM English] Nhắc nhở ôn tập từ vựng",
                    message=(
                        f"Xin chào {user.full_name or user.username},\n\n"
                        f"Bạn có {due_count} từ vựng cần ôn tập hôm nay.\n"
                        f"Hãy vào MNM English để ôn tập và giữ streak của bạn!\n\n"
                        f"Truy cập: {settings.FRONTEND_URL}/review\n\n"
                        f"Chúc bạn học tốt,\nĐội ngũ MNM English"
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=True,
                )
                sent += 1
            except Exception:
                pass

    return {"sent": sent, "users_notified": len(pending_ids)}


@shared_task(name="learning.send_assignment_digest")
def send_assignment_digest() -> dict:
    """
    Nhắc học sinh về bài tập sắp đến hạn trong 2 ngày tới.
    Chạy lúc 08:00 mỗi ngày.
    """
    from apps.learning.models import Assignment, Notification

    today = date.today()
    deadline = today + timedelta(days=2)

    # Bài tập chưa hoàn thành, hạn nộp trong 2 ngày
    upcoming = (
        Assignment.objects
        .filter(
            due_date__lte=deadline,
            due_date__gte=today,
            completed_at__isnull=True,
        )
        .select_related("student", "lesson")
    )

    notified = set()
    for assignment in upcoming:
        user = assignment.student
        if user.id in notified:
            continue

        days_left = (assignment.due_date - today).days
        label = "hôm nay" if days_left == 0 else f"trong {days_left} ngày"

        Notification.objects.create(
            user=user,
            type=Notification.Type.REMINDER,
            message=(
                f"Bài học "{assignment.lesson.title}" đến hạn {label}. "
                f"Hãy hoàn thành trước khi quá muộn!"
            ),
            related_id=assignment.lesson_id,
        )

        if user.email:
            try:
                send_mail(
                    subject="[MNM English] Nhắc nhở bài tập sắp đến hạn",
                    message=(
                        f"Xin chào {user.full_name or user.username},\n\n"
                        f"Bài học "{assignment.lesson.title}" sẽ đến hạn {label}.\n"
                        f"Hãy vào MNM English để hoàn thành bài tập!\n\n"
                        f"Truy cập: {settings.FRONTEND_URL}/learning\n\n"
                        f"Chúc bạn học tốt,\nĐội ngũ MNM English"
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=True,
                )
            except Exception:
                pass

        notified.add(user.id)

    return {"assignments_checked": upcoming.count(), "users_notified": len(notified)}
