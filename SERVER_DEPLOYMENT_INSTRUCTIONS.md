# 🚀 Instrucciones de Despliegue en Servidor - URGENTE

## 📍 Situación Actual en tu Servidor

Tienes dos problemas:
1. ❌ **Build fallando**: Archivos `src/i18n/*` causando error de `next-intl`
2. ❌ **Migración fallando**: Base de datos ya tiene esquema (necesita baseline)

---

## ✅ Solución Paso a Paso

### PASO 1: Actualizar Código en el Servidor

```bash
# Conectarse al servidor
ssh jorgeanzola@server

# Ir al directorio
cd ~/baby-sleep-tracker

# Hacer backup del código actual (por si acaso)
cp -r . ../baby-sleep-tracker-backup-$(date +%Y%m%d)

# Pull de los últimos cambios (incluye fix de build)
git pull origin main

# Verificar que los archivos i18n fueron eliminados
ls src/i18n
# Debe decir: "ls: cannot access 'src/i18n': No such file or directory"
```

---

### PASO 2: Detener y Limpiar Contenedores

```bash
# Detener contenedores actuales
docker compose down

# Limpiar imágenes antiguas (opcional pero recomendado)
docker image prune -f
```

---

### PASO 3: Build Nuevo (Sin Caché)

```bash
# Build sin caché (esto debería funcionar ahora)
docker compose build --no-cache

# Si el build falla nuevamente, verifica:
cat src/app/api/baby-settings/[babyId]/route.ts | grep "ts-expect-error"
# NO debe aparecer nada

# Y verifica que i18n no existe:
ls src/i18n
# Debe dar error "No such file or directory"
```

---

### PASO 4: Iniciar Contenedores

```bash
# Iniciar servicios
docker compose up -d

# Esperar a que estén listos
sleep 15

# Verificar que están corriendo
docker ps
# Debe mostrar: napgenius-app y napgenius-db como "Up"
```

---

### PASO 5: Resolver el Error de Migración (P3005)

El error `P3005` significa que tu base de datos ya tiene tablas y Prisma no sabe qué migraciones ya se aplicaron.

**Opción A: Baseline (RECOMENDADO - No pierde datos)**

```bash
# 1. Ver qué migraciones tienes
docker exec -it napgenius-app ls -la prisma/migrations/

# 2. Hacer baseline de la última migración aplicada
# Reemplaza XXXXXX_nombre_migracion con el nombre de la última migración
docker exec -it napgenius-app npx prisma migrate resolve --applied "20241101000000_add_baby_settings_fields"

# 3. Ahora aplicar las migraciones pendientes
docker exec -it napgenius-app npx prisma migrate deploy

# 4. Regenerar tipos
docker exec -it napgenius-app npx prisma generate
```

**Opción B: Reset Completo (⚠️ BORRA TODOS LOS DATOS)**

```bash
# SOLO si no te importa perder los datos actuales
docker exec -it napgenius-app npx prisma migrate reset --force
```

**Opción C: Ver Estado Actual**

```bash
# Ver qué migraciones existen y cuáles están aplicadas
docker exec -it napgenius-app npx prisma migrate status
```

---

### PASO 6: Ejecutar Migración de Datos

Una vez que las migraciones de Prisma estén OK:

```bash
# Ejecutar script que copia User.scheduleConfig a BabySettings
docker exec -it napgenius-app npx ts-node scripts/migrate-schedule-config.ts

# Si da error de ts-node no encontrado, instálalo:
docker exec -it napgenius-app npm install -g ts-node
docker exec -it napgenius-app npx ts-node scripts/migrate-schedule-config.ts
```

---

### PASO 7: Verificación

```bash
# 1. Ver logs
docker logs napgenius-app --tail 100

# 2. Verificar que no hay errores críticos
docker logs napgenius-app | grep -i "error" | grep -v "404"

# 3. Abrir Prisma Studio para ver la base de datos
docker exec -it napgenius-app npx prisma studio
# Abrir en navegador: http://TU-IP-SERVIDOR:5555
# Verificar tabla BabySettings tiene datos

# 4. Probar la app
# Abrir: http://TU-IP-SERVIDOR:3000
```

---

## 🆘 Si Algo Sale Mal

### Error: Build sigue fallando con "next-intl"

```bash
# Verificar que git pull funcionó
cd ~/baby-sleep-tracker
git log -1
# Debe mostrar el último commit que eliminó src/i18n

# Forzar eliminación manual
rm -rf src/i18n
docker compose build --no-cache
```

### Error: "Cannot find module 'ts-node'"

```bash
# Instalar ts-node en el contenedor
docker exec -it napgenius-app npm install -g ts-node typescript

# Reintentar migración
docker exec -it napgenius-app npx ts-node scripts/migrate-schedule-config.ts
```

### Error: Migraciones siguen fallando

```bash
# Ver estado actual
docker exec -it napgenius-app npx prisma migrate status

# Listar migraciones disponibles
docker exec -it napgenius-app ls -la prisma/migrations/

# Aplicar baseline de TODAS las migraciones que ya están en la BD
# (Reemplaza los nombres con los que veas en tu BD)
docker exec -it napgenius-app npx prisma migrate resolve --applied "20241030000000_init"
docker exec -it napgenius-app npx prisma migrate resolve --applied "20241101000000_add_baby_settings_fields"

# Intentar deploy nuevamente
docker exec -it napgenius-app npx prisma migrate deploy
```

### Error: La app no inicia

```bash
# Ver logs completos
docker logs napgenius-app

# Verificar variables de entorno
docker exec -it napgenius-app env | grep DATABASE_URL

# Reiniciar contenedores
docker compose restart
```

---

## 📋 Checklist Rápido

Completa estos pasos en orden:

- [ ] ✅ `git pull origin main` (código actualizado)
- [ ] ✅ `ls src/i18n` (debe dar error - archivo no existe)
- [ ] ✅ `docker compose down` (contenedores detenidos)
- [ ] ✅ `docker compose build --no-cache` (build exitoso)
- [ ] ✅ `docker compose up -d` (contenedores iniciados)
- [ ] ✅ `docker ps` (ambos contenedores "Up")
- [ ] ✅ `npx prisma migrate resolve` (baseline si es necesario)
- [ ] ✅ `npx prisma migrate deploy` (migraciones aplicadas)
- [ ] ✅ `npx prisma generate` (tipos regenerados)
- [ ] ✅ `npx ts-node scripts/migrate-schedule-config.ts` (datos migrados)
- [ ] ✅ `docker logs napgenius-app` (sin errores)
- [ ] ✅ Probar app en navegador (funciona)
- [ ] ✅ Prueba multi-usuario (mismas configuraciones)

---

## 🎯 Comando Todo-en-Uno (Después de git pull)

Si todo está bien configurado, este comando hace todo:

```bash
docker compose down && \
docker compose build --no-cache && \
docker compose up -d && \
sleep 15 && \
docker exec -it napgenius-app npx prisma migrate deploy && \
docker exec -it napgenius-app npx prisma generate && \
docker exec -it napgenius-app npx ts-node scripts/migrate-schedule-config.ts && \
docker logs napgenius-app --tail 50
```

---

## 📞 ¿Necesitas Ayuda?

Si algún paso falla, copia el **error completo** y pregúntame. Necesitaré ver:

1. El comando que ejecutaste
2. El error completo (no solo la primera línea)
3. Output de `docker logs napgenius-app --tail 100`

---

**Última actualización**: 2 Nov 2025  
**Versión**: v1.0.6 - Baby-specific settings
