# API Reference (Short) - NoroStu

Base URL:
- `http://localhost:8000/api/v1`

Swagger:
- `http://localhost:8000/api/docs/` (enabled when `DEBUG=True` or `ENABLE_API_DOCS=True`)

## Auth (`/auth/`)
- `POST /register/`
- `POST /verify-email/`
- `POST /resend-verification/`
- `POST /login/`
- `POST /logout/`
- `POST /token/refresh/`
- `POST /forgot-password/`
- `POST /reset-password/`
- `POST /change-password/`
- `GET /me/`
- `GET /admin/users/`
- `PATCH /admin/users/{id}/`
- `GET /admin/stats/`

## Vocabulary (`/vocabulary/`)
- `GET /words/`
- `GET /words/{id}/`
- `POST /words/` (admin)
- `GET /sets/`
- `GET /sets/{id}/`
- `POST /sets/` (admin)
- `GET /bookmarks/`

## Learning - Learner Flow (`/learning/`)
- `GET /path/`
- `GET /placement/status/`
- `GET /placement/questions/`
- `POST /placement/submit/`
- `POST /placement/skip/`
- `POST /session/start/`
- `GET /session/recover/`
- `POST /session/{session_id}/resume/`
- `POST /session/{session_id}/switch-easy/`
- `GET /session/{session_id}/`
- `POST /session/{session_id}/answer/`
- `POST /session/{session_id}/finish/`
- `POST /session/{session_id}/quit/`
- `POST /checkpoint/start/`
- `POST /checkpoint/{session_id}/submit/`
- `GET /daily-goal/`
- `POST /daily-goal/claim/`
- `POST /streak-freeze/claim/`
- `GET /review/`
- `GET /review/summary/`
- `GET /review/history/`
- `POST /review/{word_id}/answer/`

## Learning - Management (`/learning/`)
- `GET|POST /lessons/`
- `GET|PATCH|DELETE /lessons/{id}/`
- `GET|POST /notifications/`
- `GET|PATCH|DELETE /notifications/{id}/`
- `GET /profile/stats/`
- `GET /leaderboard/`
- `GET /league/current/`
- `GET /kpi/baseline/`
- `GET /kpi/onboarding-funnel/`
- `GET|POST /admin/courses/`
- `GET|PATCH|DELETE /admin/courses/{id}/`
- `GET|POST /admin/units/`
- `GET|PATCH|DELETE /admin/units/{id}/`

## Quiz (`/quiz/`)
- `GET|POST /sessions/`
- `GET|PATCH|DELETE /sessions/{id}/`
- `POST /generate/`
- `POST /submit/`
- `GET /admin/results/`

Notes:
- This is a short route-level reference synced with current backend URL config.
- For full request/response schema, use Swagger.
