#!/bin/bash
set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}TechTrace Backend - Docker Entrypoint${NC}"
echo -e "${GREEN}========================================${NC}"

# Función para esperar a que PostgreSQL esté listo
wait_for_postgres() {
    echo -e "${YELLOW}Esperando a PostgreSQL...${NC}"

    until PGPASSWORD=$DATABASE_PASSWORD psql -h "$DATABASE_HOST" -U "$DATABASE_USER" -d "$DATABASE_NAME" -c '\q' 2>/dev/null; do
        echo -e "${YELLOW}PostgreSQL no está disponible - esperando...${NC}"
        sleep 2
    done

    echo -e "${GREEN}✓ PostgreSQL está listo${NC}"
}

# Esperar a PostgreSQL
wait_for_postgres

# Ejecutar migraciones
echo -e "${YELLOW}Ejecutando migraciones de base de datos...${NC}"
python manage.py migrate --noinput

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Migraciones completadas exitosamente${NC}"
else
    echo -e "${RED}✗ Error al ejecutar migraciones${NC}"
    exit 1
fi

# Recolectar archivos estáticos
echo -e "${YELLOW}Recolectando archivos estáticos...${NC}"
python manage.py collectstatic --noinput --clear

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Archivos estáticos recolectados${NC}"
else
    echo -e "${RED}✗ Error al recolectar archivos estáticos${NC}"
    exit 1
fi

# Crear superusuario si no existe (solo en desarrollo)
if [ "$DEBUG" = "True" ] || [ "$CREATE_SUPERUSER" = "True" ]; then
    echo -e "${YELLOW}Creando superusuario de prueba (si no existe)...${NC}"
    python manage.py shell << EOF
from apps.users.models import User
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser(
        username='admin',
        email='admin@techtrace.com',
        password='admin123',
        first_name='Admin',
        last_name='TechTrace'
    )
    print('✓ Superusuario creado: admin / admin123')
else:
    print('✓ Superusuario ya existe')
EOF
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Iniciando servidor Gunicorn...${NC}"
echo -e "${GREEN}========================================${NC}"

# Ejecutar el comando proporcionado (CMD del Dockerfile)
exec "$@"
