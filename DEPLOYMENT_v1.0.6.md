# 🚀 Guía de Despliegue v1.0.6 - Baby-Specific Settings

## 📋 Resumen de Cambios

**Versión**: v1.0.6  
**Fecha**: 2 Noviembre 2025  
**Cambio Crítico**: Migración de configuraciones de usuario a configuraciones por bebé

### Cambios Principales:
- ✅ Configuraciones movidas de `User.scheduleConfig` a tabla `BabySettings`
- ✅ Todos los colaboradores ven la misma configuración por bebé
- ✅ Compatibilidad con Next.js 16 (async params)
- ✅ Nuevo helper `verifyAuth(request)` para autenticación
- ✅ Nuevos endpoints `/api/baby-settings/[babyId]`
- ✅ Script de migración de datos incluido

---

## ⚠️ IMPORTANTE: Pre-Requisitos

### 1. Backup de Base de Datos (OBLIGATORIO)
```bash
# Conectarse al servidor
ssh usuario@tu-servidor.com

# Hacer backup de la base de datos
docker exec napgenius_postgres pg_dump -U napgenius napgenius > backup_$(date +%Y%m%d_%H%M%S).sql

# Verificar que el backup se creó correctamente
ls -lh backup_*.sql
```

### 2. Verificar Estado Actual
```bash
# Ver contenedores en ejecución
docker ps

# Ver logs actuales
docker logs napgenius_app --tail 50

# Verificar versión actual
docker exec napgenius_app cat package.json | grep version
```

---

## 🔄 Proceso de Actualización

### Opción A: Usando el Script Automatizado (Recomendado)

#### Paso 1: Preparar en Local
```bash
# En tu máquina local, en el directorio del proyecto

# 1. Asegurarte de que todos los cambios están committeados
git status
git add .
git commit -m "feat: v1.0.6 - Baby-specific settings architecture"

# 2. Crear tag de versión
git tag -a v1.0.6 -m "v1.0.6 - Baby-specific settings architecture"
git push origin main --tags

# 3. Construir y publicar imagen Docker
chmod +x scripts/build-and-push.sh
./scripts/build-and-push.sh v1.0.6
```

#### Paso 2: Actualizar en Servidor
```bash
# Conectarse al servidor
ssh usuario@tu-servidor.com

# Navegar al directorio de la aplicación
cd /ruta/a/napgenius

# Detener contenedores actuales
docker-compose -f docker-compose.public.yml down

# Descargar nueva imagen
docker pull jorgeanzola/baby-sleep-tracker:v1.0.6

# Actualizar docker-compose.public.yml para usar v1.0.6
nano docker-compose.public.yml
# Cambiar la línea: image: jorgeanzola/baby-sleep-tracker:v1.0.6

# Iniciar con nueva versión
docker-compose -f docker-compose.public.yml up -d

# Ver logs del inicio
docker logs napgenius_app -f
```

#### Paso 3: Ejecutar Migraciones (CRÍTICO)
```bash
# Esperar a que la aplicación esté lista (unos 10-15 segundos)
sleep 15

# 1. Aplicar migraciones de Prisma (agrega nuevos campos a la base de datos)
docker exec -it napgenius_app npx prisma migrate deploy

# 2. Regenerar tipos de Prisma
docker exec -it napgenius_app npx prisma generate

# 3. Ejecutar script de migración de datos (copia User.scheduleConfig a BabySettings)
docker exec -it napgenius_app npx ts-node scripts/migrate-schedule-config.ts

# Ver resultado de la migración
docker exec -it napgenius_app npx prisma studio
# Abrir en navegador: http://localhost:5555
# Verificar que la tabla BabySettings tiene entradas
```

---

### Opción B: Build Directo en Servidor (Alternativa)

Si prefieres construir directamente en el servidor:

