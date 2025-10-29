# 📊 Guía de Logs y Monitoreo para NapGenius

## Logs Importantes a Revisar

### 1. **Logs de la Aplicación**
```bash
# Ver logs en tiempo real
docker-compose logs -f app

# Ver últimas 100 líneas
docker-compose logs app --tail=100

# Ver logs con timestamps
docker-compose logs -t app
```

**Qué revisar:**
- ❌ Errores de autenticación (login/register failures)
- ❌ Errores de conexión a base de datos
- ⚠️  Rate limit triggers (429 responses)
- ⚠️  Requests fallidos (500 errors)
- ℹ️  Actividad de usuarios (logins, registros)

**Ejemplo de logs problemáticos:**
```
Login error: Error: ...
Failed to verify session: ...
Registration error: ...
```

---

### 2. **Logs de PostgreSQL**
```bash
# Ver logs de la base de datos
docker-compose logs -f db

# Ver últimas 50 líneas
docker-compose logs db --tail=50
```

**Qué revisar:**
- ❌ Errores de conexión
- ❌ Queries lentos o problemáticos
- ⚠️  Advertencias de performance
- ℹ️  Conexiones activas

**Ejemplo de logs problemáticos:**
```
FATAL: password authentication failed
ERROR: relation "users" does not exist
WARNING: too many connections
```

---

### 3. **Logs del Sistema (Servidor)**
```bash
# Logs del sistema (Ubuntu/Debian)
sudo journalctl -u docker -f

# Uso de recursos
docker stats

# Espacio en disco
df -h
du -sh /var/lib/docker/volumes/*
```

**Qué revisar:**
- ❌ Errores de Docker daemon
- ⚠️  Memoria/CPU alta (> 80%)
- ⚠️  Espacio en disco bajo (< 10% libre)
- ℹ️  Reinicios de contenedores

---

## Comandos Útiles de Monitoreo

### **Ver estado de contenedores**
```bash
docker-compose ps
```

### **Ver uso de recursos**
```bash
docker stats napgenius-app napgenius-db
```

### **Ver conexiones activas a la base de datos**
```bash
docker exec napgenius-db psql -U napgenius -c "SELECT COUNT(*) FROM pg_stat_activity;"
```

### **Ver errores recientes**
```bash
docker-compose logs app --tail=1000 | grep -i "error"
docker-compose logs app --tail=1000 | grep -i "failed"
```

### **Ver rate limiting en acción**
```bash
docker-compose logs app --tail=1000 | grep "429"
docker-compose logs app | grep "Rate limit"
```

---

## Alertas Críticas

### 🚨 **Reiniciar si ves:**
1. `FATAL: out of memory`
2. `database system is shut down`
3. Múltiples `500 Internal Server Error` consecutivos
4. `Cannot connect to database`

```bash
# Reinicio rápido
docker-compose restart app

# Reinicio completo
docker-compose down && docker-compose up -d
```

---

## Monitoreo Proactivo

### **Script de monitoreo básico** (guardar como `monitor.sh`):
```bash
#!/bin/bash

echo "=== NapGenius Health Check ==="
echo ""

# Estado de contenedores
echo "📦 Container Status:"
docker-compose ps

echo ""
echo "💾 Disk Usage:"
df -h | grep -E "/$|/var"

echo ""
echo "🔍 Recent Errors (last 50 lines):"
docker-compose logs app --tail=50 | grep -i "error" | tail -5

echo ""
echo "⚠️  Rate Limit Events (last 10):"
docker-compose logs app --tail=1000 | grep "429" | tail -10

echo ""
echo "📊 Resource Usage:"
docker stats --no-stream napgenius-app napgenius-db
```

**Ejecutar:**
```bash
chmod +x monitor.sh
./monitor.sh
```

---

## Logs de Seguridad Importantes

### **Intentos de login fallidos**
```bash
docker-compose logs app | grep "Invalid email or password" | wc -l
```

### **Rate limiting activado**
```bash
docker-compose logs app | grep "Rate limit exceeded"
```

### **Registros de nuevos usuarios**
```bash
docker-compose logs app | grep "User registered successfully"
```

### **Accesos desde IPs específicas**
```bash
docker-compose logs app | grep "x-forwarded-for"
```

---

## Backup de Logs

### **Guardar logs periódicamente**
```bash
# Crear directorio de logs
mkdir -p ~/napgenius-logs

# Guardar logs con fecha
docker-compose logs app > ~/napgenius-logs/app-$(date +%Y%m%d-%H%M%S).log
docker-compose logs db > ~/napgenius-logs/db-$(date +%Y%m%d-%H%M%S).log
```

### **Automatizar con cron** (ejecutar diariamente a las 3 AM):
```bash
crontab -e

# Agregar esta línea:
0 3 * * * cd ~/baby-sleep-tracker && docker-compose logs app --tail=10000 > ~/napgenius-logs/app-$(date +\%Y\%m\%d).log
```

---

## Herramientas de Monitoreo Avanzadas (Opcional)

Para producción, considera:

1. **Portainer** - UI web para Docker
   ```bash
   docker run -d -p 9000:9000 -v /var/run/docker.sock:/var/run/docker.sock portainer/portainer-ce
   ```

2. **Grafana + Prometheus** - Métricas y dashboards

3. **Uptime Kuma** - Monitoreo de uptime
   ```bash
   docker run -d --restart=always -p 3001:3001 -v uptime-kuma:/app/data --name uptime-kuma louislam/uptime-kuma:1
   ```

---

## Resumen de Comandos Diarios

```bash
# Verificación rápida diaria (2 minutos)
docker-compose ps                                    # ¿Están corriendo?
docker stats --no-stream napgenius-app napgenius-db # ¿Recursos OK?
docker-compose logs app --tail=50 | grep -i error   # ¿Errores recientes?
df -h                                                # ¿Espacio en disco OK?

# Verificación semanal (5 minutos)
docker-compose logs app --tail=1000 | grep "429"    # ¿Rate limiting activo?
docker exec napgenius-db psql -U napgenius -c "\dt" # ¿Tablas intactas?
docker-compose logs app | grep "registered"         # ¿Nuevos usuarios?
```

---

## Contacto de Emergencia

Si algo falla y necesitas ayuda rápida:

1. **Recolecta información:**
   ```bash
   docker-compose logs app --tail=500 > error-logs.txt
   docker-compose ps >> error-logs.txt
   docker stats --no-stream >> error-logs.txt
   ```

2. **Reinicio de emergencia:**
   ```bash
   docker-compose restart app
   # Si persiste:
   docker-compose down && docker-compose up -d
   ```

3. **Backup de emergencia de la BD:**
   ```bash
   docker exec napgenius-db pg_dump -U napgenius napgenius > backup-emergency-$(date +%Y%m%d-%H%M%S).sql
   ```

---

**Actualizado:** 29 de octubre de 2025
