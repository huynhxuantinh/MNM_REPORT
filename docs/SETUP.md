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
git clone <your-repo-url>
cd <your-repo-folder>
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

Tao `SECRET_KEY` manh (toi thieu 50 ky tu, random) neu chua co:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

## 4) Chay bang Docker

Khoi dong toan bo stack:

```bash
docker compose -f deployment/docker/docker-compose.yml up -d
```

Kiem tra service:

```bash
docker compose -f deployment/docker/docker-compose.yml ps
docker compose -f deployment/docker/docker-compose.yml logs -f backend
```

Service chinh:
- `postgres`
- `redis`
- `backend`
- `celery_worker`
- `celery_beat`
- `frontend`

Frontend structure hien tai:
- `frontend/src/pages/auth/`
- `frontend/src/pages/public/`
- `frontend/src/pages/user/`
- `frontend/src/services/`

Nginx config luu y:
- Dev reverse proxy (neu dung): `deployment/nginx/nginx.conf`
- Production frontend Nginx (duoc copy trong Dockerfile.prod): `frontend/nginx.conf`
- Khong deploy production bang file `deployment/nginx/nginx.conf`.

## 5) Migrate va seed data

```bash
docker compose -f deployment/docker/docker-compose.yml exec backend python manage.py migrate
docker compose -f deployment/docker/docker-compose.yml exec backend python manage.py import_words database/seed/words.csv
docker compose -f deployment/docker/docker-compose.yml exec backend python manage.py seed_data
```

Neu can full catalog:

```bash
docker compose -f deployment/docker/docker-compose.yml exec backend python manage.py seed_full_catalog --clear
```

## 6) URL truy cap

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000/api/v1/`
- Swagger: `http://localhost:8000/api/docs/`
- Django Admin: `http://localhost:8000/admin/`

Neu chay production compose (`deployment/docker/docker-compose.prod.yml`):
- Chay bang lenh: `docker compose --env-file .env -f deployment/docker/docker-compose.prod.yml up -d --build`
- Frontend mac dinh: `http://localhost` (hoac `http://localhost:${FRONTEND_PROD_PORT}`)
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
python manage.py import_words database/seed/words.csv
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
docker compose -f deployment/docker/docker-compose.yml down
docker compose -f deployment/docker/docker-compose.yml down -v
docker compose -f deployment/docker/docker-compose.yml logs -f backend
docker compose -f deployment/docker/docker-compose.yml exec backend python manage.py check
docker compose -f deployment/docker/docker-compose.yml exec backend pytest apps -q
```

## 10) Loi thuong gap

### Backend khong len

```bash
docker compose -f deployment/docker/docker-compose.yml logs -f backend
```

### Redis/Postgres loi ket noi

```bash
docker compose -f deployment/docker/docker-compose.yml logs -f redis
docker compose -f deployment/docker/docker-compose.yml logs -f postgres
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
docker compose -f deployment/docker/docker-compose.yml down -v
docker compose -f deployment/docker/docker-compose.yml up -d
docker compose -f deployment/docker/docker-compose.yml exec backend python manage.py migrate
docker compose -f deployment/docker/docker-compose.yml exec backend python manage.py seed_data
```

Shortcut nhanh (legacy van dung):
```bash
docker compose up -d
```
docker compose -f deployment/docker/docker-compose.yml up -d
