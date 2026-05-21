# SETUP NoroStu

## 1) Prerequisites
- Docker Desktop 24+
- Docker Compose 2.20+

(Neu chay manual)
- Python 3.11+
- Node.js 20+
- PostgreSQL 14+
- Redis 7+

## 2) Tao file moi truong
```bash
cp .env.example .env
```

Chinh cac bien quan trong:
- `SECRET_KEY`
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`
- `REDIS_URL`
- `FRONTEND_URL`
- `DEFAULT_FROM_EMAIL`

## 3) Chay bang Docker (khuyen nghi)
```bash
docker compose up -d
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py import_words data/words.csv
docker compose exec backend python manage.py seed_data
```

## 4) Chay manual
Backend:
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements/development.txt
python manage.py migrate
python manage.py runserver
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

## 5) Celery
```bash
cd backend
celery -A celery worker -l info
celery -A celery beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

## 6) Tai khoan mau
- Admin: `admin@norostu.com` / `Admin@2024!`
- Student: `student@norostu.com` / `Student@2024!`

## 7) Troubleshooting nhanh
- Backend khong len: `docker compose logs -f backend`
- DB chua san sang: `docker compose ps`
- Frontend khong call API duoc: check `VITE_API_BASE_URL` va `FRONTEND_URL`