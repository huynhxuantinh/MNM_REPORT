# Changelog — MNM Learn English

Tất cả thay đổi đáng kể của dự án được ghi lại tại đây.
Format theo [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.1.2] — 2026-05-02

### Bug Fixes

- **Fix:** `VocabularyPage.jsx` — `navigate` undefined trong `WordsTab` (crash khi click tên từ)
- **Fix:** `VocabularyPage.jsx` — `useState` → `useEffect` để reset form `WordDialog` và `SetDialog` đúng khi chuyển từ/bộ từ
- **Fix:** `VocabularyPage.jsx` — `CsvImportSetDialog` và nút "Nhập CSV" được thêm vào `SetsTab`
- **Fix:** `vocabularyApi.js` — thêm method `importSetCsv` cho `POST /vocabulary/sets/import/`
- **Fix:** `adminApi.js` — thêm method `getQuizResults` cho `GET /quiz/admin/results/`
- **Fix:** `AdminQuizResults.jsx` — sửa encoding corrupt toàn bộ văn bản tiếng Việt
- **Fix:** `App.jsx` + `AdminLayout.jsx` — thêm route `/admin/quizzes` và nav item "Kết quả Quiz"
- **Fix:** `QuizPage.jsx` — `bgcolor: "#fff"` → `"background.paper"` trong matching game (dark mode)
- **Fix:** `Word` model — thêm `unique=True` trên `text` + migration `0003_word_text_unique.py`

### Tính năng mới

- **Thêm:** TOEIC và IELTS vào `LEVELS` và `LEVEL_CHIP` trong `VocabularyPage.jsx` (hỗ trợ gán cấp độ TOEIC/IELTS cho từ vựng)
- **Thêm:** Phân trang server-side cho tab Từ vựng — 20 từ/trang, reset về trang 1 khi tìm kiếm/lọc, hiển thị tổng số từ

### Dọn dẹp

- **Xóa:** `AdminPage.jsx` và `TeacherPage.jsx` — dead code, không được route
- **Xóa:** import thừa `CircularProgress` trong `VocabularyPage.jsx`

---

## [1.1.1] — 2026-05-02

### Backend — Từ vựng (Vocabulary)

- **Thêm:** `POST /vocabulary/sets/import/` — upload CSV để tạo bộ từ mới (`WordSetImportSerializer`)
  - Validate: chỉ `.csv`, tối đa 5 MB
  - Parse header: `text` (bắt buộc), `phonetic`, `part_of_speech`, `definition_en/vi`, `example_en/vi`, `level`
  - Upsert từ bằng `bulk_create(..., ignore_conflicts=True)`
  - Tự động liên kết từ vào `WordSet` qua `WordSetWord`
  - Trả về: `id`, `name`, `imported`, `skipped`, `errors[]`
- **Sửa:** `getSets()` thêm `page_size: 200` để fetch đầy đủ danh sách bộ từ
- **Sửa:** `SetDialog` reset form khi `initial` thay đổi (tránh giữ state cũ khi chuyển qua lại giữa tạo/sửa)

### Frontend — Dark Mode Support

- **Thay thế:** toàn bộ `colors.textBlack` → `"text.primary"` (theme-aware, trắng khi dark mode)
- **Thay thế:** toàn bộ `colors.textBlackSoft` → `"text.secondary"`
- **Thay thế:** `bgcolor: "#fff"` → `bgcolor: "background.paper"` (36 file JSX/JS)
- **Khôi phục:** `ThemeContext` lưu `mode` vào `localStorage` (`mnm-theme`) để dark mode có hiệu lực xuyên phiên

### Frontend — Từ vựng (Vocabulary)

- **Thêm:** `CsvImportSetDialog` component trong `VocabularyPage.jsx`
  - Form: tên bộ từ, mô tả, cấp độ, quyền truy cập (public/private), upload CSV
  - Gọi `vocabularyApi.importSetCsv(fd)` với `multipart/form-data`
  - Hiển thị kết quả: số từ được thêm, số lỗi (nếu có)

---

## [1.1.0] — 2026-05-01

