# COMMANDS NoroStu

## Docker
```bash
docker compose up -d
docker compose down
docker compose down -v
docker compose logs -f backend
```

Production/Lighthouse:
```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml down
```

## Backend
```bash
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py check
```

## Seed data
```bash
docker compose exec backend python manage.py import_words data/words.csv
docker compose exec backend python manage.py seed_data
docker compose exec backend python manage.py seed_full_catalog --clear
```

## Test
Backend:
```bash
docker compose exec -T backend pytest apps -q
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

## Celery
```bash
docker compose exec backend celery -A celery worker -l info
docker compose exec backend celery -A celery beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```
