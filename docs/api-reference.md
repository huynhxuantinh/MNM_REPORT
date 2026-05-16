# API Reference — MNM Learn English

Base URL: `http://localhost:8000/api/v1`

Interactive docs (Swagger UI): `http://localhost:8000/api/docs/`

Tất cả request/response dùng JSON. Các endpoint yêu cầu xác thực phải gửi header:

```
Authorization: Bearer <access_token>
```

---

## Xác thực (Auth)

### Đăng ký

```
POST /auth/register/
```

**Rate limit:** 5 lần/phút

**Body:**
```json
{
  "email": "user@example.com",
  "username": "myusername",
  "password": "MyPass123!",
  "full_name": "Nguyễn Văn A"
}
```

**Response 201:**
```json
{
  "message": "Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản."
}
```

---

### Xác thực email

```
POST /auth/verify-email/
```

**Body:**
```json
{ "token": "<token-từ-email>" }
```

---

### Gửi lại email xác thực

```
POST /auth/resend-verification/
```

**Rate limit:** 1 lần/phút (cooldown 60 giây)

**Body:**
```json
{ "email": "user@example.com" }
```

**Response 200:**
```json
{ "message": "Đã gửi lại email xác thực." }
```

---

### Đăng nhập

```
POST /auth/login/
```

**Rate limit:** 10 lần/phút

**Body:**
```json
{
  "email": "user@example.com",
  "password": "MyPass123!"
}
```

**Response 200:**
```json
{
  "access": "<jwt-access-token>",
  "refresh": "<jwt-refresh-token>",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "Nguyễn Văn A",
    "role": "user",
    "xp": 0,
    "level": 1
  }
}
```

---

### Làm mới access token

```
POST /auth/token/refresh/
```

**Body:**
```json
{ "refresh": "<jwt-refresh-token>" }
```

**Response 200:**
```json
{ "access": "<new-access-token>" }
```

---

### Đăng xuất

```
POST /auth/logout/
```
*(Yêu cầu xác thực)*

**Body:**
```json
{ "refresh": "<jwt-refresh-token>" }
```

---

### Quên mật khẩu

```
POST /auth/forgot-password/
```

**Rate limit:** 5 lần/giờ

**Body:**
```json
{ "email": "user@example.com" }
```

---

### Đặt lại mật khẩu

```
POST /auth/reset-password/
```

**Body:**
```json
{
  "token": "<token-từ-email>",
  "new_password": "NewPass123!"
}
```

---

### Đổi mật khẩu

```
POST /auth/change-password/
```
*(Yêu cầu xác thực)*

**Body:**
```json
{
  "old_password": "OldPass123!",
  "new_password": "NewPass456!"
}
```

---

### Xem/cập nhật profile

```
GET  /auth/me/
PATCH /auth/me/
```
*(Yêu cầu xác thực)*

**PATCH Body (các trường tùy chọn):**
```json
{
  "full_name": "Tên mới",
  "avatar_url": "https://example.com/avatar.jpg",
  "notification_enabled": true
}
```

---

### Admin — Danh sách người dùng

```
GET /auth/admin/users/
```
*(Yêu cầu role: admin)*

**Query params:** `?search=email&role=user&page=1`

---

### Admin — Cập nhật người dùng

```
PATCH /auth/admin/users/{id}/
```
*(Yêu cầu role: admin)*

---

### Admin — Thống kê hệ thống

```
GET /auth/admin/stats/
```
*(Yêu cầu role: admin)*

**Response 200:**
```json
{
  "total_users": 150,
  "students": 120,
  "teachers": 8,
  "admins": 2,
  "active_users": 145,
  "inactive_users": 5,
  "new_users_this_week": 12,
  "total_words": 500,
  "total_lessons": 12,
  "published_lessons": 10,
  "total_wordsets": 25,
  "reviews_today": 34,
  "total_reviews": 2400,
  "total_quiz_results": 310
}
```

---

## Từ vựng (Vocabulary)

### Danh sách từ vựng

```
GET /vocabulary/words/
```
*(Yêu cầu xác thực)*

**Query params:**

| Param | Mô tả | Ví dụ |
|---|---|---|
| `search` | Tìm theo text/definition | `?search=apple` |
| `level` | Lọc theo cấp độ | `?level=A1` |
| `part_of_speech` | Lọc theo loại từ | `?part_of_speech=noun` |
| `ordering` | Sắp xếp | `?ordering=text` |
| `page` | Trang | `?page=2` |

