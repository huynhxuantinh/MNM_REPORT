# NoroStu

Nen tang web hoc tieng Anh theo mo hinh self-learning (khong teacher, khong mua goi).

## Chuc nang chinh
- Hoc theo lesson session
- On tap SRS (SM-2)
- Quiz luyen tap
- Theo doi XP, level, streak, thong bao
- Quan tri noi dung (admin)

## Cong nghe
- Backend: Django + DRF
- Frontend: React + Vite
- DB: PostgreSQL
- Cache/Queue: Redis + Celery
- Auth: JWT

## Frontend structure
- Auth pages: `frontend/src/pages/auth/`
- Public pages: `frontend/src/pages/public/`
- User pages: `frontend/src/pages/user/`
- API client/services: `frontend/src/services/`

## Chay nhanh bang Docker
```bash
docker compose up -d
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py import_words database/seed/words.csv
docker compose exec backend python manage.py seed_data
```

Neu muon seed full catalog (200 words, 14 lessons):
```bash
docker compose exec backend python manage.py seed_full_catalog --clear
```

## Deployment structure
- Docker compose (dev): `docker-compose.yml` (repo root)
- Docker compose (prod): `docker-compose.prod.yml` (repo root)
- Nginx reverse proxy: `nginx/`

## URL mac dinh
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api/v1/
- Swagger: http://localhost:8000/api/docs/
- Django Admin: http://localhost:8000/admin/

## Tai khoan mau
- Admin: `admin@norostu.com` / `Admin@2024!`
- Student: `student@norostu.com` / `Student@2024!`

## Test gate (latest)
- Backend: `335 passed` (verified `2026-06-03`)
- Frontend unit/integration: `39 passed` (verified `2026-06-03`)
- Frontend lint: `PASS` (verified `2026-06-03`)
- Frontend build: `PASS` (verified `2026-06-03`)
- Cypress E2E: last captured green evidence `9 passed` (`2026-05-21`)

## Release status
- Local quality gate: `PASS`
- Deploy gate via Docker/production smoke: `PENDING`
- Current production decision: `NO-GO` until Docker stack is up and smoke test is re-run

## Tai lieu
- Setup: [docs/SETUP.md](docs/SETUP.md)
- Commands: [docs/COMMANDS.md](docs/COMMANDS.md)
- API reference: [docs/api-reference.md](docs/api-reference.md)
- Operations: [docs/OPERATIONS.md](docs/OPERATIONS.md)
- Release sign-off: [docs/RELEASE_SIGNOFF.md](docs/RELEASE_SIGNOFF.md)

## Project summary

### Product scope
NoroStu la web hoc tieng Anh theo huong self-learning.

Core flow:
1. Dang ky / dang nhap
2. Hoc lesson
3. On tap SRS
4. Lam quiz
5. Theo doi tien trinh

### Current source structure
- Frontend pages:
  - `frontend/src/pages/auth/`
  - `frontend/src/pages/public/`
  - `frontend/src/pages/user/`
- Frontend API layer:
  - `frontend/src/services/`
- Backend core apps:
  - `backend/apps/accounts/`
  - `backend/apps/vocabulary/`
  - `backend/apps/quiz/`
  - `backend/apps/learning/`
