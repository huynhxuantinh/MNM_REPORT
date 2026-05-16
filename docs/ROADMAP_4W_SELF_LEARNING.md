# ROADMAP 4 TUAN - SELF LEARNING (MNM_REPORT)

## 0) Muc tieu 4 tuan
- Tang ty le user di het flow: `placement -> first lesson -> daily return`.
- Tang completion session va giam bo do giua chung.
- Chot duoc baseline KPI retention de quyet dinh backlog tiep theo.

## 1) KPI bat buoc theo doi hang ngay
- `placement_submit_rate` = placement_submit / placement_enter
- `first_lesson_start_rate` = first_lesson_start / placement_submit
- `session_completion_rate` = session_finish / session_start
- `daily_goal_claim_rate` = daily_goal_claim / users_co_goal
- `D1`, `D7` retention

## 2) Sprint plan chi tiet

## Tuan 1 - Onboarding va Session Recovery
### Muc tieu
- User moi khong bi roi sau placement.
- User bo do giua session co duong quay lai ro rang.

### Backend
- Chuan hoa payload cho:
  - `GET /learning/placement/status/`
  - `GET /learning/session/recover/`
  - `POST /learning/session/{id}/resume/`
- Bo sung event tracking co context:
  - `onboarding_source`
  - `resume_source` (home/learning/notification)
- Them safeguard cho session recover:
  - Chi tra session `started`
  - Session qua han -> auto `abandoned`

### Frontend
- Learning page:
  - Card `Continue Session` uu tien cao o top.
  - CTA `Start first lesson now` sau placement ro hon.
- Home page:
  - Neu co recoverable session thi dua vao block dau trang.
- Notification page:
  - Message reminder tro ve dung man hinh can tiep tuc.

### QA
- E2E:
  - placement -> first lesson -> quit -> recover -> resume -> finish
- Regression:
  - khong anh huong flow review/quiz.

### Deliverable
- PR 1: backend tracking + recover rules
- PR 2: frontend onboarding/recover UX
- PR 3: cypress e2e onboarding recovery

---

## Tuan 2 - Adaptive Difficulty + Frustration Guard
### Muc tieu
- Giam fail lien tiep trong session.
- Tang session completion rate.

### Backend
- Nang cap logic difficulty theo 3 phien gan nhat:
  - accuracy
  - avg response_ms
  - wrong_streak
- Rule de xuat:
  - accuracy < 45% -> easy
  - 45-75% -> normal
  - > 75% va response_ms tot -> hard
- Mo rong event:
  - `difficulty_auto_adjust`
  - `switch_easy_mode` (manual)

### Frontend
- LearningSession page:
  - Hien badge difficulty hien tai.
  - Khi auto-adjust, show info nho de user hieu tai sao de/khon hon.
- Nham giam stress:
  - Hien hint sau N lan sai lien tiep.

### QA
- Unit test flow difficulty transitions.
- E2E testcase wrong_streak >= 3 -> switch easy -> complete.

### Deliverable
- PR 4: adaptive difficulty backend
- PR 5: UI thong bao difficulty + hint
- PR 6: tests

---

## Tuan 3 - Daily Loop (Goal + Reminder + Hearts)
### Muc tieu
- Tang daily return va claim rate.
- Don gian hoa vong lap hoc moi ngay.

### Backend
- Tinh toan `best send hour` don gian tu `last_activity_at`.
- Reminder policy:
  - Moi user toi da 1 reminder/day cho daily goal
  - 1 reminder onboarding/24h nhu hien tai
- Kiem tra refill hearts:
  - tranh over-refill
  - log transaction day du

### Frontend
- Learning page:
  - Gom `Daily Goal + Hearts + Streak Freeze` thanh 1 block hanh dong.
  - Nhan manh CTA: `Hoc tiep 5 phut`.
- Home page:
  - Them mini progress ring cho daily goal.

### QA
- Test edge case:
  - claim 2 lan
  - hearts = 0
  - refill boundary theo interval
- E2E daily loop:
  - start -> study -> claim -> notification read

### Deliverable
- PR 7: reminder scheduling + safeguards
- PR 8: daily loop UI
- PR 9: test update

---

## Tuan 4 - KPI Dashboard + Hardening + Release
### Muc tieu
- Co dashboard de ra quyet dinh product.
- Chot release on dinh.

### Backend
- Chot endpoint KPI baseline + onboarding funnel:
  - consistency field names
  - fixed time range defaults (7/28 ngay)
- Performance:
  - index check cho bang event/attempt/progress
  - cache check cho leaderboard/learning path
- Security/rate limit review lai endpoint nhay cam.

### Frontend
- Admin dashboard:
  - hien 5 KPI chinh (D1/D7, first lesson start, session completion, daily goal claim)
  - them filter 7d/28d
