# Deployment Plan - NoroStu

## 0) Muc tieu
- Deploy ban production on dinh, co the rollback nhanh neu co su co.
- Dam bao full gate PASS truoc khi release.

## 1) Scope release
- Backend: Django + DRF
- Frontend: React + Vite build
- Services: PostgreSQL, Redis, Celery Worker, Celery Beat, Nginx

## 2) Pre-deploy checklist
- [ ] Code da merge vao branch release.
- [ ] Test gate xanh:
  - Backend test PASS
  - Frontend lint/test/build PASS
  - Cypress E2E PASS
- [ ] Backup database production.
- [ ] Chot migration can apply.
- [ ] Xac nhan bien moi truong production (`.env` prod).

## 3) Ke hoach downtime
- Muc tieu: downtime toi thieu (1-5 phut cho migration nhe).
- Thong bao truoc cho user neu co migration co nguy co lock bang.

## 4) Trinh tu deploy
### 4.1 Pull source + build image
- [ ] Pull tag/commit release tren server.
- [ ] Build image moi cho backend/frontend.

### 4.2 Apply backend changes
- [ ] Chay migration production.
- [ ] Collect static (neu pipeline yeu cau rieng).
- [ ] Restart backend app.

### 4.3 Restart async services
- [ ] Restart celery worker.
- [ ] Restart celery beat.
- [ ] Kiem tra worker da nhan task.

### 4.4 Switch frontend
- [ ] Deploy build frontend moi.
- [ ] Reload/restart Nginx.
- [ ] Verify `robots.txt` va `sitemap.xml` tren domain that.

## 5) Smoke test sau deploy (bat buoc)
- [ ] Dang nhap / dang xuat.
- [ ] Onboarding / placement flow.
- [ ] Lesson session + submit answer.
- [ ] Review SRS.
- [ ] Quiz flow.
- [ ] Notifications.
- [ ] Admin pages: users / words / lessons / quizzes.

## 6) Monitoring 30-60 phut dau
- [ ] Theo doi 5xx rate backend.
- [ ] Theo doi log app/celery.
- [ ] Theo doi latency API chinh (`/learning`, `/review`, `/quiz`).
- [ ] Theo doi error frontend (console/Sentry neu co).

## 7) Rollback plan
- [ ] Neu loi nghiem trong: rollback app ve image/tag truoc.
- [ ] Neu migration gay loi:
  - Dung ghi data moi
  - Khoi phuc DB tu backup
  - Redeploy version truoc
- [ ] Re-run smoke test sau rollback.

## 8) Sign-off
- [ ] Backend owner: ___
- [ ] Frontend owner: ___
- [ ] QA owner: ___
- [ ] Thoi gian deploy: ___
- [ ] Ket luan: GO / NO-GO

