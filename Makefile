# â”€â”€ NoroStu â€” Makefile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

.PHONY: help up down build logs shell-backend shell-db migrate import-words seed test-backend test-frontend

help:
	@echo "CĂ¡c lá»‡nh cĂ³ sáºµn:"
	@echo "  make up            - Khá»Ÿi Ä‘á»™ng táº¥t cáº£ service"
	@echo "  make down          - Dá»«ng táº¥t cáº£ service"
	@echo "  make build         - Build láº¡i Docker images"
	@echo "  make logs          - Xem log realtime"
	@echo "  make shell-backend - VĂ o shell Django"
	@echo "  make shell-db      - VĂ o psql"
	@echo "  make migrate       - Cháº¡y database migrations"
	@echo "  make import-words  - Import 500 tá»« vá»±ng A1-B1 tá»« CSV"
	@echo "  make seed          - Táº¡o tĂ i khoáº£n vĂ  bĂ i há»c máº«u"
	@echo "  make test-backend  - Cháº¡y pytest backend"
	@echo "  make test-frontend - Cháº¡y Vitest frontend"

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

