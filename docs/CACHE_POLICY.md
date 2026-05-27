# Cache Policy - NoroStu

## 1) Long cache (public, immutable)

Use for static build files:
- `/assets/*` (JS/CSS chunks)
- `/static/*` (Django static)

Policy:
- `Cache-Control: public, immutable`
- long `expires` (30d to 1y)

## 2) Medium cache (public)

Use for media files:
- `/media/*`
- `/site.webmanifest`

Policy:
- `Cache-Control: public`
- `expires` around 7d

## 3) No-store (must not cache)

Use for sensitive dynamic content:
- `/api/*`
- `/admin/*`
- SPA shell for private/auth routes (served by `index.html`)

Policy:
- `Cache-Control: no-store, no-cache, must-revalidate, private`

## 4) Public route with short cache

Use for public marketing page:
- `/about`

Policy:
- `Cache-Control: public, max-age=300, must-revalidate`

## 5) Current implementation

Implemented in:
- `frontend/nginx.conf`

Rules already applied:
- API/Admin: no-store
- Assets: long immutable cache
- Media: 7d public cache
- SPA fallback: default no-store
- `/about`: short cache 300s
