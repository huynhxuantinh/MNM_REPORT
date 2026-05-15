# DUOLINGO PHASE 4 - DONE (core scope)

## Dot 1 - Tracking + KPI baseline (DONE)

- Them model event analytics:
  - `LearningEvent` (`session_start`, `answer_submit`, `session_finish`, `session_quit`, `checkpoint_submit`)
- Tracking da duoc cam vao flow:
  - `POST /learning/session/start/`
  - `POST /learning/session/{id}/answer/`
  - `POST /learning/session/{id}/finish/`
  - `POST /learning/session/{id}/quit/` (moi)
  - `POST /learning/checkpoint/{id}/submit/`
- KPI baseline API (teacher/admin):
  - `GET /learning/kpi/baseline/?days=7`
  - Output co: `dau`, `sessions_per_dau`, `avg_session_minutes`, `session_completion_rate`,
    `checkpoint_pass_rate`, `unit_completion_rate`, `daily_goal_achievement_rate`,
    `streak_continuation_rate`, `d1_retention_rate`, `d7_retention_rate`.

## Migration

- `learning.0009_learningevent` (da apply trong Docker).

## Verify

- `manage.py check`: pass
- `pytest apps/learning/tests/test_phase4_tracking.py apps/learning/tests/test_learning_path_session.py -q`: 10 passed
- `docker compose exec backend python manage.py migrate`: applied `0009_learningevent`

## Dot 2 - Hardening (DONE)

- Learning throttle classes:
  - `learning_session_start`
  - `learning_session_answer_burst`
  - `learning_session_answer_sustained`
  - `learning_session_finish`
  - `learning_session_quit`
  - `learning_checkpoint_start`
  - `learning_checkpoint_submit`
- Da cam throttle vao endpoints:
  - `POST /learning/session/start/`
  - `POST /learning/session/{id}/answer/`
  - `POST /learning/session/{id}/finish/`
  - `POST /learning/session/{id}/quit/`
  - `POST /learning/checkpoint/start/`
  - `POST /learning/checkpoint/{id}/submit/`
- Anti-cheat co ban trong answer flow:
  - Bat buoc tra loi dung thu tu step
  - Clamp `response_ms` o server
  - Danh dau suspicious neu tra loi qua nhanh (`too_fast_response`)
  - Giam `awarded_xp` ve `0` khi suspicious
  - Event metadata co them `suspicious`, `suspicious_flags`
- Test moi:
  - `apps/learning/tests/test_phase4_hardening.py`

## Verify Dot 2

- `docker compose exec backend pytest apps/learning/tests/test_phase4_hardening.py apps/learning/tests/test_phase4_tracking.py apps/learning/tests/test_learning_path_session.py -q`
- Ket qua: `13 passed`

## Tong ket trang thai

- Dot 1: DONE
- Dot 2: DONE
- Dot 3A: DONE core
- Dot 3B: DONE core
- Dot 3C: DONE core
- Dot 3D: DONE core

## Dot 3A - Placement + onboarding (DONE core)

- Backend model moi:
  - `PlacementResult`
- Placement APIs:
  - `GET /learning/placement/status/`
  - `GET /learning/placement/questions/`
  - `POST /learning/placement/submit/`
- Logic:
  - Sinh bo cau hoi placement (MC nghia tu)
  - Luu bo cau hoi tam trong cache (TTL 30 phut)
  - Cham diem + de xuat `recommended_level`
  - Luu ket qua vao `placement_results`
- Frontend:
  - Them man hinh `LearningPlacementPage`
  - Route: `/learning/placement`
  - Learning page hien CTA placement neu user chua lam

## Verify Dot 3A

- `docker compose exec backend python manage.py migrate learning`
  - apply: `learning.0010_placementresult`
- `docker compose exec backend pytest apps/learning/tests/test_phase4_placement.py apps/learning/tests/test_phase4_hardening.py apps/learning/tests/test_phase4_tracking.py apps/learning/tests/test_learning_path_session.py -q`
  - ket qua: `16 passed`

## Dot 3B - KPI dashboard UI + W4 retention (DONE core)

- Backend:
  - Them KPI `w4_retention_rate` vao `GET /learning/kpi/baseline/`
- Frontend:
  - Teacher dashboard hien thi block `Learning KPI Baseline`
  - Co switch moc thoi gian `7d / 28d / 56d`
  - Hien thi cac chi so chinh: `DAU`, `sessions_per_dau`, `session_completion_rate`,
    `checkpoint_pass_rate`, `d1_retention_rate`, `d7_retention_rate`, `w4_retention_rate`

## Verify Dot 3B

- `docker compose exec backend pytest apps/learning/tests/test_phase4_tracking.py apps/learning/tests/test_phase4_placement.py apps/learning/tests/test_phase4_hardening.py -q`
  - ket qua: `9 passed`

## Dot 3C - Listening exercise + metadata pipeline (DONE core)

- Backend listening exercise:
  - Them type `listen_choose_word` trong exercise engine
  - `to_client_exercise` tra them `audio_text`
  - `evaluate_exercise_answer` support listening option
- Frontend session UI:
  - Render bai listening trong `LearningSessionPage`
  - Nut `Play Audio` dung browser speech synthesis
- Metadata pipeline:
  - Them metadata lesson: `topic`, `skill_tag`, `content_difficulty`
  - Them command chuan hoa metadata:
    - `python manage.py normalize_learning_metadata`
- Tests:
  - `test_phase4_listening_metadata.py` (listening engine + metadata command)
  - Update test session/checkpoint de support exercise listening

## Verify Dot 3C

- `docker compose exec backend python manage.py migrate learning`
  - apply: `learning.0011_lesson_content_difficulty_lesson_skill_tag_and_more`
- `docker compose exec backend pytest apps/learning/tests/test_phase4_listening_metadata.py apps/learning/tests/test_phase4_placement.py apps/learning/tests/test_phase4_hardening.py apps/learning/tests/test_phase4_tracking.py apps/learning/tests/test_learning_path_session.py -q`
  - ket qua: `18 passed`

## Dot 3D - A/B framework + league batch (DONE core)

- A/B test framework:
  - Model `ExperimentConfig` (config theo `key`, `variants`, `is_active`)
  - Model `ExperimentAssignment` (persist assignment user -> variant)
  - Support metric split qua `LearningEvent.event_type = experiment_metric`
  - Cac diem da cam metric:
    - claim daily goal (`daily_goal_v1`)
    - heart consume (`hearts_balance_v1`)
- League batch:
  - Model `LeagueSeason` + `LeagueStanding`
  - Celery task: `learning.rebuild_weekly_league`
  - Beat schedule:
    - `rebuild-weekly-league-daily` (00:10 ICT)
  - API moi:
    - `GET /learning/league/current/` (season + top + rank current user)

## Verify Dot 3D

- `docker compose exec backend python manage.py migrate learning`
  - apply: `learning.0012_experimentassignment_experimentconfig_leagueseason_and_more`
- `docker compose exec backend pytest apps/learning/tests/test_phase4_experiment_league.py apps/learning/tests/test_phase4_listening_metadata.py apps/learning/tests/test_phase4_placement.py apps/learning/tests/test_phase4_hardening.py apps/learning/tests/test_phase4_tracking.py apps/learning/tests/test_learning_path_session.py -q`
  - ket qua: `22 passed`
