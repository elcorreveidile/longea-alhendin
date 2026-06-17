-- ============================================================
-- Esquema completo · Cuadrantes Residencia Alhendín (Grupo Longea)
-- Pegar entero en el editor SQL de Neon para crear la BD desde cero.
-- Equivale a las migraciones 0000 + 0001 + 0002 ya consolidadas.
-- ============================================================

-- Tipos (enums)
CREATE TYPE "app_role"          AS ENUM ('superadmin', 'admin', 'worker');
CREATE TYPE "cuadrante_status"  AS ENUM ('draft', 'published');
CREATE TYPE "job_role"          AS ENUM ('gerocultora', 'gerocultora_lv', 'supervisora');

-- Trabajadoras (plantilla)
CREATE TABLE "workers" (
    "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name"       text NOT NULL,
    "job_role"   "job_role" DEFAULT 'gerocultora' NOT NULL,
    "phone"      text,
    "active"     boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Usuarios que inician sesión (admin / superadmin / trabajadora)
CREATE TABLE "users" (
    "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "email"         text,
    "phone"         text,
    "name"          text,
    "role"          "app_role" DEFAULT 'worker' NOT NULL,
    "worker_id"     uuid REFERENCES "workers"("id") ON DELETE set null,
    "created_at"    timestamp with time zone DEFAULT now() NOT NULL,
    "last_login_at" timestamp with time zone
);

-- Tokens de magic link (correo)
CREATE TABLE "magic_tokens" (
    "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "email"      text NOT NULL,
    "token_hash" text NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "used_at"    timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Vacaciones
CREATE TABLE "vacations" (
    "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "worker_id"  uuid NOT NULL REFERENCES "workers"("id") ON DELETE cascade,
    "start_date" date NOT NULL,
    "end_date"   date NOT NULL,
    "note"       text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Cuadrantes guardados
CREATE TABLE "cuadrantes" (
    "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "year"       integer NOT NULL,
    "month"      integer NOT NULL,
    "status"     "cuadrante_status" DEFAULT 'draft' NOT NULL,
    "data"       jsonb NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Índices únicos
CREATE UNIQUE INDEX "users_email_idx"        ON "users" ("email");
CREATE UNIQUE INDEX "users_phone_idx"        ON "users" ("phone");
CREATE UNIQUE INDEX "cuadrantes_year_month_idx" ON "cuadrantes" ("year", "month");
