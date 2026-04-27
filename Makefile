# ── MNM Learn English — Makefile ──────────────────────────────────

.PHONY: help up down build logs shell-backend shell-db migrate import-words seed test-backend test-frontend

help:
	@echo "Các lệnh có sẵn:"
	@echo "  make up            - Khởi động tất cả service"
	@echo "  make down          - Dừng tất cả service"
	@echo "  make build         - Build lại Docker images"
	@echo "  make logs          - Xem log realtime"
	@echo "  make shell-backend - Vào shell Django"
	@echo "  make shell-db      - Vào psql"
	@echo "  make migrate       - Chạy database migrations"
	@echo "  make import-words  - Import 500 từ vựng A1-B1 từ CSV"
	@echo "  make seed          - Tạo tài khoản và bài học mẫu"
	@echo "  make test-backend  - Chạy pytest backend"
	@echo "  make test-frontend - Chạy Vitest frontend"

up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose build --no-cache

logs:
	docker compose logs -f

shell-backend:
	docker compose exec backend python manage.py shell

shell-db:
	docker compose exec postgres psql -U $${DB_USER} -d $${DB_NAME}

migrate:
	docker compose exec backend python manage.py migrate

import-words:
	docker compose exec backend python manage.py import_words data/words.csv

seed:
	docker compose exec backend python manage.py seed_data

test-backend:
	docker compose exec backend pytest

test-frontend:
	docker compose exec frontend npm test