### Backend — Xác thực & Tài khoản

- **Thêm:** `POST /auth/resend-verification/` — gửi lại email xác thực với cooldown 60 giây
- **Fix:** `AdminUserListView` search dùng `Q` objects đúng cách (trước đây bị duplicate queryset + mất `order_by`)
- **Cải thiện:** `LoginSerializer` phân biệt rõ lỗi "email chưa xác thực" và "tài khoản bị khoá"
- **Cải thiện:** `ForgotPasswordView` chỉ gửi email cho tài khoản đã xác thực
- **Cải thiện:** `ChangePasswordView` blacklist tất cả outstanding tokens sau khi đổi mật khẩu (đăng xuất tất cả thiết bị)
- **Cải thiện:** `VerifyEmailView` trả thông báo lỗi rõ hơn khi token đã dùng hoặc hết hạn
- **Performance:** Thêm `db_index=True` cho `EmailVerificationToken.token` và `PasswordResetToken.token`
- **Bật lại:** `RegisterRateThrottle` (trước đây bị comment out)

### Backend — Quiz

- **Thêm:** `GET /quiz/admin/results/` — danh sách tất cả kết quả quiz (admin only), hỗ trợ `?search=` và `?quiz=`
- **Thêm:** `AdminQuizResultSerializer` với thông tin user (email, full_name)
- **Thêm:** `AdminQuizResultListView` (ReadOnlyModelViewSet, phân trang)

### Frontend — Xác thực

- **Thêm:** Nút "Gửi lại email xác thực" trên trang đăng ký thành công với loading/success/error states
- **Cải thiện:** `LoginPage` hiển thị thông báo rõ hơn khi email chưa xác thực kèm hướng dẫn
- **Fix:** Race condition trong token refresh — các request 401 đồng thời giờ được queue và chờ một lần refresh duy nhất

### Frontend — Teacher

- **Thêm:** Shared dialogs module `features/teacher/dialogs/ClassDialogs.jsx`
  - `ClassFormDialog` — form tạo/sửa lớp học
  - `DeleteClassDialog` — xác nhận xóa lớp
  - `ManageClassDialog` — quản lý học sinh trong lớp (3 tab: danh sách, thêm học sinh, giao bài)
- **Refactor:** `TeacherClasses.jsx` và `TeacherStudents.jsx` dùng shared dialogs, xóa code trùng lặp
- **Cải thiện:** `AvatarGroup` hiển thị "+N" khi lớp có nhiều hơn 3 học sinh

### Frontend — Admin

- **Thêm:** Trang `AdminQuizResults` (`/admin/quizzes`) — xem kết quả quiz toàn hệ thống
  - Bảng: học sinh, bài kiểm tra, điểm (màu theo mức), đúng/tổng, thời gian
  - Search theo tên/email, phân trang
- **Thêm:** Nav item "Kết quả quiz" trong `AdminLayout` sidebar
- **Fix:** `AdminUsers`, `AdminWords`, `AdminLessons` — `keepPreviousData` → `placeholderData` (TanStack Query v5)
- **Fix:** `AdminWords`, `AdminLessons` — `isLoading` → `isPending` trên mutations (TanStack Query v5)
- **Fix:** Tất cả `qc.invalidateQueries([...])` → `qc.invalidateQueries({ queryKey: [...] })` (TanStack Query v5)
- **Thêm:** `adminApi.getQuizResults()` method

---

## [1.0.0] — 2026-04-27

Phiên bản đầu tiên hoàn chỉnh. Bao gồm toàn bộ tính năng core từ thiết kế ban đầu.

---

### Backend

#### Xác thực & Tài khoản (apps/accounts)

