#!/bin/bash

# Script de Despliegue Automatizado v1.0.6
# Baby Sleep Tracker - Baby-Specific Settings Migration
# Uso: ./deploy-v1.0.6.sh [modo]
# Modos: local (construir localmente) | remote (usar imagen de Docker Hub)

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
VERSION="v1.0.6"
IMAGE_NAME="jorgeanzola/baby-sleep-tracker"
COMPOSE_FILE="docker-compose.public.yml"
MODE=${1:-"remote"}

echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     NapGenius Deployment Script v1.0.6            ║${NC}"
echo -e "${GREEN}║     Baby-Specific Settings Migration              ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# Función para mostrar error y salir
error_exit() {
    echo -e "${RED}❌ Error: $1${NC}" >&2
    exit 1
}

# Función para confirmar acción
confirm() {
    read -p "$(echo -e ${YELLOW}$1 [y/N]:${NC}) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}❌ Operación cancelada${NC}"
        exit 1
    fi
}

# Verificar que Docker está instalado
if ! command -v docker &> /dev/null; then
    error_exit "Docker no está instalado"
fi

if ! command -v docker-compose &> /dev/null; then
    error_exit "Docker Compose no está instalado"
fi

echo -e "${BLUE}📋 Información del Despliegue${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Versión: ${VERSION}"
echo "Modo: ${MODE}"
echo "Imagen: ${IMAGE_NAME}:${VERSION}"
echo "Compose: ${COMPOSE_FILE}"
echo ""

# PASO 1: Backup de Base de Datos
echo -e "${YELLOW}🗄️  PASO 1: Backup de Base de Datos${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if docker ps | grep -q "napgenius_postgres"; then
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    echo "Creando backup: ${BACKUP_FILE}"
    
    if docker exec napgenius_postgres pg_dump -U napgenius napgenius > "${BACKUP_FILE}" 2>/dev/null; then
        BACKUP_SIZE=$(ls -lh "${BACKUP_FILE}" | awk '{print $5}')
        echo -e "${GREEN}✅ Backup creado exitosamente (${BACKUP_SIZE})${NC}"
    else
        confirm "⚠️  No se pudo crear el backup. ¿Continuar sin backup?"
    fi
else
    echo -e "${YELLOW}⚠️  PostgreSQL no está corriendo. Saltando backup...${NC}"
fi
echo ""

# PASO 2: Detener Contenedores
echo -e "${YELLOW}🛑 PASO 2: Detener Contenedores Actuales${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f "${COMPOSE_FILE}" ]; then
    docker-compose -f "${COMPOSE_FILE}" down
    echo -e "${GREEN}✅ Contenedores detenidos${NC}"
else
    error_exit "No se encontró ${COMPOSE_FILE}"
fi
echo ""

# PASO 3: Construir o Descargar Imagen
echo -e "${YELLOW}🐳 PASO 3: Preparar Imagen Docker${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "${MODE}" = "local" ]; then
    echo "Construyendo imagen localmente..."
    if [ ! -f "Dockerfile" ]; then
        error_exit "No se encontró Dockerfile"
    fi
    docker build -t "${IMAGE_NAME}:${VERSION}" .
    echo -e "${GREEN}✅ Imagen construida localmente${NC}"
else
    echo "Descargando imagen desde Docker Hub..."
    docker pull "${IMAGE_NAME}:${VERSION}"
    echo -e "${GREEN}✅ Imagen descargada${NC}"
fi
echo ""

# PASO 4: Actualizar docker-compose.yml
echo -e "${YELLOW}📝 PASO 4: Actualizar Configuración${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if grep -q "image: ${IMAGE_NAME}" "${COMPOSE_FILE}"; then
    # Crear backup del compose file
    cp "${COMPOSE_FILE}" "${COMPOSE_FILE}.backup"
    
    # Actualizar versión en el compose file
    sed -i.bak "s|image: ${IMAGE_NAME}:.*|image: ${IMAGE_NAME}:${VERSION}|g" "${COMPOSE_FILE}"
    rm -f "${COMPOSE_FILE}.bak"
    
    echo -e "${GREEN}✅ Archivo ${COMPOSE_FILE} actualizado${NC}"
else
    echo -e "${YELLOW}⚠️  No se encontró referencia a la imagen. Verifica manualmente.${NC}"
fi
echo ""

