-- Acentos · Rol de personal del centro (sobre las cuentas admin).
-- direccion | subdireccion | secretaria  (NULL = admin sin rol específico).
-- El superadministrador sigue siendo role='superadmin' (plataforma).
-- Ejecutar en Neon. Idempotente.

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "staff_role" text;
