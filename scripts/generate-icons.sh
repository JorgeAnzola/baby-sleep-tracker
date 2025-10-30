#!/bin/bash

# Script para generar iconos PNG desde SVG
# Requiere ImageMagick o inkscape

echo "🎨 Generando iconos de la PWA..."

# Verificar si existe convert (ImageMagick) o inkscape
if command -v convert &> /dev/null; then
    TOOL="convert"
elif command -v magick &> /dev/null; then
    TOOL="magick"
elif command -v inkscape &> /dev/null; then
    TOOL="inkscape"
else
    echo "❌ Error: Necesitas ImageMagick o Inkscape instalado"
    echo ""
    echo "Instalar ImageMagick:"
    echo "  macOS: brew install imagemagick"
    echo "  Ubuntu: sudo apt-get install imagemagick"
    echo ""
    echo "O Inkscape:"
    echo "  macOS: brew install --cask inkscape"
    echo "  Ubuntu: sudo apt-get install inkscape"
    exit 1
fi

cd public

# Generar iconos
if [ "$TOOL" = "inkscape" ]; then
    echo "Usando Inkscape..."
    inkscape icon.svg -w 192 -h 192 -o icon-192.png
    inkscape icon.svg -w 512 -h 512 -o icon-512.png
    inkscape icon.svg -w 180 -h 180 -o apple-touch-icon.png
elif [ "$TOOL" = "magick" ]; then
    echo "Usando ImageMagick (magick)..."
    magick icon.svg -resize 192x192 icon-192.png
    magick icon.svg -resize 512x512 icon-512.png
    magick icon.svg -resize 180x180 apple-touch-icon.png
else
    echo "Usando ImageMagick (convert)..."
    convert icon.svg -resize 192x192 icon-192.png
    convert icon.svg -resize 512x512 icon-512.png
    convert icon.svg -resize 180x180 apple-touch-icon.png
fi

echo "✅ Iconos generados:"
ls -lh icon-*.png apple-touch-icon.png

echo ""
echo "🎉 ¡Listo! Los iconos están en la carpeta public/"
