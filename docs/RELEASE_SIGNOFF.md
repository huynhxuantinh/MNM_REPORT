# RELEASE SIGN-OFF (Self-learning)

Date: `2026-05-27`
Scope: self-learning only (`no teacher flow`, `no payment/subscription flow` runtime)

## 1) Quality Gate
- Backend check: `python manage.py check` -> PASS
- Backend test full: `pytest apps -q` -> `335 passed`
- Frontend lint: `npm run lint` -> PASS
- Frontend test: `npm run test -- --run` -> `43 passed`
- Frontend build: `npm run build` -> PASS
- Cypress E2E: chua run lai trong dot nay (lan gan nhat: `9 passed`, `2026-05-21`)

## 2) Dot 1 -> Dot 6 da chot
- Dot 1: them `frontend/public/robots.txt`, `frontend/public/sitemap.xml`
- Dot 2: dong bo docs nginx dev/prod (`nginx/nginx.conf` vs `frontend/nginx.conf`)
- Dot 3: chuan hoa text UI luong learning (VN text, thong bao, fallback)
- Dot 4: dong bo route docs theo backend URL thuc te
- Dot 5: verify backend/frontend gate + cleanup wording self-learning
- Dot 6: final sign-off va release handoff

## 3) Pre-deploy command checklist
```bash
# backend
cd backend
.venv\Scripts\python.exe manage.py check
.venv\Scripts\python.exe -m pytest apps -q

# frontend
cd ../frontend
npm run lint
npm run test -- --run
npm run build
```

## 4) Deploy sequence (quick)
```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate
docker compose -f docker-compose.prod.yml logs -f backend
```

## 5) Smoke after deploy
- Login/Register/Verify email
- Onboarding -> Placement -> Learning session
- Review SRS
- Quiz generate + submit
- Notifications read/read-all
- Admin pages: users/words/lessons/quiz results

## 6) GO/NO-GO
- Backend owner: `______`
- Frontend owner: `______`
- QA owner: `______`
- Final decision: `GO / NO-GO`
