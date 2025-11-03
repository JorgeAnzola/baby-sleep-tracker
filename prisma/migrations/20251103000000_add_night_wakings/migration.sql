-- CreateEnum
CREATE TYPE "InterventionType" AS ENUM ('COMFORT', 'FEED', 'DIAPER', 'MEDICATION', 'OTHER');

-- CreateTable
CREATE TABLE "night_wakings" (
    "id" TEXT NOT NULL,
    "sleep_session_id" TEXT NOT NULL,
    "wake_time" TIMESTAMP(3) NOT NULL,
    "sleep_time" TIMESTAMP(3),
    "duration_minutes" INTEGER,
    "intervention_type" "InterventionType" NOT NULL DEFAULT 'COMFORT',
    "self_soothed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "night_wakings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "night_wakings_sleep_session_id_idx" ON "night_wakings"("sleep_session_id");

-- AddForeignKey
ALTER TABLE "night_wakings" ADD CONSTRAINT "night_wakings_sleep_session_id_fkey" FOREIGN KEY ("sleep_session_id") REFERENCES "sleep_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
