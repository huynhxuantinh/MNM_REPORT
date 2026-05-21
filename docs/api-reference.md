# API Reference (Short) - NoroStu

Base URL:
- `http://localhost:8000/api/v1`

Swagger:
- `http://localhost:8000/api/docs/`

## Auth
- `POST /auth/register/`
- `POST /auth/login/`
- `POST /auth/refresh/`
- `POST /auth/logout/`
- `POST /auth/forgot-password/`
- `POST /auth/reset-password/`

## Vocabulary
- `GET /vocabulary/words/`
- `GET /vocabulary/words/{id}/`
- `GET /vocabulary/sets/`
- `POST /vocabulary/sets/import/` (admin)

## Learning
- `GET /learning/path/`
- `POST /learning/sessions/start/`
- `POST /learning/sessions/{id}/answer/`
- `POST /learning/sessions/{id}/finish/`
- `GET /learning/review/queue/`
- `POST /learning/review/submit/`
- `GET /learning/leaderboard/`

## Quiz
- `POST /quiz/generate/`
- `POST /quiz/submit/`
- `GET /quiz/history/`

## Admin
- `GET /admin/users/`
- `GET /admin/words/`
- `GET /admin/lessons/`
- `GET /admin/quizzes/`

Luu y:
- Tai lieu day du va schema request/response xem tren Swagger.