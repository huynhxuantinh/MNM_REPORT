import pytest
from django.utils import timezone

from apps.accounts.models import User
from apps.learning.models import (
    Course,
    ExperimentAssignment,
    ExperimentConfig,
    LeagueSeason,
    LeagueStanding,
    LearningSession,
    Unit,
)
from apps.learning.tasks import rebuild_weekly_league

pytestmark = pytest.mark.django_db


DAILY_GOAL_URL = "/api/v1/learning/daily-goal/"
LEAGUE_CURRENT_URL = "/api/v1/learning/league/current/"
LEADERBOARD_URL = "/api/v1/learning/leaderboard/"


@pytest.fixture
def unit_for_session():
    course = Course.objects.create(name="League Course", slug="league-course", is_active=True)
    return Unit.objects.create(
        course=course,
        title="League Unit",
        order_index=1,
        required_lessons_to_unlock=1,
        is_published=True,
    )


def test_daily_goal_experiment_assignment(sc, student):
    ExperimentConfig.objects.create(
        key="daily_goal_v1",
        is_active=True,
        variants=[
            {"name": "control", "weight": 1, "payload": {"target_minutes": 10, "reward_xp": 15}},
            {"name": "stretch", "weight": 1, "payload": {"target_minutes": 15, "reward_xp": 22}},
        ],
    )

    response = sc.get(DAILY_GOAL_URL)
    assert response.status_code == 200

    assignment = ExperimentAssignment.objects.filter(
        user=student, experiment_key="daily_goal_v1"
    ).first()
    assert assignment is not None
    assert response.data["experiments"]["daily_goal"] == assignment.variant_name
    assert response.data["target_minutes"] == assignment.variant_payload["target_minutes"]
    assert response.data["reward_xp"] == assignment.variant_payload["reward_xp"]


def test_hearts_experiment_applies_payload(sc):
    ExperimentConfig.objects.create(
        key="hearts_balance_v1",
        is_active=True,
        variants=[
            {
                "name": "fast_refill",
                "weight": 1,
                "payload": {"max_hearts": 3, "refill_interval_minutes": 120},
            }
        ],
    )

    response = sc.get(DAILY_GOAL_URL)
    assert response.status_code == 200
    assert response.data["experiments"]["hearts"] == "fast_refill"
    assert response.data["hearts"]["max"] == 3
    assert response.data["hearts"]["refill_interval_minutes"] == 120


def test_rebuild_weekly_league_creates_standings(student, lesson, unit_for_session):
    other = User.objects.create_user(
        username="league_other",
        email="league_other@test.com",
        password="Pass123!",
        is_active=True,
        email_verified=True,
        role=User.Role.USER,
    )
    now = timezone.now()
    LearningSession.objects.create(
        user=student,
        unit=unit_for_session,
        lesson=lesson,
        status=LearningSession.Status.COMPLETED,
        xp_earned=40,
        completed_at=now,
    )
    LearningSession.objects.create(
        user=other,
        unit=unit_for_session,
        lesson=lesson,
        status=LearningSession.Status.COMPLETED,
        xp_earned=20,
        completed_at=now,
    )

    result = rebuild_weekly_league()

    assert result["participants"] == 2
    season = LeagueSeason.objects.get(code=result["season_code"])
    top = list(LeagueStanding.objects.filter(season=season).order_by("rank"))
    assert top[0].user_id == student.id
    assert top[0].rank == 1
    assert top[1].user_id == other.id
    assert top[1].rank == 2


def test_league_current_endpoint_returns_payload(sc, student, lesson, unit_for_session):
    student.full_name = "Weekly Student"
    student.xp = 320
    student.is_active = True
    student.save(update_fields=["full_name", "xp", "is_active"])
    now = timezone.now()
    LearningSession.objects.create(
        user=student,
        unit=unit_for_session,
        lesson=lesson,
        status=LearningSession.Status.COMPLETED,
        xp_earned=30,
        completed_at=now,
    )
    rebuild_weekly_league()

    response = sc.get(LEAGUE_CURRENT_URL)
    assert response.status_code == 200
    assert response.data["season"] is not None
    assert isinstance(response.data["leaderboard"], list)
    assert response.data["me"] is not None
    top = response.data["leaderboard"][0]
    assert top["username"] == student.username
    assert top["level"] == student.level
    assert "streak" in top


def test_leaderboard_filters_inactive_users(sc, student):
    student.full_name = "Active Student"
    student.xp = 120
    student.is_active = True
    student.save(update_fields=["full_name", "xp", "is_active"])

    inactive = User.objects.create_user(
        username="inactive_top",
        email="inactive_top@test.com",
        password="Pass123!",
        full_name="Inactive Top",
        xp=999,
        is_active=False,
        email_verified=False,
        role=User.Role.USER,
    )

    response = sc.get(LEADERBOARD_URL)
    assert response.status_code == 200
    ids = [item["id"] for item in response.data]
    assert student.id in ids
    assert inactive.id not in ids


def test_leaderboard_cache_key_refreshes_after_xp_change(sc, student):
    student.full_name = "Cache Student"
    student.xp = 10
    student.is_active = True
    student.save(update_fields=["full_name", "xp", "is_active"])

    response1 = sc.get(LEADERBOARD_URL)
    assert response1.status_code == 200
    assert response1.data[0]["xp"] == 10

    student.xp = 25
    student.save(update_fields=["xp"])

    response2 = sc.get(LEADERBOARD_URL)
    assert response2.status_code == 200
    assert response2.data[0]["xp"] == 25
    assert response2.data[0]["username"] == student.username
