# Hướng dẫn cấu hình và chạy MNM Learn English

## Mục lục

1. [Yêu cầu hệ thống](#1-yêu-cầu-hệ-thống)
2. [Lấy source code](#2-lấy-source-code)
3. [Cấu hình biến môi trường](#3-cấu-hình-biến-môi-trường)
4. [Cách 1 — Docker Compose (khuyến nghị)](#4-cách-1--docker-compose-khuyến-nghị)
5. [Cách 2 — Chạy thủ công (không có Docker)](#5-cách-2--chạy-thủ-công-không-có-docker)
6. [Cấu hình Email (Mailtrap)](#6-cấu-hình-email-mailtrap)
7. [Celery — Nhắc nhở tự động](#7-celery--nhắc-nhở-tự-động)
8. [Tài khoản mẫu](#8-tài-khoản-mẫu)
9. [Lệnh hữu ích](#9-lệnh-hữu-ích)
10. [Xử lý lỗi thường gặp](#10-xử-lý-lỗi-thường-gặp)

---

## 1. Yêu cầu hệ thống

### Cách Docker (khuyến nghị)

| Phần mềm | Phiên bản tối thiểu | Kiểm tra |
|---|---|---|
| Docker Desktop | 24+ | `docker --version` |
| Docker Compose | 2.20+ | `docker compose version` |

### Cách thủ công

| Phần mềm | Phiên bản | Kiểm tra |
|---|---|---|
| Python | 3.11+ | `python --version` |
| Node.js | 20+ | `node --version` |
| npm | 9+ | `npm --version` |
| PostgreSQL | 14+ | `psql --version` |
| Redis | 7+ | `redis-server --version` |

---

## 2. Lấy source code

```bash
git clone <repository-url>
cd MNM_REPORT
```

Cấu trúc thư mục chính:

```
MNM_REPORT/
├── backend/          # Django REST API
├── frontend/         # React + Vite
├── docs/             # Tài liệu (bạn đang đọc file này)
├── docker-compose.yml
├── Makefile
├── .env.example      # Mẫu biến môi trường
└── .env              # File thực (KHÔNG commit lên git)
```

---

## 3. Cấu hình biến môi trường

### Bước 1 — Tạo file `.env`

```bash
cp .env.example .env
```

### Bước 2 — Chỉnh sửa `.env`

Mở file `.env` và điền các giá trị. Dưới đây là giải thích chi tiết từng nhóm biến:

---

### Nhóm Django

```env
DJANGO_SETTINGS_MODULE=config.settings.development
SECRET_KEY=change-me-to-a-long-random-string-at-least-50-chars
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost,backend
FRONTEND_URL=http://localhost:5173
```

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `SECRET_KEY` | **Có** | Chuỗi ngẫu nhiên ≥ 50 ký tự. Dùng lệnh dưới để tạo |
| `DEBUG` | Không | `True` cho dev, **phải `False` trên production** |
| `ALLOWED_HOSTS` | Không | Danh sách host được phép, cách nhau bằng dấu phẩy |

**Tạo SECRET_KEY:**

```bash
python -c "import secrets; print(secrets.token_urlsafe(50))"
```

---

### Nhóm PostgreSQL

```env
DB_NAME=mnm_learnenglish
DB_USER=postgres
DB_PASSWORD=123321!@
DB_HOST=postgres        # Dùng "postgres" cho Docker, "localhost" cho thủ công
DB_PORT=5432
```

> **Lưu ý Docker:** `DB_HOST=postgres` — tên service trong `docker-compose.yml`.  
> **Chạy thủ công:** Đổi thành `DB_HOST=localhost`.

---

### Nhóm Redis

```env
REDIS_HOST=redis        # "redis" cho Docker, "localhost" cho thủ công
REDIS_PORT=6379
REDIS_PASSWORD=redispassword
REDIS_URL=redis://:redispassword@redis:6379/0
CELERY_BROKER_URL=redis://:redispassword@redis:6379/1
CELERY_RESULT_BACKEND=redis://:redispassword@redis:6379/2
```

> **Chạy thủ công:** Thay `redis` trong URL thành `localhost`:
> ```env
> REDIS_URL=redis://:redispassword@localhost:6379/0
> ```

---

### Nhóm JWT

```env
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=60
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7
JWT_SIGNING_KEY=change-me-to-another-random-secret-key
```

---

### Nhóm CORS

```env
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Thêm domain frontend nếu deploy lên server thật:

```env
CORS_ALLOWED_ORIGINS=http://localhost:5173,https://your-domain.com
```

---

### Nhóm Email

```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-mailtrap-user
EMAIL_HOST_PASSWORD=your-mailtrap-password
DEFAULT_FROM_EMAIL=MNM Learn English <noreply@mnm-english.com>
```

Xem chi tiết ở [Mục 6 — Cấu hình Email](#6-cấu-hình-email-mailtrap).

---

### Nhóm Frontend (Vite)

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_APP_NAME=MNM Learn English
VITE_APP_VERSION=1.0.0
```

---

## 4. Cách 1 — Docker Compose (khuyến nghị)

### Sơ đồ service

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  frontend   │    │   backend   │    │  postgres   │
│  React/Vite │───▶│   Django    │───▶│ PostgreSQL  │
│  :5173      │    │   :8000     │    │   :5432     │
└─────────────┘    └──────┬──────┘    └─────────────┘
                          │
                   ┌──────▼──────┐    ┌─────────────┐
                   │    redis    │◀───│celery-worker│
                   │   Redis     │    │celery-beat  │
                   │   :6379     │    └─────────────┘
                   └─────────────┘
```

### Lần đầu chạy

```bash
# 1. Khởi động toàn bộ service (chạy nền)
docker compose up -d

# 2. Kiểm tra tất cả service đang chạy
docker compose ps
```

Đợi ~30 giây để PostgreSQL và Redis khởi động hoàn toàn, sau đó:

```bash
# 3. Chạy database migration
docker compose exec backend python manage.py migrate

# 4. Tạo dữ liệu mẫu (200 từ vựng, 14 bài học, 3 tài khoản)
docker compose exec backend python manage.py seed_data
```

### Truy cập ứng dụng

| Dịch vụ | URL |
|---|---|
| **Frontend** | http://localhost:5173 |
| **Backend API** | http://localhost:8000/api/v1/ |
| **Swagger UI** | http://localhost:8000/api/docs/ |
| **ReDoc** | http://localhost:8000/api/redoc/ |
| **Django Admin** | http://localhost:8000/admin/ |

### Xem log realtime

```bash
# Tất cả service
docker compose logs -f

# Một service cụ thể
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f celery-worker
```

### Dừng service

```bash
# Dừng nhưng giữ dữ liệu (volumes)
docker compose down

# Dừng và xóa toàn bộ dữ liệu (reset hoàn toàn)
docker compose down -v
```

### Build lại sau khi thay đổi Dockerfile hoặc requirements

```bash
docker compose build --no-cache
docker compose up -d
```

---

## 5. Cách 2 — Chạy thủ công (không có Docker)

### Yêu cầu trước

Đảm bảo đã cài PostgreSQL và Redis, và đang chạy:

```bash
# PostgreSQL — tạo database
psql -U postgres -c "CREATE DATABASE mnm_learnenglish;"

# Redis — kiểm tra đang chạy
redis-cli ping   # phải trả về PONG
```

Chỉnh `.env`:
```env
DB_HOST=localhost
REDIS_URL=redis://:redispassword@localhost:6379/0
```

---

### 5.1 Backend (Django)

```bash
cd backend

# Tạo và kích hoạt virtualenv
python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux / macOS
source .venv/bin/activate

# Cài đặt dependencies
pip install -r requirements/development.txt

# Chạy migration
python manage.py migrate

# Tạo dữ liệu mẫu
python manage.py seed_data

# Khởi động dev server
python manage.py runserver
```

Backend chạy tại: **http://localhost:8000**

---

### 5.2 Frontend (React + Vite)

Mở terminal mới:

```bash
cd frontend

# Cài đặt packages
npm install

# Khởi động dev server
npm run dev
```

Frontend chạy tại: **http://localhost:5173**

Vite proxy tự động chuyển tiếp `/api/*` → `http://localhost:8000`.

---

### 5.3 Celery (tùy chọn — cần cho email nhắc nhở)

Mở 2 terminal khác trong thư mục `backend/`:

**Terminal 1 — Worker:**
```bash
cd backend
source .venv/bin/activate   # hoặc .venv\Scripts\activate (Windows)
celery -A celery worker -l info
```

**Terminal 2 — Beat scheduler:**
```bash
cd backend
source .venv/bin/activate
celery -A celery beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

> **Windows:** Celery worker trên Windows cần thêm cờ `-P solo`:
> ```bash
> celery -A celery worker -l info -P solo
> ```

---

## 6. Cấu hình Email (Mailtrap)

Dự án dùng **Mailtrap** để test email trong môi trường development (email không gửi thật, chỉ xuất hiện trong inbox sandbox).

### Đăng ký Mailtrap

1. Truy cập [https://mailtrap.io](https://mailtrap.io) → **Sign up** (miễn phí)
2. Vào **Email Testing** → **Inboxes** → chọn inbox mặc định
3. Chọn tab **SMTP Settings** → dropdown **Integration: Django**
4. Copy các giá trị vào `.env`:

```env
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USE_TLS=True
EMAIL_HOST_USER=<mailtrap-username>
EMAIL_HOST_PASSWORD=<mailtrap-password>
```

### Test gửi email thủ công

```bash
# Trong Django shell
python manage.py shell
>>> from django.core.mail import send_mail
>>> send_mail("Test", "Nội dung test", "from@example.com", ["to@example.com"])
```

Email sẽ xuất hiện trong inbox Mailtrap.

### Tắt email hoàn toàn (chỉ in ra console)

```env
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

---

## 7. Celery — Nhắc nhở tự động

Celery xử lý 2 tác vụ nền:

| Task | Lịch | Mô tả |
|---|---|---|
| `learning.send_review_reminders` | 20:00 hàng ngày | Nhắc học sinh có từ đến hạn chưa ôn |
| `learning.send_assignment_digest` | 08:00 hàng ngày | Nhắc bài tập sắp đến hạn (≤ 2 ngày) |

### Chạy thủ công (không cần đợi lịch)

```bash
# Trong container Docker
docker compose exec backend celery -A celery call learning.send_review_reminders
docker compose exec backend celery -A celery call learning.send_assignment_digest

# Chạy thủ công (không Docker)
cd backend && celery -A celery call learning.send_review_reminders
```

### Kiểm tra Celery đang hoạt động

```bash
# Xem worker đang chạy
docker compose exec backend celery -A celery inspect active

# Xem các task đã đăng ký
docker compose exec backend celery -A celery inspect registered

# Xóa toàn bộ task khỏi queue
docker compose exec backend celery -A celery purge
```

---

## 8. Tài khoản mẫu

Sau khi chạy `python manage.py seed_data`:

| Role | Email | Mật khẩu |
|---|---|---|
| **Admin** | admin@mnm.com | Admin@123456 |
| **Giáo viên** | teacher@mnm.com | Teacher@123456 |
| **Học sinh** | student@mnm.com | Student@123456 |

### Reset dữ liệu mẫu

```bash
# Docker
docker compose exec backend python manage.py seed_data --clear

# Thủ công
python manage.py seed_data --clear
```

Lệnh `--clear` xóa toàn bộ dữ liệu từ vựng, bài học, tài khoản mẫu rồi tạo lại từ đầu.

---

## 9. Lệnh hữu ích

### Makefile shortcuts

```bash
make up             # Khởi động tất cả service
make down           # Dừng tất cả service
make build          # Build lại Docker images
make logs           # Xem log realtime
make migrate        # Chạy migration
make seed           # Tạo dữ liệu mẫu
make shell-backend  # Vào Django shell
make shell-db       # Vào psql
make test-backend   # Chạy pytest
make test-frontend  # Chạy Vitest
```

### Django management commands

```bash
# Tạo superuser mới
docker compose exec backend python manage.py createsuperuser

# Chạy migration
docker compose exec backend python manage.py migrate

# Kiểm tra migration chưa apply
docker compose exec backend python manage.py showmigrations

# Export OpenAPI schema ra file
docker compose exec backend python manage.py spectacular --file schema.yml

# Xem tất cả URL patterns
docker compose exec backend python manage.py show_urls

# Xóa expired JWT tokens
docker compose exec backend python manage.py flushexpiredtokens
```

### Database

```bash
# Vào psql trong container
docker compose exec postgres psql -U postgres -d mnm_learnenglish

# Backup database
docker compose exec postgres pg_dump -U postgres mnm_learnenglish > backup.sql

# Restore database
docker compose exec -T postgres psql -U postgres mnm_learnenglish < backup.sql
```

### Frontend

```bash
# Dev server
npm run dev

# Build production
npm run build

# Preview bản build
npm run preview

# Kiểm tra lỗi ESLint
npm run lint

# Chạy unit tests (Vitest)
npm test

# Chạy E2E tests (Cypress — giao diện đồ họa)
npx cypress open

# Chạy E2E tests (Cypress — headless CI)
npx cypress run
```

### Backend tests

```bash
# Chạy toàn bộ test suite
cd backend && pytest

# Kèm coverage report
pytest --cov=apps --cov-report=term-missing

# Theo module
pytest apps/accounts/tests/ -v        # Auth
pytest apps/vocabulary/tests/ -v      # Từ vựng
pytest apps/learning/tests/ -v        # Learning, SRS, Assignment, Teacher, Tasks
pytest apps/quiz/tests/ -v            # Quiz API
```

---

## 10. Xử lý lỗi thường gặp

### ❌ `django.db.utils.OperationalError: could not connect to server`

**Nguyên nhân:** Backend khởi động trước khi PostgreSQL sẵn sàng.

**Giải pháp:**
```bash
# Đợi PostgreSQL healthy rồi mới chạy migration
docker compose ps     # kiểm tra cột STATUS
# Nếu postgres "healthy" rồi:
docker compose exec backend python manage.py migrate
```

---

### ❌ `redis.exceptions.ConnectionError: Error connecting to Redis`

**Nguyên nhân:** Redis chưa khởi động hoặc sai `REDIS_URL`.

**Kiểm tra:**
```bash
# Docker
docker compose logs redis

# Thủ công — kiểm tra Redis đang chạy
redis-cli ping   # phải trả về PONG

# Kiểm tra password đúng
redis-cli -a redispassword ping
```

**Sửa `.env`** — đảm bảo password trong URL khớp với `REDIS_PASSWORD`:
```env
REDIS_PASSWORD=redispassword
REDIS_URL=redis://:redispassword@redis:6379/0
```

---

### ❌ `ModuleNotFoundError: No module named 'xyz'`

**Nguyên nhân:** Chưa cài dependencies sau khi thêm package mới.

**Giải pháp:**
```bash
# Docker — rebuild image
docker compose build backend
docker compose up -d backend

# Thủ công
pip install -r requirements/development.txt
```

---

### ❌ Frontend báo `CORS error` hoặc `Network Error`

**Nguyên nhân:** `CORS_ALLOWED_ORIGINS` không bao gồm URL frontend, hoặc backend chưa chạy.

**Kiểm tra:**
1. Backend đang chạy tại http://localhost:8000
2. Trong `.env`: `CORS_ALLOWED_ORIGINS=http://localhost:5173`
3. Không có khoảng trắng dư trong giá trị

---

### ❌ `django.core.exceptions.ImproperlyConfigured: The SECRET_KEY setting must not be empty`

**Giải pháp:** File `.env` chưa được tạo hoặc `SECRET_KEY` bỏ trống.

```bash
cp .env.example .env
# Điền SECRET_KEY vào .env
python -c "import secrets; print(secrets.token_urlsafe(50))"
```

---

### ❌ Frontend Vite báo `502 Bad Gateway` khi gọi API

**Nguyên nhân:** Proxy Vite không kết nối được đến backend.

**Kiểm tra `vite.config.js`:**
```js
proxy: {
  "/api": {
    target: "http://localhost:8000",  // thủ công
    // hoặc "http://backend:8000"     // Docker
    changeOrigin: true,
  },
},
```

Khi chạy thủ công (không Docker), đảm bảo `VITE_API_BASE_URL=http://localhost:8000/api/v1` trong `.env`.

---

### ❌ Celery task không chạy / email không gửi

**Kiểm tra worker đang chạy:**
```bash
docker compose logs celery-worker
docker compose logs celery-beat
```

**Celery trên Windows bị lỗi `billiard`:**
```bash
celery -A celery worker -l info -P solo
```

**Kiểm tra task đã đăng ký:**
```bash
celery -A celery inspect registered
# Phải thấy: learning.send_review_reminders, learning.send_assignment_digest
```

---

### ❌ `Migration conflict` khi chạy `migrate`

```bash
# Xem trạng thái migration
python manage.py showmigrations

# Fake migration nếu DB đã có bảng nhưng migration chưa ghi nhận
python manage.py migrate --fake-initial

# Reset migration của một app (cẩn thận — xóa dữ liệu)
python manage.py migrate <app_name> zero
```

---

*Tài liệu này phản ánh trạng thái dự án tính đến phiên bản 1.1.0 (2026-05-01).*
