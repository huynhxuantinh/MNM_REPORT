# MNM Learn English

Ứng dụng web học tiếng Anh theo mô hình self-learning (không giáo viên, không mua gói), tập trung vào:
- Học theo bài
- Ôn tập SRS (SM-2)
- Quiz luyện tập
- Theo dõi tiến trình cá nhân

## Mục lục
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Tính năng chính](#tính-năng-chính)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt và chạy local](#cài-đặt-và-chạy-local)
- [Celery](#celery)
- [Biến môi trường](#biến-môi-trường)
- [Tài khoản mẫu](#tài-khoản-mẫu)
- [API docs](#api-docs)
- [Chạy test](#chạy-test)
- [Trạng thái verify](#trạng-thái-verify)

---

## Công nghệ sử dụng
- Backend: Django + Django REST Framework
- Frontend: React + Vite
- State: Redux Toolkit + TanStack Query
- UI: Material UI (MUI)
- Database: PostgreSQL
- Cache/Queue: Redis + Celery
- Auth: JWT
- API schema: drf-spectacular (OpenAPI)

## Tính năng chính

### Người học
- Đăng ký, đăng nhập, xác thực email, quên mật khẩu
- Xem danh sách từ vựng theo cấp độ/chủ đề
- Học bài theo lesson session
- Ôn tập theo lịch SRS (SM-2)
- Làm quiz và xem kết quả
- Theo dõi XP, level, streak, tiến trình
- Nhận thông báo in-app

### Quản trị (admin)
- Quản lý người dùng
- Quản lý từ vựng
- Quản lý bài học
- Xem thống kê và lịch sử quiz

## Yêu cầu hệ thống

### Cách Docker (khuyến nghị)
- Docker Desktop >= 24
- Docker Compose >= 2.20

### Cách chạy thủ công
- Python 3.11+
- Node.js 20+
- PostgreSQL 14+
- Redis 7+

## Cài đặt và chạy local

### 1) Clone source
```bash
git clone <repository-url>
cd MNM_REPORT
```

### 2) Chuẩn bị môi trường
```bash
cp .env.example .env
# Sau đó điền các biến cần thiết trong .env
```

### Cách 1: Docker Compose

Chạy nhanh:
```bash
docker compose up -d
```

Lần đầu setup:
```bash
docker compose up -d
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py seed_data
```

URL mặc định:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api/v1/
- Swagger: http://localhost:8000/api/docs/
- Django Admin: http://localhost:8000/admin/

Dừng dịch vụ:
```bash
docker compose down
```

Reset toàn bộ dữ liệu local:
```bash
docker compose down -v
```

### Cách 2: Chạy thủ công

Backend:
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements/development.txt
python manage.py migrate
python manage.py seed_data
python manage.py runserver
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

## Celery

Chạy trong thư mục `backend/`:

Terminal 1:
```bash
celery -A celery worker -l info
```

Terminal 2:
```bash
celery -A celery beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

Chạy task thủ công:
```bash
celery -A celery call learning.send_review_reminders
```

## Biến môi trường

Các biến quan trọng trong `.env`:
- `SECRET_KEY`
- `DEBUG`
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`
- `REDIS_URL`
- `JWT_ACCESS_TOKEN_LIFETIME_MINUTES`
- `JWT_REFRESH_TOKEN_LIFETIME_DAYS`
- `EMAIL_HOST`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_PORT`, `EMAIL_USE_TLS`
- `CORS_ALLOWED_ORIGINS`
- `FRONTEND_URL`

Lưu ý bảo mật:
- Không commit `.env` lên git

## Tài khoản mẫu
Sau khi chạy `seed_data`:
- Admin: `admin@mnm.com` / `Admin@123456`
- Student: `student@mnm.com` / `Student@123456`

## API docs
- Swagger UI: http://localhost:8000/api/docs/
- ReDoc: http://localhost:8000/api/redoc/
- OpenAPI schema: http://localhost:8000/api/schema/

## Chạy test

Backend:
```bash
backend/.venv/Scripts/python -m pytest backend/apps -q
```

Frontend unit/integration:
```bash
cd frontend
npm run test -- --run
npm run lint
```

Frontend E2E (Cypress):
```bash
cd frontend
npm run cy:run
```

## Trạng thái verify

Kết quả verify gần nhất (2026-05-15):
- Backend test: `324 passed`
- Frontend test: `43 passed`
- Cypress E2E: `9 passed`

Đã xử lý:
- Lỗi Cypress do biến môi trường `ELECTRON_RUN_AS_NODE=1` (đã fix bằng wrapper script trước khi chạy Cypress).
- Warning deprecation `esbuild` khi chạy test frontend (đã xử lý cấu hình plugin Vite).
- README đã được dọn encoding UTF-8, bỏ toàn bộ đoạn mojibake.

## Frontend Test Gate (2026-05-16)

Lenh da chay:
- `npm run lint` -> PASS
- `npm run test -- --run` -> PASS (`43 passed`)
- `npm run build` -> PASS
- `npm run cy:run` -> FAIL

Chi tiet loi Cypress:
- App runtime error: `Element type is invalid ... Check the render method of SidebarContent`.
- Anh huong: `admin_flow.cy.js` fail 4/4 test, `learning_flow.cy.js` fail 5/5 test.
- Tong ket Cypress: `0 passing, 9 failing`.
