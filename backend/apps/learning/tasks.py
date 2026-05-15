"""Celery tasks for learning module."""
from __future__ import annotations

from datetime import timedelta

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.db.models import Count, Sum
from django.utils import timezone


@shared_task(name="learning.send_review_reminders")
def send_review_reminders() -> dict:
    """Notify users with due review words (personalized by preferred hour)."""
    from apps.accounts.models import User
    from apps.learning.models import Notification, ReviewLog, UserReminderPreference

    today = timezone.localdate()
    current_hour = timezone.localtime().hour

    due_user_ids = (
        ReviewLog.objects
        .filter(next_review_date__lte=today)
        .values_list("user_id", flat=True)
        .distinct()
    )
    already_reviewed_ids = (
        ReviewLog.objects
        .filter(last_reviewed=today)
        .values_list("user_id", flat=True)
        .distinct()
    )
    pending_ids = set(due_user_ids) - set(already_reviewed_ids)
    if not pending_ids:
        return {"sent": 0, "users_notified": 0}

    users = User.objects.filter(
        id__in=pending_ids,
        is_active=True,
        notification_enabled=True,
    )
    sent = 0

    for user in users:
        pref = UserReminderPreference.objects.filter(user=user).only("preferred_hour").first()
        if pref and pref.preferred_hour is not None and pref.preferred_hour != current_hour:
            continue

        duplicate = Notification.objects.filter(
            user=user,
            type=Notification.Type.REMINDER,
            created_at__date=today,
            message__icontains="on tap",
        ).exists()
        if duplicate:
            continue

        due_count = ReviewLog.objects.filter(user=user, next_review_date__lte=today).count()
        Notification.objects.create(
            user=user,
            type=Notification.Type.REMINDER,
            message=f"Ban co {due_count} tu can on tap hom nay. Dung bo lo streak cua ban!",
        )

        if user.email:
            send_mail(
                subject="[MNM English] Nhac nho on tap tu vung",
                message=(
                    f"Xin chao {user.full_name or user.username},\n\n"
                    f"Ban co {due_count} tu vung can on tap hom nay.\n"
                    f"Truy cap: {settings.FRONTEND_URL}/review\n"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )
            sent += 1

    return {"sent": sent, "users_notified": sent}


@shared_task(name="learning.send_assignment_digest")
def send_assignment_digest() -> dict:
    """Daily reminder for assignments due in <=2 days."""
    from apps.learning.models import Assignment, Notification

    today = timezone.localdate()
    deadline = today + timedelta(days=2)

    upcoming = (
        Assignment.objects
        .filter(due_date__lte=deadline, due_date__gte=today, completed_at__isnull=True)
        .select_related("student", "lesson")
    )

    notified = set()
    for assignment in upcoming:
        user = assignment.student
        if user.id in notified:
            continue

        days_left = (assignment.due_date - today).days
        label = "hom nay" if days_left == 0 else f"trong {days_left} ngay"

        Notification.objects.create(
            user=user,
            type=Notification.Type.REMINDER,
            message=(
                f'Bai hoc "{assignment.lesson.title}" den han {label}. '
                "Hay hoan thanh truoc khi qua muon!"
            ),
            related_id=assignment.lesson_id,
        )

        if user.email and user.notification_enabled:
            send_mail(
                subject="[MNM English] Nhac nho bai tap sap den han",
                message=(
                    f"Xin chao {user.full_name or user.username},\n\n"
                    f'Bai hoc "{assignment.lesson.title}" se den han {label}.\n'
                    f"Truy cap: {settings.FRONTEND_URL}/learning\n"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )

        notified.add(user.id)

    return {"assignments_checked": upcoming.count(), "users_notified": len(notified)}


@shared_task(name="learning.send_daily_goal_reminders")
def send_daily_goal_reminders() -> dict:
    """Notify users who have not completed daily goal today."""
    from apps.accounts.models import User
    from apps.learning.models import DailyGoal, DailyGoalLog, Notification, UserReminderPreference

    today = timezone.localdate()
    current_hour = timezone.localtime().hour
    users = User.objects.filter(is_active=True, notification_enabled=True, role=User.Role.USER)
    reminded = 0

    for user in users:
        goal = DailyGoal.objects.filter(user=user, is_active=True).first()
        if not goal:
            continue

        pref = UserReminderPreference.objects.filter(user=user).only("preferred_hour").first()
        if pref and pref.preferred_hour is not None and pref.preferred_hour != current_hour:
            continue

        log = DailyGoalLog.objects.filter(user=user, goal_date=today).first()
        if log and log.is_achieved:
            continue

        duplicate = Notification.objects.filter(
            user=user,
            type=Notification.Type.REMINDER,
            created_at__date=today,
            message__icontains="daily goal",
        ).exists()
        if duplicate:
            continue

        studied = log.studied_minutes if log else 0
        Notification.objects.create(
            user=user,
            type=Notification.Type.REMINDER,
            message=(
                f"Daily goal {goal.target_minutes} phut: ban da hoc {studied} phut. "
                "Vao app hoan thanh muc tieu nhe!"
            ),
        )
        if user.email:
            send_mail(
                subject="[MNM English] Reminder daily goal",
                message=(
                    f"Xin chao {user.full_name or user.username},\n\n"
                    f"Ban dang co daily goal {goal.target_minutes} phut/ngay.\n"
                    f"Hien tai ban da hoc {studied} phut.\n"
                    f"Truy cap: {settings.FRONTEND_URL}/learning\n"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )
        reminded += 1

    return {"users_notified": reminded}


@shared_task(name="learning.send_onboarding_first_lesson_reminders")
def send_onboarding_first_lesson_reminders() -> dict:
    """Remind users who submitted placement >=24h ago but have not started first lesson."""
    from apps.accounts.models import User
    from apps.learning.models import LearningEvent, Notification

    now = timezone.now()
    cutoff = now - timedelta(hours=24)

    submit_events = (
        LearningEvent.objects
        .select_related("user")
        .filter(
            event_type=LearningEvent.EventType.ONBOARDING_STEP,
            meta__step="placement_submit",
            created_at__lte=cutoff,
            user__is_active=True,
            user__notification_enabled=True,
            user__role=User.Role.USER,
        )
        .order_by("user_id", "-created_at")
    )

    latest_submit_by_user: dict[int, LearningEvent] = {}
    for event in submit_events:
        if event.user_id not in latest_submit_by_user:
            latest_submit_by_user[event.user_id] = event

    users_notified = 0
    users_eligible = 0

    for user_id, submit_event in latest_submit_by_user.items():
        users_eligible += 1

        has_first_lesson = LearningEvent.objects.filter(
            user_id=user_id,
            event_type=LearningEvent.EventType.ONBOARDING_STEP,
            meta__step="first_lesson_start",
            created_at__gt=submit_event.created_at,
        ).exists()
        if has_first_lesson:
            continue

        already_reminded = LearningEvent.objects.filter(
            user_id=user_id,
            event_type=LearningEvent.EventType.ONBOARDING_STEP,
            meta__step="first_lesson_reminder_sent",
            meta__submit_event_id=submit_event.id,
        ).exists()
        if already_reminded:
            continue

        user = submit_event.user
        Notification.objects.create(
            user=user,
            type=Notification.Type.REMINDER,
            message="Ban da xep level xong. Bat dau bai hoc dau tien de mo streak ngay hom nay!",
        )
        if user.email:
            send_mail(
                subject="[MNM English] Bat dau bai hoc dau tien",
                message=(
                    f"Xin chao {user.full_name or user.username},\n\n"
                    "Ban da hoan thanh placement test nhung chua bat dau bai hoc dau tien.\n"
                    f"Vao ngay: {settings.FRONTEND_URL}/learning de tiep tuc nhe.\n"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )

        LearningEvent.objects.create(
            user=user,
            event_type=LearningEvent.EventType.ONBOARDING_STEP,
            meta={
                "step": "first_lesson_reminder_sent",
                "submit_event_id": submit_event.id,
                "submit_at": submit_event.created_at.isoformat(),
            },
        )
        users_notified += 1

    return {
        "users_eligible": users_eligible,
        "users_notified": users_notified,
    }


@shared_task(name="learning.refill_hearts")
def refill_hearts() -> dict:
    """Batch refill hearts for all users."""
    from apps.learning.models import HeartTransaction, UserHearts

    now = timezone.now()
    updated_users = 0
    total_refilled = 0

    for hearts in UserHearts.objects.all():
        if hearts.current_hearts >= hearts.max_hearts:
            continue
        interval_seconds = max(60, hearts.refill_interval_minutes * 60)
        elapsed_seconds = (now - hearts.last_refill_at).total_seconds()
        refill_units = int(elapsed_seconds // interval_seconds)
        if refill_units <= 0:
            continue

        refill_amount = min(refill_units, hearts.max_hearts - hearts.current_hearts)
        if refill_amount <= 0:
            continue

        hearts.current_hearts += refill_amount
        hearts.last_refill_at = hearts.last_refill_at + timedelta(seconds=interval_seconds * refill_units)
        hearts.save(update_fields=["current_hearts", "last_refill_at", "updated_at"])
        HeartTransaction.objects.create(
            hearts=hearts,
            transaction_type=HeartTransaction.TxType.REFILL,
            delta=refill_amount,
            reason="batch_refill",
        )
        updated_users += 1
        total_refilled += refill_amount

    return {"users_updated": updated_users, "hearts_refilled": total_refilled}


@shared_task(name="learning.rebuild_weekly_league")
def rebuild_weekly_league() -> dict:
    """Build weekly league standings snapshot from completed learning sessions."""
    from apps.accounts.models import User
    from apps.learning.models import LeagueSeason, LeagueStanding, LearningSession

    today = timezone.localdate()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)
    code = f"{week_start.isoformat()}_{week_end.isoformat()}"
    title = f"League {week_start.strftime('%d/%m')} - {week_end.strftime('%d/%m')}"

    season, created = LeagueSeason.objects.get_or_create(
        code=code,
        defaults={
            "title": title,
            "start_date": week_start,
            "end_date": week_end,
            "is_active": True,
        },
    )
    if not created and (
        season.start_date != week_start
        or season.end_date != week_end
        or season.title != title
        or not season.is_active
    ):
        season.start_date = week_start
        season.end_date = week_end
        season.title = title
        season.is_active = True
        season.save(update_fields=["title", "start_date", "end_date", "is_active"])

    LeagueSeason.objects.exclude(id=season.id).filter(is_active=True).update(is_active=False)

    aggregates = (
        LearningSession.objects.filter(
            status=LearningSession.Status.COMPLETED,
            completed_at__date__range=[week_start, week_end],
            user__role=User.Role.USER,
        )
        .values("user_id")
        .annotate(
            xp_earned=Sum("xp_earned"),
            sessions_completed=Count("id"),
        )
        .order_by("-xp_earned", "-sessions_completed", "user_id")
    )

    LeagueStanding.objects.filter(season=season).delete()
    standings = []
    rank = 1
    for row in aggregates:
        xp_earned = int(row.get("xp_earned") or 0)
        sessions_completed = int(row.get("sessions_completed") or 0)
        standings.append(
            LeagueStanding(
                season=season,
                user_id=row["user_id"],
                rank=rank,
                xp_earned=max(0, xp_earned),
                sessions_completed=max(0, sessions_completed),
            )
        )
        rank += 1

    if standings:
        LeagueStanding.objects.bulk_create(standings, batch_size=500)

    return {
        "season_code": season.code,
        "season_start": str(season.start_date),
        "season_end": str(season.end_date),
        "participants": len(standings),
    }
