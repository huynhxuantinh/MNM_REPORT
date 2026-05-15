# Kế Hoạch Chuyển Hướng MNM_REPORT Theo Trải Nghiệm Duolingo

## 1) Mục tiêu sản phẩm

- Tăng `daily active usage` và `retention` thay vì chỉ CRUD nội dung học.
- Người dùng học theo vòng lặp ngắn: `vào app -> làm bài 2-5 phút -> nhận thưởng -> quay lại ngày mai`.
- Ưu tiên trải nghiệm `mobile-first`, thao tác nhanh, phản hồi tức thì.

## 2) Định hướng chiến lược: Giữ / Làm thêm / Bỏ bớt

### 2.1 Giữ lại (nền tảng tốt sẵn có)

- Auth + hồ sơ người dùng.
- Hệ thống `SRS/SM-2`, XP, streak, notification.
- Dữ liệu từ vựng/bài học và quiz hiện có.
- Celery nhắc học hằng ngày.

### 2.2 Làm thêm (ưu tiên cao)

- `Learning Path` theo unit (map tiến trình, mở khóa tuần tự).
- `Exercise Engine` dạng bài ngắn (2-5 phút/lần):
  - chọn nghĩa đúng
  - nghe chọn từ
  - điền từ còn thiếu
  - sắp xếp từ thành câu ngắn
- `Placement Test` (xếp level đầu vào).
- `Checkpoint Test` cuối mỗi unit để mở khóa unit tiếp theo.
- `Daily Goal` (5/10/15 phút) + streak freeze.
- `Lives/Hearts` + combo thưởng XP để tăng gamification.
- `Adaptive Difficulty` (điều chỉnh độ khó theo lịch sử đúng/sai).

### 2.3 Tạm bỏ hoặc hạ ưu tiên

- Teacher/Class/Assignment nếu target chính là B2C tự học.
- Dashboard phân tích quá sâu ở giai đoạn đầu.
- Nhiều loại quiz phức tạp khi chưa chứng minh tác động retention.

## 3) KPI cần đo ngay từ đầu

- `D1 retention`, `D7 retention`, `W4 retention`.
- Số phiên học/ngày/người (`sessions per DAU`).
- Thời lượng phiên học trung bình.
- `streak continuation rate` (tỷ lệ giữ streak ngày tiếp theo).
- Tỷ lệ hoàn thành unit/checkpoint.
- % người dùng đạt daily goal.

## 4) Roadmap triển khai (12 tuần)

## Phase 0 (Tuần 1): Chốt scope + thiết kế dữ liệu

- Chốt target người dùng (A1-A2 hay rộng hơn).
- Chốt cấu trúc content:
  - Course -> Unit -> Lesson -> Exercise
- Thiết kế migration mới cho progression và session learning.
- Thiết kế event tracking schema.

Deliverables:
- ERD mới.
- Spec API v1.1 cho learning path + exercise session.
- Danh sách metric và dashboard tracking.

## Phase 1 (Tuần 2-4): Learning Path + session học ngắn

- Backend:
  - API lấy learning path theo user.
  - API bắt đầu/kết thúc lesson session.
  - API lưu tiến độ `unit_progress`, `lesson_progress`.
- Frontend:
  - Trang map lộ trình (unit card + trạng thái khóa/mở).
  - Session UI 1 flow “start -> answer -> instant feedback -> finish”.
- Rule mở khóa cơ bản:
  - hoàn thành >= X bài trong unit mới mở checkpoint.

Deliverables:
- User đi được full flow unit đầu tiên.
- Có lưu tiến độ và hiển thị đúng trạng thái.

## Phase 2 (Tuần 5-7): Exercise engine + checkpoint

- Backend:
  - Generator câu hỏi theo template.
  - Bank distractor cho đáp án sai.
  - Checkpoint scoring + unlock unit.
- Frontend:
  - 3-4 loại exercise chính.
  - Hiệu ứng phản hồi đúng/sai dưới 200ms UI feedback.
  - Summary cuối phiên: XP, accuracy, từ cần ôn.
- Kết nối SRS:
  - sai nhiều -> đưa vào review sớm hơn.

Deliverables:
- 1 unit hoàn chỉnh với nhiều exercise.
- Checkpoint unlock hoạt động.

## Phase 3 (Tuần 8-10): Gamification + cá nhân hóa

