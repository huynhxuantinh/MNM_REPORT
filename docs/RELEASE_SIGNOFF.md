# RELEASE SIGN-OFF (Self-learning)

Date: `2026-06-04`
Scope: self-learning only (`no teacher flow`, `no payment/subscription flow` runtime)

## 1) Quality Gate
- Backend check: `python manage.py check` -> PASS (local app env)
- Backend test full: `pytest apps -q` -> `335 passed`
- Frontend lint: `npm run lint` -> PASS
- Frontend test: `npm run test -- --run` -> `39 passed`
- Frontend build: `npm run build` -> PASS
- E2E gate:
  - `learning_flow.cy.js` -> PASS
  - `admin_flow.cy.js` -> PASS

## 2) Production Docker Smoke
Command used:
```bash
docker compose -f deployment/docker/docker-compose.prod.yml down -v
docker compose -f deployment/docker/docker-compose.prod.yml up -d --build
```

Current result:
- `frontend` (nginx) -> UP on `http://localhost`
- `backend` -> healthy
- `postgres` -> UP
- `redis` -> UP
- `celery-worker` -> UP
- `celery-beat` -> UP

Note:
- Local prod smoke required `down -v` because the existing Postgres volume had old credentials and caused auth failure on first boot.
- After backend image rebuild, nginx frontend needed one restart to refresh upstream connection to backend.

## 3) Production API Smoke Result
Base URL tested: `http://localhost/api/v1`

### Student flow
- `POST /auth/login/` -> PASS (`student@norostu.com`)
- `GET /auth/me/` -> PASS
- `GET /learning/placement/status/` -> PASS
- `GET /learning/path/` -> PASS (`2 units`, `5 lessons`)
- `POST /learning/session/start/` -> PASS
- `GET /learning/session/{id}/` -> PASS
- `GET /learning/review/summary/` -> PASS
- `GET /learning/profile/stats/` -> PASS
- `GET /learning/notifications/` -> PASS
- `PUT /learning/notifications/read-all/` -> PASS
- `GET /vocabulary/sets/` -> PASS (`6 wordsets`)
- `GET /vocabulary/words/?page_size=1` -> PASS (`992 words`)
- `GET /quiz/generate/?lesson_id={lesson_id}&type=mc` -> PASS for all `5/5` seeded lessons

### Admin flow
- `POST /auth/login/` -> PASS (`admin@norostu.com`)
- `GET /auth/admin/stats/` -> PASS

### Data loaded in prod smoke DB
- Courses: `1`
- Units: `2`
- Unit lessons: `5`
- Lessons: `5`
- Words: `992`
- Wordsets: `6`

### Content verification
- Vietnamese text in seeded vocabulary is clean after reseed from host `database/seed/words.csv`
- Verified on:
  - learning session choices
  - quiz options
  - vocabulary definition payload

## 4) Remaining Note
Severity: `LOW`

- No release blocker was found in the current prod smoke pass.
- `seed_learning_path` was updated and re-verified: deleting all `UnitLesson` rows and re-running the command now recreates `5` links consistently.

## 5) Deploy Readiness Decision
- Backend owner: `______`
- Frontend owner: `______`
- QA owner: `______`
- Final decision: `GO`

Reason:
- Docker/prod smoke is verified.
- Core infra and main APIs are healthy.
- Learner-facing seeded Vietnamese content is clean after correct reseed.
- Quiz smoke now passes on all seeded lessons.

## 6) Follow-up After GO
1. Re-run prod smoke after any deploy-script changes
