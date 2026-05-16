# RELEASE NOTES - SELF LEARNING (WEEK 1-4)

## Scope
- Onboarding recovery flow.
- Adaptive difficulty + frustration guard.
- Daily loop improvements (goal/reminder/hearts).
- KPI dashboard backend + frontend.

## Backend highlights
- Standardized payloads:
  - `/learning/placement/status/`
  - `/learning/session/recover/`
  - `/learning/session/{id}/resume/`
- Adaptive difficulty:
  - auto adjust by recent accuracy/response/wrong streak.
  - tracking keys: `difficulty_auto_adjust`, `switch_easy_mode`.
- Reminder/hearts hardening:
  - preferred hour fallback theo `last_activity_at`.
  - refill hearts boundary-safe.
- KPI endpoints:
  - `/learning/kpi/baseline/?range=7d|28d`
  - `/learning/kpi/onboarding-funnel/?range=7d|28d`
- Performance hardening:
  - cache short TTL cho leaderboard/league/kpi.
  - throttle scope `learning_analytics_read` cho endpoint analytics read.

## Frontend highlights
- Home/Learning pages: continue session + daily goal action cues.
- Learning session page: difficulty badge + auto-adjust hint.
- Admin dashboard: KPI cards + range filter 7d/28d.

## QA summary
- Backend: `332 passed` (previous full run).
- Frontend lint: `pass` (2026-05-16).
- Frontend unit: `43 passed` (2026-05-16).
- Frontend build: `pass` (2026-05-16).
- Cypress e2e: `9 passing, 0 failing` (re-run 2026-05-16).

## Deploy status (2026-05-16)
- Local Docker deploy: success (`backend`, `frontend`, `celery-worker`, `celery-beat`, `postgres`, `redis` all up).
- Learning migrations:
  - `0015_learningplan_paymentevent_learningsubscription_and_more`: migration state aligned.
  - `0016_remove_legacy_teacher_and_billing_models`: applied.

## Known follow-up
- Con tai lieu cu bi mojibake can cleanup encoding toan bo docs.
- Nen bo sung mobile bug-bash report thanh file rieng cho release tiep theo.
