# Advanced SEO - NoroStu

## Trang thai hien tai

NoroStu la SPA can dang nhap cho phan lon tinh nang hoc tap. Vi vay SEO nang cao tap trung vao:

- Trang public `/`.
- Metadata dung cho social preview.
- Structured data cho brand va web app.
- Robots/sitemap tranh index cac trang can dang nhap.
- Performance production de ho tro Core Web Vitals.

## Da cau hinh

- Title va meta description mac dinh trong `frontend/index.html`.
- Open Graph va Twitter Card.
- Canonical URL theo route trong `frontend/src/utils/seo.js`.
- JSON-LD:
  - `Organization`
  - `WebSite`
  - `WebApplication`
  - `WebPage` theo route
- `site.webmanifest` cho PWA metadata (hien dang luu tai `frontend/img/site.webmanifest`).
- `robots.txt` chan cac trang private (file that: `frontend/public/robots.txt`).
- `sitemap.xml` chi liet ke URL public co the index (file that: `frontend/public/sitemap.xml`).

## Nguyen tac index

Nen index:

- `/` neu domain co noi dung public ro rang.
- `/about` vi day la trang gioi thieu public cua NoroStu.

Khong nen index:

- `/login`, `/register`, `/verify-email`
- `/admin`
- `/vocabulary`, `/wordsets`, `/learning`, `/review`, `/quiz`
- `/profile`, `/notifications`, `/leaderboard`

Ly do: cac trang nay can dang nhap, crawler khong thay noi dung hoc tap that nen de index se tao trang mong, redirect hoac duplicate.

## Viec can lam neu muon SEO manh hon

1. Them landing page public that su cho `/` voi noi dung gioi thieu NoroStu, loi ich SRS, quiz, lo trinh hoc va CTA dang ky.
2. Them cac trang public:
   - `/features`
   - `/srs`
   - `/quiz-learning`
   - `/english-vocabulary`
3. Neu muon rank tu khoa canh tranh, can SSR hoac prerender cac trang public.
4. Tao Open Graph image rieng kich thuoc 1200x630 thay vi dung logo nho.
5. Ket noi Google Search Console sau khi deploy domain that.

## Kiem tra sau deploy

```bash
npm run build
npm run preview -- --host 0.0.0.0
```

Kiem tra:

- `https://norostu.com/robots.txt`
- `https://norostu.com/sitemap.xml`
- Neu domain khac `norostu.com`, cap nhat lai URL trong 2 file tren truoc khi deploy.
- View source co title, description, canonical, JSON-LD.
- Rich Results Test khong bao loi schema nghiem trong.
- Lighthouse SEO >= 95.