- Daily goal.
- Hearts/lives + cơ chế hồi theo thời gian.
- Streak freeze (miễn bỏ streak 1 ngày).
- Adaptive difficulty:
  - user trả lời đúng liên tục -> tăng độ khó
  - sai liên tục -> giảm độ khó + tăng lặp
- Tối ưu thông báo nhắc học theo giờ hoạt động user.

Deliverables:
- Vòng lặp “quay lại hằng ngày” hoàn chỉnh.
- Có thể A/B test daily goal và hearts.

## Phase 4 (Tuần 11-12): Tracking, tối ưu, release

- Tạo dashboard KPI.
- Tối ưu onboarding + placement test.
- Sửa điểm rơi UX gây drop.
- Hardening: test, rate-limit, anti-cheat cơ bản.

Deliverables:
- Báo cáo baseline KPI tuần đầu sau release.
- Backlog tối ưu quý tiếp theo.

## 5) Backlog kỹ thuật chi tiết

## 5.1 Backend (Django/DRF/Celery)

### A. Models mới cần thêm

- `Course`, `Unit`, `UnitLesson`.
- `Exercise` (type, prompt, payload).
- `ExerciseAttempt` (answer, correct, latency, timestamp).
- `UserUnitProgress`, `UserCourseProgress`.
- `DailyGoal`, `DailyGoalLog`.
- `UserHearts`, `HeartTransaction`.
- `PlacementResult`.

### B. API endpoints mới

- `GET /learning/path/`
- `POST /learning/session/start/`
- `POST /learning/session/{id}/answer/`
- `POST /learning/session/{id}/finish/`
- `POST /learning/checkpoint/start/`
- `POST /learning/checkpoint/{id}/submit/`
- `GET /learning/daily-goal/`
- `POST /learning/daily-goal/claim/`

### C. Logic nghiệp vụ

- Unit unlock rule.
- XP policy thống nhất theo loại bài.
- Adaptive difficulty policy.
- Heart tiêu hao/hồi theo thời gian.
- Streak freeze consume logic.

### D. Jobs/Celery

- Nhắc học theo daily goal chưa đạt.
- Heart refill scheduler.
- Batch tính leaderboard/league (nếu dùng).

### E. Bảo mật/hiệu năng

- Idempotency cho submit answer.
- Chống spam submit.
- Cache path data theo user.
- Index cho bảng attempts/progress.

## 5.2 Frontend (React)

### A. Màn hình mới

- Learning Path page.
- Session Exercise page.
- Checkpoint page.
- Daily Goal/Rewards panel.
- Lives/Hearts indicator.

### B. State management

- Slice/session state chuyên biệt cho exercise run.
- Đồng bộ optimistic UI cho answer feedback.
- Persist minimal state khi reload giữa phiên.

### C. UX bắt buộc

- 1 tay dùng được trên mobile.
- Nút lớn, thao tác nhanh, animation ngắn.
- Feedback đúng/sai rõ, không lag.
- Progress hiển thị liên tục (step, unit, streak, XP).

## 5.3 Dữ liệu nội dung học

- Chuẩn hóa metadata:
  - level
  - topic
  - skill tag (vocab/listening/grammar)
  - difficulty
- Tạo content pipeline để sinh exercise từ word/lesson hiện có.
- Quy trình review chất lượng nội dung.

## 6) Những gì cần refactor từ code hiện tại

- Tách rõ `learning flow API` khỏi CRUD teacher/admin.
- Chuẩn hóa cách cập nhật user state (xp/level) để tránh overwrite.
- Gom các API học tập thành 1 module session-centric.
- Bổ sung analytics event ở các điểm:
  - start session
  - answer
  - complete
  - quit giữa chừng

## 7) Progress cập nhật theo code hiện tại (Phase 0-4)

### 7.1 Trạng thái phase

- Phase 0: DONE
- Phase 1: DONE
- Phase 2: DONE
- Phase 3: DONE
- Phase 4: DONE (core scope)

### 7.2 Đã làm xong (đối chiếu plan)

- Learning path + session flow:
  - `GET /learning/path/`
  - `POST /learning/session/start/`
  - `POST /learning/session/{id}/answer/`
  - `POST /learning/session/{id}/finish/`
  - `POST /learning/session/{id}/quit/`
  - `GET /learning/session/recover/`
  - `POST /learning/session/{id}/resume/`
- Checkpoint:
  - `POST /learning/checkpoint/start/`
  - `POST /learning/checkpoint/{id}/submit/`
