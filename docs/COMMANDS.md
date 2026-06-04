# COMMANDS NoroStu

## Docker
```bash
docker compose -f deployment/docker/docker-compose.yml up -d
docker compose -f deployment/docker/docker-compose.yml down
docker compose -f deployment/docker/docker-compose.yml down -v
docker compose -f deployment/docker/docker-compose.yml logs -f backend
```

Nginx config:
- Dev proxy: `deployment/nginx/nginx.conf`
- Production frontend: `frontend/nginx.conf`

Production/Lighthouse:
```bash
docker compose --env-file .env -f deployment/docker/docker-compose.prod.yml up -d --build
docker compose --env-file .env -f deployment/docker/docker-compose.prod.yml down
docker compose --env-file .env -f deployment/docker/docker-compose.prod.yml logs -f frontend
```

Check config frontend Nginx trong production container:
```bash
docker compose --env-file .env -f deployment/docker/docker-compose.prod.yml exec frontend cat /etc/nginx/conf.d/default.conf
```

## Backend
```bash
docker compose -f deployment/docker/docker-compose.yml exec backend python manage.py migrate
docker compose -f deployment/docker/docker-compose.yml exec backend python manage.py makemigrations
docker compose -f deployment/docker/docker-compose.yml exec backend python manage.py check
```

## Seed data
```bash
docker compose -f deployment/docker/docker-compose.yml exec backend python manage.py import_words database/seed/words.csv
docker compose -f deployment/docker/docker-compose.yml exec backend python manage.py seed_data
docker compose -f deployment/docker/docker-compose.yml exec backend python manage.py seed_full_catalog --clear
```

## Test
Backend:
```bash
docker compose -f deployment/docker/docker-compose.yml exec -T backend pytest apps -q
```

Frontend:
```bash
cd frontend
npm run lint
npm run test -- --run
npm run build
npm run preview -- --host 0.0.0.0
npm run cy:run
```

Frontend source layout:
- Pages auth: `frontend/src/pages/auth/`
- Pages public: `frontend/src/pages/public/`
- Pages user: `frontend/src/pages/user/`
- API/services: `frontend/src/services/`

## Celery
```bash
docker compose -f deployment/docker/docker-compose.yml exec backend celery -A config.celery worker -l info
docker compose -f deployment/docker/docker-compose.yml exec backend celery -A config.celery beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

Legacy shortcut (van ho tro):
```bash
docker compose up -d
```
