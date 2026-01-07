# TechTrace - Docker Compose Helper Commands

.PHONY: help build up down logs restart clean shell-backend shell-db test migrate collectstatic

# Colores
GREEN  := $(shell tput -Txterm setaf 2)
YELLOW := $(shell tput -Txterm setaf 3)
WHITE  := $(shell tput -Txterm setaf 7)
CYAN   := $(shell tput -Txterm setaf 6)
RESET  := $(shell tput -Txterm sgr0)

help: ## Mostrar esta ayuda
	@echo ''
	@echo '${GREEN}TechTrace - Comandos Docker Compose${RESET}'
	@echo ''
	@echo 'Uso:'
	@echo '  ${YELLOW}make${RESET} ${CYAN}<target>${RESET}'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} { \
		if (/^[a-zA-Z_-]+:.*?##.*$$/) {printf "  ${YELLOW}%-20s${CYAN}%s${RESET}\n", $$1, $$2} \
		else if (/^## .*$$/) {printf "  ${CYAN}%s${RESET}\n", substr($$1,4)} \
		}' $(MAKEFILE_LIST)

build: ## Construir todas las imágenes Docker
	@echo "${GREEN}Construyendo imágenes Docker...${RESET}"
	docker-compose build

up: ## Levantar todos los servicios
	@echo "${GREEN}Levantando servicios...${RESET}"
	docker-compose up -d
	@echo "${GREEN}Servicios levantados. Accede a:${RESET}"
	@echo "${CYAN}  - Frontend: http://localhost${RESET}"
	@echo "${CYAN}  - Backend API: http://localhost/api${RESET}"
	@echo "${CYAN}  - Django Admin: http://localhost/admin${RESET}"

down: ## Detener todos los servicios
	@echo "${YELLOW}Deteniendo servicios...${RESET}"
	docker-compose down

logs: ## Ver logs de todos los servicios
	docker-compose logs -f

logs-backend: ## Ver logs del backend
	docker-compose logs -f backend

logs-frontend: ## Ver logs del frontend
	docker-compose logs -f frontend

logs-nginx: ## Ver logs de nginx
	docker-compose logs -f nginx

logs-db: ## Ver logs de la base de datos
	docker-compose logs -f db

restart: ## Reiniciar todos los servicios
	@echo "${YELLOW}Reiniciando servicios...${RESET}"
	docker-compose restart

restart-backend: ## Reiniciar solo el backend
	docker-compose restart backend

restart-frontend: ## Reiniciar solo el frontend
	docker-compose restart frontend

shell-backend: ## Acceder al shell del contenedor backend
	docker-compose exec backend /bin/bash

shell-db: ## Acceder al shell de PostgreSQL
	docker-compose exec db psql -U techtrace_user -d techtrace_db

migrate: ## Ejecutar migraciones de Django
	docker-compose exec backend python manage.py migrate

makemigrations: ## Crear nuevas migraciones
	docker-compose exec backend python manage.py makemigrations

collectstatic: ## Recolectar archivos estáticos
	docker-compose exec backend python manage.py collectstatic --noinput

createsuperuser: ## Crear un superusuario
	docker-compose exec backend python manage.py createsuperuser

test: ## Ejecutar tests del backend
	docker-compose exec backend python manage.py test

clean: ## Limpiar contenedores, volúmenes e imágenes
	@echo "${YELLOW}¿Estás seguro? Esto eliminará todos los contenedores, volúmenes e imágenes de TechTrace.${RESET}"
	@echo "Presiona Ctrl+C para cancelar, Enter para continuar..."
	@read _
	docker-compose down -v
	docker volume rm techtrace_postgres_data techtrace_static_files techtrace_media_files 2>/dev/null || true
	docker rmi tech-trace_backend tech-trace_frontend 2>/dev/null || true

rebuild: ## Reconstruir y reiniciar todos los servicios
	@echo "${YELLOW}Reconstruyendo servicios...${RESET}"
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d

status: ## Ver estado de los servicios
	docker-compose ps

backup-db: ## Crear backup de la base de datos
	@echo "${GREEN}Creando backup de la base de datos...${RESET}"
	docker-compose exec -T db pg_dump -U techtrace_user techtrace_db > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "${GREEN}Backup creado exitosamente${RESET}"

restore-db: ## Restaurar backup de la base de datos (uso: make restore-db FILE=backup.sql)
	@echo "${YELLOW}Restaurando backup: $(FILE)${RESET}"
	docker-compose exec -T db psql -U techtrace_user -d techtrace_db < $(FILE)
	@echo "${GREEN}Backup restaurado exitosamente${RESET}"
