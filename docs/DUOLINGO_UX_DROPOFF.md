# DUOLINGO UX DROP-OFF ROADMAP

## 1) Mục tiêu

- Giảm rơi ở funnel: `placement_enter -> placement_submit -> first_lesson_start`.
- Giảm bỏ dở trong session học ngắn.

## 2) Drop-point ưu tiên cao (theo dữ liệu funnel hiện tại)

1. Người dùng rời placement trước khi submit.
2. Người dùng submit placement xong nhưng chưa start lesson đầu tiên.
3. Người dùng thoát giữa session không có đường lui rõ ràng.

## 3) Patch đã triển khai

- Placement draft:
  - Lưu đáp án placement vào `localStorage`.
  - Reload/rời trang quay lại vẫn giữ câu trả lời.
  - Nút `Save & Back` để thoát an toàn.
- Placement progress:
  - Hiển thị progress bar số câu đã làm.
- Session quit UX:
  - Nút `Quit Session` rõ ràng.
  - Gọi API `POST /learning/session/{id}/quit/` để ghi nhận bỏ dở.
- Placement result CTA:
  - Sau submit hiển thị kết quả placement tại chỗ.
  - CTA `Start First Lesson Now` để vào session ngay.
- Re-engage abandoned session:
  - API `GET /learning/session/recover/`
  - API `POST /learning/session/{id}/resume/`
  - Learning page hiển thị card `Continue Session`

## 4) Patch tiếp theo (đợt kế)

1. Session frustration guard:
   - Khi sai liên tiếp >= 3, hiện CTA `Switch to easier mode`.
2. Reminder funnel:
   - Nếu placement_submit mà chưa first_lesson sau 24h, push reminder chuyên biệt.

## 5) KPI theo dõi hiệu quả patch

- `placement_abandon_rate`
- `submit_conversion_rate` (enter -> submit)
- `first_lesson_conversion_rate` (submit -> first lesson)
- `session_quit_rate` trong 24h đầu onboarding

## 6) Update 2026-05-14

- DONE: Session frustration guard da duoc trien khai (>=3 cau sai lien tiep -> CTA Switch To Easy, API POST /learning/session/{id}/switch-easy/).
- DONE: Reminder funnel da duoc trien khai voi Celery task learning.send_onboarding_first_lesson_reminders (placement_submit >24h va chua co first_lesson_start).
- Da add idempotency reminder qua event onboarding step first_lesson_reminder_sent de tranh gui lap.


