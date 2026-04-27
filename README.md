# MNM Learn English

Ứng dụng web học từ vựng tiếng Anh theo phương pháp lặp lại ngắt quãng (Spaced Repetition System — SM-2). Người dùng học theo bài học được giáo viên thiết kế, ôn tập từ theo lịch SRS tự động, và theo dõi tiến trình qua bảng điều khiển cá nhân.

## Mục lục

- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt và chạy local](#cài-đặt-và-chạy-local)
  - [Cách 1: Docker Compose (khuyến nghị)](#cách-1-docker-compose-khuyến-nghị)
  - [Cách 2: Chạy thủ công](#cách-2-chạy-thủ-công)
- [Biến môi trường](#biến-môi-trường)
- [Tài khoản mẫu](#tài-khoản-mẫu)
- [API Documentation](#api-documentation)
- [Chạy test](#chạy-test)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Lệnh hữu ích](#lệnh-hữu-ích)

---

## Công nghệ sử dụng

| Lớp | Công nghệ | Phiên bản |
|---|---|---|
| Backend | Django + Django REST Framework | 4.2 / 3.15 |
| Frontend | React + Vite | 18 / 5 |
| State Management | Redux Toolkit + React Query | 2.x / 5.x |
| UI Library | Material UI (MUI) | 5.x |
| Database | PostgreSQL | 14 |
| Cache / Queue | Redis | 7 |
| Auth | JWT (djangorestframework-simplejwt) | 5.3 |
| API Docs | drf-spectacular (OpenAPI 3) | 0.27 |
| Container | Docker + Docker Compose | — |

---

## Yêu cầu hệ thống

**Cách Docker (khuyến nghị):**
- Docker Desktop >= 24
- Docker Compose >= 2.20

**Cách thủ công:**
- Python 3.11+
- Node.js 20+
- PostgreSQL 14+
- Redis 7+

---

## Cài đặt và chạy local

### Bước 1 — Lấy source code

```bash
git clone <repository-url>
cd MNM_REPORT
```

### Bước 2 — Chuẩn bị file môi trường

```bash
cp .env.example .env
```

Mở `.env` và điền các giá trị cần thiết (xem [Biến môi trường](#biến-môi-trường)). Các giá trị mặc định trong `.env.example` hoạt động ngay với Docker Compose mà không cần chỉnh sửa thêm.

---

### Cách 1: Docker Compose (khuyến nghị)

Khởi động toàn bộ stack (PostgreSQL + Redis + Backend + Frontend) bằng một lệnh:

```bash
docker compose up -d
```

Chờ khoảng 30–60 giây cho các service khởi động, sau đó import dữ liệu mẫu:

```bash
# Chạy migration
docker compose exec backend python manage.py migrate

# Import 500 từ vựng A1-B1
docker compose exec backend python manage.py import_words data/words.csv

# Tạo tài khoản và bài học mẫu
docker compose exec backend python manage.py seed_data
```

Ứng dụng chạy tại:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000/api/v1/
- **Swagger UI:** http://localhost:8000/api/docs/
- **Django Admin:** http://localhost:8000/admin/

Dừng tất cả service:

```bash
docker compose down
```

Dừng và xóa toàn bộ dữ liệu (volumes):

```bash
docker compose down -v
```

---

### Cách 2: Chạy thủ công

#### Backend

```bash
cd backend

# Tạo và kích hoạt virtualenv
python -m venv .venv
source .venv/bin/activate          # Linux/macOS
# .venv\Scripts\activate           # Windows

# Cài đặt dependencies
pip install -r requirements/development.txt

# Cấu hình biến môi trường
cp ../.env.example ../.env
# Sửa .env: đặt DB_HOST=localhost, REDIS_HOST=localhost

# Chạy migration
python manage.py migrate

# Import dữ liệu mẫu
python manage.py import_words data/words.csv
python manage.py seed_data

# Khởi động dev server
python manage.py runserver
```

Backend chạy tại http://localhost:8000

#### Frontend

Mở terminal mới:

```bash
cd frontend

# Cài đặt dependencies
npm install

# Khởi động dev server
npm run dev
```

Frontend chạy tại http://localhost:5173

---

## Biến môi trường

Tất cả cấu hình nằm trong file `.env` (sao chép từ `.env.example`). Các biến quan trọng:

| Biến | Mô tả | Giá trị mặc định |
|---|---|---|
| `SECRET_KEY` | Django secret key — **bắt buộc thay đổi trên production** | _(trống)_ |
| `DEBUG` | Chế độ debug | `True` |
| `DB_NAME` | Tên database | `mnm_learnenglish` |
| `DB_USER` | User PostgreSQL | `postgres` |
| `DB_PASSWORD` | Mật khẩu PostgreSQL | _(cần điền)_ |
| `DB_HOST` | Host PostgreSQL | `postgres` (Docker) / `localhost` (thủ công) |
| `REDIS_URL` | URL kết nối Redis | `redis://:password@redis:6379/0` |
| `JWT_ACCESS_TOKEN_LIFETIME_MINUTES` | Thời hạn access token | `60` |
| `JWT_REFRESH_TOKEN_LIFETIME_DAYS` | Thời hạn refresh token | `7` |
| `CORS_ALLOWED_ORIGINS` | Domain frontend được phép | `http://localhost:5173` |
| `VITE_API_BASE_URL` | URL API cho React | `http://localhost:8000/api/v1` |

> **Lưu ý bảo mật:** Không commit file `.env` lên git. File này đã có trong `.gitignore`.

---

## Tài khoản mẫu

Sau khi chạy `python manage.py seed_data`:

| Role | Email | Mật khẩu |
|---|---|---|
| Admin | admin@mnm-english.com | Admin@2024! |
| Teacher | teacher@mnm-english.com | Teacher@2024! |
| Student | student@mnm-english.com | Student@2024! |

---

## API Documentation

Swagger UI tự động sinh từ code, truy cập khi `DEBUG=True`:

- **Swagger UI:** http://localhost:8000/api/docs/
- **ReDoc:** http://localhost:8000/api/redoc/
- **OpenAPI JSON:** http://localhost:8000/api/schema/

Trên production, API docs bị ẩn mặc định. Bật lại bằng cách đặt `ENABLE_API_DOCS=True` trong `.env`.

Xem tài liệu API chi tiết tại [`docs/api-reference.md`](docs/api-reference.md).

---

## Chạy test

### Backend (pytest)

```bash
cd backend

# Toàn bộ test suite
pytest

# Với coverage report
pytest --cov=apps --cov-report=html
# Mở htmlcov/index.html để xem báo cáo

# Chỉ một module
pytest apps/accounts/tests/
pytest apps/vocabulary/tests/
pytest apps/learning/tests/
```

### Frontend (Vitest)

```bash
cd frontend

# Toàn bộ test
npm test

# Với coverage
npm run test:coverage

# E2E với Cypress
npm run cy:open    # giao diện đồ họa
npm run cy:run     # chạy headless
```

---

## Cấu trúc thư mục

```
MNM_REPORT/
├── backend/
│   ├── apps/
│   │   ├── accounts/          # Auth, User, JWT
│   │   │   ├── management/commands/seed_data.py
│   │   │   └── tests/
│   │   ├── vocabulary/        # Word, WordSet, Bookmark
│   │   │   ├── management/commands/import_words.py
│   │   │   └── tests/
│   │   ├── learning/          # Lesson, SRS Review, Assignment
│   │   │   └── tests/
│   │   └── quiz/              # Quiz, QuizResult
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py        # Cấu hình chung
│   │   │   ├── development.py
│   │   │   ├── test.py        # SQLite in-memory
│   │   │   └── production.py  # HTTPS, HSTS, S3
│   │   └── urls.py
│   ├── data/
│   │   └── words.csv          # 500 từ vựng A1-B1
│   ├── requirements/
│   │   ├── base.txt
│   │   ├── development.txt
│   │   └── production.txt
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── pages/             # Các trang React
│   │   ├── components/        # Layout, UI components
│   │   ├── store/             # Redux slices
│   │   └── App.jsx
│   ├── cypress/               # E2E tests
│   └── vite.config.js
├── docs/
│   └── api-reference.md       # Tài liệu API chi tiết
├── docker-compose.yml
├── Makefile                   # Lệnh tắt (make up, make migrate…)
├── .env.example
└── README.md
```

---

## Lệnh hữu ích

Sử dụng `Makefile` để tắt gõ lệnh dài:

```bash
make up              # Khởi động tất cả service
make down            # Dừng tất cả service
make build           # Build lại Docker images
make logs            # Xem log realtime
make migrate         # Chạy migrations
make shell-backend   # Vào Django shell
make shell-db        # Vào psql
```

Hoặc dùng trực tiếp với Docker:

```bash
# Xem log backend
docker compose logs -f backend

# Tạo superuser mới
docker compose exec backend python manage.py createsuperuser

# Reset mật khẩu tài khoản mẫu
docker compose exec backend python manage.py seed_data --reset-passwords

# Import lại từ vựng và cập nhật từ đã tồn tại
docker compose exec backend python manage.py import_words data/words.csv --update
```
