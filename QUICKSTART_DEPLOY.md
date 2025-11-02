# 🚀 Guía Rápida de Despliegue v1.0.6

## ⚡ Opción Rápida: Script Automatizado

### En el Servidor:
```bash
# 1. Hacer backup
docker exec napgenius_postgres pg_dump -U napgenius napgenius > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Descargar y ejecutar script
curl -O https://raw.githubusercontent.com/JorgeAnzola/baby-sleep-tracker/main/scripts/deploy-v1.0.6.sh
chmod +x deploy-v1.0.6.sh
./deploy-v1.0.6.sh remote
```

El script hace TODO automáticamente:
- ✅ Backup de base de datos
- ✅ Detiene contenedores
- ✅ Descarga nueva imagen (v1.0.6)
- ✅ Actualiza docker-compose.public.yml
- ✅ Inicia servicios
- ✅ Ejecuta migraciones de Prisma
- ✅ Regenera tipos
- ✅ Migra datos a BabySettings
- ✅ Verifica que todo esté OK

---

## 🐢 Opción Manual (Paso a Paso)

### 1. Backup (OBLIGATORIO)
```bash
ssh usuario@servidor
docker exec napgenius_postgres pg_dump -U napgenius napgenius > backup.sql
```

### 2. Actualizar Docker
```bash
docker-compose -f docker-compose.public.yml down
docker pull jorgeanzola/baby-sleep-tracker:v1.0.6
```

### 3. Editar docker-compose.public.yml
```yaml
# Cambiar la línea de image a:
image: jorgeanzola/baby-sleep-tracker:v1.0.6
```

### 4. Iniciar Servicios
```bash
docker-compose -f docker-compose.public.yml up -d
sleep 15  # Esperar que arranque
```

### 5. Migraciones (CRÍTICO)
```bash
docker exec -it napgenius_app npx prisma migrate deploy
docker exec -it napgenius_app npx prisma generate
docker exec -it napgenius_app npx ts-node scripts/migrate-schedule-config.ts
```

### 6. Verificar
```bash
docker logs napgenius_app --tail 50
docker ps  # Ambos contenedores deben estar "Up"
```

---

## 🧪 Prueba Multi-Usuario

1. **Usuario A**: Cambiar bedtime a 19:00 en configuración de un bebé
2. **Usuario B**: Ver el mismo bebé → Debe ver 19:00 también
3. ✅ Si ambos ven lo mismo = **ÉXITO**

---

## 🔙 Rollback (Si algo sale mal)

```bash
docker-compose -f docker-compose.public.yml down
docker pull jorgeanzola/baby-sleep-tracker:v1.0.5
# Editar docker-compose.public.yml → cambiar a v1.0.5
docker-compose -f docker-compose.public.yml up -d
```

---

## 📚 Documentación Completa

Ver **DEPLOYMENT_v1.0.6.md** para instrucciones detalladas y troubleshooting.

---

## ✅ Checklist Mínimo

- [ ] Backup de base de datos
- [ ] Pull de imagen v1.0.6
- [ ] Contenedores reiniciados
- [ ] `prisma migrate deploy` ejecutado
- [ ] `prisma generate` ejecutado
- [ ] `migrate-schedule-config.ts` ejecutado
- [ ] Logs sin errores
- [ ] Prueba multi-usuario OK

---

**Tiempo estimado**: 5-10 minutos (con script automatizado)
