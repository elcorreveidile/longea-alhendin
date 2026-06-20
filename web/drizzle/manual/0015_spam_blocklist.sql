-- Lista de bloqueo de spam, gestionable desde /admin/leads.
-- kind: 'term' (palabra/frase en el mensaje) | 'email' (correo exacto) | 'domain' (dominio del correo).
-- Ejecutar en Neon. Idempotente.

CREATE TABLE IF NOT EXISTS "spam_blocklist" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "kind" text NOT NULL,
  "value" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "spam_blocklist_kind_value_idx" ON "spam_blocklist" ("kind", "value");
