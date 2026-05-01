# Dự án: MNM Learn English — Web Học Từ Vựng Tiếng Anh

## Công nghệ
- Backend: Django 4.2 + Django REST Framework 3.15
- Frontend: React 18 + Vite 5 + Redux Toolkit + TanStack Query v5
- Database: PostgreSQL 14
- Cache / Queue: Redis 7 + Celery + django-celery-beat
- Auth: JWT (djangorestframework-simplejwt) — access token + refresh token blacklist
- API Docs: drf-spectacular (Swagger UI / ReDoc)

## Giao diện
- UI Library: Material UI (MUI v5)
- Phong cách: xem file DESIGN-starbucks.md (màu Starbucks green)
- Font: Inter hoặc Nunito
- Responsive: Desktop trước, mobile sau
- Theme token: `frontend/src/styles/theme.js`

## Quy tắc code
- Backend: PEP8, docstring tiếng Việt
- Frontend: ESLint, component dùng arrow function, camelCase
- Tên biến/hàm: tiếng Anh; Comment: tiếng Việt
- TanStack Query v5: dùng `placeholderData`, `isPending`, `invalidateQueries({ queryKey: [...] })`

## Cấu trúc thư mục
- /backend         → Django project
  - apps/accounts  → Auth, User, permissions, resend-verification
  - apps/vocabulary→ Word, WordSet, Bookmark, import CSV
  - apps/learning  → Lesson, Assignment, SRS (SM-2), Classes, Notifications, Celery tasks
  - apps/quiz      → Quiz, QuizResult, admin results endpoint
- /frontend        → React project
  - src/features/teacher/dialogs/ → Shared ClassFormDialog, DeleteClassDialog, ManageClassDialog
  - src/features/admin/           → AdminDashboard, AdminUsers, AdminWords, AdminLessons, AdminQuizResults
- /docs            → SETUP.md, api-reference.md

## Roles
- `user`    → Học sinh (student portal)
- `teacher` → Giáo viên (/teacher portal)
- `admin`   → Quản trị viên (/admin portal)

## Phiên bản hiện tại: 1.1.1 (2026-05-02)

### Ghi chú gần đây
- **Dark mode:** toàn bộ `colors.textBlack` đã được thay bằng MUI theme token `"text.primary"`, `colors.textBlackSoft` → `"text.secondary"`, `bgcolor: "#fff"` → `"background.paper"`. Dark mode giờ hiển thị chữ trắng đúng cách.
- **WordSet CSV Import:** `POST /vocabulary/sets/import/` — upload CSV để tạo bộ từ mới (backend serializer `WordSetImportSerializer`, frontend dialog `CsvImportSetDialog`).