- Bug bash UX mobile:
  - learning path
  - session
  - review

### QA + Release
- Full test gate:
  - backend pytest full
  - frontend vitest + lint
  - cypress full
- Chot release note + rollback note.

### Deliverable
- PR 10: KPI hardening backend
- PR 11: admin KPI dashboard frontend
- PR 12: release checklist + docs

---

## 3) Thu tu uu tien neu thieu tai nguyen
1. Tuan 1 (onboarding/recover)
2. Tuan 2 (adaptive difficulty)
3. Tuan 3 (daily loop)
4. Tuan 4 (dashboard/hardening)

## 4) Definition of Done (DoD)
- Moi PR co test (unit/integration/e2e tuy scope).
- Khong giam pass rate cua test suite hien tai.
- Co metric truoc/sau (it nhat 1 KPI) cho tinh nang chinh.
- Co update docs endpoint neu payload thay doi.

## 5) Ke hoach chia nguoi (goi y)
- 1 Backend owner: learning flow + tasks + metrics
- 1 Frontend owner: learning pages + UX states
- 1 QA owner: cypress + regression + release checklist

## 6) Risk can canh bao som
- Drift giua docs va API implementation.
- Regression do thay doi reward/xp/hearts logic.
- Event tracking khong dong nhat key -> dashboard sai.

## 7) Dau ra cuoi ky (sau 4 tuan)
- 1 flow hoc daily khong dut doan tu placement den session va quay lai ngay sau.
- 1 bo KPI du tin cay de xep backlog quy tiep.
- 1 release on dinh, test gate xanh full.

## 8) Update thuc thi
### 2026-05-15 - Tuan 1 DONE
- Backend:
  - Chuan hoa payload cho `placement/status`, `session/recover`, `session/{id}/resume`.
  - Them source tracking cho onboarding/resume (`onboarding_source`, `resume_source`).
  - Them recover safeguard: auto-abandon session `started` bi stale (24h), chi recover session `started` con hop le.
- Frontend:
  - Learning page uu tien card `Continue Session` len tren.
  - Home page bo sung card `Continue Session` de quay lai session dang do.
  - Placement va start/resume session gui `source` xuong backend.
- Verify:
  - Backend full: `325 passed`
  - Frontend test: `43 passed`
  - Frontend lint: pass

### 2026-05-15 - Tuan 2 DONE
- Backend:
  - Nang cap adaptive difficulty dua tren 3 phien gan nhat (accuracy/response_ms/wrong_streak).
  - Bo sung tracking `difficulty_auto_adjust` va context ly do auto adjust.
  - Giu `switch_easy_mode` cho manual frustration guard.
- Frontend:
  - Learning session hien badge difficulty hien tai.
  - Hien `difficulty_hint` khi he thong auto adjust de user hieu ly do.
  - Hien canh bao som khi wrong streak tang de giam stress.
- Verify:
  - Unit/integration learning flow: pass.

### 2026-05-15 - Tuan 3 DONE
- Backend:
  - Reminder scheduling uu tien `preferred_hour`, fallback `last_activity_at`.
  - Hardening refill hearts: chong over-refill, handle future timestamp, clamp theo `max_hearts`.
- Frontend:
  - Learning page bo sung block daily loop + CTA `Hoc tiep 5 phut`.
  - Home page them mini progress ring cho daily goal + quick resume card.
- Verify:
  - Task tests edge case refill/reminder: pass.

### 2026-05-15 - Tuan 4 DONE
- Backend:
  - Bo sung KPI endpoints:
    - `GET /learning/kpi/baseline/?range=7d|28d`
    - `GET /learning/kpi/onboarding-funnel/?range=7d|28d`
  - Chuan hoa field KPI, default range, va admin permission.
- Frontend:
  - Admin dashboard them KPI block + filter 7d/28d.
  - Hien cac KPI chinh: D1/D7, first lesson start, session completion, daily goal claim, sessions/DAU.
- Verify (full test gate):
  - Backend full: `332 passed`
  - Frontend lint: pass
  - Frontend unit: `43 passed`
  - Frontend build: pass
  - Cypress e2e: `9 passed`

### 2026-05-16 - Tuan 4 hardening/release docs update
- Performance hardening bo sung:
  - Cache TTL cho `leaderboard`, `league/current`, `kpi/baseline`, `kpi/onboarding-funnel`.
- Security hardening bo sung:
  - Throttle read analytics scope `learning_analytics_read`.
- Release docs bo sung:
  - `docs/RELEASE_CHECKLIST_SELF_LEARNING.md`
  - `docs/ROLLBACK_SELF_LEARNING.md`
  - `docs/RELEASE_NOTES_SELF_LEARNING.md`