```bash
# Conectarse al servidor
ssh usuario@tu-servidor.com

# Navegar al directorio del proyecto
cd /ruta/a/napgenius

# Hacer backup de la base de datos
docker exec napgenius_postgres pg_dump -U napgenius napgenius > backup_$(date +%Y%m%d_%H%M%S).sql

# Pull de los últimos cambios
git pull origin main

# Detener contenedores
docker-compose -f docker-compose.public.yml down

# Construir nueva imagen (esto puede tardar 5-10 minutos)
docker build -t jorgeanzola/baby-sleep-tracker:v1.0.6 .

# Actualizar docker-compose.public.yml
nano docker-compose.public.yml
# Cambiar: image: jorgeanzola/baby-sleep-tracker:v1.0.6

# Iniciar servicios
docker-compose -f docker-compose.public.yml up -d

# Ejecutar migraciones (MISMO PASO 3 DE LA OPCIÓN A)
docker exec -it napgenius_app npx prisma migrate deploy
docker exec -it napgenius_app npx prisma generate
docker exec -it napgenius_app npx ts-node scripts/migrate-schedule-config.ts
```

---

## ✅ Verificación Post-Despliegue

### 1. Verificar que los Contenedores Están Corriendo
```bash
docker ps
# Debe mostrar: napgenius_app y napgenius_postgres como "Up"
```

### 2. Verificar Logs
```bash
# Ver logs de la aplicación
docker logs napgenius_app --tail 100

# Buscar errores
docker logs napgenius_app | grep -i error

# Ver logs en tiempo real
docker logs napgenius_app -f
```

### 3. Verificar Base de Datos
```bash
# Abrir Prisma Studio
docker exec -it napgenius_app npx prisma studio

# En el navegador (http://localhost:5555), verificar:
# - Tabla BabySettings existe
# - Cada bebé tiene una entrada en BabySettings
# - Los campos bedtime, wakeTime, napsPerDay tienen valores
```

### 4. Probar Funcionalidad Multi-Usuario (IMPORTANTE)
1. **Usuario A (propietario)**:
   - Iniciar sesión
   - Seleccionar un bebé
   - Ir a Configuración → Horarios
   - Cambiar hora de dormir a 19:00
   - Esperar 2 segundos (auto-save)

2. **Usuario B (colaborador)**:
   - Iniciar sesión con otra cuenta
   - Ver el mismo bebé
   - Ir a Configuración → Horarios
   - ✅ **DEBE ver 19:00** (misma hora que Usuario A)
   - ❌ **NO debe ver** su propia configuración anterior

3. **Verificar Predicciones**:
   - Usuario B debe ver predicciones basadas en la configuración del bebé
   - No debe ver predicciones basadas en su usuario

### 5. Verificar API de Home Assistant
```bash
# Probar endpoint de estado
curl http://localhost:3000/api/sleep-status?babyId=TU_BABY_ID

# Debe retornar JSON con predictions usando baby-specific settings
```

---

## 🔙 Procedimiento de Rollback (Si Algo Sale Mal)

Si encuentras problemas después del despliegue:

### Opción 1: Rollback Rápido (Sin Base de Datos)
```bash
# Detener contenedores
docker-compose -f docker-compose.public.yml down

# Volver a versión anterior (v1.0.5 o la última estable)
docker pull jorgeanzola/baby-sleep-tracker:v1.0.5

# Actualizar docker-compose.public.yml
nano docker-compose.public.yml
# Cambiar a: image: jorgeanzola/baby-sleep-tracker:v1.0.5

# Reiniciar
docker-compose -f docker-compose.public.yml up -d
```

### Opción 2: Rollback Completo (Con Restauración de Base de Datos)
```bash
# Detener contenedores
docker-compose -f docker-compose.public.yml down

# Restaurar base de datos desde backup
docker-compose -f docker-compose.public.yml up -d postgres
sleep 5
docker exec -i napgenius_postgres psql -U napgenius napgenius < backup_YYYYMMDD_HHMMSS.sql

# Volver a versión anterior
docker pull jorgeanzola/baby-sleep-tracker:v1.0.5
nano docker-compose.public.yml  # Cambiar versión
docker-compose -f docker-compose.public.yml up -d
```

---

## 📊 Comandos Útiles de Mantenimiento

### Monitoreo
```bash
# Ver uso de recursos
docker stats

# Ver logs en tiempo real
docker logs napgenius_app -f

# Ver estado de migraciones
docker exec -it napgenius_app npx prisma migrate status

# Verificar conexión a base de datos
docker exec -it napgenius_postgres psql -U napgenius -c "\dt"
```

