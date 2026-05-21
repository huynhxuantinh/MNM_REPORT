# Hướng dẫn cài đặt NoroStu từ đầu

## Mục lục
1. [Yêu cầu hệ thống](#1-yêu-cầu-hệ-thống)
2. [Cài đặt Docker Desktop](#2-cài-đặt-docker-desktop)
3. [Clone dự án](#3-clone-dự-án)
4. [Cấu hình môi trường](#4-cấu-hình-môi-trường)
5. [Chạy bằng Docker (khuyến nghị)](#5-chạy-bằng-docker-khuyến-nghị)
6. [Seed dữ liệu mẫu](#6-seed-dữ-liệu-mẫu)
7. [Kiểm tra hệ thống](#7-kiểm-tra-hệ-thống)
8. [Chạy thủ công (không Docker)](#8-chạy-thủ-công-không-docker)
9. [Tài khoản mẫu](#9-tài-khoản-mẫu)
10. [Quản lý services](#10-quản-lý-services)
11. [Xử lý lỗi thường gặp](#11-xử-lý-lỗi-thường-gặp)

---

## 1. Yêu cầu hệ thống

### Cách A — Chạy bằng Docker (khuyến nghị)
| Công cụ | Phiên bản tối thiểu | Link tải |
|---|---|---|
| Docker Desktop | 24+ | https://www.docker.com/products/docker-desktop |
| Docker Compose | 2.20+ | Đi kèm Docker Desktop |
| Git | bất kỳ | https://git-scm.com |

### Cách B — Chạy thủ công
| Công cụ | Phiên bản tối thiểu |
|---|---|
| Python | 3.11+ |
| Node.js | 20+ |
| PostgreSQL | 14+ |
| Redis | 7+ |
| Git | bất kỳ |

Kiểm tra đã cài chưa:
```bash
docker --version
docker compose version
git --version
```

---

## 2. Cài đặt Docker Desktop

> Bỏ qua nếu đã có Docker. Kiểm tra: `docker --version`

### Windows

1. Tải Docker Desktop tại: https://www.docker.com/products/docker-desktop
2. Chạy file `.exe` vừa tải, làm theo hướng dẫn cài đặt
3. Khi được hỏi, chọn **Use WSL 2 instead of Hyper-V** (khuyến nghị)
4. Khởi động lại máy nếu được yêu cầu
5. Mở Docker Desktop, chờ icon ở thanh taskbar chuyển sang **xanh** (Running)

> **Lưu ý Windows:** Nếu WSL2 chưa được cài, mở PowerShell với quyền Administrator và chạy:
> ```powershell
> wsl --install
> ```
> Khởi động lại máy, sau đó cài Docker Desktop.

### macOS

1. Tải Docker Desktop tại: https://www.docker.com/products/docker-desktop
   - **Mac chip Apple (M1/M2/M3):** chọn bản **Apple Silicon**
   - **Mac chip Intel:** chọn bản **Intel Chip**
2. Mở file `.dmg`, kéo Docker vào thư mục Applications
3. Mở Docker từ Applications, cho phép khi được hỏi quyền truy cập
4. Chờ icon Docker ở menu bar chuyển sang **xanh** (Running)

### Linux (Ubuntu/Debian)

```bash
# Gỡ phiên bản cũ nếu có
sudo apt remove docker docker-engine docker.io containerd runc

# Cài dependencies
sudo apt update
sudo apt install -y ca-certificates curl gnupg

# Thêm GPG key của Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Thêm repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Cài Docker Engine + Compose
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Cho phép chạy Docker không cần sudo
sudo usermod -aG docker $USER
newgrp docker
```

### Kiểm tra cài đặt thành công

```bash
docker --version
# Docker version 24.x.x

docker compose version
# Docker Compose version v2.x.x

docker run hello-world
# Nếu thấy "Hello from Docker!" là thành công
```

---

## 3. Clone dự án

```bash
git clone <https://github.com/huynhxuantinh/MNM_REPORT>
```

Cấu trúc thư mục sau khi clone:
```
MNM_REPORT/
├── backend/        # Django + DRF
├── frontend/       # React + Vite
├── docs/
├── data/           # File CSV từ vựng mẫu
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 3. Cấu hình môi trường

### Bước 3.1 — Tạo file `.env`

```bash
# Linux / macOS
cp .env.example .env

# Windows (PowerShell)
Copy-Item .env.example .env
```

### Bước 3.2 — Chỉnh các biến bắt buộc

Mở file `.env` và thay các giá trị `change-me-*`:

```env
# ── Django ──────────────────────────────────────────────
SECRET_KEY=thay-bang-chuoi-ngau-nhien-dai-it-nhat-50-ky-tu
DEBUG=True

# ── Database ────────────────────────────────────────────
DB_NAME=mnm_learnenglish
DB_USER=postgres
DB_PASSWORD=mat-khau-postgres-cua-ban
DB_HOST=postgres          # giữ nguyên nếu dùng Docker
DB_PORT=5432

# ── Redis ───────────────────────────────────────────────
REDIS_PASSWORD=mat-khau-redis-cua-ban
REDIS_URL=redis://:mat-khau-redis-cua-ban@redis:6379/0
CELERY_BROKER_URL=redis://:mat-khau-redis-cua-ban@redis:6379/1
CELERY_RESULT_BACKEND=redis://:mat-khau-redis-cua-ban@redis:6379/2

# ── JWT ─────────────────────────────────────────────────
JWT_SIGNING_KEY=chuoi-bi-mat-khac-cho-jwt

# ── Email (dùng Mailtrap cho dev) ───────────────────────
EMAIL_HOST_USER=mailtrap-username-cua-ban
EMAIL_HOST_PASSWORD=mailtrap-password-cua-ban
```

> **Lưu ý:** Không cần cấu hình email để chạy được app. Bỏ qua nếu chưa có Mailtrap.

### Bước 3.3 — Tạo `SECRET_KEY` ngẫu nhiên (tùy chọn)

```bash
# Dùng Python để sinh key
python -c "import secrets; print(secrets.token_urlsafe(50))"
```

Dán kết quả vào `SECRET_KEY` trong `.env`.

---

## 4. Chạy bằng Docker (khuyến nghị)

### Bước 4.1 — Khởi động toàn bộ stack

```bash
docker compose up -d
```

Lệnh này sẽ tự động khởi động:
- `mnm_postgres` — PostgreSQL 14
- `mnm_redis` — Redis 7
- `mnm_backend` — Django (tự động migrate khi khởi động)
- `mnm_celery_worker` — Celery Worker
- `mnm_celery_beat` — Celery Beat (scheduler)
- `mnm_frontend` — React + Vite dev server

### Bước 4.2 — Kiểm tra container đang chạy

```bash
docker compose ps
```

Tất cả container phải ở trạng thái `running`. Nếu có container `exited`, xem log:

```bash
docker compose logs -f <tên-service>
# Ví dụ:
docker compose logs -f backend
```

### Bước 4.3 — Chờ backend sẵn sàng

Lần đầu chạy backend cần build image và migrate DB. Theo dõi tiến trình:

```bash
docker compose logs -f backend
```

Chờ đến khi thấy dòng:
```
Watching for file changes with StatReloader
```

---

## 5. Seed dữ liệu mẫu

Sau khi backend đã sẵn sàng, chạy lần lượt:

### Bước 5.1 — Import từ vựng từ CSV

```bash
docker compose exec backend python manage.py import_words data/words.csv
```

### Bước 5.2 — Seed dữ liệu cơ bản (users, lessons mẫu)

```bash
docker compose exec backend python manage.py seed_data
```

### Bước 5.3 — (Tùy chọn) Seed full catalog — 200 từ, 14 lessons

```bash
docker compose exec backend python manage.py seed_full_catalog --clear
```

> **Cờ `--clear`** sẽ xóa dữ liệu cũ trước khi seed lại. Bỏ cờ này nếu không muốn xóa.

---

## 6. Kiểm tra hệ thống

Mở trình duyệt và truy cập:

| Dịch vụ | URL | Mô tả |
|---|---|---|
| Frontend | http://localhost:5173 | Giao diện người dùng |
| Backend API | http://localhost:8000/api/v1/ | REST API |
| Swagger UI | http://localhost:8000/api/docs/ | Tài liệu API tương tác |
| Django Admin | http://localhost:8000/admin/ | Quản trị nội dung |

Kiểm tra API đang hoạt động:

```bash
curl http://localhost:8000/api/v1/
```

---

## 7. Chạy thủ công (không Docker)

> Dùng cách này khi không có Docker hoặc muốn debug trực tiếp.

### Bước 7.1 — Chạy PostgreSQL và Redis

Cài đặt và khởi động PostgreSQL 14 và Redis 7 theo tài liệu của từng công cụ.

Tạo database:
```sql
CREATE DATABASE mnm_learnenglish;
```

### Bước 7.2 — Chỉnh `.env` cho local

Thay `DB_HOST=postgres` thành `DB_HOST=localhost` và `REDIS_URL` trỏ về `localhost`.

### Bước 7.3 — Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux / macOS
source .venv/bin/activate

pip install -r requirements/development.txt

python manage.py migrate
python manage.py import_words data/words.csv
python manage.py seed_data
python manage.py runserver
```

### Bước 7.4 — Celery (terminal riêng)

```bash
cd backend
source .venv/bin/activate  # hoặc .venv\Scripts\activate trên Windows

# Worker
celery -A celery_app worker -l info

# Beat (terminal riêng nữa)
celery -A celery_app beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

### Bước 7.5 — Frontend (terminal riêng)

```bash
cd frontend
npm install
npm run dev
```

---

## 8. Tài khoản mẫu

Sau khi seed xong, có thể đăng nhập bằng:

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | `admin@norostu.com` | `Admin@2024!` |
| Student | `student@norostu.com` | `Student@2024!` |

---

## 9. Xử lý lỗi thường gặp

### Backend không khởi động được
```bash
docker compose logs -f backend
```
Nguyên nhân thường gặp: DB chưa sẵn sàng → chờ thêm 10–30 giây rồi thử lại.

### Database chưa sẵn sàng
```bash
docker compose ps
# Kiểm tra mnm_postgres có ở trạng thái healthy chưa
```

### Frontend không gọi được API (CORS / 404)
- Kiểm tra `VITE_API_BASE_URL=http://localhost:8000/api/v1` trong `.env`
- Kiểm tra `FRONTEND_URL=http://localhost:5173` trong `.env`
- Đảm bảo backend đang chạy tại port 8000

### Lỗi Redis kết nối
- Đảm bảo `REDIS_PASSWORD` trong `.env` khớp với lệnh trong `docker-compose.yml`
- Kiểm tra: `docker compose logs -f redis`

### Port bị chiếm (Address already in use)
Kiểm tra process đang dùng port:
```bash
# Windows
netstat -ano | findstr :8000
netstat -ano | findstr :5173

# Linux / macOS
lsof -i :8000
lsof -i :5173
```
Hoặc đổi port trong `.env`:
```env
BACKEND_PORT=8001
FRONTEND_PORT=5174
```

### Tạo superuser thủ công (nếu seed_data thất bại)
```bash
docker compose exec backend python manage.py createsuperuser
```
Nhập email, password theo hướng dẫn. Sau đó vào `http://localhost:8000/admin/` để quản trị.

### Windows: Docker không chạy được (WSL2)
Docker Desktop trên Windows yêu cầu WSL2. Nếu gặp lỗi khi khởi động Docker:
1. Mở PowerShell với quyền **Administrator**
2. Chạy: `wsl --install`
3. Khởi động lại máy
4. Mở Docker Desktop → Settings → General → bật **Use the WSL 2 based engine**

### Reset toàn bộ (xóa sạch data, chạy lại từ đầu)
```bash
docker compose down -v   # xóa cả volumes
docker compose up -d
```
Sau đó chạy lại bước 5 để seed data.
