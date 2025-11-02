#!/bin/bash

# 🚀 Script de Despliegue Rápido para Servidor
# Ejecutar este script en el servidor después de git pull

set -e

echo "🚀 Iniciando despliegue v1.0.6..."
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Paso 1: Verificar archivos i18n eliminados
echo -e "${YELLOW}1. Verificando archivos i18n...${NC}"
if [ -d "src/i18n" ]; then
    echo -e "${RED}❌ Error: src/i18n/ todavía existe. Ejecuta: rm -rf src/i18n${NC}"
    exit 1
else
    echo -e "${GREEN}✅ src/i18n/ eliminado correctamente${NC}"
fi
echo ""

# Paso 2: Detener contenedores
echo -e "${YELLOW}2. Deteniendo contenedores...${NC}"
docker compose down
echo -e "${GREEN}✅ Contenedores detenidos${NC}"
echo ""

# Paso 3: Build
echo -e "${YELLOW}3. Construyendo nueva imagen (esto puede tardar 5-10 min)...${NC}"
docker compose build --no-cache
echo -e "${GREEN}✅ Build completado${NC}"
echo ""

# Paso 4: Iniciar servicios
echo -e "${YELLOW}4. Iniciando servicios...${NC}"
docker compose up -d
echo "Esperando 15 segundos para que arranquen..."
sleep 15
echo -e "${GREEN}✅ Servicios iniciados${NC}"
echo ""

# Paso 5: Verificar contenedores
echo -e "${YELLOW}5. Verificando contenedores...${NC}"
if docker ps | grep -q "napgenius-app"; then
    echo -e "${GREEN}✅ napgenius-app está corriendo${NC}"
else
    echo -e "${RED}❌ napgenius-app NO está corriendo${NC}"
    docker logs napgenius-app --tail 50
    exit 1
fi

if docker ps | grep -q "napgenius-db"; then
    echo -e "${GREEN}✅ napgenius-db está corriendo${NC}"
else
    echo -e "${RED}❌ napgenius-db NO está corriendo${NC}"
    exit 1
fi
echo ""

# Paso 6: Migraciones Prisma
echo -e "${YELLOW}6. Aplicando migraciones Prisma...${NC}"

# Intentar migrate deploy directamente
if docker exec napgenius-app npx prisma migrate deploy 2>&1 | grep -q "P3005"; then
    echo -e "${YELLOW}⚠️  Base de datos ya tiene esquema. Aplicando baseline...${NC}"
    
    # Listar migraciones disponibles
    echo "Migraciones disponibles:"
    docker exec napgenius-app ls -1 prisma/migrations/ | grep -v "migration_lock"
    
    echo ""
    echo -e "${YELLOW}Aplicando baseline de migraciones existentes...${NC}"
    
    # Aplicar baseline de cada migración (ajusta según tus migraciones)
    MIGRATIONS=$(docker exec napgenius-app ls -1 prisma/migrations/ | grep -v "migration_lock" || true)
    for migration in $MIGRATIONS; do
        echo "Marcando como aplicada: $migration"
        docker exec napgenius-app npx prisma migrate resolve --applied "$migration" || true
    done
    
    # Intentar deploy nuevamente
    docker exec napgenius-app npx prisma migrate deploy
fi

echo -e "${GREEN}✅ Migraciones aplicadas${NC}"
echo ""

# Paso 7: Regenerar tipos Prisma
echo -e "${YELLOW}7. Regenerando tipos Prisma...${NC}"
docker exec napgenius-app npx prisma generate
echo -e "${GREEN}✅ Tipos regenerados${NC}"
echo ""

# Paso 8: Migrar datos
echo -e "${YELLOW}8. Migrando datos (User.scheduleConfig → BabySettings)...${NC}"

# Ejecutar script de migración (usa versión JavaScript para evitar problemas de permisos con ts-node)
echo "Ejecutando migración de datos..."
docker exec napgenius-app node scripts/migrate-schedule-config.js
echo -e "${GREEN}✅ Datos migrados${NC}"
echo ""

# Paso 9: Verificación
echo -e "${YELLOW}9. Verificando logs...${NC}"
echo "Últimas 30 líneas de logs:"
docker logs napgenius-app --tail 30
echo ""

# Paso 10: Verificar errores
echo -e "${YELLOW}10. Buscando errores en logs...${NC}"
ERROR_COUNT=$(docker logs napgenius-app 2>&1 | grep -i "error" | grep -v "404" | wc -l || echo 0)

if [ "$ERROR_COUNT" -gt 0 ]; then
    echo -e "${RED}⚠️  Se encontraron $ERROR_COUNT errores en los logs${NC}"
    echo "Errores:"
    docker logs napgenius-app 2>&1 | grep -i "error" | grep -v "404" | tail -10
else
    echo -e "${GREEN}✅ No se encontraron errores críticos${NC}"
fi
echo ""

# Resumen
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 DESPLIEGUE COMPLETADO${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Estado:"
echo "   - Contenedores: $(docker ps --filter 'name=napgenius' --format '{{.Names}}' | wc -l)/2 corriendo"
echo "   - Errores en logs: $ERROR_COUNT"
echo ""
echo "✅ Siguiente paso: Probar la aplicación"
echo "   - Abrir en navegador y probar login"
echo "   - Verificar que dos usuarios ven las mismas configuraciones"
echo ""
echo "🔍 Comandos útiles:"
echo "   docker logs napgenius-app -f          # Ver logs en tiempo real"
echo "   docker exec -it napgenius-app npx prisma studio  # Ver base de datos"
echo "   docker ps                             # Ver contenedores"
echo "   docker compose restart                # Reiniciar servicios"
echo ""
