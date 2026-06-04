# Deployment Folder

## Docker compose
- Dev stack: `deployment/docker/docker-compose.yml`
- Production stack: `deployment/docker/docker-compose.prod.yml`

Run from project root:

```bash
docker compose -f deployment/docker/docker-compose.yml up -d
docker compose -f deployment/docker/docker-compose.prod.yml up -d --build
```

## Nginx
- Dev reverse proxy: `deployment/nginx/nginx.conf`
- Security headers: `deployment/nginx/security_headers.conf`

Note:
- `frontend/nginx.conf` is still used inside the production frontend image.
