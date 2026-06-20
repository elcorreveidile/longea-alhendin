-- Acentos · Reparto de docencia (esqueleto): programas, ediciones, asignaturas,
-- grupos/plazas, asignaciones y recursos. Multi-tenant (tenant_id en todo).
-- Ejecutar en Neon. Idempotente.

DO $$ BEGIN
  CREATE TYPE "program_kind" AS ENUM ('intensivo','semestral','verano','colaboracion','examen','formacion','otro');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "group_kind" AS ENUM ('clase','practicas','vigilancia_examen','prueba_nivel','tutoria','otro');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "group_status" AS ENUM ('sin_asignar','auto','manual','locked');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "teacher_role" AS ENUM ('titular','candidato');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "course_programs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE cascade,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "kind" "program_kind" NOT NULL DEFAULT 'otro',
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "course_programs_tenant_idx" ON "course_programs" ("tenant_id");

CREATE TABLE IF NOT EXISTS "course_terms" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE cascade,
  "program_id" uuid NOT NULL REFERENCES "course_programs"("id") ON DELETE cascade,
  "name" text NOT NULL,
  "course_year" integer NOT NULL,
  "start_date" date,
  "end_date" date,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "course_terms_tenant_idx" ON "course_terms" ("tenant_id", "course_year");

CREATE TABLE IF NOT EXISTS "subjects" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE cascade,
  "name" text NOT NULL,
  "area" text,
  "languages" text NOT NULL DEFAULT 'es',
  "level_min" text,
  "level_max" text,
  "staffing" text NOT NULL DEFAULT 'abierta',
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "subjects_tenant_idx" ON "subjects" ("tenant_id");

CREATE TABLE IF NOT EXISTS "teaching_groups" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE cascade,
  "term_id" uuid NOT NULL REFERENCES "course_terms"("id") ON DELETE cascade,
  "subject_id" uuid REFERENCES "subjects"("id") ON DELETE set null,
  "group_code" text,
  "kind" "group_kind" NOT NULL DEFAULT 'clase',
  "language" text NOT NULL DEFAULT 'es',
  "level" text,
  "minutes" integer NOT NULL DEFAULT 0,
  "schedule" jsonb,
  "status" "group_status" NOT NULL DEFAULT 'sin_asignar',
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "teaching_groups_term_idx" ON "teaching_groups" ("tenant_id", "term_id");

CREATE TABLE IF NOT EXISTS "group_teachers" (
  "group_id" uuid NOT NULL REFERENCES "teaching_groups"("id") ON DELETE cascade,
  "worker_id" uuid NOT NULL REFERENCES "workers"("id") ON DELETE cascade,
  "role" text,
  PRIMARY KEY ("group_id", "worker_id")
);

CREATE TABLE IF NOT EXISTS "teacher_subjects" (
  "worker_id" uuid NOT NULL REFERENCES "workers"("id") ON DELETE cascade,
  "subject_id" uuid NOT NULL REFERENCES "subjects"("id") ON DELETE cascade,
  "role" "teacher_role" NOT NULL DEFAULT 'candidato',
  "preferred" boolean NOT NULL DEFAULT false,
  PRIMARY KEY ("worker_id", "subject_id")
);

CREATE TABLE IF NOT EXISTS "teacher_unavailability" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE cascade,
  "worker_id" uuid NOT NULL REFERENCES "workers"("id") ON DELETE cascade,
  "start_date" date NOT NULL,
  "end_date" date NOT NULL,
  "note" text
);

CREATE TABLE IF NOT EXISTS "teacher_incompatibilities" (
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE cascade,
  "worker_id" uuid NOT NULL REFERENCES "workers"("id") ON DELETE cascade,
  "other_worker_id" uuid NOT NULL REFERENCES "workers"("id") ON DELETE cascade,
  PRIMARY KEY ("worker_id", "other_worker_id")
);

CREATE TABLE IF NOT EXISTS "rooms" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE cascade,
  "code" text NOT NULL,
  "site" text,
  "capacity" integer
);

-- Ampliación del perfil docente: idiomas y rango de nivel.
ALTER TABLE "teacher_profiles" ADD COLUMN IF NOT EXISTS "languages" text NOT NULL DEFAULT 'es';
ALTER TABLE "teacher_profiles" ADD COLUMN IF NOT EXISTS "level_min" text;
ALTER TABLE "teacher_profiles" ADD COLUMN IF NOT EXISTS "level_max" text;
