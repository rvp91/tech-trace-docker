#!/bin/bash

# TechTrace - Script de Inicio Rápido

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}TechTrace - Inicio Rápido${NC}"
echo -e "${GREEN}========================================${NC}"

# Verificar que Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker no está instalado${NC}"
    exit 1
fi

# Verificar que Docker Compose está instalado
if ! command -v docker &> /dev/null || ! docker compose version &> /dev/null 2>&1; then
    echo -e "${RED}Error: Docker Compose no está instalado${NC}"
    exit 1
fi

# Crear archivo .env si no existe
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creando archivo .env desde .env.example...${NC}"
    cp .env.example .env

    # Generar SECRET_KEY aleatoria
    if command -v python3 &> /dev/null; then
        SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_urlsafe(50))')
        sed -i "s|SECRET_KEY=.*|SECRET_KEY=$SECRET_KEY|" .env
        echo -e "${GREEN}✓ SECRET_KEY generada automáticamente${NC}"
    fi

    # Generar contraseña de PostgreSQL aleatoria
    POSTGRES_PASSWORD=$(openssl rand -base64 32)
    sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$POSTGRES_PASSWORD|" .env
    echo -e "${GREEN}✓ Contraseña de PostgreSQL generada automáticamente${NC}"

    echo -e "${YELLOW}⚠ Por favor, revisa y ajusta el archivo .env según tus necesidades${NC}"
fi

# Construir imágenes
echo -e "${YELLOW}Construyendo imágenes Docker...${NC}"
docker compose build

# Levantar servicios
echo -e "${YELLOW}Levantando servicios...${NC}"
docker compose up -d

# Esperar a que los servicios estén listos
echo -e "${YELLOW}Esperando a que los servicios estén listos...${NC}"
sleep 10

# Verificar estado
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Estado de los servicios:${NC}"
echo -e "${GREEN}========================================${NC}"
docker compose ps

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}TechTrace está listo!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Accede a:${NC}"
echo -e "  ${YELLOW}Frontend:${NC}     http://localhost"
echo -e "  ${YELLOW}Backend API:${NC}  http://localhost/api"
echo -e "  ${YELLOW}Django Admin:${NC} http://localhost/admin"
echo ""
echo -e "${GREEN}Credenciales por defecto:${NC}"
echo -e "  ${YELLOW}Username:${NC} admin"
echo -e "  ${YELLOW}Email:${NC}    admin@techtrace.com"
echo -e "  ${YELLOW}Password:${NC} admin123"
echo ""
echo -e "${GREEN}Comandos útiles:${NC}"
echo -e "  ${YELLOW}make logs${NC}         - Ver logs de todos los servicios"
echo -e "  ${YELLOW}make logs-backend${NC} - Ver logs del backend"
echo -e "  ${YELLOW}make down${NC}         - Detener servicios"
echo -e "  ${YELLOW}make help${NC}         - Ver todos los comandos"
echo ""