**Response 200:**
```json
{
  "count": 500,
  "next": "http://localhost:8000/api/v1/vocabulary/words/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "text": "apple",
      "phonetic": "/ˈæp.əl/",
      "part_of_speech": "noun",
      "definition_en": "a round fruit with red or green skin",
      "definition_vi": "quả táo",
      "example_en": "I eat an apple every morning.",
      "example_vi": "Tôi ăn một quả táo mỗi sáng.",
      "level": "A1",
      "image_url": "",
      "is_bookmarked": false
    }
  ]
}
```

---

### Chi tiết từ vựng

```
GET /vocabulary/words/{id}/
```

---

### Tạo từ vựng mới

```
POST /vocabulary/words/
```
*(Yêu cầu role: admin)*

**Body:**
```json
{
  "text": "serendipity",
  "phonetic": "/ˌser.ənˈdɪp.ɪ.ti/",
  "part_of_speech": "noun",
  "definition_en": "the occurrence of events by chance in a happy way",
  "definition_vi": "sự tình cờ may mắn",
  "example_en": "Finding that book was pure serendipity.",
  "example_vi": "Tìm thấy cuốn sách đó là sự tình cờ may mắn.",
  "level": "C1"
}
```

---

### Bộ từ vựng (WordSet)

```
GET    /vocabulary/sets/          # Danh sách (cache 5 phút)
POST   /vocabulary/sets/          # Tạo mới (admin)
GET    /vocabulary/sets/{id}/     # Chi tiết
PATCH  /vocabulary/sets/{id}/     # Cập nhật (owner hoặc admin)
DELETE /vocabulary/sets/{id}/     # Xóa (owner hoặc admin)
```

**Thêm/xóa từ trong bộ:**
```
POST   /vocabulary/sets/{id}/add_word/     # Body: {"word_id": 5}
POST   /vocabulary/sets/{id}/remove_word/  # Body: {"word_id": 5}
```

---

### Import CSV tạo bộ từ mới

```
POST /vocabulary/sets/import/
```

*(Yêu cầu role: admin)*

**Content-Type:** `multipart/form-data`

**Form fields:**

| Field | Mô tả | Bắt buộc |
|---|---|---|
| `name` | Tên bộ từ | **Có** |
| `description` | Mô tả | Không |
| `level` | Cấp độ (A1, A2, B1, B2, C1, C2, TOEIC, IELTS) | Không |
| `is_public` | `true` / `false` | Không (mặc định `true`) |
| `file` | File CSV (tối đa 5 MB) | **Có** |

**Header CSV bắt buộc:** `text` — các cột tùy chọn: `phonetic`, `part_of_speech`, `definition_en`, `definition_vi`, `example_en`, `example_vi`, `level`

**Response 201:**
```json
{
  "id": 42,
  "name": "Động vật rừng",
  "imported": 25,
  "skipped": 3,
  "errors": [
    {"row": 7, "error": "Trường 'text' bắt buộc."}
  ]
}
```

---

### Bookmark

```
GET    /vocabulary/bookmarks/          # Danh sách bookmark của tôi
POST   /vocabulary/bookmarks/          # Thêm bookmark: {"word": 5}
DELETE /vocabulary/bookmarks/{id}/     # Xóa bookmark
```

---

## Học tập (Learning)

### Danh sách bài học

```
GET /learning/lessons/
```
*(Yêu cầu xác thực — cache 5 phút)*

**Query params:** `?level=A1&search=chào+hỏi&ordering=order_index`

**Response 200:**
```json
{
  "count": 5,
  "results": [
    {
      "id": 1,
      "title": "Chào hỏi cơ bản",
      "description": "Học các từ vựng thiết yếu để chào hỏi...",
      "level": "A1",
      "order_index": 1,
      "is_published": true,
      "word_count": 15
    }
  ]
}
```

---

### Chi tiết bài học (kèm danh sách từ)

```
GET /learning/lessons/{id}/
```

---

### Tạo bài học

```
POST /learning/lessons/
```
*(Yêu cầu role: admin)*

**Body:**
```json
{
  "title": "Động vật",
  "description": "Học tên các loài động vật bằng tiếng Anh.",
  "level": "A1",
  "order_index": 6,
  "is_published": false
}
```

---

### Thêm/xóa từ trong bài học

```
POST   /learning/lessons/{id}/words/            # Body: {"word_id": 5, "order_index": 1}
DELETE /learning/lessons/{id}/words/{word_id}/
```
*(Yêu cầu role: admin)*

---

### Bắt đầu/hoàn thành bài học

