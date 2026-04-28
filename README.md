# MNM Learn English

Ứng dụng web học từ vựng tiếng Anh theo phương pháp lặp lại ngắt quãng (Spaced Repetition System — SM-2). Người dùng học theo bài học được giáo viên thiết kế, ôn tập từ theo lịch SRS tự động, kiểm tra trắc nghiệm, và theo dõi tiến trình qua bảng điều khiển cá nhân.

## Mục lục

- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Tính năng](#tính-năng)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt và chạy local](#cài-đặt-và-chạy-local)
  - [Cách 1: Docker Compose (khuyến nghị)](#cách-1-docker-compose-khuyến-nghị)
  - [Cách 2: Chạy thủ công](#cách-2-chạy-thủ-công)
- [Celery (email reminders)](#celery-email-reminders)
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
| State Management | Redux Toolkit + TanStack Query | 2.x / 5.x |
| UI Library | Material UI (MUI) | 5.x |
| Database | PostgreSQL | 14 |
| Cache | Redis | 7 |
| Task queue | Celery + django-celery-beat | 5.4 / 2.6 |
| Auth | JWT (djangorestframework-simplejwt) | 5.3 |
| API Docs | drf-spectacular (OpenAPI 3) | 0.27 |
| Container | Docker + Docker Compose | — |

---

## Tính năng

### Học sinh
- Đăng ký / đăng nhập / quên mật khẩu / xác thực email
- Duyệt từ vựng theo cấp độ (A1 → C1, TOEIC), bookmark, tìm kiếm, lọc
- **Học bài:** slideshow từ vựng + phát âm tự động (Web Speech API)
- **Ôn tập SRS:** flashcard đánh giá 6 mức chất lượng (thuật toán SM-2), lịch ôn tự động
- **Kiểm tra trắc nghiệm:** chọn bài → 10 câu MC → highlight đúng/sai → xem kết quả chi tiết
- Theo dõi XP, level, streak học hàng ngày, biểu đồ lịch sử ôn tập
- Thông báo in-app: lên cấp, streak milestone, bài được giao, nhắc ôn tập

### Giáo viên (portal riêng)
- Dashboard thống kê: số bài học, số bài giao, số học sinh
- Quản lý bài học: tạo / sửa / xóa / publish, thêm-xóa từ vựng trong bài
- Giao bài cho nhiều học sinh cùng lúc, đặt hạn nộp, thu hồi bài
- Danh sách học sinh: level, XP progress, số bài được giao, chi tiết tiến độ

### Admin
- Quản lý người dùng: tìm kiếm, đổi role, vô hiệu hoá tài khoản

### Hệ thống (Celery)
- Nhắc ôn từ đến hạn lúc 20:00 mỗi ngày (in-app notification + email)
- Nhắc bài tập sắp đến hạn lúc 08:00 mỗi ngày

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
# Mở .env và điền SECRET_KEY, DB_PASSWORD…
```

---

### Cách 1: Docker Compose (khuyến nghị)

```bash
docker compose up -d
```

Sau khi các service khởi động (~30s):

```bash
# Chạy migration
docker compose exec backend python manage.py migrate

# Seed 200 từ vựng, 14 bài học, 3 tài khoản mẫu
docker compose exec backend python manage.py seed_data
```

Ứng dụng chạy tại:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000/api/v1/
- **Swagger UI:** http://localhost:8000/api/docs/
- **Django Admin:** http://localhost:8000/admin/

```bash
docker compose down      # dừng service
docker compose down -v   # dừng + xoá volumes
```

---

### Cách 2: Chạy thủ công

#### Backend

```bash
cd backend

# Tạo và kích hoạt virtualenv
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Linux/macOS

# Cài đặt dependencies
pip install -r requirements/development.txt

# Chạy migration
python manage.py migrate

# Seed dữ liệu mẫu
python manage.py seed_data

# Khởi động dev server
python manage.py runserver
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Celery (email reminders)

Celery cần Redis đang chạy. Mở 2 terminal riêng trong thư mục `backend/`:

```bash
# Terminal 1 — Worker xử lý task
celery -A celery worker -l info

# Terminal 2 — Beat gửi task theo lịch
celery -A celery beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

| Task | Lịch | Mô tả |
|------|------|-------|
| `learning.send_review_reminders` | 20:00 hàng ngày | Nhắc học sinh có từ đến hạn chưa ôn |
| `learning.send_assignment_digest` | 08:00 hàng ngày | Nhắc bài tập sắp đến hạn (≤ 2 ngày) |

Chạy thủ công một lần (không cần beat):

```bash
celery -A celery call learning.send_review_reminders
celery -A celery call learning.send_assignment_digest
```

---

## Biến môi trường

| Biến | Mô tả | Mặc định |
|---|---|---|
| `SECRET_KEY` | Django secret key (**bắt buộc thay trên production**) | _(trống)_ |
| `DEBUG` | Chế độ debug | `True` |
| `DB_NAME` | Tên database PostgreSQL | `mnm_learnenglish` |
| `DB_USER` | User PostgreSQL | `postgres` |
| `DB_PASSWORD` | Mật khẩu PostgreSQL | _(cần điền)_ |
| `DB_HOST` | Host PostgreSQL | `postgres` (Docker) / `localhost` (thủ công) |
| `REDIS_URL` | URL kết nối Redis | `redis://redis:6379/0` |
| `JWT_ACCESS_TOKEN_LIFETIME_MINUTES` | Thời hạn access token | `60` |
| `JWT_REFRESH_TOKEN_LIFETIME_DAYS` | Thời hạn refresh token | `7` |
| `EMAIL_HOST` | SMTP server | `sandbox.smtp.mailtrap.io` |
| `EMAIL_HOST_USER` | SMTP user | _(trống)_ |
| `EMAIL_HOST_PASSWORD` | SMTP password | _(trống)_ |
| `CORS_ALLOWED_ORIGINS` | Domain frontend được phép | `http://localhost:5173` |
| `FRONTEND_URL` | URL frontend (dùng trong email) | `http://localhost:5173` |

> **Bảo mật:** Không commit `.env` lên git. File đã có trong `.gitignore`.

---

## Tài khoản mẫu

Sau khi chạy `python manage.py seed_data`:

| Role | Email | Mật khẩu |
|---|---|---|
| Admin | admin@mnm.com | Admin@123456 |
| Giáo viên | teacher@mnm.com | Teacher@123456 |
| Học sinh | student@mnm.com | Student@123456 |

Seed lại từ đầu (xoá dữ liệu cũ):

```bash
python manage.py seed_data --clear
```

---

## API Documentation

Swagger UI tự động sinh từ code, truy cập khi `DEBUG=True`:

- **Swagger UI:** http://localhost:8000/api/docs/
- **ReDoc:** http://localhost:8000/api/redoc/
- **OpenAPI schema:** http://localhost:8000/api/schema/

Trên production, docs bị ẩn mặc định. Bật lại: `ENABLE_API_DOCS=True` trong `.env`.

### Các endpoint chính

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/v1/auth/register/` | Đăng ký tài khoản |
| POST | `/api/v1/auth/login/` | Đăng nhập (JWT cookie) |
| POST | `/api/v1/auth/logout/` | Đăng xuất |
| POST | `/api/v1/auth/token/refresh/` | Làm mới access token |
| GET | `/api/v1/vocabulary/words/` | Danh sách từ (filter, search, paginate) |
| GET/POST | `/api/v1/learning/lessons/` | Danh sách / tạo bài học |
| GET | `/api/v1/learning/review/` | Từ đến hạn ôn (SRS queue) |
| POST | `/api/v1/learning/review/{id}/answer/` | Submit kết quả ôn (quality 0–5) |
| GET | `/api/v1/quiz/generate/?lesson_id=X` | Tạo 10 câu trắc nghiệm từ bài học |
| POST | `/api/v1/quiz/submit/` | Lưu kết quả quiz `{quiz_id, score, …}` |
| GET | `/api/v1/quiz/sessions/` | Lịch sử quiz của user |
| GET | `/api/v1/learning/teacher/stats/` | Thống kê tổng quan giáo viên |
| GET | `/api/v1/auth/teacher/students/` | Danh sách học sinh (teacher only) |

---

## Chạy test

### Backend (pytest)

```bash
cd backend

# Toàn bộ test suite
pytest

# Kèm coverage report
pytest --cov=apps --cov-report=term-missing

# Theo module
pytest apps/accounts/tests/ -v        # Auth
pytest apps/vocabulary/tests/ -v      # Từ vựng
pytest apps/learning/tests/ -v        # Learning (SM-2, SRS, Assignment, Teacher, Tasks)
pytest apps/quiz/tests/ -v            # Quiz API
```

### Frontend E2E (Cypress)

```bash
cd frontend
npx cypress open   # giao diện đồ họa
npx cypress run    # headless CI
```

---

## Cấu trúc thư mục

```
MNM_REPORT/
├── backend/
│   ├── apps/
│   │   ├── accounts/          # User, auth (register/login/JWT/reset-password/verify-email)
│   │   │   ├── management/commands/seed_data.py
│   │   │   ├── permissions.py  # IsAdmin, IsTeacherOrAdmin
│   │   │   └── tests/
│   │   ├── vocabulary/        # Word, WordSet, Bookmark, import CSV
│   │   │   └── tests/
│   │   ├── learning/          # Lesson, Assignment, ReviewLog (SM-2), UserStreak, Notification
│   │   │   ├── tasks.py       # Celery: nhắc ôn tập + nhắc bài tập
│   │   │   └── tests/         # test_sm2, test_review, test_assignment, test_teacher, test_tasks
│   │   └── quiz/              # Quiz, QuizResult, generate endpoint, submit endpoint
│   │       └── tests/
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py        # Cấu hình chung + Celery
│   │   │   ├── development.py
│   │   │   └── production.py
│   │   └── urls.py
│   ├── celery.py              # Celery app entry point
│   ├── requirements/
│   │   ├── base.txt           # Django, DRF, Celery, Redis…
│   │   ├── development.txt    # pytest, ipython…
│   │   └── production.txt
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── api/               # axiosClient, authApi, learningApi, quizApi, teacherApi, adminApi
│   │   ├── features/
│   │   │   ├── auth/          # authSlice (Redux)
│   │   │   └── teacher/       # TeacherDashboard, TeacherLessons, TeacherAssignments, TeacherStudents
│   │   ├── pages/             # HomePage, VocabularyPage, StudyPage, ReviewPage, QuizPage, ProfilePage…
│   │   ├── components/
│   │   │   ├── layout/        # MainLayout, TeacherLayout, Sidebar
│   │   │   └── ui/            # SbButton, SbCard, SbInput, SbAvatar…
│   │   └── styles/
│   │       └── theme.js       # Starbucks color tokens
│   ├── cypress/e2e/           # E2E tests (login → study → review → profile)
│   └── vite.config.js
├── docs/
├── docker-compose.yml
├── Makefile
├── CLAUDE.md
└── README.md
```

---

## Lệnh hữu ích

```bash
# Docker
make up              # Khởi động tất cả service
make down            # Dừng tất cả service
make logs            # Xem log realtime
make migrate         # Chạy migrations
make shell-backend   # Vào Django shell

# Backend (thủ công)
python manage.py seed_data --clear   # Reset + seed lại toàn bộ dữ liệu
python manage.py createsuperuser     # Tạo superuser mới
python manage.py spectacular --file schema.yml  # Export OpenAPI schema

# Celery
celery -A celery inspect active      # Xem task đang chạy
celery -A celery purge               # Xoá toàn bộ task khỏi queue
```
