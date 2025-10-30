# 📱 Configuración de PWA (Progressive Web App)

## ✅ Lo que ya está configurado:

1. **manifest.json** - Configuración de la PWA
2. **Meta tags en layout.tsx** - Para iOS y Android
3. **icon.svg** - Icono base en formato vectorial

## 🎨 Generar Iconos PNG

### Opción 1: Usar el script automático
```bash
./scripts/generate-icons.sh
```

Este script requiere **ImageMagick** o **Inkscape**:
```bash
# macOS
brew install imagemagick

# Ubuntu/Debian
sudo apt-get install imagemagick
```

### Opción 2: Generar manualmente

Si tienes **ImageMagick** instalado:
```bash
cd public
magick icon.svg -resize 192x192 icon-192.png
magick icon.svg -resize 512x512 icon-512.png
magick icon.svg -resize 180x180 apple-touch-icon.png
```

### Opción 3: Usar herramientas online

1. Ve a https://realfavicongenerator.net/
2. Sube `public/icon.svg`
3. Descarga el paquete generado
4. Reemplaza los archivos en `public/`

### Opción 4: Usar tu propio diseño

Simplemente coloca estos archivos en la carpeta `public/`:
- `icon-192.png` (192x192 px)
- `icon-512.png` (512x512 px)
- `apple-touch-icon.png` (180x180 px)

**Recomendaciones para el diseño:**
- Usa colores sólidos y contrastantes
- Evita detalles muy pequeños
- El icono debe verse bien en tamaños pequeños
- Usa fondo opaco (no transparente para iOS)

## 📲 Cómo agregar a la pantalla de inicio

### iPhone/iPad:
1. Abre Safari (no Chrome/Firefox)
2. Ve a tu sitio web
3. Toca el botón de compartir (cuadro con flecha hacia arriba)
4. Desplázate y toca "Agregar a pantalla de inicio"
5. Dale un nombre (por defecto "NapGenius")
6. Toca "Agregar"

### Android:
1. Abre Chrome
2. Ve a tu sitio web
3. Toca el menú (⋮)
4. Toca "Agregar a pantalla de inicio"
5. Confirma

### Verificar que funciona:
- El icono aparece en tu pantalla de inicio
- Al abrirla, no se ve la barra del navegador (modo standalone)
- La barra de estado coincide con el color del tema

## 🔧 Archivos de configuración

### manifest.json
```json
{
  "name": "NapGenius - Baby Sleep Tracker",
  "short_name": "NapGenius",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#8B5CF6"
}
```

### layout.tsx metadata
```typescript
export const metadata: Metadata = {
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NapGenius",
  },
  // ...
}
```

## 🎨 Personalizar colores

Para cambiar el color del tema (barra de estado):

1. Edita `public/manifest.json`:
```json
{
  "theme_color": "#TU_COLOR_AQUI",
  "background_color": "#TU_COLOR_AQUI"
}
```

2. Edita `src/app/layout.tsx`:
```typescript
themeColor: "#TU_COLOR_AQUI"
```

## ✅ Checklist de PWA

- [ ] Iconos generados (192px, 512px, 180px)
- [ ] manifest.json configurado
- [ ] Meta tags en layout.tsx
- [ ] HTTPS habilitado (requerido para PWA)
- [ ] Probado en iPhone con Safari
- [ ] Probado en Android con Chrome

## 🚀 Desplegar cambios

Después de generar los iconos:
```bash
git add public/icon*.png public/apple-touch-icon.png public/manifest.json src/app/layout.tsx
git commit -m "feat: add PWA support with app icons"
git push origin main

# Reconstruir y publicar imagen Docker
docker build -t jorgeanzola/baby-sleep-tracker:1.1.3 .
docker push jorgeanzola/baby-sleep-tracker:1.1.3
docker push jorgeanzola/baby-sleep-tracker:latest
```

## 📱 Características de PWA incluidas

✅ Instalable en pantalla de inicio  
✅ Funciona en modo standalone (sin barra del navegador)  
✅ Icono personalizado  
✅ Splash screen automático (iOS)  
✅ Color de tema personalizado  
✅ Nombre corto para pantalla de inicio  
✅ Orientación vertical forzada  
✅ Viewport optimizado para móvil  

## 🔍 Depuración

### Verificar manifest.json:
```
https://tu-dominio.com/manifest.json
```

### Chrome DevTools:
1. F12 → Application tab
2. Manifest section
3. Verifica que no haya errores

### iOS Safari:
1. Conecta tu iPhone a la Mac
2. Safari → Develop → [Tu iPhone] → [Tu página]
3. Console para ver errores

## 📚 Recursos adicionales

- [PWA Builder](https://www.pwabuilder.com/)
- [Favicon Generator](https://realfavicongenerator.net/)
- [Web App Manifest MDN](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [iOS PWA Support](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)

---

**Nota importante:** Safari en iOS requiere HTTPS para instalar PWAs. No funcionará con HTTP (excepto localhost).
