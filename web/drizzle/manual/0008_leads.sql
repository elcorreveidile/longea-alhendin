-- Interesados llegados por el formulario de contacto (gestionados por el superadmin).
-- Aplicar en Neon:  ejecutar este SQL una vez.

DO $$ BEGIN
  CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "leads" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "org" text,
  "message" text NOT NULL,
  "status" "lead_status" DEFAULT 'new' NOT NULL,
  "source" text DEFAULT 'contacto' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "contacted_at" timestamp with time zone
);
