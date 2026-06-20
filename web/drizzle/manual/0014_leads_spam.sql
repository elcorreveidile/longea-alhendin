-- Leads · marca de spam (formularios de agencia/publicidad).
-- Los mensajes detectados se guardan con spam=true y NO se avisan por correo.
-- Ejecutar en Neon. Idempotente.

ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "spam" boolean NOT NULL DEFAULT false;
