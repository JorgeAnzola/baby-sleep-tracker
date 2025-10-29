#!/bin/sh
set -e

echo "🚀 Starting NapGenius..."

# Wait for database to be ready by checking if port is open
echo "⏳ Waiting for database..."
max_attempts=30
attempt=0

while ! nc -z db 5432; do
  attempt=$((attempt + 1))
  if [ $attempt -ge $max_attempts ]; then
    echo "❌ Database failed to become ready in time"
    exit 1
  fi
  echo "Database is unavailable - sleeping (attempt $attempt/$max_attempts)"
  sleep 2
done

echo "✅ Database is ready!"

# Wait additional 2 seconds for database to fully initialize
sleep 2

# Sync database schema
echo "📦 Syncing database schema..."
npx prisma db push --accept-data-loss

echo "✅ Database schema synced!"

# Start the application
echo "🎉 Starting application..."
exec node server.js
