-- Profesorado: perfil docente + libro de horas (control de horas fehaciente).
-- Additivo: no toca ninguna tabla existente. Aplicar una vez en Neon.

DO $$ BEGIN
  CREATE TYPE "public"."hour_status" AS ENUM('declared', 'confirmed', 'locked', 'voided');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "teacher_profiles" (
  "worker_id" uuid PRIMARY KEY NOT NULL REFERENCES "workers"("id") ON DELETE cascade,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE cascade,
  "annual_target_min" integer NOT NULL DEFAULT 46020,
  "reduction_min" integer NOT NULL DEFAULT 0,
  "reduction_type" text,
  "availability" text NOT NULL DEFAULT 'both',
  "notes" text,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "hour_entries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE cascade,
  "worker_id" uuid NOT NULL REFERENCES "workers"("id") ON DELETE cascade,
  "work_date" date NOT NULL,
  "minutes" integer NOT NULL,
  "concept" text NOT NULL DEFAULT 'clase',
  "note" text,
  "status" "hour_status" NOT NULL DEFAULT 'declared',
  "created_by_user_id" uuid REFERENCES "users"("id") ON DELETE set null,
  "confirmed_by_user_id" uuid REFERENCES "users"("id") ON DELETE set null,
  "confirmed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "hour_entries_tenant_worker_idx" ON "hour_entries" ("tenant_id", "worker_id", "work_date");
