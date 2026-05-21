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

## Chay nhanh bang Docker
```bash
docker compose up -d
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py import_words data/words.csv
docker compose exec backend python manage.py seed_data
```

Neu muon seed full catalog (200 words, 14 lessons):
```bash
docker compose exec backend python manage.py seed_full_catalog --clear
```

## URL mac dinh
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api/v1/
- Swagger: http://localhost:8000/api/docs/
- Django Admin: http://localhost:8000/admin/

## Tai khoan mau
- Admin: `admin@norostu.com` / `Admin@2024!`
- Student: `student@norostu.com` / `Student@2024!`

## Test gate (latest)
- Backend: `335 passed`
- Frontend unit/integration: `43 passed`
- Cypress E2E: `9 passed`
- Date: `2026-05-21`

## Tai lieu
- Setup: [docs/SETUP.md](docs/SETUP.md)
- Commands: [docs/COMMANDS.md](docs/COMMANDS.md)
- API reference: [docs/api-reference.md](docs/api-reference.md)