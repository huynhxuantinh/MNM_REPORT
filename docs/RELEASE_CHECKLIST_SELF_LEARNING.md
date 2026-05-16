# RELEASE CHECKLIST - SELF LEARNING

## 1) Pre-release
- [ ] Freeze merge window cho `backend/apps/learning`, `frontend/src/pages/Learning*`, `frontend/src/features/admin`.
- [ ] Xac nhan env production:
  - [ ] `DJANGO_SETTINGS_MODULE=config.settings.production`
  - [ ] `DEBUG=False`
  - [ ] `ALLOWED_HOSTS` da dung domain that.
- [ ] Verify migration status: `docker compose exec backend python manage.py showmigrations learning`.
- [ ] Backup DB production truoc release:
  - [ ] `docker compose exec postgres pg_dump -U $DB_USER $DB_NAME > backup_pre_release.sql`
- [ ] Confirm env vars:
  - [ ] `REDIS_URL`
  - [ ] `CELERY_BROKER_URL`
  - [ ] `CELERY_RESULT_BACKEND`
  - [ ] JWT/CORS vars

## 1.1) Migration review (0015, 0016)
- [ ] `0015_learningplan_paymentevent_learningsubscription_and_more`:
  - [ ] Tao bang legacy billing/class: `learning_plans`, `learning_payment_events`, `learning_subscriptions`.
- [ ] `0016_remove_legacy_teacher_and_billing_models`:
  - [ ] Xoa bang legacy: `Assignment`, `StudentClass`, `LearningPlan`, `PaymentEvent`, `LearningSubscription`.
- [ ] Precheck du lieu truoc khi apply `0016`:
  - [ ] `docker compose exec postgres psql -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) FROM learning_assignments;"`
  - [ ] `docker compose exec postgres psql -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) FROM learning_student_classes;"`
- [ ] Neu count > 0: export backup rieng cac bang legacy truoc khi migrate.

## 2) Test gate (must pass 100%)
- [ ] Backend full: `backend/.venv/Scripts/python -m pytest backend/apps -q`
- [ ] Frontend lint: `npm run lint` (in `frontend`)
- [ ] Frontend unit: `npm run test -- --run` (in `frontend`)
- [ ] Frontend build: `npm run build` (in `frontend`)
- [ ] Cypress full: `npm run cy:run` (in `frontend`)

## 2.1) Production apply plan
- [ ] Pull image/tag release.
- [ ] Apply migration:
  - [ ] `docker compose exec backend python manage.py migrate --noinput`
- [ ] Collect static:
  - [ ] `docker compose exec backend python manage.py collectstatic --noinput`
- [ ] Restart services:
  - [ ] `docker compose up -d backend celery-worker celery-beat frontend`
- [ ] Verify migration da apply:
  - [ ] `docker compose exec backend python manage.py showmigrations learning | findstr 0016`

## 3) Runtime checks sau deploy
- [ ] API health:
  - [ ] `GET /api/v1/learning/placement/status/`
  - [ ] `GET /api/v1/learning/session/recover/`
  - [ ] `GET /api/v1/learning/leaderboard/`
  - [ ] `GET /api/v1/learning/kpi/baseline/?range=7d` (admin)
- [ ] Celery checks:
  - [ ] `learning.send_review_reminders`
  - [ ] `learning.send_daily_goal_reminders`
  - [ ] `learning.refill_hearts`
- [ ] KPI dashboard:
  - [ ] Admin page load du 5 KPI chinh
  - [ ] Filter `7d/28d` tra ve du lieu dung format

## 4) Product smoke checks
- [ ] New user: placement -> first lesson start -> complete 1 session.
- [ ] Returning user: recover session -> resume -> finish.
- [ ] Daily loop: daily goal progress update + claim.
- [ ] Review flow: answer -> next due date update.

## 5) Observability and alerting
- [ ] Error rate khong tang bat thuong 30 phut dau.
- [ ] P95 API latency khong tang >20% so voi baseline gan nhat.
- [ ] No spike 429 bat thuong o learning endpoints.

## 6) Sign-off
- [x] Backend owner sign-off. (2026-05-16)
- [x] Frontend owner sign-off. (2026-05-16)
- [x] QA owner sign-off. (2026-05-16)
- [x] Release note da publish. (2026-05-16)
- [x] Rollback note da chuan bi: `docs/ROLLBACK_SELF_LEARNING.md`. (2026-05-16)

## 7) Release Execution Log (2026-05-16)
- [x] Frontend test gate da xanh:
  - [x] `npm run lint`
  - [x] `npm run test -- --run` (`43 passed`)
  - [x] `npm run build`
  - [x] `npm run cy:run` (`9/9 passed`)
- [x] Migration learning da chot:
  - [x] `0015` da duoc ghi nhan migration state.
  - [x] `0016` da apply thanh cong.
- [x] Deploy local bang Docker Compose da hoan tat:
  - [x] `backend`, `frontend`, `celery-worker`, `celery-beat`, `postgres`, `redis` dang `Up`.
  - [x] Smoke check: `http://127.0.0.1:5173` = 200, `http://127.0.0.1:8000/api/docs/` = 200.
- [ ] Backup production DB: CHUA thuc hien trong lan local deploy nay.
