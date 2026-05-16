# ROLLBACK RUNBOOK - SELF LEARNING

## Khi nao rollback
- Ty le 5xx tang lien tuc > 10 phut.
- Session start/answer/finish bi fail hang loat.
- KPI endpoint gay load cao bat thuong hoac timeout.

## Muc tieu rollback
- Dua app ve release truoc o muc on dinh.
- Khong mat du lieu hoc tap quan trong.

## Quy trinh rollback
1. Thong bao team va dong bang deploy moi.
2. Rollback image:
   - Backend: ve tag truoc.
   - Frontend: ve build truoc.
3. Restart services theo thu tu:
   - backend
   - celery-worker
   - celery-beat
   - frontend
4. Verify nhanh:
   - login
   - learning session start/answer/finish
   - leaderboard
   - admin KPI

## Luu y DB migration
- Neu release co migration additive (chi add field/index): rollback app code duoc, migration co the giu nguyen.
- Neu release co migration destructive: phai co DB backup truoc, rollback theo backup snapshot.

## Luu y rieng cho migration 0015/0016
- `0016` la destructive (drop bang legacy assignment/class/payment).
- Rollback code sau khi da apply `0016` se KHONG phuc hoi du lieu cac bang da drop.
- Neu can phuc hoi du lieu legacy:
  1. restore DB backup pre-release
  2. deploy lai image cu
  3. khong apply tiep `0016` cho den khi da export/migrate du lieu can giu.

## Lenh tham khao
```bash
# 1) rollback image/tag (vi du)
docker compose pull
docker compose up -d backend celery-worker celery-beat frontend

# 2) neu can restore DB
# yeu cau file backup_pre_release.sql tao truoc release
docker compose exec -T postgres psql -U $DB_USER -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();"
docker compose exec -T postgres psql -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
docker compose exec -T postgres psql -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;"
docker compose exec -T postgres psql -U $DB_USER -d $DB_NAME < backup_pre_release.sql

# Kiem tra log
docker compose logs -f backend
docker compose logs -f celery-worker
```

## Post-rollback
- Tao incident note: thoi gian, trieu chung, nguyen nhan tam thoi.
- Mo issue fix-forward voi priority cao.
- Chot CAPA truoc khi release lai.
