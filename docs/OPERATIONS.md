# Operations - NoroStu

## 1) Cache policy

### Long cache
Use for static build files:
- `/assets/*` (JS/CSS chunks)
- `/static/*` (Django static)

Policy:
- `Cache-Control: public, immutable`
- long `expires` (30d to 1y)

### Medium cache
Use for media files:
- `/media/*`
- `/site.webmanifest`

Policy:
- `Cache-Control: public`
- `expires` around 7d

### No-store
Use for sensitive dynamic content:
- `/api/*`
- `/admin/*`
- SPA shell for private/auth routes

Policy:
- `Cache-Control: no-store, no-cache, must-revalidate, private`

### Short cache
Use for public route:
- `/about`

Policy:
- `Cache-Control: public, max-age=300, must-revalidate`

### Current implementation
Implemented in:
- `frontend/nginx.conf`

Not implemented in:
- `deployment/nginx/nginx.conf`

## 2) Performance

### Luu y khi do Lighthouse
Neu chay Lighthouse tren `npm run dev` hoac compose dev, diem Performance co the thap vi Vite dev server tai JavaScript chua minify.

De cham dung production, phai build va serve ban da toi uu.

### Cach do dung

#### Vite production preview
```bash
cd frontend
npm run build
npm run preview -- --host 0.0.0.0
```

Mo `http://localhost:4173`, dang nhap, sau do chay Lighthouse.

#### Docker production
```bash
docker compose -f deployment/docker/docker-compose.prod.yml up -d --build
```

Mo `http://localhost` neu `FRONTEND_PORT` khong duoc set. Neu `.env` co `FRONTEND_PORT=5173`, mo `http://localhost:5173`.

Khi deploy that:
```env
FRONTEND_PORT=80
VITE_API_BASE_URL=/api/v1
```

### Toi uu da co
- Frontend production build bang Vite
- JavaScript/CSS duoc minify trong `npm run build`
- Tach chunk vendor trong `frontend/vite.config.js`
- Route-level lazy loading trong `frontend/src/App.jsx`
- Nginx serve static frontend voi gzip
- Cache dai han cho `/assets/`
- `index.html` dung `no-cache`
- API, static va media duoc proxy qua backend

### Neu diem van thap
- Kiem tra lai dang chay tren production preview, khong phai dev server
- Chay Lighthouse o che do Incognito
- Xem tab Network de tim file lon
- Neu LCP cao do API cham, toi uu endpoint trang chu va them skeleton/loading
- Neu anh lon, doi sang WebP/AVIF va dat kich thuoc that

## 3) SEO

### Trang thai hien tai
NoroStu la SPA can dang nhap cho phan lon tinh nang hoc tap. SEO nang cao hien tai tap trung vao:
- Trang public `/`
- Metadata dung cho social preview
- Structured data cho brand va web app
- Robots/sitemap tranh index cac trang can dang nhap
- Performance production de ho tro Core Web Vitals

### Da cau hinh
- Title va meta description mac dinh trong `frontend/index.html`
- Open Graph va Twitter Card
- Canonical URL theo route trong `frontend/src/utils/seo.js`
- JSON-LD:
  - `Organization`
  - `WebSite`
  - `WebApplication`
  - `WebPage` theo route
- `site.webmanifest` tai `frontend/img/site.webmanifest`
- `robots.txt` tai `frontend/public/robots.txt`
- `sitemap.xml` tai `frontend/public/sitemap.xml`

### Nguyen tac index
Nen index:
- `/`
- `/about`

Khong nen index:
- `/login`, `/register`, `/verify-email`
- `/admin`
- `/vocabulary`, `/wordsets`, `/learning`, `/review`, `/quiz`
- `/profile`, `/notifications`, `/leaderboard`

Ly do: phan lon la trang private, can dang nhap, khong phu hop de index.

### Viec can lam neu muon SEO manh hon
1. Them landing page public day du cho `/`
2. Them cac trang public:
   - `/features`
   - `/srs`
   - `/quiz-learning`
   - `/english-vocabulary`
3. Neu muon rank tu khoa canh tranh, can SSR hoac prerender
4. Tao Open Graph image 1200x630 rieng
5. Ket noi Google Search Console sau khi deploy

### Kiem tra sau deploy
```bash
npm run build
npm run preview -- --host 0.0.0.0
```

Kiem tra:
- `https://norostu.com/robots.txt`
- `https://norostu.com/sitemap.xml`
- view source co title, description, canonical, JSON-LD
- Rich Results Test khong bao loi schema nghiem trong
- Lighthouse SEO >= 95
