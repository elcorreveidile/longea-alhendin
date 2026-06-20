-- Historial de comunicaciones del personal del centro al profesorado.
-- Registra cada envío hecho desde /panel/correos. Ejecutar en Neon. Idempotente.

CREATE TABLE IF NOT EXISTS "staff_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "sender_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "sender_name" text NOT NULL,
  "sender_role" text,
  "subject" text NOT NULL,
  "body" text NOT NULL,
  "to_emails" text NOT NULL DEFAULT '',
  "cc_emails" text NOT NULL DEFAULT '',
  "to_count" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "staff_messages_tenant_idx" ON "staff_messages" ("tenant_id", "created_at");
