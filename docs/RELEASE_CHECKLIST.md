# Release Checklist (NoroStu)

## 1) Pre-release (bat buoc)
- [ ] Backup database production.
- [ ] Xac nhan branch/tag release dung.
- [ ] Cap nhat bien moi truong production (neu co thay doi).
- [ ] Chot migration se apply trong release nay.

## 2) Quality Gate
- [ ] Backend test PASS.
- [ ] Frontend lint PASS.
- [ ] Frontend unit/integration test PASS.
- [ ] Frontend build PASS.
- [ ] Cypress E2E PASS.

## 3) Deploy
- [ ] Deploy backend.
- [ ] Apply migration production.
- [ ] Deploy frontend.
- [ ] Restart service worker/celery/beat (neu can).

## 4) Smoke Test Production
- [ ] Dang nhap/Dang xuat.
- [ ] Hoc lesson session.
- [ ] On tap SRS + submit dap an.
- [ ] Quiz flow.
- [ ] Notification flow.
- [ ] Admin pages (users/words/lessons/quizzes).

## 5) Post-release
- [ ] Kiem tra log loi 15-30 phut dau.
- [ ] Kiem tra metric chinh (5xx, latency, error rate).
- [ ] Xac nhan khong can rollback.

## 6) Sign-off
- [ ] Backend owner: ___
- [ ] Frontend owner: ___
- [ ] QA owner: ___
- [ ] Time release: ___
- [ ] Final status: GO / NO-GO

