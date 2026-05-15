"""A/B experiment helpers for learning module."""
from __future__ import annotations

import hashlib

from django.utils import timezone

from .models import DailyGoal, ExperimentAssignment, ExperimentConfig, LearningEvent, UserHearts

DAILY_GOAL_EXPERIMENT_KEY = "daily_goal_v1"
HEARTS_EXPERIMENT_KEY = "hearts_balance_v1"


def _pick_variant(user_id: int, experiment_key: str, variants: list[dict]) -> tuple[str, dict]:
    normalized = []
    total_weight = 0
    for item in variants:
        name = str(item.get("name") or "").strip()
        if not name:
            continue
        weight = int(item.get("weight") or 1)
        if weight <= 0:
            continue
        payload = item.get("payload") if isinstance(item.get("payload"), dict) else {}
        normalized.append((name, weight, payload))
        total_weight += weight

    if not normalized:
        return "control", {}

    key = f"{user_id}:{experiment_key}".encode("utf-8")
    bucket = int(hashlib.md5(key).hexdigest(), 16) % total_weight
    cursor = 0
    for name, weight, payload in normalized:
        cursor += weight
        if bucket < cursor:
            return name, payload
    return normalized[-1][0], normalized[-1][2]


def get_or_assign_experiment(user, experiment_key: str) -> ExperimentAssignment | None:
    assignment = ExperimentAssignment.objects.filter(
        user=user, experiment_key=experiment_key
    ).first()
    if assignment:
        return assignment

    config = ExperimentConfig.objects.filter(
        key=experiment_key,
        is_active=True,
    ).first()
    if not config:
        return None

    variant_name, payload = _pick_variant(user.id, experiment_key, config.variants or [])
    return ExperimentAssignment.objects.create(
        user=user,
        experiment=config,
        experiment_key=experiment_key,
        variant_name=variant_name,
        variant_payload=payload,
    )


def apply_daily_goal_experiment(user, goal: DailyGoal) -> ExperimentAssignment | None:
    assignment = get_or_assign_experiment(user, DAILY_GOAL_EXPERIMENT_KEY)
    if not assignment:
        return None

    payload = assignment.variant_payload or {}
    target_minutes = payload.get("target_minutes")
    reward_xp = payload.get("reward_xp")
    update_fields = []

    if isinstance(target_minutes, int) and target_minutes > 0 and goal.target_minutes != target_minutes:
        goal.target_minutes = target_minutes
        update_fields.append("target_minutes")

    if isinstance(reward_xp, int) and reward_xp > 0 and goal.reward_xp != reward_xp:
        goal.reward_xp = reward_xp
        update_fields.append("reward_xp")

    if update_fields:
        update_fields.append("updated_at")
        goal.save(update_fields=update_fields)
    return assignment


def apply_hearts_experiment(user, hearts: UserHearts) -> ExperimentAssignment | None:
    assignment = get_or_assign_experiment(user, HEARTS_EXPERIMENT_KEY)
    if not assignment:
        return None

    payload = assignment.variant_payload or {}
    max_hearts = payload.get("max_hearts")
    refill_interval_minutes = payload.get("refill_interval_minutes")
    update_fields = []

    if isinstance(max_hearts, int) and max_hearts > 0 and hearts.max_hearts != max_hearts:
        hearts.max_hearts = max_hearts
        hearts.current_hearts = min(hearts.current_hearts, max_hearts)
        update_fields.extend(["max_hearts", "current_hearts"])

    if (
        isinstance(refill_interval_minutes, int)
        and refill_interval_minutes > 0
        and hearts.refill_interval_minutes != refill_interval_minutes
    ):
        hearts.refill_interval_minutes = refill_interval_minutes
        update_fields.append("refill_interval_minutes")

    if hearts.last_refill_at is None:
        hearts.last_refill_at = timezone.now()
        update_fields.append("last_refill_at")

    if update_fields:
        update_fields.append("updated_at")
        hearts.save(update_fields=update_fields)
    return assignment


def track_experiment_metric(user, experiment_key: str, metric_key: str, metric_value: int = 1, meta=None) -> None:
    assignment = get_or_assign_experiment(user, experiment_key)
    if not assignment:
        return
    payload = {
        "experiment_key": experiment_key,
        "variant": assignment.variant_name,
        "metric_key": metric_key,
        "metric_value": metric_value,
    }
    if meta:
        payload["extra"] = meta
    LearningEvent.objects.create(
        user=user,
        event_type=LearningEvent.EventType.EXPERIMENT_METRIC,
        meta=payload,
    )
