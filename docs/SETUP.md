# Huong dan cai dat NoroStu

Tai lieu nay duoc viet bang text ASCII de tranh loi mojibake tren moi truong Windows.

## 1) Yeu cau he thong

### Cach A (khuyen nghi): Docker
- Docker Desktop 24+
- Docker Compose 2.20+
- Git

### Cach B (khong Docker)
- Python 3.11+
- Node.js 20+
- PostgreSQL 14+
- Redis 7+

Kiem tra nhanh:

```bash
docker --version
docker compose version
git --version
```

## 2) Clone du an

```bash
git clone https://github.com/huynhxuantinh/MNM_REPORT
cd MNM_REPORT
```

## 3) Tao file moi truong

```bash
# Linux/macOS
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

Bat buoc kiem tra cac bien trong `.env`:
- `SECRET_KEY`
- `DEBUG`
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`
- `REDIS_URL`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`
- `JWT_SIGNING_KEY`
- `VITE_API_BASE_URL`

## 4) Chay bang Docker

Khoi dong toan bo stack:

```bash
docker compose up -d
```

Kiem tra service:

```bash
docker compose ps
docker compose logs -f backend
```

Service chinh:
- `postgres`
- `redis`
- `backend`
- `celery_worker`
- `celery_beat`
- `frontend`

Nginx config luu y:
- Dev reverse proxy (neu dung): `nginx/nginx.conf`
- Production frontend Nginx (duoc copy trong Dockerfile.prod): `frontend/nginx.conf`
- Khong deploy production bang file `nginx/nginx.conf`.

## 5) Migrate va seed data

```bash
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py import_words data/words.csv
docker compose exec backend python manage.py seed_data
```

Neu can full catalog:

```bash
docker compose exec backend python manage.py seed_full_catalog --clear
```

## 6) URL truy cap

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000/api/v1/`
- Swagger: `http://localhost:8000/api/docs/`
- Django Admin: `http://localhost:8000/admin/`

Neu chay production compose (`docker-compose.prod.yml`):
- Frontend mac dinh: `http://localhost` (hoac `http://localhost:${FRONTEND_PORT}`)
- Frontend phuc vu bang `frontend/nginx.conf`

## 7) Chay thu cong (khong Docker)

### Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux/macOS
source .venv/bin/activate

pip install -r requirements/development.txt
python manage.py migrate
python manage.py import_words data/words.csv
python manage.py seed_data
python manage.py runserver
```

### Celery (mo them 2 terminal rieng)

```bash
cd backend
celery -A config.celery worker -l info
celery -A config.celery beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 8) Tai khoan mau

- Admin: `admin@norostu.com` / `Admin@2024!`
- Student: `student@norostu.com` / `Student@2024!`

## 9) Lenh hay dung

```bash
docker compose down
docker compose down -v
docker compose logs -f backend
docker compose exec backend python manage.py check
docker compose exec backend pytest apps -q
```

## 10) Loi thuong gap

### Backend khong len

```bash
docker compose logs -f backend
```

### Redis/Postgres loi ket noi

```bash
docker compose logs -f redis
docker compose logs -f postgres
```

### Port bi trung

```bash
# Windows
netstat -ano | findstr :8000
netstat -ano | findstr :5173

# Linux/macOS
lsof -i :8000
lsof -i :5173
```

### Reset toan bo du lieu local

```bash
docker compose down -v
docker compose up -d
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py seed_data
```
