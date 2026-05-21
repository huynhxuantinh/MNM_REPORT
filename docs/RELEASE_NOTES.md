# Release Notes - NoroStu

## Version
- `v1.0.0`
- Release date: `2026-05-21`
- Status: `Production Ready`

## Scope
Ban release nay chot he thong hoc tieng Anh theo mo hinh self-learning:
- Lesson session
- Review SRS (SM-2)
- Quiz
- Leaderboard
- Admin management (users/words/lessons/quizzes)

## Highlights
- Chuan hoa brand toan he thong sang **NoroStu**.
- On dinh hoa flow onboarding/placement cho user moi.
- Tach seed command ro rang:
  - `seed_data` (tai khoan + du lieu co ban)
  - `seed_full_catalog --clear` (full catalog)
- Hoan thien SEO co ban:
  - Meta title/description theo route
  - `robots.txt`
  - `sitemap.xml`
  - Canonical + Open Graph + Twitter meta
- Don dep docs va chuan hoa tai lieu deploy/release.

## Quality Gate Result
- Backend tests: **335 passed**
- Frontend lint: **PASS**
- Frontend unit/integration tests: **43 passed**
- Frontend build: **PASS**
- Cypress E2E: **9 passed**

## Deployment Notes
- Yêu cau backup DB production truoc khi deploy.
- Apply migration trong release window.
- Restart celery worker/beat sau deploy backend.
- Smoke test bat buoc: auth, learning, review, quiz, notifications, admin.

## Known Limitations
- Hien tai la SPA client-side, SEO da o muc co ban (khong SSR/prerender).
- Can tiep tuc toi uu SEO nang cao neu can rank manh o trang con.

## Rollback Strategy
- Rollback app ve image/tag truoc neu co blocker.
- Restore DB backup neu migration/data issue nghiem trong.
- Re-run smoke test sau rollback.

## Sign-off
- Backend owner: `__________`
- Frontend owner: `__________`
- QA owner: `__________`
- Final decision: `GO / NO-GO`

