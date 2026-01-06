#!/bin/bash

# Script de configuración inicial para TechTrace Backend
# Uso: ./setup.sh [desarrollo|produccion]

set -e

ENVIRONMENT=${1:-desarrollo}
BACKEND_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "🚀 Configurando TechTrace Backend - Entorno: $ENVIRONMENT"
echo "================================================"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# 1. Verificar Python
echo ""
echo "1️⃣  Verificando Python..."
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 no está instalado"
    exit 1
fi

PYTHON_VERSION=$(python3 --version)
print_success "Python instalado: $PYTHON_VERSION"

# 2. Crear entorno virtual si no existe
echo ""
echo "2️⃣  Configurando entorno virtual..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    print_success "Entorno virtual creado"
else
    print_warning "Entorno virtual ya existe"
fi

# 3. Activar entorno virtual
source venv/bin/activate
print_success "Entorno virtual activado"

# 4. Actualizar pip
echo ""
echo "3️⃣  Actualizando pip..."
pip install --upgrade pip > /dev/null 2>&1
print_success "pip actualizado"

# 5. Instalar dependencias
echo ""
echo "4️⃣  Instalando dependencias..."
pip install -r requirements.txt > /dev/null 2>&1
print_success "Dependencias instaladas"

# 6. Configurar archivo .env
echo ""
echo "5️⃣  Configurando variables de entorno..."
if [ ! -f ".env" ]; then
    cp .env.example .env

    # Generar SECRET_KEY única
    SECRET_KEY=$(python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')

    # Reemplazar SECRET_KEY en .env
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/SECRET_KEY=.*/SECRET_KEY=$SECRET_KEY/" .env
    else
        # Linux
        sed -i "s/SECRET_KEY=.*/SECRET_KEY=$SECRET_KEY/" .env
    fi

    if [ "$ENVIRONMENT" = "produccion" ]; then
        # Configurar para producción
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' 's/DEBUG=True/DEBUG=False/' .env
        else
            sed -i 's/DEBUG=True/DEBUG=False/' .env
        fi
        print_warning "Configurado para PRODUCCIÓN - Revisa .env antes de continuar"
        print_info "Debes configurar:"
        print_info "  - ALLOWED_HOSTS"
        print_info "  - CORS_ALLOWED_ORIGINS"
        print_info "  - Variables de base de datos PostgreSQL"
        print_info "  - Variables de seguridad"
    else
        print_success "Archivo .env creado para DESARROLLO"
    fi
else
    print_warning "Archivo .env ya existe - no se modificará"
fi

# 7. Crear directorios necesarios
echo ""
echo "6️⃣  Creando directorios necesarios..."
mkdir -p staticfiles
mkdir -p media
print_success "Directorios creados"

# 8. Ejecutar migraciones
echo ""
echo "7️⃣  Ejecutando migraciones de base de datos..."
python manage.py makemigrations --noinput
python manage.py migrate --noinput
print_success "Migraciones completadas"

# 9. Crear superusuario (solo en desarrollo)
if [ "$ENVIRONMENT" = "desarrollo" ]; then
    echo ""
    echo "8️⃣  Crear superusuario (opcional)..."
    read -p "¿Deseas crear un superusuario ahora? (s/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[SsYy]$ ]]; then
        python manage.py createsuperuser
        print_success "Superusuario creado"
    else
        print_info "Puedes crear un superusuario después con: python manage.py createsuperuser"
    fi
fi

# 10. Recopilar archivos estáticos (solo producción)
if [ "$ENVIRONMENT" = "produccion" ]; then
    echo ""
    echo "8️⃣  Recopilando archivos estáticos..."
    python manage.py collectstatic --noinput > /dev/null 2>&1
    print_success "Archivos estáticos recopilados"
fi

# Resumen final
echo ""
echo "================================================"
echo -e "${GREEN}✅ Configuración completada exitosamente${NC}"
echo "================================================"
echo ""

if [ "$ENVIRONMENT" = "desarrollo" ]; then
    echo "📝 Próximos pasos:"
    echo ""
    echo "1. Activar entorno virtual:"
    echo "   source venv/bin/activate"
    echo ""
    echo "2. Ejecutar servidor de desarrollo:"
    echo "   python manage.py runserver"
    echo ""
    echo "3. Acceder a:"
    echo "   - API: http://localhost:8000/api/"
    echo "   - Admin: http://localhost:8000/admin/"
    echo ""
else
    echo "📝 Próximos pasos para PRODUCCIÓN:"
    echo ""
    echo "1. Editar archivo .env con configuraciones de producción"
    echo "2. Configurar base de datos PostgreSQL"
    echo "3. Revisar checklist de seguridad en DEPLOYMENT.md"
    echo "4. Ejecutar con Gunicorn:"
    echo "   gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3"
    echo ""
fi

print_info "Para más información, consulta DEPLOYMENT.md"
echo ""
