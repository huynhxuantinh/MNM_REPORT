# Lệnh Thường Dùng — MNM Learn English

> Cheat sheet nhanh cho các thao tác hàng ngày. Chi tiết đầy đủ xem [SETUP.md](./SETUP.md).

---

## Docker Compose

```bash
# Khởi động toàn bộ stack (lần đầu hoặc sau khi dừng)
docker compose up -d

# Dừng toàn bộ
docker compose down

# Dừng + xoá toàn bộ dữ liệu (reset hoàn toàn)
docker compose down -v

# Build lại image sau khi thay đổi Dockerfile / requirements
docker compose build --no-cache
docker compose up -d

# Xem log realtime
docker compose logs -f
docker compose logs -f backend
docker compose logs -f celery-worker

# Kiểm tra service đang chạy
docker compose ps
```

---

## Database & Migration

```bash
# Chạy migration (sau khi pull code mới hoặc thay đổi model)
docker compose exec backend python manage.py migrate

# Kiểm tra migration chưa apply
docker compose exec backend python manage.py showmigrations

# Fake migration nếu DB đã có bảng
docker compose exec backend python manage.py migrate --fake-initial

# Reset migration một app (cẩn thận — xoá dữ liệu)
docker compose exec backend python manage.py migrate <app_name> zero

# Vào psql
docker compose exec postgres psql -U postgres -d mnm_learnenglish

# Backup
docker compose exec postgres pg_dump -U postgres mnm_learnenglish > backup.sql

# Restore
docker compose exec -T postgres psql -U postgres mnm_learnenglish < backup.sql
```

---

## Seed & Dữ Liệu Mẫu

```bash
# Tạo dữ liệu mẫu (200 từ, 14 bài học, 3 tài khoản)
docker compose exec backend python manage.py seed_data

# Reset + tạo lại từ đầu
docker compose exec backend python manage.py seed_data --clear

# Reset chỉ mật khẩu tài khoản mẫu
docker compose exec backend python manage.py seed_data --reset-passwords

# Import từ vựng từ CSV (idempotent — bỏ qua từ đã tồn tại)
docker compose exec backend python manage.py import_words data/words.csv

# Import + ghi đè từ đã tồn tại
docker compose exec backend python manage.py import_words data/words.csv --update
```

---

## Tài Khoản Mẫu

| Role | Email | Mật khẩu |
|---|---|---|
| Admin | `admin@mnm.com` | `Admin@123456` |
| Giáo viên | `teacher@mnm.com` | `Teacher@123456` |
| Học sinh | `student@mnm.com` | `Student@123456` |

```bash
# Tạo superuser mới
docker compose exec backend python manage.py createsuperuser
```

---

## Backend (Django Shell)

```bash
# Vào Django shell
docker compose exec backend python manage.py shell

# Tạo SECRET_KEY mới (dùng cho .env)
python -c "import secrets; print(secrets.token_urlsafe(50))"

# Export OpenAPI schema
docker compose exec backend python manage.py spectacular --file schema.yml

# Xem tất cả URL patterns
docker compose exec backend python manage.py show_urls

# Xóa expired JWT tokens
docker compose exec backend python manage.py flushexpiredtokens
```

---

## Frontend (React + Vite)

```bash
cd frontend

# Cài packages
npm install

# Dev server
npm run dev

# Build production
npm run build

# Preview bản build
npm run preview

# Kiểm tra ESLint
npm run lint

# Unit tests (Vitest)
npm test

# E2E tests (Cypress UI)
npx cypress open

# E2E tests headless
npx cypress run
```

---

## Celery (Nhắc Nhở Tự Động)

```bash
# Chạy thủ công 1 lần (không cần beat scheduler)
docker compose exec backend celery -A celery call learning.send_review_reminders
docker compose exec backend celery -A celery call learning.send_assignment_digest

# Kiểm tra worker đang chạy
docker compose exec backend celery -A celery inspect active

# Kiểm tra task đã đăng ký
docker compose exec backend celery -A celery inspect registered

# Xóa toàn bộ task khỏi queue
docker compose exec backend celery -A celery purge
```

---

## Tests

### Backend (pytest)

```bash
cd backend

# Toàn bộ
docker compose exec backend pytest

# Theo module
pytest apps/accounts/tests/ -v        # Auth
pytest apps/vocabulary/tests/ -v      # Từ vựng
pytest apps/learning/tests/ -v        # Learning, SRS, Assignment, Teacher, Tasks
pytest apps/quiz/tests/ -v            # Quiz API

# Coverage
pytest --cov=apps --cov-report=term-missing
```

---

## Makefile Shortcuts

```bash
make up              # docker compose up -d
make down            # docker compose down
make build           # docker compose build
make logs            # docker compose logs -f
make migrate         # docker compose exec backend migrate
make seed            # docker compose exec backend seed_data
make shell-backend   # docker compose exec backend shell
make shell-db        # docker compose exec postgres psql
make test-backend    # docker compose exec backend pytest
make test-frontend   # cd frontend && npm test
```

---

## Git

```bash
# Xem file đã thay đổi so với HEAD
git diff --stat HEAD

# Revert file về HEAD (dùng khi sửa hỏng cần hoàn tác)
git checkout HEAD -- <file_path>

# Revert toàn bộ thư mục về HEAD
git checkout HEAD -- frontend/src/
```

---

## Kiểm Tra Lỗi Nhanh

| Triệu chứng | Kiểm tra | Lệnh |
|---|---|---|
| Backend không khởi động | PostgreSQL đã healthy? | `docker compose ps` |
| `CORS error` | Backend đang chạy? `.env` đúng? | `docker compose logs backend` |
| Font / encoding lỗi | File có dùng UTF-8? | `file -i <file>` (Linux) / kiểm tra BOM |
| `ModuleNotFoundError` | Rebuild image | `docker compose build backend && docker compose up -d` |
| Email không gửi | Worker + beat chạy chưa? | `docker compose logs celery-worker` |

---

*Tài liệu này phản ánh trạng thái dự án tính đến phiên bản 1.1.2 (2026-05-02).*
