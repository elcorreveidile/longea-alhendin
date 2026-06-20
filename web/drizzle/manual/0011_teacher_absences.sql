-- Acentos · Tipo de ausencia/permiso en la no-disponibilidad del profesorado.
-- vacaciones | asuntos_propios | permiso | no_retribuido | baja_medica | otro
-- Ejecutar en Neon. Idempotente.

ALTER TABLE "teacher_unavailability" ADD COLUMN IF NOT EXISTS "kind" text NOT NULL DEFAULT 'vacaciones';
ALTER TABLE "teacher_unavailability" ADD COLUMN IF NOT EXISTS "created_by_user_id" uuid REFERENCES "users"("id") ON DELETE set null;
CREATE INDEX IF NOT EXISTS "teacher_unavailability_worker_idx" ON "teacher_unavailability" ("tenant_id", "worker_id");
