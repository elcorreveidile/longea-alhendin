-- Acentos · Estado de aprobación de ausencias del profesorado.
-- solicitada (el profesor avisa) | aprobada | rechazada (subdirección decide).
-- Las ya existentes se dan por aprobadas. Ejecutar en Neon. Idempotente.

ALTER TABLE "teacher_unavailability" ADD COLUMN IF NOT EXISTS "status" text NOT NULL DEFAULT 'aprobada';
ALTER TABLE "teacher_unavailability" ADD COLUMN IF NOT EXISTS "decided_by_user_id" uuid REFERENCES "users"("id") ON DELETE set null;
ALTER TABLE "teacher_unavailability" ADD COLUMN IF NOT EXISTS "decided_at" timestamp with time zone;
