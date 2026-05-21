# Performance Guide - NoroStu

## Van de tren Lighthouse

Neu chay Lighthouse tren `npm run dev` hoac `docker compose up -d` mac dinh, diem Performance co the thap vi Vite dev server tai JavaScript chua minify va phuc vu file phuc vu debug.

De cham dung ban production, phai build va serve ban da toi uu.

## Chay Lighthouse dung cach

### Cach 1: Vite production preview

```bash
cd frontend
npm run build
npm run preview -- --host 0.0.0.0
```

Mo `http://localhost:4173`, dang nhap, sau do chay Lighthouse.

### Cach 2: Docker production

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Mo `http://localhost` neu `FRONTEND_PORT` khong duoc set. Neu `.env` dang co `FRONTEND_PORT=5173`, mo `http://localhost:5173`.

Khi deploy len server that, nen set:

```env
FRONTEND_PORT=80
VITE_API_BASE_URL=/api/v1
```

## Nhung toi uu da cau hinh

- Frontend production build bang Vite.
- JavaScript/CSS duoc minify trong `npm run build`.
- Tach chunk vendor trong `frontend/vite.config.js`.
- Route-level lazy loading trong `frontend/src/App.jsx`.
- Nginx serve static frontend voi gzip.
- Cache dai han cho `/assets/`.
- `index.html` dung `no-cache` de tranh ket app shell cu.
- API, static va media duoc proxy qua backend.

## Neu diem van thap

- Kiem tra lai dang chay tren port production, khong phai `5173`.
- Chay Lighthouse o che do Incognito de giam anh huong extension.
- Dung tab Network de xem file nao lon nhat.
- Neu LCP cao do API cham, toi uu endpoint trang chu va them skeleton/loading state.
- Neu anh lon, doi sang WebP/AVIF va dat kich thuoc that tren UI.