### Limpieza
```bash
# Limpiar imágenes antiguas
docker image prune -a

# Ver espacio usado por Docker
docker system df

# Limpiar todo lo no usado
docker system prune -a --volumes
```

### Debugging
```bash
# Entrar al contenedor de la app
docker exec -it napgenius_app sh

# Dentro del contenedor:
# - Ver variables de entorno
env | grep DATABASE

# - Ver archivos
ls -la /app

# - Probar conexión a DB
npx prisma db pull
```

---

## 📝 Checklist Final

Antes de considerar el despliegue completo:

- [ ] ✅ Backup de base de datos creado y verificado
- [ ] ✅ Git tags creados y pusheados
- [ ] ✅ Imagen Docker construida y publicada en Docker Hub
- [ ] ✅ Contenedores actualizados en servidor
- [ ] ✅ Migraciones de Prisma ejecutadas (`prisma migrate deploy`)
- [ ] ✅ Tipos de Prisma regenerados (`prisma generate`)
- [ ] ✅ Script de migración de datos ejecutado (`migrate-schedule-config.ts`)
- [ ] ✅ Tabla BabySettings verificada en base de datos
- [ ] ✅ Logs de aplicación sin errores
- [ ] ✅ Prueba multi-usuario exitosa (mismas configuraciones)
- [ ] ✅ Predicciones funcionando correctamente
- [ ] ✅ API de Home Assistant respondiendo

---

## 🆘 Soporte y Troubleshooting

### Error: "Cannot find module 'next-intl'"
```bash
# Instalar dependencias faltantes
docker exec -it napgenius_app npm install next-intl recharts
docker-compose -f docker-compose.public.yml restart app
```

### Error: "Table 'BabySettings' does not exist"
```bash
# Ejecutar migraciones
docker exec -it napgenius_app npx prisma migrate deploy
docker exec -it napgenius_app npx prisma generate
```

### Error: "JWT verification failed"
```bash
# Verificar que JWT_SECRET está configurado
docker exec -it napgenius_app env | grep JWT_SECRET

# Si no existe, agregar a .env o docker-compose.public.yml
```

### Los Colaboradores Ven Configuraciones Diferentes
```bash
# Ejecutar script de migración de datos
docker exec -it napgenius_app npx ts-node scripts/migrate-schedule-config.ts

# Verificar que se crearon entradas en BabySettings
docker exec -it napgenius_app npx prisma studio
```

---

## 📚 Documentación Adicional

- **AGENTS.md**: Guía completa para desarrolladores y AI agents
- **README.md**: Documentación de usuario
- **prisma/schema.prisma**: Schema de base de datos
- **scripts/migrate-schedule-config.ts**: Script de migración de datos

---

## 🎯 Próximos Pasos (Después del Despliegue)

1. **Monitorear**: Observar logs durante las primeras 24-48 horas
2. **Feedback**: Solicitar feedback de usuarios sobre configuraciones
3. **Optimización**: Revisar rendimiento de nuevas consultas a BabySettings
4. **Feature Next**: Preparar para Night Waking feature (ya tiene backend listo)

---

**Versión del Documento**: 1.0  
**Última Actualización**: 2 Noviembre 2025  
**Autor**: Jorge Anzola

---

## 🔗 Comandos Quick Reference

```bash
# Backup
docker exec napgenius_postgres pg_dump -U napgenius napgenius > backup.sql

# Deploy
docker-compose -f docker-compose.public.yml down
docker pull jorgeanzola/baby-sleep-tracker:v1.0.6
docker-compose -f docker-compose.public.yml up -d

# Migrate
docker exec -it napgenius_app npx prisma migrate deploy
docker exec -it napgenius_app npx prisma generate
docker exec -it napgenius_app npx ts-node scripts/migrate-schedule-config.ts

# Verify
docker ps
docker logs napgenius_app --tail 50
docker exec -it napgenius_app npx prisma studio

# Rollback
docker-compose -f docker-compose.public.yml down
docker pull jorgeanzola/baby-sleep-tracker:v1.0.5
docker-compose -f docker-compose.public.yml up -d
```