- Daily goal + hearts + streak freeze:
  - `GET /learning/daily-goal/`
  - `POST /learning/daily-goal/claim/`
  - `POST /learning/streak-freeze/claim/`
- Placement test:
  - `GET /learning/placement/status/`
  - `GET /learning/placement/questions/`
  - `POST /learning/placement/submit/`
- KPI baseline + dashboard:
  - `GET /learning/kpi/baseline/`
  - Đã có các KPI: `D1`, `D7`, `W4`, `sessions_per_dau`, `session_completion_rate`, ...
- Onboarding funnel + drop-off tracking:
  - Event onboarding: `placement_enter`, `placement_abandon`, `placement_submit`, `first_lesson_start`
  - API funnel: `GET /learning/kpi/onboarding-funnel/`
  - Teacher dashboard đã hiển thị block funnel
- Listening exercise + metadata pipeline:
  - Exercise type `listen_choose_word`
  - Metadata lesson: `topic`, `skill_tag`, `content_difficulty`
  - Command: `python manage.py normalize_learning_metadata`
- Hardening:
  - Throttle learning endpoints
  - Anti-cheat cơ bản (step order, clamp `response_ms`, suspicious flags)
  - Idempotency cho submit answer
- A/B framework (core):
  - `ExperimentConfig`, `ExperimentAssignment`
  - Event metric split: `experiment_metric`
- League batch (core):
  - `LeagueSeason`, `LeagueStanding`
  - Task `learning.rebuild_weekly_league`
  - API `GET /learning/league/current/`
- Model backlog bổ sung:
  - `Exercise` (template bank theo lesson, session ưu tiên lấy từ bank này)
  - `UserCourseProgress` (aggregate tiến độ course)

### 7.3 Chua lam xong so voi full scope ban dau

- Onboarding funnel + UX optimization: DONE
  - Da xong `Placement result CTA`, `Continue Session`, `Session frustration guard`, `Reminder funnel 24h`.
- Con lai cho full scope:
  - Refactor tach `learning flow API` khoi CRUD teacher/admin triet de.
  - Chuan hoa 1 luong update `xp/level/streak/hearts` toan bo endpoint.
  - Gom API hoc tap theo module session-centric (giam views.py monolith).
### 7.4 Migrations đã thêm trong nhánh Duolingo

- `0005` -> `0008`: learning path + gamification nền tảng
- `0009_learningevent`
- `0010_placementresult`
- `0011_lesson_content_difficulty_lesson_skill_tag_and_more`
- `0012_experimentassignment_experimentconfig_leagueseason_and_more`
- `0013_usercourseprogress_exercise`
- `0014_alter_learningevent_event_type`

### 7.5 Verify gần nhất

- `docker compose exec backend python manage.py check` -> pass
- `docker compose exec backend python manage.py migrate learning` -> đã apply tới `0014` (local)
- Bộ test phase 4 chính: `24 passed`
- Bộ test onboarding/placement/session (local, settings development): `13 passed`

### 7.6 Update them (2026-05-14)

- Hoan thanh UX patch Session frustration guard (wrong streak >=3 -> goi y chuyen easy mode).
- Hoan thanh UX patch Reminder funnel 24h qua task learning.send_onboarding_first_lesson_reminders.
- Reminder duoc danh dau bang event onboarding first_lesson_reminder_sent de tranh gui trung lap.




### 7.7 Update them (2026-05-14 - dot tiep)

- Da tach routing theo nhom: urls_flow.py (learner flow) va urls_management.py (teacher/admin/analytics).
- Da chuan hoa update user state qua helper _apply_learning_rewards de giam duplicate logic.

- Da chuyen implementation cac view management/analytics (KPI, funnel, teacher stats, notifications, leaderboard, league, profile stats) sang ackend/apps/learning/management_views.py.


### 7.8 Update them (2026-05-15)

- Fixed toàn bộ nhóm test fail của learning module: từ 199/204 lên 204/204 pass.
- Chuẩn hóa logic ngày cho review/daily-goal/streak theo timezone-aware (`timezone.localdate()`), riêng early-review giữ UTC-date để tương thích rule test hiện tại.
- Sửa `lesson_views.py` (message + cache stamp) để tránh lỗi encoding và stale cache giữa các run.
- Checkpoint session không trừ hearts để tránh fail giữa chừng khi làm full bộ câu hỏi checkpoint.
