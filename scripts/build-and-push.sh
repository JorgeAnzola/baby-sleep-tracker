#!/bin/bash

# Script para construir y publicar imagen Docker de NapGenius
# Uso: ./build-and-push.sh [version]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
DOCKER_USERNAME="jorgeanzola"  # Cambiar por tu usuario de Docker Hub
IMAGE_NAME="baby-sleep-tracker"
VERSION=${1:-"latest"}

echo -e "${GREEN}🚀 NapGenius - Docker Build & Push Script${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar que Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker no está instalado${NC}"
    exit 1
fi

# Verificar que estamos en el directorio correcto
if [ ! -f "Dockerfile" ]; then
    echo -e "${RED}❌ No se encontró Dockerfile. Ejecuta este script desde la raíz del proyecto.${NC}"
    exit 1
fi

# Confirmar versión
echo -e "${YELLOW}📦 Construyendo versión: ${VERSION}${NC}"
echo -e "${YELLOW}🏷️  Tag completo: ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}${NC}"
echo ""
read -p "¿Continuar? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Cancelado${NC}"
    exit 1
fi

# Construir imagen
echo ""
echo -e "${GREEN}🔨 Construyendo imagen Docker...${NC}"
docker build -t ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION} .

# Tag como latest si es una versión específica
if [ "$VERSION" != "latest" ]; then
    echo -e "${GREEN}🏷️  Taggeando como latest...${NC}"
    docker tag ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION} ${DOCKER_USERNAME}/${IMAGE_NAME}:latest
fi

# Login a Docker Hub
echo ""
echo -e "${GREEN}🔐 Iniciando sesión en Docker Hub...${NC}"
docker login

# Push de la imagen
echo ""
echo -e "${GREEN}📤 Publicando imagen en Docker Hub...${NC}"
docker push ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}

if [ "$VERSION" != "latest" ]; then
    echo -e "${GREEN}📤 Publicando tag latest...${NC}"
    docker push ${DOCKER_USERNAME}/${IMAGE_NAME}:latest
fi

# Resumen
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ ¡Imagen publicada exitosamente!${NC}"
echo ""
echo "📦 Imagen disponible en:"
echo "   docker pull ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}"
if [ "$VERSION" != "latest" ]; then
    echo "   docker pull ${DOCKER_USERNAME}/${IMAGE_NAME}:latest"
fi
echo ""
echo "🌐 Docker Hub:"
echo "   https://hub.docker.com/r/${DOCKER_USERNAME}/${IMAGE_NAME}"
echo ""
echo "📝 Los usuarios pueden instalar con:"
echo "   curl -O https://raw.githubusercontent.com/tu-usuario/baby-sleep-tracker/main/docker-compose.public.yml"
echo "   docker-compose -f docker-compose.public.yml up -d"
echo ""