```
POST /learning/lessons/{id}/start/     # Ghi nhận bắt đầu học
POST /learning/lessons/{id}/complete/  # Ghi nhận hoàn thành, tạo ReviewLog
```

---
### Learning flow phase 1-4 (current)

```
GET  /learning/path/
POST /learning/session/start/
GET  /learning/session/{id}/
POST /learning/session/{id}/answer/
POST /learning/session/{id}/finish/
POST /learning/session/{id}/quit/
POST /learning/checkpoint/start/
POST /learning/checkpoint/{id}/submit/
GET  /learning/daily-goal/
POST /learning/daily-goal/claim/
POST /learning/streak-freeze/claim/
GET  /learning/placement/status/
GET  /learning/placement/questions/
POST /learning/placement/submit/
```

---

### Ôn tập SRS

```
GET /learning/review/
```

Trả về danh sách từ đến hạn ôn tập hôm nay.

**Response 200:**
```json
{
  "count": 8,
  "words": [
    {
      "id": 1,
      "text": "apple",
      "phonetic": "/ˈæp.əl/",
      "definition_vi": "quả táo",
      "next_review_date": "2026-04-27",
      "repetitions": 2
    }
  ]
}
```

---

### Trả lời ôn tập

```
POST /learning/review/{word_id}/answer/
```

**Body:**
```json
{ "quality": 4 }
```

`quality` từ 0–5 theo thuật toán SM-2:
- 0–2: Không nhớ → đặt lại từ đầu
- 3: Nhớ nhưng khó khăn
- 4: Nhớ khá tốt
- 5: Nhớ hoàn hảo

**Response 200:**
```json
{
  "next_review_date": "2026-05-03",
  "interval_days": 6,
  "easiness_factor": 2.5
}
```

---

### Tóm tắt ôn tập

```
GET /learning/review/summary/
```

**Response 200:**
```json
{
  "total": 50,
  "mastered": 30,
  "learning": 15,
  "new": 5
}
```

---

### Lịch sử ôn tập

```
GET /learning/review/history/
```

---

## Quiz

### Tạo câu hỏi trắc nghiệm

```
GET /quiz/generate/?lesson_id=X
```
*(Yêu cầu xác thực)*

Trả về `quiz_id` và danh sách 10 câu MC sinh ngẫu nhiên từ bài học.

---

### Nộp kết quả quiz

```
POST /quiz/submit/
```

**Body:**
```json
{
  "quiz_id": 3,
  "score": 80.0,
  "total_questions": 10,
  "correct_answers": 8
}
```

**Response 201:** `QuizResult` object

---

### Lịch sử quiz cá nhân

```
GET /quiz/sessions/
GET /quiz/sessions/{id}/
```

---

### Admin — Kết quả quiz toàn hệ thống

```
GET /quiz/admin/results/
```
*(Yêu cầu role: admin)*

**Query params:** `?search=email_hoặc_ten&quiz=id&page=N`

**Response 200:**
```json
{
  "count": 310,
  "results": [
    {
      "id": 1,
      "user": 5,
      "user_email": "student@mnm.com",
      "user_name": "Nguyễn Văn A",
      "quiz": 3,
      "quiz_title": "Chào hỏi cơ bản",
      "score": 80.0,
      "total_questions": 10,
      "correct_answers": 8,
      "completed_at": "2026-05-01T14:30:00Z"
    }
  ]
}
```

---

## Mã lỗi HTTP

| Code | Ý nghĩa |
|---|---|
| `200` | Thành công |
| `201` | Tạo mới thành công |
| `204` | Xóa thành công |
| `400` | Dữ liệu không hợp lệ |
| `401` | Chưa xác thực (thiếu hoặc hết hạn token) |
| `403` | Không có quyền truy cập |
| `404` | Không tìm thấy |
| `429` | Vượt quá rate limit |
| `500` | Lỗi server |

**Cấu trúc lỗi chuẩn:**
```json
{
  "detail": "Mô tả lỗi"
}
```

Hoặc lỗi validation field:
```json
{
  "email": ["Email này đã được sử dụng."],
  "password": ["Mật khẩu phải có ít nhất 8 ký tự."]
}
```

---

## Rate Limiting

| Endpoint | Giới hạn |
|---|---|
| `POST /auth/register/` | 5 lần/phút |
| `POST /auth/login/` | 10 lần/phút |
| `POST /auth/forgot-password/` | 5 lần/giờ |
| `POST /auth/reset-password/` | 5 lần/giờ |
| Các endpoint khác (user đã đăng nhập) | 300 lần/phút |
| Các endpoint không xác thực | 60 lần/phút |



