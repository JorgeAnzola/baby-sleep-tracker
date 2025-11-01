-- AlterTable
ALTER TABLE "users" ADD COLUMN "theme" TEXT DEFAULT 'default',
ADD COLUMN "language" TEXT DEFAULT 'en',
ADD COLUMN "scheduleConfig" JSONB;