- **Đăng ký tài khoản** với xác thực email (token qua email)
- **Đăng nhập / Đăng xuất** bằng JWT (access token + refresh token)
- **Làm mới token** qua `POST /auth/token/refresh/` — refresh token bị blacklist sau khi logout
- **Quên / Đặt lại mật khẩu** qua email
- **Đổi mật khẩu** khi đã đăng nhập
- **Xem và cập nhật profile** (`GET/PATCH /auth/me/`)
- **Phân quyền 3 role:** `user` (học sinh), `teacher` (giáo viên), `admin` (quản trị viên)
- **Permission class** `IsAdmin`, `IsTeacherOrAdmin`, `IsOwnerOrAdmin` tích hợp DRF
- **Rate limiting** riêng cho register (5/phút), login (10/phút), password reset (5/giờ)
- **Admin API:** danh sách người dùng, cập nhật role, thống kê hệ thống

#### Từ vựng (apps/vocabulary)

- **CRUD từ vựng** với đầy đủ trường: text, phonetic, part_of_speech, definition_en/vi, example_en/vi, level, image_url
- **Hỗ trợ 8 cấp độ:** A1, A2, B1, B2, C1, C2, TOEIC, IELTS
- **Bộ từ vựng (WordSet):** tạo, chỉnh sửa, thêm/xóa từ, phân quyền owner/admin
- **Bookmark:** đánh dấu từ yêu thích, xem danh sách bookmark cá nhân
- **Tìm kiếm & lọc:** theo text, definition, level, part_of_speech
- **Annotation `is_bookmarked`** — dùng `Exists(OuterRef)` thay vì N+1 query
- **Redis cache 5 phút** cho danh sách WordSet với version-based invalidation
- **Pagination** cho tất cả endpoint trả danh sách (mặc định 20 item/trang)

#### Học tập & SRS (apps/learning)

- **CRUD Lesson:** tạo/sửa/xóa bài học, thêm/xóa từ vựng vào bài
- **Bắt đầu & hoàn thành bài học** — ghi nhận `LessonProgress`
- **Spaced Repetition System (SM-2):** tạo `ReviewLog` khi hoàn thành bài, cập nhật `interval_days` và `easiness_factor` sau mỗi lần ôn
- **Ôn tập hôm nay:** trả về danh sách từ đến hạn (`next_review_date <= today`)
- **Trả lời ôn tập** với quality 0–5, tự động tính ngày ôn tiếp theo
- **Tóm tắt ôn tập:** phân loại mastered / learning / new
- **Streak học tập:** chuỗi ngày học liên tiếp (`UserStreak`)
- **Bài được giao (Assignment):** giáo viên giao bài cho học sinh kèm deadline
- **Thông báo (Notification):** thông báo assignment mới, streak milestone
- **Redis cache 5 phút** cho danh sách Lesson
- **Conditional `prefetch_related`** — chỉ fetch `lesson_words__word` khi action là `retrieve`

#### Quiz (apps/quiz)

- Tạo phiên quiz từ bộ từ vựng hoặc bài học
- Ghi nhận kết quả từng câu hỏi
- Xem lịch sử và điểm số các phiên quiz

#### Cơ sở hạ tầng Backend

- **Django 4.2** + **DRF 3.15** + **PostgreSQL 14** + **Redis 7**
- **drf-spectacular 0.27** — Swagger UI và ReDoc tự động sinh từ code
- **django-filter** — filter backend tích hợp cho tất cả ViewSet
- **Throttling toàn cục:** 60 req/phút (anon), 300 req/phút (user đã đăng nhập)
- **CORS** cấu hình chặt chẽ, chỉ cho phép domain frontend
- **Settings phân tầng:** `base.py` → `development.py` / `test.py` / `production.py`
- **Test settings:** SQLite in-memory + DummyCache (không cần PostgreSQL/Redis khi test)
- **Production settings:** HTTPS redirect, HSTS 1 năm, cookie secure/httponly/samesite, X-Frame-Options DENY, Content-Type nosniff, Referrer-Policy

---

### Frontend

#### Xác thực

- **Trang Đăng ký** với validation client-side (email, password strength)
- **Trang Đăng nhập** với JWT, lưu token vào Redux store
- **Trang Quên mật khẩu** và **Đặt lại mật khẩu** qua email
- **Auto refresh token** khi access token hết hạn
- **Protected routes** — redirect về `/login` nếu chưa đăng nhập

#### Trang chính

