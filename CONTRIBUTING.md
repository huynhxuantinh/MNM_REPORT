# Contributing to NoroStu

Cam on ban da muon dong gop cho du an.

## 1. Before You Start
- Fork repo va tao branch moi cho tung thay doi.
- Dat ten branch ro rang, vi du:
  - `feat/add-review-filter`
  - `fix/login-redirect-loop`
  - `docs/update-setup`

## 2. Local Setup
- Doc tai lieu setup:
  - `README.md`
  - `docs/SETUP.md`
  - `docs/COMMANDS.md`

## 3. Coding Rules
- Backend: Django + DRF, follow PEP8.
- Frontend: React + Vite, follow ESLint rules.
- Ten bien/ham: English, camelCase o frontend.
- Khong commit secrets (`.env`, keys, tokens).

## 4. Required Checks
Truoc khi mo Pull Request, hay chay:

```bash
# backend
docker compose exec -T backend pytest apps -q

# frontend
cd frontend
npm run lint
npm run test -- --run
npm run build
npm run cy:run
```

Tat ca check phai PASS.

## 5. Commit Style
- Viet commit message ngan, ro y:
  - `feat: add placement entry gate`
  - `fix: prevent duplicate lesson completion`
  - `docs: add release checklist`

## 6. Pull Request Checklist
- Mo ta muc tieu thay doi.
- Liet ke file/chuc nang bi anh huong.
- Dinh kem ket qua test (log hoac screenshot).
- Neu co thay doi UI, them screenshot truoc/sau.

## 7. Reporting Bugs
Khi tao bug report, vui long cung cap:
- Mo ta loi ngan gon
- Cach reproduce
- Ket qua mong doi vs ket qua thuc te
- Environment (OS, browser, Node/Python version)
- Log loi neu co

## 8. Code of Conduct
Ton trong, xay dung, va review tren tinh than hop tac.

