#!/bin/bash

# NapGenius - Instalación Rápida
# Este script automatiza la instalación completa

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

clear

echo -e "${CYAN}"
cat << "EOF"
   _   __            ______           _           
  / | / /___ _____  / ____/__  ____  (_)_  _______
 /  |/ / __ `/ __ \/ / __/ _ \/ __ \/ / / / / ___/
/ /|  / /_/ / /_/ / /_/ /  __/ / / / / /_/ (__  ) 
/_/ |_/\__,_/ .___/\____/\___/_/ /_/_/\__,_/____/  
           /_/                                     
EOF
echo -e "${NC}"

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Baby Sleep Tracker - Instalación Automática${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

# Verificar Docker
echo -e "${YELLOW}🔍 Verificando requisitos...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker no está instalado${NC}"
    echo ""
    echo "Por favor instala Docker desde:"
    echo "  macOS: https://docs.docker.com/desktop/install/mac-install/"
    echo "  Linux: https://docs.docker.com/engine/install/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose no está instalado${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker instalado${NC}"

# Verificar que Docker está corriendo
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker no está corriendo${NC}"
    echo "Por favor inicia Docker Desktop"
    exit 1
fi

echo -e "${GREEN}✓ Docker corriendo${NC}"
echo ""

# Descargar archivos
echo -e "${YELLOW}📥 Descargando archivos de configuración...${NC}"

# Detectar si estamos en modo test (archivos locales disponibles)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/docker-compose.public.yml" ]; then
    echo -e "${CYAN}ℹ️  Modo test: usando archivos locales${NC}"
    USE_LOCAL=true
else
    USE_LOCAL=false
fi

# docker-compose.yml
if [ ! -f "docker-compose.yml" ]; then
    if [ "$USE_LOCAL" = true ]; then
        cp "$SCRIPT_DIR/docker-compose.public.yml" docker-compose.yml
        echo -e "${GREEN}✓ docker-compose.yml copiado${NC}"
    elif curl -fsSL -o docker-compose.yml https://raw.githubusercontent.com/jorgeanzola/baby-sleep-tracker/main/docker-compose.public.yml; then
        echo -e "${GREEN}✓ docker-compose.yml descargado${NC}"
    else
        echo -e "${RED}❌ Error descargando docker-compose.yml${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠ docker-compose.yml ya existe, no se sobrescribe${NC}"
fi

# .env
if [ ! -f ".env" ]; then
    if [ "$USE_LOCAL" = true ]; then
        cp "$SCRIPT_DIR/.env.public.example" .env
        echo -e "${GREEN}✓ .env copiado${NC}"
    elif curl -fsSL -o .env https://raw.githubusercontent.com/jorgeanzola/baby-sleep-tracker/main/.env.public.example; then
        echo -e "${GREEN}✓ .env descargado${NC}"
    else
        echo -e "${RED}❌ Error descargando .env${NC}"
        exit 1
    fi
    
    # Generar secretos automáticamente
    echo ""
    echo -e "${YELLOW}🔐 Generando secretos seguros...${NC}"
    
    if command -v openssl &> /dev/null; then
        # Generar JWT_SECRET (sin caracteres problemáticos para sed)
        JWT_SECRET=$(openssl rand -base64 32 | tr -d '\n' | tr '+/' '-_')
        # Usar delimitador diferente para sed para evitar problemas con /
        sed -i.bak "s|CHANGE_THIS_SECRET_NOW|$JWT_SECRET|" .env
        echo -e "${GREEN}✓ JWT_SECRET generado${NC}"
        
        # Generar password seguro (sin caracteres problemáticos)
        DB_PASSWORD=$(openssl rand -base64 20 | tr -d "=+/\n" | cut -c1-25)
        sed -i.bak "s|CHANGE_THIS_PASSWORD_NOW|$DB_PASSWORD|" .env
        echo -e "${GREEN}✓ POSTGRES_PASSWORD generado${NC}"
        
        # Limpiar archivos backup
        rm -f .env.bak
    else
        echo -e "${YELLOW}⚠ openssl no encontrado, debes editar .env manualmente${NC}"
    fi
else
    echo -e "${YELLOW}⚠ .env ya existe, no se sobrescribe${NC}"
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Configuración${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

# Mostrar configuración actual
if grep -q "CHANGE_THIS" .env; then
    echo -e "${RED}⚠️  ATENCIÓN: Algunos secretos no han sido configurados${NC}"
    echo ""
    echo "Edita el archivo .env antes de continuar:"
    echo "  nano .env"
    echo ""
    read -p "¿Has editado .env con valores seguros? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Por favor edita .env y ejecuta de nuevo este script${NC}"
        exit 1
    fi
fi

# Cargar puerto actual del .env si existe
CURRENT_PORT=$(grep "^APP_PORT=" .env 2>/dev/null | cut -d'=' -f2)
CURRENT_PORT=${CURRENT_PORT:-3000}

# Preguntar por puerto
echo -e "${CYAN}¿En qué puerto quieres ejecutar la aplicación?${NC}"
read -p "Puerto (Enter para usar $CURRENT_PORT): " USER_INPUT

# Si el usuario no escribió nada, usar el puerto actual
if [ -z "$USER_INPUT" ]; then
    APP_PORT=$CURRENT_PORT
else
    APP_PORT=$USER_INPUT
fi

# Actualizar puerto en .env
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/^APP_PORT=.*/APP_PORT=$APP_PORT/" .env
else
    sed -i "s/^APP_PORT=.*/APP_PORT=$APP_PORT/" .env
fi

echo ""
echo -e "${YELLOW}📦 Iniciando NapGenius...${NC}"
echo ""

# Iniciar servicios
if docker compose version &> /dev/null; then
    docker compose up -d
else
    docker-compose up -d
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ ¡Instalación Completada!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}🌐 Accede a la aplicación en:${NC}"
echo -e "   ${GREEN}http://localhost:$APP_PORT${NC}"
echo ""
echo -e "${CYAN}📊 Ver logs:${NC}"
if docker compose version &> /dev/null; then
    echo "   docker compose logs -f"
else
    echo "   docker-compose logs -f"
fi
echo ""
echo -e "${CYAN}🛑 Detener:${NC}"
if docker compose version &> /dev/null; then
    echo "   docker compose stop"
else
    echo "   docker-compose stop"
fi
echo ""
echo -e "${CYAN}🔄 Actualizar:${NC}"
if docker compose version &> /dev/null; then
    echo "   docker compose pull && docker compose up -d"
else
    echo "   docker-compose pull && docker-compose up -d"
fi
echo ""
echo -e "${YELLOW}⏳ La aplicación puede tardar 30-60 segundos en estar lista${NC}"
echo ""

# Esperar a que la app esté lista
echo -e "${YELLOW}Esperando a que la aplicación esté lista...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:$APP_PORT/api/health > /dev/null 2>&1; then
        echo ""
        echo -e "${GREEN}✓ ¡Aplicación lista!${NC}"
        echo ""
        echo -e "${CYAN}Abriendo navegador...${NC}"
        sleep 2
        
        # Abrir navegador
        if [[ "$OSTYPE" == "darwin"* ]]; then
            open "http://localhost:$APP_PORT"
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            xdg-open "http://localhost:$APP_PORT" 2>/dev/null || echo "Abre http://localhost:$APP_PORT en tu navegador"
        fi
        break
    fi
    echo -n "."
    sleep 2
done

echo ""
echo -e "${GREEN}🎉 ¡Disfruta usando NapGenius!${NC}"
echo ""