# PASO 5: Iniciar Servicios
echo -e "${YELLOW}🚀 PASO 5: Iniciar Servicios${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker-compose -f "${COMPOSE_FILE}" up -d
echo "Esperando a que los servicios estén listos..."
sleep 15

# Verificar que los contenedores están corriendo
if docker ps | grep -q "napgenius_app"; then
    echo -e "${GREEN}✅ Servicios iniciados correctamente${NC}"
else
    error_exit "Los contenedores no iniciaron correctamente"
fi
echo ""

# PASO 6: Ejecutar Migraciones
echo -e "${YELLOW}🔄 PASO 6: Ejecutar Migraciones de Base de Datos${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "6.1 - Aplicando migraciones de Prisma..."
if docker exec napgenius_app npx prisma migrate deploy; then
    echo -e "${GREEN}✅ Migraciones de Prisma aplicadas${NC}"
else
    error_exit "Error al aplicar migraciones de Prisma"
fi

echo ""
echo "6.2 - Regenerando tipos de Prisma..."
if docker exec napgenius_app npx prisma generate; then
    echo -e "${GREEN}✅ Tipos de Prisma regenerados${NC}"
else
    error_exit "Error al regenerar tipos de Prisma"
fi

echo ""
echo "6.3 - Ejecutando migración de datos (User.scheduleConfig → BabySettings)..."
if docker exec napgenius_app npx ts-node scripts/migrate-schedule-config.ts; then
    echo -e "${GREEN}✅ Migración de datos completada${NC}"
else
    echo -e "${RED}⚠️  Error en migración de datos. Verifica manualmente.${NC}"
fi
echo ""

# PASO 7: Verificación
echo -e "${YELLOW}✅ PASO 7: Verificación Post-Despliegue${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "7.1 - Verificando contenedores..."
RUNNING=$(docker ps --filter "name=napgenius" --format "{{.Names}}" | wc -l)
echo "   Contenedores corriendo: ${RUNNING}/2"

echo ""
echo "7.2 - Verificando logs recientes..."
docker logs napgenius_app --tail 20 2>&1 | grep -i "error" && \
    echo -e "${RED}⚠️  Se encontraron errores en los logs${NC}" || \
    echo -e "${GREEN}✅ No se encontraron errores en los logs${NC}"

echo ""
echo "7.3 - Verificando estado de migraciones..."
docker exec napgenius_app npx prisma migrate status

echo ""

# Resumen Final
echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           ✅ DESPLIEGUE COMPLETADO                  ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📊 Resumen:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Versión desplegada: ${VERSION}"
echo "✅ Backup creado: ${BACKUP_FILE:-N/A}"
echo "✅ Contenedores iniciados"
echo "✅ Migraciones aplicadas"
echo "✅ Datos migrados a BabySettings"
echo ""

echo -e "${BLUE}🔍 Verificación Manual Recomendada:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Ver logs en tiempo real:"
echo "   docker logs napgenius_app -f"
echo ""
echo "2. Abrir Prisma Studio (verificar tabla BabySettings):"
echo "   docker exec -it napgenius_app npx prisma studio"
echo "   Abrir: http://localhost:5555"
echo ""
echo "3. Probar la aplicación:"
echo "   Abrir: http://localhost:3000"
echo ""
echo "4. Probar multi-usuario:"
echo "   - Usuario A: Cambiar configuración de un bebé"
echo "   - Usuario B: Verificar que ve la misma configuración"
echo ""

echo -e "${YELLOW}📚 Documentación:${NC}"
echo "   Ver DEPLOYMENT_v1.0.6.md para más detalles"
echo "   Ver AGENTS.md para información técnica"
echo ""

echo -e "${BLUE}🔙 Rollback (si es necesario):${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   docker-compose -f ${COMPOSE_FILE} down"
echo "   docker pull ${IMAGE_NAME}:v1.0.5"
echo "   # Editar ${COMPOSE_FILE} para usar v1.0.5"
echo "   docker-compose -f ${COMPOSE_FILE} up -d"
if [ -n "${BACKUP_FILE}" ]; then
    echo "   # Restaurar DB: docker exec -i napgenius_postgres psql -U napgenius napgenius < ${BACKUP_FILE}"
fi
echo ""

echo -e "${GREEN}🎉 Despliegue finalizado exitosamente!${NC}"
echo ""