- **Trang chủ (Dashboard):** streak, XP, số từ đến hạn ôn hôm nay, bài học gần đây
- **Trang Từ vựng:** bảng từ, tìm kiếm, lọc theo level, import CSV
- **Trang Học tập (LearningPage):** danh sách bài học, lọc theo level
- **Trang Học từ (StudyPage):** flashcard, flip animation, điều hướng từng từ
- **Trang Ôn tập (ReviewPage):** flashcard SRS, nút đánh giá quality 1–5
- **Trang Quiz:** câu hỏi multiple choice, kết quả
- **Trang Profile:** xem thông tin, đổi mật khẩu với validation
- **Trang Thông báo**
- **Trang Admin:** quản lý người dùng (chỉ hiển thị với role admin)
- **Trang 404** với nút quay lại và về trang chủ

#### UX / Chất lượng

- **Skeleton loading** thay vì spinner trên StudyPage và ReviewPage
- **ErrorBoundary** bắt lỗi render React, hiển thị fallback UI thay vì crash trắng trang
- **Lazy loading** 9 trang nặng với `React.lazy()` + `Suspense`
- **Responsive mobile:** stats row wrap trên màn hình nhỏ, bảng có `overflowX: auto`
- **Form validation:** password phải có ≥8 ký tự, 1 chữ hoa, 1 chữ số; CSV import kiểm tra kích thước ≤2 MB và đuôi `.csv`

#### Hiệu năng Frontend

- **Vite `manualChunks`** tách 6 vendor chunks riêng (react, mui, redux, recharts, router, query) — bundle index.js chỉ còn 85 kB (gzip 28 kB)
- **React Query** cho tất cả data fetching — tự động cache và deduplication
- **Redux Toolkit** cho auth state

---

### DevOps & Tooling

- **Docker Compose** một lệnh khởi động toàn bộ stack (PostgreSQL + Redis + Backend + Frontend)
- **Dockerfile** tối ưu cho backend (python:3.11-slim) và frontend (node:20-alpine)
- **Makefile** với các lệnh tắt: `make up`, `make down`, `make migrate`, `make shell-backend`
- **pytest** cho backend với cấu hình `pytest.ini`, fixtures trong `conftest.py`
- **Vitest** cho frontend unit tests
- **Cypress** cho E2E tests

---

### Bảo mật

- **Không hardcode SECRET_KEY** — đọc từ biến môi trường bắt buộc
- **`.gitignore` đầy đủ** — loại bỏ `.env`, `*.env.*`, `backend/media/`, `frontend/dist/`
- **`.env.example`** không chứa mật khẩu thực
- **JWT blacklist** — refresh token bị vô hiệu hóa sau logout
- **Admin API** kiểm tra `IsAdmin` ở permission layer, không lọc trong queryset
- **Rate limiting** cho các endpoint nhạy cảm (register, login, password reset)

---

### Seed Data & Import

- **`python manage.py import_words data/words.csv`**
  - Import 500 từ vựng A1-B1 từ CSV
  - Validate encoding UTF-8, kiểm tra cột bắt buộc và level hợp lệ
  - Idempotent: bỏ qua từ đã tồn tại (dùng `--update` để ghi đè)
  - Báo cáo: số từ nhập / cập nhật / bỏ qua / lỗi

- **`python manage.py seed_data`**
  - Tạo 3 tài khoản mẫu: admin, teacher, student
  - Tạo 5 bài học mẫu được publish với từ vựng thực từ CSV
  - Idempotent: chạy nhiều lần không tạo trùng
  - Option `--reset-passwords` để reset mật khẩu

---

### Test Coverage

| Module | Nội dung test |
|---|---|
| `accounts` | Đăng ký, đăng nhập, JWT refresh, đổi mật khẩu, RBAC admin/teacher/student |
| `vocabulary` | CRUD word, WordSet visibility, bookmark, cache invalidation, N+1 query |
| `learning` | Lesson CRUD, SRS complete flow, ReviewLog SM-2, Assignment, Notification |
| Frontend | LoginPage, StudyPage, ReviewPage (Vitest + Testing Library) |
